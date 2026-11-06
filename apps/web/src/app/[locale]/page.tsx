import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getTranslations } from "next-intl/server";
import type { MarketPricesReply } from "@repo/types";
import {
  Activity,
  ArrowUpRight,
  Blocks,
  BookOpen,
  Bot,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  Globe2,
  KeyRound,
  Layers,
  LayoutGrid,
  QrCode,
  Radio,
  Server,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wallet,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getQueryClient } from "@/lib/getQueryClient";
import { serverFetch } from "@/lib/serverFetch";
import { Link } from "@/lib/i18nNavigation";
import { walletPaths } from "@/features/wallet/api";
import { walletQueries } from "@/features/wallet/api/wallet.queries";
import { LandingHeaderControls } from "@/features/landing/components/landingHeaderControls";
import { LiveEngineShowcase } from "@/features/landing/components/liveEngineShowcase";
import { JevAiWorkflowShowcase } from "@/features/landing/components/jevAiWorkflowShowcase";
import { cn } from "@/lib/cn";

const TECH_BADGES = [
  "Next.js 16 (SSR + BFF)",
  "React 19",
  "TanStack Query v5",
  "Fastify 5",
  "sorted-btree Engine",
  "Big.js (10^18)",
  "WebSocket Store",
  "Drizzle ORM + PostgreSQL",
  "Turborepo Monorepo",
  "Zod 4 + CASL",
  "JEV AI Agent (jev-1.13)",
  "next-intl (RTL / LTR)",
] as const;

const PILLAR_KEYS = [
  {
    key: "orderEngine",
    icon: Cpu,
    accent: "text-primary bg-primary/10 border-primary/25",
    code: "sorted-btree • Big.js",
    href: "/dashboard/trade/btc",
    featured: true,
  },
  {
    key: "realtimeOrders",
    icon: Zap,
    accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/25",
    code: "POST /trade/new • WS",
    href: "/dashboard/trade/btc",
    featured: true,
  },
  {
    key: "orderbookManager",
    icon: BookOpen,
    accent: "text-amber-500 bg-amber-500/10 border-amber-500/25",
    code: "L2 Snapshot + Tickers",
    href: "/dashboard/trade/btc",
    featured: false,
  },
  {
    key: "marketMaker",
    icon: Bot,
    accent: "text-purple-400 bg-purple-500/10 border-purple-500/25",
    code: "Autonomous Liquidity",
    href: "/dashboard/markets",
    featured: false,
  },
  {
    key: "ssrBff",
    icon: Server,
    accent: "text-primary bg-primary/10 border-primary/25",
    code: "HydrationBoundary + Proxy",
    href: "/dashboard/wallet",
    featured: true,
  },
  {
    key: "wsManager",
    icon: Radio,
    accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/25",
    code: "useSyncExternalStore",
    href: "/dashboard",
    featured: false,
  },
  {
    key: "genericQuery",
    icon: Layers,
    accent: "text-sky-400 bg-sky-500/10 border-sky-500/25",
    code: "Isomorphic queryOptions",
    href: "/dashboard/wallet",
    featured: false,
  },
  {
    key: "otpLogin",
    icon: KeyRound,
    accent: "text-amber-500 bg-amber-500/10 border-amber-500/25",
    code: "6-Digit Auto-Advance",
    href: "/auth/otp",
    featured: false,
  },
  {
    key: "qrLogin",
    icon: QrCode,
    accent: "text-primary bg-primary/10 border-primary/25",
    code: "Cross-Device Handshake",
    href: "/dashboard/account",
    featured: false,
  },
  {
    key: "multilanguage",
    icon: Globe2,
    accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/25",
    code: "FA (RTL) • EN (LTR)",
    href: "/dashboard",
    featured: false,
  },
  {
    key: "advancedUx",
    icon: LayoutGrid,
    accent: "text-purple-400 bg-purple-500/10 border-purple-500/25",
    code: "@dnd-kit • AI Assistant",
    href: "/dashboard/trade/btc",
    featured: false,
  },
  {
    key: "monorepo",
    icon: Blocks,
    accent: "text-sky-400 bg-sky-500/10 border-sky-500/25",
    code: "apps/* + @repo/*",
    href: "/dashboard",
    featured: false,
  },
  {
    key: "fullstackJs",
    icon: Code2,
    accent: "text-primary bg-primary/10 border-primary/25",
    code: "Next 16 + Fastify 5",
    href: "/dashboard",
    featured: false,
  },
  {
    key: "securityLedger",
    icon: Wallet,
    accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/25",
    code: "Double-Entry Ledger",
    href: "/dashboard/wallet",
    featured: false,
  },
] as const;

const ARCH_STEPS = [
  { key: "client", icon: LayoutGrid },
  { key: "bff", icon: Server },
  { key: "api", icon: ShieldCheck },
  { key: "engine", icon: Cpu },
  { key: "db", icon: Database },
] as const;

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const qc = getQueryClient();

  // Prefetch live market prices on the server so the interactive hero showcase
  // hydrates with zero network waterfall when the backend is reachable.
  await qc.prefetchQuery({
    ...walletQueries.marketPrices(),
    queryFn: () => serverFetch<MarketPricesReply>(walletPaths.marketPrices()),
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary overflow-x-hidden">
        {/* Ambient radial background */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 start-1/4 h-96 w-96 rounded-full bg-primary/12 blur-3xl" />
          <div className="absolute top-1/3 end-10 h-80 w-80 rounded-full bg-emerald-500/8 blur-3xl" />
        </div>

        {/* Sticky Top Bar */}
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Activity className="size-5" />
                </div>
                <span className="font-black text-base tracking-tight">
                  {t("nav.brand")}
                </span>
              </Link>
              <Badge
                variant="secondary"
                className="hidden sm:inline-flex font-medium text-[11px]"
              >
                {t("nav.badge")}
              </Badge>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <a
                href="#engine"
                className="hover:text-foreground transition-colors"
              >
                {t("nav.engine")}
              </a>
              <a
                href="#pillars"
                className="hover:text-foreground transition-colors"
              >
                {t("nav.features")}
              </a>
              <a
                href="#ai-agent"
                className="hover:text-foreground transition-colors"
              >
                {t("nav.ai")}
              </a>
              <a
                href="#architecture"
                className="hover:text-foreground transition-colors"
              >
                {t("nav.architecture")}
              </a>
              <a
                href="#auth"
                className="hover:text-foreground transition-colors"
              >
                {t("nav.auth")}
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <LandingHeaderControls />
              <Link href="/auth" className="hidden sm:block">
                <Button variant="ghost" color="secondary" size="sm">
                  {t("nav.login")}
                </Button>
              </Link>
              <Link href="/dashboard/trade/btc">
                <Button size="sm" className="font-bold">
                  <Terminal className="size-3.5" />
                  <span>{t("nav.cta")}</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {/* ───── HERO SECTION ───── */}
          <section
            id="engine"
            className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8 lg:pt-16 lg:pb-24"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              {/* Left Narrative Column */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
                  <Sparkles className="size-3.5" />
                  <span>{t("hero.eyebrow")}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.15]">
                  <span className="block text-foreground">
                    {t("hero.titleLine1")}
                  </span>
                  <span className="mt-1 block bg-gradient-to-r from-primary via-sky-400 to-emerald-500 bg-clip-text text-transparent">
                    {t("hero.titleHighlight")}
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                  {t("hero.subtitle")}
                </p>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link href="/dashboard/trade/btc">
                    <Button size="xl" className="font-bold shadow-lg shadow-primary/20">
                      <Terminal className="size-5" />
                      <span>{t("hero.primaryCta")}</span>
                      <ArrowUpRight className="size-4" />
                    </Button>
                  </Link>

                  <Link href="/auth/otp">
                    <Button
                      variant="outline"
                      color="primary"
                      size="xl"
                      className="font-bold"
                    >
                      <KeyRound className="size-4" />
                      <span>{t("hero.secondaryCta")}</span>
                    </Button>
                  </Link>

                  <a href="#pillars">
                    <Button variant="ghost" color="secondary" size="xl">
                      <span>{t("hero.exploreCta")}</span>
                    </Button>
                  </a>
                </div>

                {/* Tech Stack Pills */}
                <div className="pt-2">
                  <div className="flex flex-wrap gap-1.5" dir="ltr">
                    {TECH_BADGES.map((tech) => (
                      <span
                        key={tech}
                        className="inline-flex items-center rounded-lg border border-border/70 bg-card/70 px-2.5 py-1 font-mono text-[11px] font-medium text-muted-foreground"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Interactive Engine Preview Column */}
              <div className="lg:col-span-6">
                <LiveEngineShowcase />
              </div>
            </div>

            {/* ───── METRICS STRIP ───── */}
            <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(["engine", "streaming", "rendering", "monorepo"] as const).map(
                (k) => (
                  <div
                    key={k}
                    className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm p-5 flex flex-col justify-between gap-2 hover:border-primary/40 transition-colors"
                  >
                    <span
                      dir="ltr"
                      className="font-mono text-2xl sm:text-3xl font-black tracking-tight text-primary w-fit"
                    >
                      {t(`metrics.${k}.value`)}
                    </span>
                    <div>
                      <h2 className="font-bold text-sm text-foreground">
                        {t(`metrics.${k}.label`)}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t(`metrics.${k}.detail`)}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </section>

          {/* ───── 14 ARCHITECTURAL PILLARS BENTO GRID ───── */}
          <section
            id="pillars"
            className="border-t border-border/60 bg-dashboard/60 py-16 lg:py-24"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="max-w-3xl space-y-3">
                <Badge variant="secondary" className="text-primary font-semibold">
                  {t("pillars.eyebrow")}
                </Badge>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                  {t("pillars.title")}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {t("pillars.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PILLAR_KEYS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={cn(
                        "group relative rounded-2xl border border-border/70 bg-card p-6 flex flex-col justify-between gap-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg",
                        item.featured && "lg:col-span-1 ring-1 ring-primary/15",
                      )}
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className={cn(
                              "flex size-10 items-center justify-center rounded-xl border",
                              item.accent,
                            )}
                          >
                            <Icon className="size-5" />
                          </div>
                          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            {t(`pillars.items.${item.key}.tag`)}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                          {t(`pillars.items.${item.key}.title`)}
                        </h3>

                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {t(`pillars.items.${item.key}.desc`)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <code
                          dir="ltr"
                          className="text-[11px] font-mono text-muted-foreground"
                        >
                          {item.code}
                        </code>
                        <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ───── JEV AI AGENT WORKFLOW SECTION ───── */}
          <section
            id="ai-agent"
            className="border-t border-border/60 py-16 lg:py-24"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
              <div className="max-w-3xl space-y-3">
                <Badge variant="secondary" className="text-primary font-semibold">
                  <Bot className="size-3.5" />
                  <span>{t("aiSection.eyebrow")}</span>
                </Badge>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                  {t("aiSection.title")}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {t("aiSection.subtitle")}
                </p>
              </div>

              <JevAiWorkflowShowcase />
            </div>
          </section>

          {/* ───── SYSTEM ARCHITECTURE PIPELINE ───── */}
          <section
            id="architecture"
            className="border-t border-border/60 py-16 lg:py-24"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="max-w-3xl space-y-3">
                <Badge variant="secondary" className="text-primary font-semibold">
                  {t("architecture.eyebrow")}
                </Badge>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                  {t("architecture.title")}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {t("architecture.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {ARCH_STEPS.map(({ key, icon: Icon }, idx) => (
                  <Card
                    key={key}
                    className="relative border-border/70 bg-card/80 hover:border-primary/40 transition-colors"
                  >
                    <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="size-4.5" />
                          </div>
                          <span className="font-mono text-xs font-bold text-muted-foreground">
                            0{idx + 1}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-foreground">
                          {t(`architecture.steps.${key}.title`)}
                        </h3>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {t(`architecture.steps.${key}.desc`)}
                        </p>
                      </div>

                      <div
                        dir="ltr"
                        className="rounded-lg bg-muted/60 px-2.5 py-1.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {t(`architecture.steps.${key}.tech`)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* ───── AUTHENTICATION SPOTLIGHT (OTP + QR CODE) ───── */}
          <section
            id="auth"
            className="border-t border-border/60 bg-dashboard/60 py-16 lg:py-24"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="max-w-3xl space-y-3">
                <Badge variant="secondary" className="text-primary font-semibold">
                  {t("authSpotlight.eyebrow")}
                </Badge>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                  {t("authSpotlight.title")}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {t("authSpotlight.subtitle")}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* OTP Easy Login Card */}
                <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-sm">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="bg-amber-500/15 text-amber-500"
                      >
                        <KeyRound className="size-3.5" />
                        <span>{t("authSpotlight.otp.badge")}</span>
                      </Badge>
                      <code
                        dir="ltr"
                        className="font-mono text-xs text-muted-foreground"
                      >
                        /auth/otp
                      </code>
                    </div>

                    <h3 className="text-xl font-black">
                      {t("authSpotlight.otp.title")}
                    </h3>

                    {/* Visual 6-digit OTP representation */}
                    <div
                      dir="ltr"
                      className="flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/60 p-4 font-mono"
                    >
                      {["4", "8", "2", "9", "1", "•"].map((digit, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex size-10 sm:size-11 items-center justify-center rounded-xl border text-base font-black",
                            i === 5
                              ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/25"
                              : "border-border bg-card text-foreground",
                          )}
                        >
                          {digit}
                        </div>
                      ))}
                    </div>

                    <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                      {(["step1", "step2", "step3"] as const).map((s) => (
                        <li key={s} className="flex items-center gap-2.5">
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                          <span>{t(`authSpotlight.otp.${s}`)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href="/auth/otp">
                    <Button
                      variant="secondary"
                      color="primary"
                      size="lg"
                      className="w-full font-bold"
                    >
                      <KeyRound className="size-4" />
                      <span>{t("authSpotlight.otp.action")}</span>
                      <ArrowUpRight className="size-4" />
                    </Button>
                  </Link>
                </div>

                {/* QR Code Device Link Card */}
                <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-sm">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="bg-primary/15 text-primary"
                      >
                        <QrCode className="size-3.5" />
                        <span>{t("authSpotlight.qr.badge")}</span>
                      </Badge>
                      <code
                        dir="ltr"
                        className="font-mono text-xs text-muted-foreground"
                      >
                        /deviceLink/[token]
                      </code>
                    </div>

                    <h3 className="text-xl font-black">
                      {t("authSpotlight.qr.title")}
                    </h3>

                    {/* Visual QR + Verification Handshake Mock */}
                    <div
                      dir="ltr"
                      className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/60 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary">
                          <QrCode className="size-7" />
                        </div>
                        <div className="font-mono text-xs">
                          <div className="font-bold text-foreground">
                            Chrome / Windows
                          </div>
                          <div className="text-muted-foreground text-[11px]">
                            IP: 185.143.xx.xx
                          </div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-sm font-black tracking-widest text-emerald-500">
                        7394
                      </div>
                    </div>

                    <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                      {(["step1", "step2", "step3"] as const).map((s) => (
                        <li key={s} className="flex items-center gap-2.5">
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                          <span>{t(`authSpotlight.qr.${s}`)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link href="/dashboard/account">
                    <Button
                      variant="secondary"
                      color="primary"
                      size="lg"
                      className="w-full font-bold"
                    >
                      <QrCode className="size-4" />
                      <span>{t("authSpotlight.qr.action")}</span>
                      <ArrowUpRight className="size-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ───── FINAL CTA BANNER ───── */}
          <section className="border-t border-border/60 py-16 lg:py-20">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-emerald-500/10 p-8 sm:p-12 text-center space-y-6 shadow-xl">
                <Badge variant="default" className="font-semibold">
                  {t("cta.badge")}
                </Badge>

                <h2 className="text-2xl sm:text-4xl font-black tracking-tight max-w-2xl mx-auto">
                  {t("cta.title")}
                </h2>

                <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  {t("cta.subtitle")}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link href="/dashboard/trade/btc">
                    <Button size="xl" className="font-bold">
                      <Terminal className="size-5" />
                      <span>{t("cta.primary")}</span>
                    </Button>
                  </Link>

                  <Link href="/dashboard/wallet">
                    <Button variant="secondary" color="primary" size="xl" className="font-bold">
                      <Wallet className="size-5" />
                      <span>{t("cta.wallet")}</span>
                    </Button>
                  </Link>

                  <Link href="/dashboard/markets">
                    <Button variant="outline" color="secondary" size="xl">
                      <span>{t("cta.markets")}</span>
                    </Button>
                  </Link>

                  <Link href="/auth/otp">
                    <Button variant="outline" color="secondary" size="xl">
                      <span>{t("cta.secondary")}</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* ───── FOOTER ───── */}
        <footer className="border-t border-border/60 bg-card/40 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <span className="font-bold text-foreground">
                {t("nav.brand")}
              </span>
              <span>— {t("footer.builtAs")}</span>
            </div>

            <div className="flex flex-wrap items-center gap-5 font-medium">
              <Link href="/dashboard" className="hover:text-foreground">
                {t("footer.dashboard")}
              </Link>
              <Link
                href="/dashboard/trade/btc"
                className="hover:text-foreground"
              >
                {t("footer.trade")}
              </Link>
              <Link href="/dashboard/wallet" className="hover:text-foreground">
                {t("footer.wallet")}
              </Link>
              <Link href="/dashboard/markets" className="hover:text-foreground">
                {t("footer.markets")}
              </Link>
              <Link href="/auth/otp" className="hover:text-foreground">
                {t("footer.auth")}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </HydrationBoundary>
  );
}
