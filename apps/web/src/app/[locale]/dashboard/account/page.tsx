"use client";
import React from "react";
import { KYCStepper } from "@/features/account/kycStepper";
import { ConnectedAccounts } from "@/features/account/connectedAccounts";
import { SecuritySettings } from "@/features/account/scuritySettings";
import { ProfileCard } from "@/features/account/profileCard";
import { AccountLimitsCard } from "@/features/account/accountLimits";

export default function DozBanehDashboard() {
  return (
    <div className="space-y-6">
      {/* هدر کنترل پلتفرم */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-black text-foreground"> پنل کاربری</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            مدیریت حساب، احراز هویت و تنظیمات امنیتی
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <main className="lg:col-span-9 space-y-6 order-2 lg:order-1">
          <KYCStepper />
          <ConnectedAccounts />
          <SecuritySettings />
        </main>

        <aside className="lg:col-span-3 space-y-6 order-1 lg:order-2">
          <ProfileCard />
          <AccountLimitsCard />
        </aside>
      </div>
    </div>
  );
}
