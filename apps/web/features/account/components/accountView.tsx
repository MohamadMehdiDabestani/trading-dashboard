"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { KYCStepper } from "./kycStepper";
import { ConnectedAccounts } from "./connectedAccounts";
import { SecuritySettings } from "./scuritySettings";
import { ProfileCard } from "./profileCard";
import { AccountLimitsCard } from "./accountLimits";

export function AccountView() {
  const t = useTranslations("account.page");

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-black text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("subtitle")}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
        <main className="lg:col-span-9 min-w-0 space-y-6 order-2 lg:order-1">
          <KYCStepper />
          <ConnectedAccounts />
          <SecuritySettings />
        </main>

        <aside className="lg:col-span-3 min-w-0 space-y-6 order-1 lg:order-2">
          <ProfileCard />
          <AccountLimitsCard />
        </aside>
      </div>
    </div>
  );
}
