"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18nNavigation";
import { useMe } from "@/hooks/useMe";
import { useLogout } from "@/features/auth/hooks/useAuthMutations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Wallet,
  Shield,
  LogOut,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

export function UserMenu() {
  const { data: me } = useMe();
  const logout = useLogout();
  const t = useTranslations("navbar.user");

  const displayName =
    me?.user?.username ??
    (me?.user?.phone ? me.user.phone.slice(-4) : "User");

  const initials =
    me?.user?.username
      ? me.user.username.slice(0, 2).toUpperCase()
      : me?.user?.phone
        ? me.user.phone.slice(-2)
        : "TR";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 p-1 pe-2 rounded-full hover:bg-muted/60 transition-colors border border-border/50 bg-background/50 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <div className="relative">
            <Avatar className="size-7 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 end-0 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
          </div>

          <div className="hidden sm:flex flex-col text-left rtl:text-right">
            <span className="text-xs font-semibold leading-none truncate max-w-24">
              {me?.user?.phone ?? displayName}
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">
              {t("level")}
            </span>
          </div>

          <ChevronDown className="size-3 text-muted-foreground opacity-60 hidden sm:block" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-1.5 border-border/80">
        <DropdownMenuLabel className="p-2 font-normal">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-9 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-0.5 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {me?.user?.phone ?? displayName}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="size-3" />
                <span>{t("verified")}</span>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer text-xs">
            <Link href="/dashboard/account" className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <span>{t("account")}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer text-xs">
            <Link href="/dashboard/wallet" className="flex items-center gap-2">
              <Wallet className="size-4 text-muted-foreground" />
              <span>{t("wallet")}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer text-xs">
            <Link href="/dashboard/account" className="flex items-center gap-2">
              <Shield className="size-4 text-muted-foreground" />
              <span>{t("security")}</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => logout.mutate()}
          className="text-xs text-rose-600 dark:text-rose-400 focus:bg-rose-500/10 focus:text-rose-600 dark:focus:text-rose-400 cursor-pointer flex items-center gap-2"
        >
          <LogOut className="size-4 flip-h" />
          <span>{t("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
