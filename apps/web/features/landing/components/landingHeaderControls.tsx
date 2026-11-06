"use client";

import { useTransition } from "react";
import { Languages, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/lib/i18nNavigation";

export function LandingHeaderControls() {
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const nextLocale = locale === "fa" ? "en" : "fa";
  const nextLabel = locale === "fa" ? "EN" : "فا";

  const switchLocale = () => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
         color="secondary"
        size="sm"
        disabled={isPending}
        onClick={switchLocale}
        className="font-mono text-xs font-bold px-2.5 border-border/70 bg-background/60 backdrop-blur-sm"
      >
        <Languages className="size-3.5" />
        <span>{nextLabel}</span>
      </Button>

      <Button
        variant="outline"
        color="secondary"
        size="icon-sm"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
        className="border-border/70 bg-background/60 backdrop-blur-sm"
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="size-4 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
    </div>
  );
}
