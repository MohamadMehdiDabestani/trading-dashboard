"use client";

import { memo, useEffect, useRef } from "react";

const EXCHANGE = "BINANCE";

type Props = {
  symbol: string; 
  interval?: string; // 1, 5, 15, 60, 240, D, W
  theme?: "light" | "dark";
};

const THEME_COLORS = {
  dark: { bg: "#0F0F0F", grid: "rgba(242, 242, 242, 0.06)" },
  light: { bg: "#FFFFFF", grid: "rgba(46, 46, 46, 0.06)" },
} as const;

function TradingViewChartComponent({
  symbol,
  interval = "60",
  theme = "dark",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const id = `tv_${symbol}_${Math.random().toString(36).slice(2, 8)}`;
    container.innerHTML = `<div id="${id}" style="height:100%;width:100%"></div>`;

    let disposed = false;
    let widget: any = null;

    const createWidget = () => {
      if (disposed) return;
      const colors = THEME_COLORS[theme];

      widget = new (window as any).TradingView.widget({
        container_id: id,
        autosize: true,
        symbol: `${EXCHANGE}:${symbol}`,
        interval,
        theme,
        style: "1",
        locale: "en",
        toolbar_bg: colors.bg,
        enable_publishing: false,
        allow_symbol_change: false,
        hide_side_toolbar: false,
      });
    };

    let resizeRaf = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    });
    observer.observe(container);

    // اگر tv.js قبلا لود شده، دوباره لودش نکن
    let script: HTMLScriptElement | null = null;
    if ((window as any).TradingView?.widget) {
      createWidget();
    } else {
      script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = createWidget;
      document.head.appendChild(script);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(resizeRaf);
      observer.disconnect();
      try {
        widget?.remove();
      } catch {}
      container.innerHTML = "";
      script?.remove();
    };
  }, [symbol, interval, theme]);

  return (
    <div
      ref={containerRef}
      dir="ltr"
      className="tradingview-widget-container absolute inset-0 overflow-hidden"
      style={{ backgroundColor: THEME_COLORS[theme].bg, colorScheme: theme }}
    />
  );
}

export const TradingViewChart = memo(TradingViewChartComponent);