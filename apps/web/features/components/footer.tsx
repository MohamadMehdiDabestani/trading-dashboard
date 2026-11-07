import React from "react";
import { Activity, FolderCode, Rocket } from "lucide-react";
import { Link } from "@/lib/i18nNavigation";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full max-w-full border-t bg-background/50 backdrop-blur-sm mt-10">
      <div className="container max-w-full mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground order-2 md:order-1">
            {t("copyright", { year: currentYear })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 order-1 md:order-2">
            <Link
              href="https://github.com/MohamadMehdiDabestani/trading-dashboard"
              target="_blank"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <FolderCode className="size-4" />
              <span>{t("sourceCode")}</span>
            </Link>
            <Link
              href={`https://vercel.com/new/clone?repository-url=${encodeURIComponent("https://github.com/MohamadMehdiDabestani/trading-dashboard")}`}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Rocket className="size-4" />
              <span>{t("vercelDeploy")}</span>
            </Link>

            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground cursor-help hover:text-emerald-500 transition-colors">
              <Activity className="size-4" />
              <span>{t("networkStatus")}</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            <nav className="flex items-center gap-4 border-s ps-6 ms-2 hidden sm:flex">
              <Link
                href="#"
                className="text-xs text-muted-foreground hover:underline"
              >
                {t("terms")}
              </Link>
              <Link
                href="#"
                className="text-xs text-muted-foreground hover:underline"
              >
                {t("privacy")}
              </Link>
              <Link
                href="#"
                className="text-xs text-muted-foreground hover:underline"
              >
                {t("api")}
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
