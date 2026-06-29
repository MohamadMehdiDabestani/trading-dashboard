import { getTranslations } from "next-intl/server";

const staticKeys = ["dashboard", "wallet", "settings", "profile"] as const;
type StaticKey = (typeof staticKeys)[number];

function isStaticKey(value: string): value is StaticKey {
  return (staticKeys as readonly string[]).includes(value);
}

export async function getBreadcrumbLabel(segment: string): Promise<string> {
  const t = await getTranslations("breadcrumbs");

  if (isStaticKey(segment)) {
    return t(segment);
  }

  // dynamic مثل usdt, btc
  if (/^[a-z]{2,10}$/i.test(segment)) {
    return segment.toUpperCase();
  }

  return segment;
}
