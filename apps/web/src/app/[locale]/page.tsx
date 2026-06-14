import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";


export default function Home() {
  const t = useTranslations("d");

  return (
    <div>
      {t("a")}
      <Button variant="outline">Open alert</Button>
    </div>
  );
}
