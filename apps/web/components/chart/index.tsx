"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  UTCTimestamp,
  IChartApi,
  ISeriesApi,
  Time,
  CrosshairMode,
} from "lightweight-charts";
import { cn } from "@/lib/cn";

type Anchor = { time: Time; price: number };

type Props = {
  className?: string;
  onAnchorChange?: (a: Anchor) => void; // optional برای sync بیرونی
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function generateMockCandles(count: number) {
  const data = [];
  let currentPrice = 100;
  const baseTime = Math.floor(Date.now() / 1000) - count * 60;

  for (let i = 0; i < count; i++) {
    const time = (baseTime + i * 60) as UTCTimestamp;
    const change = (Math.random() - 0.49) * 4;
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * 1.5;
    const low = Math.min(open, close) - Math.random() * 1.5;

    data.push({
      time,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
    });

    currentPrice = close;
  }
  return data;
}

export function Chart({ className, onAnchorChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);

  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const candles = useMemo(() => generateMockCandles(300), []);
  const syncRafRef = useRef<number | null>(null);
  const syncingRef = useRef(false);

  const startSyncLoop = () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    const tick = () => {
      if (!syncingRef.current) return;
      if (!draggingRef.current) updateMarkerFromAnchor();
      syncRafRef.current = requestAnimationFrame(tick);
    };

    syncRafRef.current = requestAnimationFrame(tick);
  };

  const stopSyncLoop = () => {
    syncingRef.current = false;
    if (syncRafRef.current != null) {
      cancelAnimationFrame(syncRafRef.current);
      syncRafRef.current = null;
    }
    if (!draggingRef.current) updateMarkerFromAnchor();
  };
  // state-free anchor (برای جلوگیری از rerender)
  const anchorRef = useRef<Anchor>({
    time: candles[200].time,
    price: candles[200].close,
  });

  // آخرین مختصات پیکسلی anchor
  const pixelRef = useRef<{ x: number; y: number } | null>(null);

  // drag runtime refs
  const draggingRef = useRef(false);
  const dragStartPointerRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartPixelRef = useRef<{ x: number; y: number } | null>(null);

  const setMarkerPixel = (x: number, y: number) => {
    const marker = markerRef.current;
    if (!marker) return;
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
  };

  const setMarkerVisible = (visible: boolean) => {
    const marker = markerRef.current;
    if (!marker) return;
    marker.style.display = visible ? "block" : "none";
  };

  const updateMarkerFromAnchor = () => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const x = chart.timeScale().timeToCoordinate(anchorRef.current.time);
    const y = series.priceToCoordinate(anchorRef.current.price);

    if (x == null || y == null || Number.isNaN(x) || Number.isNaN(y)) {
      pixelRef.current = null;
      setMarkerVisible(false);
      return;
    }

    pixelRef.current = { x, y };
    setMarkerVisible(true);
    setMarkerPixel(x, y);
  };

  useEffect(() => {
    const container = containerRef.current!;
    if (!container || chartRef.current) return;
    const doc = container.ownerDocument;
    const chart = createChart(container, {
      width: container.clientWidth || 300,
      height: container.clientHeight || 320,
      layout: { background: { color: "#0f172a" }, textColor: "#d1d5db" },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#1f2937" },
      },
      rightPriceScale: { borderColor: "#334155" },
      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: { mode: CrosshairMode.Normal },
    });

    const series = chart.addSeries(CandlestickSeries);
    series.setData(candles);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    // --- subscriptions (بدون RAF loop) ---
    const onRangeChange = () => {
      if (!draggingRef.current) updateMarkerFromAnchor();
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(onRangeChange);

    // optional: بعضی تغییرات render از این مسیر هم sync شوند
    const onCrosshairMove = () => {
      if (!draggingRef.current) updateMarkerFromAnchor();
    };
    chart.subscribeCrosshairMove(onCrosshairMove);

    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (!e || !chartRef.current) return;
      const w = Math.max(1, Math.floor(e.contentRect.width));
      const h = Math.max(1, Math.floor(e.contentRect.height));
      chartRef.current.applyOptions({ width: w, height: h });
      if (!draggingRef.current) updateMarkerFromAnchor();
    });
    ro.observe(container);

    // initial
    updateMarkerFromAnchor();
    const onPointerDown = () => startSyncLoop();
    const onWheel = () => {
      startSyncLoop();
      // برای wheel یک توقف تاخیری بگذار
      window.clearTimeout((onWheel as any)._t);
      (onWheel as any)._t = window.setTimeout(() => stopSyncLoop(), 140);
    };

    const onPointerUp = () => stopSyncLoop();

    container.addEventListener("pointerdown", onPointerDown, {
      passive: true,
    });
    container.addEventListener("wheel", onWheel, { passive: true });

    doc.addEventListener("pointerup", onPointerUp, { passive: true });
    doc.addEventListener("mouseup", onPointerUp, { passive: true });
    doc.addEventListener("touchend", onPointerUp, { passive: true });
    return () => {
      ro.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRangeChange);
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [candles]);

  // --- Pointer drag (production-friendly) ---
  useEffect(() => {
    const marker = markerRef.current;
    const container = containerRef.current;
    if (!marker || !container) return;

    const onPointerDown = (ev: PointerEvent) => {
      if (!pixelRef.current) return;

      draggingRef.current = true;
      dragStartPointerRef.current = { x: ev.clientX, y: ev.clientY };
      dragStartPixelRef.current = { ...pixelRef.current };

      marker.setPointerCapture(ev.pointerId);
      marker.style.cursor = "grabbing";
      marker.style.willChange = "transform";
    };

    const onPointerMove = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      if (!dragStartPointerRef.current || !dragStartPixelRef.current) return;

      const dx = ev.clientX - dragStartPointerRef.current.x;
      const dy = ev.clientY - dragStartPointerRef.current.y;

      marker.style.transform = `translate(-50%, -50%) translate3d(${dx}px, ${dy}px, 0)`;
    };

    const endDrag = (ev: PointerEvent) => {
      if (!draggingRef.current) return;

      const chart = chartRef.current;
      const series = seriesRef.current;
      const rect = container.getBoundingClientRect();

      const startPx = dragStartPixelRef.current;
      const startPointer = dragStartPointerRef.current;

      draggingRef.current = false;
      dragStartPointerRef.current = null;
      dragStartPixelRef.current = null;

      marker.style.cursor = "grab";
      marker.style.willChange = "auto";
      marker.style.transform = "translate(-50%, -50%)";

      if (!chart || !series || !startPx || !startPointer) return;

      const dx = ev.clientX - startPointer.x;
      const dy = ev.clientY - startPointer.y;

      const nextX = clamp(startPx.x + dx, 0, rect.width);
      const nextY = clamp(startPx.y + dy, 0, rect.height);

      const t = chart.timeScale().coordinateToTime(nextX);
      const p = series.coordinateToPrice(nextY);

      if (t != null && p != null) {
        anchorRef.current = { time: t, price: p };
        onAnchorChange?.(anchorRef.current);
      }

      updateMarkerFromAnchor();
    };

    marker.addEventListener("pointerdown", onPointerDown);
    marker.addEventListener("pointermove", onPointerMove);
    marker.addEventListener("pointerup", endDrag);
    marker.addEventListener("pointercancel", endDrag);
    marker.addEventListener("lostpointercapture", endDrag);

    return () => {
      marker.removeEventListener("pointerdown", onPointerDown);
      marker.removeEventListener("pointermove", onPointerMove);
      marker.removeEventListener("pointerup", endDrag);
      marker.removeEventListener("pointercancel", endDrag);
      marker.removeEventListener("lostpointercapture", endDrag);
    };
  }, [onAnchorChange]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full min-h-[320px] overflow-hidden",
        className,
      )}
    >
      <div
        ref={markerRef}
        className="absolute z-20 select-none"
        style={{
          display: "none",
          left: 0,
          top: 0,
          transform: "translate(-50%, -50%)",
          cursor: "grab",
          touchAction: "none",
        }}
      >
        <button
          type="button"
          className="px-3 py-1.5 text-xs font-bold rounded shadow-lg bg-blue-600 hover:bg-blue-500 text-white"
        >
          BUY
        </button>
      </div>
    </div>
  );
}
