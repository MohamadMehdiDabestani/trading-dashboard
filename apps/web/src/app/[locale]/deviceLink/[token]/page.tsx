import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/getQueryClient";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { DeviceLinkView } from "@/features/account/components/deviceLinkView";

type Props = {
  params: Promise<{ token: string; locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "deviceLink" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function DeviceLinkPage({ params }: Props) {
  const { token, locale } = await params;
  setRequestLocale(locale);

  const qc = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <DeviceLinkView token={token} />
    </HydrationBoundary>
  );
}
