-- ==============================================================================
-- TurfTalk 管理者向け BigQuery 分析クエリ集 & Looker Studio 指標定義
-- ==============================================================================
-- 本ファイルは、Firebase Analytics および Firestore to BigQuery (Stream Collections to BigQuery)
-- によって連携された生ログを元に、Looker Studio ダッシュボードで可視化するための標準SQLクエリ集です。
--
-- 対象データソース:
-- 1. `turftalk_production.users_raw_latest`: Firestore users コレクションの最新レコード
-- 2. `analytics_XXXXXXXXX.events_*`: Firebase Analytics 自動エクスポートイベントテーブル
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. コンテンツ健全性 ＆ 消化率・枯渇予測 (Content Health & Depletion Forecast)
-- 目的: 全ユーザーの問題消化ペースを把握し、「いつ新問題パックを追加すべきか」を科学的に予測する。
-- アラート基準: 「未消化残り10問以下」の枯渇予備軍ユーザーがアクティブ全体の15%を超えたら新問題投入。
-- ------------------------------------------------------------------------------

WITH user_progress_summary AS (
  SELECT
    document_name AS user_id,
    JSON_VALUE(data, '$.providerId') AS provider_id,
    CAST(JSON_VALUE(data, '$.learnedCount') AS INT64) AS learned_count,
    CAST(JSON_VALUE(data, '$.progressPercent') AS FLOAT64) AS progress_percent,
    120 - CAST(JSON_VALUE(data, '$.learnedCount') AS INT64) AS remaining_count,
    TIMESTAMP(JSON_VALUE(data, '$.lastActiveAt')) AS last_active_at,
    BOOLEAN(JSON_VALUE(data, '$.isDeleted')) AS is_deleted
  FROM
    `turftalk_production.firestore_users_raw_latest`
  WHERE
    -- 退会済みユーザーおよび破損レコードを除外
    (BOOLEAN(JSON_VALUE(data, '$.isDeleted')) IS FALSE OR JSON_VALUE(data, '$.isDeleted') IS NULL)
),
active_users AS (
  SELECT
    *,
    CASE
      WHEN progress_percent = 100.0 THEN '6. Fully Completed (100%)'
      WHEN progress_percent >= 80.0 THEN '5. Near Completion (80-99%)'
      WHEN progress_percent >= 60.0 THEN '4. Advanced (60-79%)'
      WHEN progress_percent >= 40.0 THEN '3. Intermediate (40-59%)'
      WHEN progress_percent >= 20.0 THEN '2. Early Stage (20-39%)'
      ELSE '1. Beginner (0-19%)'
    END AS progress_bucket,
    -- コンテンツ枯渇危機フラグ（残り10問以下）
    IF(remaining_count <= 10, 1, 0) AS is_content_depleted
  FROM
    user_progress_summary
  -- 直近30日以内に学習活動のあったアクティブユーザー
  WHERE
    last_active_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
)
SELECT
  progress_bucket,
  COUNT(user_id) AS user_count,
  ROUND(COUNT(user_id) * 100.0 / SUM(COUNT(user_id)) OVER(), 1) AS ratio_percent,
  SUM(is_content_depleted) AS depleted_user_count,
  ROUND(SUM(is_content_depleted) * 100.0 / SUM(COUNT(user_id)) OVER(), 1) AS overall_depletion_rate_percent,
  -- 15%を超えた場合に 'CRITICAL: RELEASE NEW PACK' を出力
  IF(
    ROUND(SUM(is_content_depleted) * 100.0 / SUM(COUNT(user_id)) OVER(), 1) >= 15.0,
    '⚠️ CRITICAL: Release New Phrase Pack Immediately',
    '✅ HEALTHY: Sufficient Content Margin'
  ) AS pack_release_status
FROM
  active_users
GROUP BY
  progress_bucket
ORDER BY
  progress_bucket ASC;


-- ------------------------------------------------------------------------------
-- 2. 問題クオリティ ＆ フレーズ難易度分析 (Phrase Quality & Difficulty Analysis)
-- 目的: フレーズごとの解答実績・ブックマーク頻度を集計し、選択肢の誤認やタイポ、難易度の歪みを検知する。
-- アラート基準: 正答率が20%未満の問題は解説改訂またはシチュエーション文の修正を実施。
-- ------------------------------------------------------------------------------

WITH phrase_events AS (
  SELECT
    event_name,
    event_timestamp,
    user_pseudo_id,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'course') AS course,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'score') AS score,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'phrase_id') AS phrase_id,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'is_bookmarked') AS is_bookmarked
  FROM
    `turftalk_production.analytics_XXXXXXXXX.events_*`
  WHERE
    _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
    AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
),
bookmark_stats AS (
  SELECT
    phrase_id,
    COUNTIF(is_bookmarked = 'true') AS bookmark_add_count
  FROM
    phrase_events
  WHERE
    event_name = 'phrase_bookmarked'
  GROUP BY
    phrase_id
)
SELECT
  p.id AS phrase_id,
  p.phrase AS english_phrase,
  p.category,
  p.type,
  COALESCE(b.bookmark_add_count, 0) AS total_bookmarks,
  COUNT(DISTINCT u.user_id) AS mastered_user_count
FROM
  `turftalk_production.phrases_master` p
LEFT JOIN
  bookmark_stats b ON p.id = b.phrase_id
LEFT JOIN (
  SELECT
    document_name AS user_id,
    phrase_id
  FROM
    `turftalk_production.firestore_users_raw_latest`,
    UNNEST(JSON_EXTRACT_STRING_ARRAY(data, '$.progressData.learnedPhraseIds')) AS phrase_id
) u ON p.id = u.phrase_id
GROUP BY
  p.id, p.phrase, p.category, p.type, b.bookmark_add_count
ORDER BY
  mastered_user_count ASC, total_bookmarks DESC;


-- ------------------------------------------------------------------------------
-- 3. ユーザー継続率（リテンション） ＆ ストリーク分析 (Retention & Habituation)
-- 目的: 初回訪問日をコホートとして、Day 1（翌日）、Day 7（習慣化）、Day 30 の継続率を可視化する。
-- ------------------------------------------------------------------------------

WITH user_activity AS (
  SELECT
    document_name AS user_id,
    DATE(TIMESTAMP(JSON_VALUE(data, '$.createdAt'))) AS signup_date,
    DATE(TIMESTAMP(JSON_VALUE(data, '$.lastActiveAt'))) AS last_active_date,
    CAST(JSON_VALUE(data, '$.streakDays') AS INT64) AS streak_days,
    CAST(JSON_VALUE(data, '$.carrotCount') AS INT64) AS carrot_count
  FROM
    `turftalk_production.firestore_users_raw_latest`
  WHERE
    (BOOLEAN(JSON_VALUE(data, '$.isDeleted')) IS FALSE OR JSON_VALUE(data, '$.isDeleted') IS NULL)
),
cohort_summary AS (
  SELECT
    signup_date,
    COUNT(user_id) AS cohort_size,
    COUNTIF(DATE_DIFF(last_active_date, signup_date, DAY) >= 1) AS day_1_retained,
    COUNTIF(DATE_DIFF(last_active_date, signup_date, DAY) >= 7) AS day_7_retained,
    COUNTIF(DATE_DIFF(last_active_date, signup_date, DAY) >= 30) AS day_30_retained,
    ROUND(AVG(streak_days), 1) AS avg_streak_days,
    ROUND(AVG(carrot_count), 2) AS avg_carrot_count
  FROM
    user_activity
  GROUP BY
    signup_date
)
SELECT
  signup_date,
  cohort_size,
  ROUND(day_1_retained * 100.0 / NULLIF(cohort_size, 0), 1) AS day_1_retention_percent,
  ROUND(day_7_retained * 100.0 / NULLIF(cohort_size, 0), 1) AS day_7_retention_percent,
  ROUND(day_30_retained * 100.0 / NULLIF(cohort_size, 0), 1) AS day_30_retention_percent,
  avg_streak_days,
  avg_carrot_count
FROM
  cohort_summary
ORDER BY
  signup_date DESC;


-- ------------------------------------------------------------------------------
-- 4. 競走馬成績 ＆ 路線動向分析 (Career Routes & Win Rates)
-- 目的: 選択された路線の偏りや、各クラス・週末レースの勝率バランス（難易度）を検証する。
-- ------------------------------------------------------------------------------

SELECT
  JSON_VALUE(data, '$.currentHorseRoute') AS route_id,
  COUNT(document_name) AS horse_count,
  ROUND(COUNT(document_name) * 100.0 / SUM(COUNT(document_name)) OVER(), 1) AS route_popularity_percent,
  ROUND(AVG(CAST(JSON_VALUE(data, '$.totalRaceWins') AS INT64)), 2) AS avg_race_wins,
  SUM(CAST(JSON_VALUE(data, '$.totalHallOfFameCount') AS INT64)) AS total_hall_of_fame_count,
  ROUND(AVG(CAST(JSON_VALUE(data, '$.currentHorseWeek') AS INT64)), 1) AS avg_current_week
FROM
  `turftalk_production.firestore_users_raw_latest`
WHERE
  (BOOLEAN(JSON_VALUE(data, '$.isDeleted')) IS FALSE OR JSON_VALUE(data, '$.isDeleted') IS NULL)
  AND JSON_VALUE(data, '$.currentHorseRoute') IS NOT NULL
GROUP BY
  route_id
ORDER BY
  horse_count DESC;
