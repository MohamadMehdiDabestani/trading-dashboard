// lib/historyManager.ts
import { Drawing } from "./drawingEngine";

export class HistoryManager {
  private history: Drawing[][] = [];
  private currentIndex: number = -1;
  private maxHistory: number = 50;

  constructor(initialState: Drawing[] = []) {
    this.pushState(initialState);
  }

  // ذخیره وضعیت فعلی
  pushState(state: Drawing[]): void {
    // اگر در جایگاه قبلی نیستیم، تاریخچه بعدی را حذف کن
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // کلون عمیق از وضعیت فعلی
    const clonedState = state.map(drawing => ({
      ...drawing,
      points: drawing.points.map(p => ({ ...p }))
    }));

    this.history.push(clonedState);
    
    // اگر از حداکثر تعداد بیشتر شد، قدیمی‌ترین را حذف کن
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  // برگشت به وضعیت قبلی (Undo)
  undo(): Drawing[] | undefined {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return undefined;
  }

  // رفتن به وضعیت بعدی (Redo)
  redo(): Drawing[] | undefined {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return undefined;
  }

  // بررسی اینکه آیا قابلیت Undo وجود دارد
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  // بررسی اینکه آیا قابلیت Redo وجود دارد
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  // دریافت وضعیت فعلی
  getCurrentState(): Drawing[] | undefined {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return undefined;
  }

  // پاک کردن تاریخچه
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  // گرفتن تعداد آیتم‌های تاریخچه
  getHistoryLength(): number {
    return this.history.length;
  }

  // گرفتن ایندکس فعلی
  getCurrentIndex(): number {
    return this.currentIndex;
  }
}