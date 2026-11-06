"use client";

import React, { useTransition } from "react";
import { Sun, Moon, Languages, LogOut, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useLogout } from "@/features/auth/hooks/useAuthMutations";
import { usePathname, useRouter } from "@/lib/i18nNavigation";

const LANGUAGES = [
  { code: "fa", label: "فارسی" },
  { code: "en", label: "English" },
] as const;

export function SidebarSettingsMenu() {
  const { theme, setTheme } = useTheme();
  const logout = useLogout();

  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("sidebar.footer")
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const changeLanguage = (nextLocale: string) => {
    if (nextLocale === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  const currentLanguage = LANGUAGES.find((l) => l.code === locale);

  return (
    <div className="w-full border-t border-border/60 pt-4 px-2 select-none">
      <div className="flex flex-col gap-1.5">
        <Button
          onClick={toggleTheme}
          className="justify-start bg-transparent rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
          size="lg"
        >
          <div className="relative size-5 flex items-center justify-center overflow-hidden">
            <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="size-5 absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </div>
          <span className="font-semibold text-[13px] sm:text-sm">
            {t('themeToggle')}
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={isPending}
              className="justify-start bg-transparent rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
              size="lg"
            >
              <Languages className="size-5" />
              <span className="font-semibold text-[13px] sm:text-sm">
                {currentLanguage?.label ?? "زبان"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="min-w-40">
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className="flex items-center justify-between gap-2 cursor-pointer"
              >
                <span>{lang.label}</span>
                {lang.code === locale && <Check className="size-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          className="justify-start bg-transparent rounded-lg text-sm font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/15 transition-all duration-200"
          size="lg"
          onClick={() => logout.mutate()}
        >
          <LogOut className="size-5 flip-h" />
          <span className="text-[13px] sm:text-sm">{t("logout")}</span>
        </Button>
      </div>
    </div>
  );
}