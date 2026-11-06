"use client";

import { useTransition } from "react";
import { Sun, Moon, Languages } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/lib/i18nNavigation";

export function ThemeAndLocaleToggle() {
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const nextLocale = locale === "fa" ? "en" : "fa";
  const nextLabel = locale === "fa" ? "EN" : "فا";

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const switchLocale = () => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className="flex items-center gap-1">
      {/* Language Switch */}
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={switchLocale}
        className="h-8 px-2 font-mono text-xs font-semibold text-muted-foreground hover:text-foreground rounded-lg"
        title="Switch language"
      >
        <Languages className="size-3.5" />
        <span className="text-[11px] font-bold">{nextLabel}</span>
      </Button>

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggleTheme}
        className="relative text-muted-foreground hover:text-foreground rounded-lg"
        title="Toggle dark/light mode"
        aria-label="Toggle theme"
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="size-4 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </Button>
    </div>
  );
}
