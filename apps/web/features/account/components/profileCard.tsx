"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { QrLoginDialog } from "../../auth/components/qrLoginDialog";

export const ProfileCard = () => {
  const t = useTranslations("account.profile");

  return (
    <Card className="bg-card text-center overflow-hidden border-border/60">
      <div className="h-20 bg-gradient-to-r from-primary/20 to-primary/5" />
      <CardContent className="relative pt-0 px-6 pb-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full border-4 border-card bg-secondary overflow-hidden -mt-10">
            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              DB
            </div>
          </div>
        </div>

        <h3 className="mt-3 font-bold text-foreground text-lg">
          {t("username")}
        </h3>

        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {t("level")}
        </div>
        <QrLoginDialog />
      </CardContent>
    </Card>
  );
};