export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0: 日, 1: 月, ..., 6: 土

export type AppMode = 'weekday' | 'weekend';

export const DAY_NAMES_JA: readonly string[] = ['日', '月', '火', '水', '木', '金', '土'];
export const DAY_NAMES_EN: readonly string[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/**
 * Date オブジェクトまたは 'YYYY-MM-DD' 形式の文字列から曜日番号（0:日〜6:土）を取得
 */
export function getDayOfWeek(date: Date | string): DayOfWeek {
  if (typeof date === 'string') {
    const parts = date.split('-');
    if (parts.length === 3) {
      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const day = Number(parts[2]);
      return new Date(year, month, day).getDay() as DayOfWeek;
    }
    return new Date(date).getDay() as DayOfWeek;
  }
  return date.getDay() as DayOfWeek;
}

/**
 * 曜日が週末（土・日）かどうかを判定
 */
export function isWeekend(target: DayOfWeek | Date | string): boolean {
  const day = typeof target === 'number' ? target : getDayOfWeek(target);
  return day === 0 || day === 6;
}

/**
 * 今週末（土曜日）までの残り日数を算出
 * - 月曜: 5日
 * - 火曜: 4日
 * - 水曜: 3日
 * - 木曜: 2日
 * - 金曜: 1日
 * - 土曜・日曜: 0日（開催中）
 */
export function getDaysUntilWeekend(target: DayOfWeek | Date | string): number {
  const day = typeof target === 'number' ? target : getDayOfWeek(target);
  if (day === 0 || day === 6) {
    return 0;
  }
  return 6 - day;
}

/**
 * 曜日からアプリの稼働モード（平日調教 / 週末レース）を判定
 */
export function getAppMode(target: DayOfWeek | Date | string): AppMode {
  return isWeekend(target) ? 'weekend' : 'weekday';
}
