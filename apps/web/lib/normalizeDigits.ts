const FA = "۰۱۲۳۴۵۶۷۸۹";
const AR = "٠١٢٣٤٥٦٧٨٩";

export const normalizeDigits = (s: string) =>
  s
    .replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));

/** +98912... / 0098912... / 98912... -> 0912... */
export const normalizeMobile = (s: string) => {
  const v = normalizeDigits(s).replace(/[\s-]/g, "");
  return v.replace(/^(\+98|0098|98)(?=9\d{9}$)/, "0");
};