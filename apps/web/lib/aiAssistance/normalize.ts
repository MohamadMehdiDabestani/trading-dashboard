const FA = "۰۱۲۳۴۵۶۷۸۹";
const AR = "٠١٢٣٤٥٦٧٨٩";

/** اعداد فارسی/عربی → لاتین، ي/ك → ی/ک، جداکننده‌های عددی */
export function normalizeText(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)))
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/٫/g, ".")
    .replace(/٬/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parsePositive(s: string): number | null {
  const n = Number(normalizeText(s).replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** عدد بدون نماد علمی (مطابق pattern بک‌اند: ^[0-9.]+$) */
export function toPlain(n: number, dp = 8): string {
  return n.toFixed(dp).replace(/\.?0+$/, "") || "0";
}

export function formatAmount(v: unknown, dp = 8): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(dp).replace(/\.?0+$/, "") || "0";
}