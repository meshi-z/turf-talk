import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ScrollableTarget {
  scrollTo?: (x: number, y: number) => void;
}

/**
 * 画面遷移や問題切り替え時にスクロール位置を即座にページ最上部へリセットする
 */
export function scrollToTop(
  target: ScrollableTarget | null | undefined = typeof window !== 'undefined' ? window : undefined
): void {
  if (target && typeof target.scrollTo === 'function') {
    target.scrollTo(0, 0);
  }
}
