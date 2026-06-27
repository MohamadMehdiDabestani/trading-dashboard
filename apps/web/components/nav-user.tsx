"use client";

import React from "react";
import { Sun, Moon, Settings, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";

export function SidebarSettingsMenu() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

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
            حالت تیره/روشن
          </span>
        </Button>
        <Button
          className="justify-start bg-transparent rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
          size="lg"
        >
          <Settings className="size-5 text-muted-foreground group-hover:text-foreground" />
          <span className="font-semibold text-[13px] sm:text-sm">تنظیمات</span>
        </Button>
        <Button
          className="justify-start bg-transparent rounded-lg text-sm font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/15 transition-all duration-200"
          size="lg"
        >
          <LogOut className="size-5 flip-h" />
          <span className="text-[13px] sm:text-sm">خروج</span>
        </Button>
      </div>
    </div>
  );
}
