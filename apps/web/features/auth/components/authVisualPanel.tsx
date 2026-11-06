"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Activity,
  Cpu,
  Layers,
  Lock,
  Radio,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AuthVisualPanel() {
  const t = useTranslations("auth.hero");

  return (
    <div className="hidden md:flex flex-1 relative bg-[#0B0E17] text-white flex-col justify-between p-8 lg:p-12 overflow-hidden border-s border-border/40 select-none">
      {/* Ambient Radial Lights */}
      <div className="pointer-events-none absolute -top-32 -start-32 size-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 end-0 size-96 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 size-[32rem] rounded-full bg-indigo-600/10 blur-3xl" />

      {/* Cyber Grid Pattern Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(to right, #fff 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* Top Bar with Brand Badge & Real-time Indicator */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Activity className="size-5" />
          </div>
          <span className="font-black text-lg tracking-tight">CryptoTrade Pro</span>
        </div>

        <Badge
          variant="secondary"
          className="gap-2 bg-emerald-500/15 text-emerald-400 border-emerald-500/30 px-3 py-1 font-mono text-xs"
        >
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
          </span>
          <Radio className="size-3.5" />
          <span>MATCHING ENGINE LIVE</span>
        </Badge>
      </div>

      {/* Centerpiece Vector Illustration with Floating HUD Cards */}
      <div className="relative z-10 my-auto py-6 flex items-center justify-center">
        {/* Glow backdrop for image */}
        <div className="relative w-full max-w-lg aspect-square">
          <Image
            src="/images/auth-vector.svg"
            alt="Cryptographic Matching Engine & Orderbook Architecture"
            fill
            priority
            className="object-contain drop-shadow-2xl transition-transform duration-700 hover:scale-[1.02]"
          />

          {/* Floating HUD Pill 1: Top Right/Left */}
          <div
            className="absolute -top-2 end-4 rounded-xl border border-indigo-500/30 bg-[#141829]/90 backdrop-blur-md px-3.5 py-2 shadow-xl flex items-center gap-2.5"
            dir="ltr"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Zap className="size-4" />
            </div>
            <div className="text-left font-mono">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                FIFO MATCH
              </div>
              <div className="text-xs font-black text-emerald-400">&lt; 0.38 ms</div>
            </div>
          </div>

          {/* Floating HUD Pill 2: Bottom Left/Right */}
          <div
            className="absolute -bottom-2 start-4 rounded-xl border border-emerald-500/30 bg-[#141829]/90 backdrop-blur-md px-3.5 py-2 shadow-xl flex items-center gap-2.5"
            dir="ltr"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="size-4" />
            </div>
            <div className="text-left font-mono">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                BALANCE LEDGER
              </div>
              <div className="text-xs font-black text-white">Double-Entry</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Narrative & Metrics Strip */}
      <div className="relative z-10 space-y-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            <span>{t("badge")}</span>
          </div>

          <h2 className="text-xl lg:text-2xl font-black tracking-tight leading-snug">
            {t("title")}
          </h2>

          <p className="text-xs lg:text-sm text-slate-400 leading-relaxed max-w-xl">
            {t("subtitle")}
          </p>
        </div>

        {/* 4 Metric Badges */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
          <div className="space-y-0.5">
            <div className="text-sm lg:text-base font-black text-emerald-400" dir="ltr">
              {t("statLatency")}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {t("statLatencyLabel")}
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-sm lg:text-base font-black text-primary" dir="ltr">
              {t("statEngine")}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {t("statEngineLabel")}
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-sm lg:text-base font-black text-sky-400" dir="ltr">
              {t("statStream")}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {t("statStreamLabel")}
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-sm lg:text-base font-black text-amber-400" dir="ltr">
              {t("statSecurity")}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {t("statSecurityLabel")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
