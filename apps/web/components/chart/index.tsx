"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { DrawingEngine, DrawingType, Drawing } from "@/lib/drawingEngine"; // آدرس‌دهی فایل انجین
import { HistoryManager } from "@/lib/drawingHistroyManager";

type Anchor = { time: Time; price: number };

type Props = {
  className?: string;
  onAnchorChange?: (a: Anchor) => void;
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
  const drawingEngineRef = useRef<DrawingEngine | null>(null);
  const historyManagerRef = useRef<HistoryManager | null>(null);

  // تولبار استیت برای انتخاب ابزار فعلی
  const [activeTool, setActiveTool] = useState<DrawingType | null>(null);

  // وضعیت‌های مربوط به پروسه رسم (برای پرفورمنس بالا در Ref نگهداری می‌شوند)
  const isDrawingRef = useRef(false);
  const currentDrawingIdRef = useRef<string | null>(null);

  const candles = useMemo(() => generateMockCandles(300), []);
  const syncRafRef = useRef<number | null>(null);
  const syncingRef = useRef(false);
  const anchorRef = useRef<Anchor>({
    time: candles[200].time,
    price: candles[200].close,
  });
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
  const handleContextMenu = (ev: React.MouseEvent<HTMLDivElement>) => {
    // اگر ابزاری فعال است، آن را غیرفعال کن
    if (activeTool) {
      ev.preventDefault(); // جلوگیری از نمایش منوی زمینه پیش‌فرض
      setActiveTool(null); // غیرفعال کردن ابزار فعال
    }
  };

  const saveHistoryState = () => {
    if (!drawingEngineRef.current || !historyManagerRef.current) return;

    const currentDrawings = drawingEngineRef.current.drawings;
    historyManagerRef.current.pushState(currentDrawings);
  };
  // تابع برای اعمال وضعیت جدید از تاریخچه
  const applyHistoryState = (drawings: Drawing[] | null) => {
    if (!drawings || !drawingEngineRef.current) return;

    // ۱. کلون کردن داده‌ها هنگام بازیابی برای جلوگیری از mutation تصادفی
    const stateToApply = drawings.map((d) => ({
      ...d,
      points: d.points.map((p) => ({ ...p })), // کپی عمیق نقاط
    }));

    // ۲. جایگزینی مستقیم در انجین
    drawingEngineRef.current.drawings = stateToApply;

    // ۳. رندر مجدد
    drawingEngineRef.current.render();
  };

  // هندلرهای Undo و Redo
  const handleUndo = () => {
    if (!historyManagerRef.current) return;

    const previousState = historyManagerRef.current.undo();
    if (previousState) {
      applyHistoryState(previousState);
    }
  };

  const handleRedo = () => {
    if (!historyManagerRef.current) return;

    const nextState = historyManagerRef.current.redo();
    if (nextState) {
      applyHistoryState(nextState);
    }
  };

  const pixelRef = useRef<{ x: number; y: number } | null>(null);
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
  const isInsidePlotArea = (x: number, y: number) => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return false;

    const t = chart.timeScale().coordinateToTime(x);
    const p = series.coordinateToPrice(y);

    // روی محور زمان یا محور قیمت معمولاً یکی از اینا null میشه
    return t != null && p != null;
  };
  // مدیریت فعال/غیرفعال کردن اسکرول چارت هنگام فعال بودن ابزار رسم
  // مدیریت فعال/غیرفعال کردن برهم‌کنش‌های چارت و سپر بلا کردن Canvas
  useEffect(() => {
    if (!chartRef.current || !drawingEngineRef.current) return;

    const drawingCanvas = drawingEngineRef.current.canvas;
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape" && activeTool) {
        setActiveTool(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    if (activeTool) {
      // ۱. غیرفعال کردن کامل اسکرول و زوم چارت برای اطمینان ۱۰۰٪
      chartRef.current.applyOptions({
        handleScroll: false,
        handleScale: false,
      });

      // ۲. فعال کردن پوینتر روی کانواس تا کلیک‌ها را جذب کند و به چارت نرسند
      drawingCanvas.style.pointerEvents = "auto";
      drawingCanvas.style.cursor = "crosshair";
    } else {
      // ۳. برگشت چارت به حالت عادی وقتی هیچ ابزاری انتخاب نشده
      chartRef.current.applyOptions({
        handleScroll: {
          mouseWheel: false, // اگر میخوای wheel در حالت draw پن نکنه
          pressedMouseMove: false, // مهم: درگ برای پن غیرفعال
          horzTouchDrag: false,
          vertTouchDrag: false,
        },
        handleScale: {
          mouseWheel: true, // زوم با wheel فعال بماند
          pinch: true,
          axisPressedMouseMove: true, // زوم با درگ روی محور فعال بماند
        },
      });

      // ۴. عبور دادن مجدد کلیک‌ها از کانواس برای کارکرد عادی چارت
      drawingCanvas.style.pointerEvents = "none";
      drawingCanvas.style.cursor = "default";
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTool]);

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

    // راه‌اندازی انجین ترسیمات دستی با پاس دادن کانتینر اصلی چارت
    const engine = new DrawingEngine(chart, series, container);
    drawingEngineRef.current = engine;

    const onRangeChange = () => {
      if (!draggingRef.current) updateMarkerFromAnchor();
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(onRangeChange);

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
      engine.resize();
      if (!draggingRef.current) updateMarkerFromAnchor();
    });
    ro.observe(container);

    updateMarkerFromAnchor();
    historyManagerRef.current = new HistoryManager([]);
    const onOnWheel = () => {
      startSyncLoop();
      window.clearTimeout((onOnWheel as any)._t);
      (onOnWheel as any)._t = window.setTimeout(() => stopSyncLoop(), 140);
    };

    container.addEventListener("pointerdown", () => startSyncLoop(), {
      passive: true,
    });
    container.addEventListener("wheel", onOnWheel, { passive: true });
    doc.addEventListener("pointerup", () => stopSyncLoop(), { passive: true });

    return () => {
      ro.disconnect();
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onRangeChange);
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      engine.destroy();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      drawingEngineRef.current = null;
    };
  }, [candles]);

  // مدیریت جابه‌جایی دکمه BUY (کد قبلی شما)
  useEffect(() => {
    const marker = markerRef.current;
    const container = containerRef.current;
    if (!marker || !container) return;

    const onPointerDown = (ev: PointerEvent) => {
      if (activeTool) return; // اگر ابزار رسم فعال است، مارکر نباید درگ شود
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

    return () => {
      marker.removeEventListener("pointerdown", onPointerDown);
      marker.removeEventListener("pointermove", onPointerMove);
      marker.removeEventListener("pointerup", endDrag);
      marker.removeEventListener("pointercancel", endDrag);
    };
  }, [onAnchorChange, activeTool]);
  useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      // Ctrl+Z برای Undo
      if ((ev.ctrlKey || ev.metaKey) && ev.key === "z" && !ev.shiftKey) {
        ev.preventDefault();
        handleUndo();
      }
      // Ctrl+Y یا Ctrl+Shift+Z برای Redo
      else if (
        (ev.ctrlKey || ev.metaKey) &&
        (ev.key === "y" || (ev.shiftKey && ev.key === "z"))
      ) {
        ev.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  // --- مدیریت ترسیم اشکال بر اساس پوینتر اتچ شده به کانتینر اصلی ---
  const handleContainerPointerDown = (
    ev: React.PointerEvent<HTMLDivElement>,
  ) => {
    // اگر کلیک راست بود و ابزاری فعال است، ابزار را غیرفعال کن و از ادامه کار جلوگیری کن
    if (ev.button === 2) {
      if (activeTool) {
        setActiveTool(null);
        ev.preventDefault();
        ev.stopPropagation();
      }
      return;
    }

    // اگر کلیک چپ نبود یا ابزاری فعال نبود، کاری نکن
    if (ev.button !== 0 || !activeTool) return;

    if (!chartRef.current || !seriesRef.current || !drawingEngineRef.current)
      return;

    if (
      ev.target === markerRef.current ||
      markerRef.current?.contains(ev.target as Node)
    )
      return;

    const rect = containerRef.current!.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    if (!isInsidePlotArea(x, y)) return;

    const time = chartRef.current.timeScale().coordinateToTime(x);
    const price = seriesRef.current.coordinateToPrice(y);

    if (time == null || price == null) return;

    isDrawingRef.current = true;
    const id = Math.random().toString(36).substring(2, 9);
    currentDrawingIdRef.current = id;

    const newDrawing: Drawing = {
      id,
      type: activeTool,
      points: [{ time, price }],
      selected: false,
    };

    if (
      activeTool === "trend" ||
      activeTool === "rectangle" ||
      activeTool === "position"
    ) {
      newDrawing.points.push({ time, price });
    }

    drawingEngineRef.current.add(newDrawing);
    (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
  };
  const handleContainerPointerMove = (
    ev: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (
      !isDrawingRef.current ||
      !currentDrawingIdRef.current ||
      !drawingEngineRef.current ||
      !chartRef.current ||
      !seriesRef.current
    )
      return;

    const rect = containerRef.current!.getBoundingClientRect();
    const rawX = ev.clientX - rect.left;
    const rawY = ev.clientY - rect.top;

    if (!isInsidePlotArea(rawX, rawY)) return; // ادامه رسم روی محور ممنوع
    const x = clamp(rawX, 0, rect.width);
    const y = clamp(rawY, 0, rect.height);

    const time = chartRef.current.timeScale().coordinateToTime(x);
    const price = seriesRef.current.coordinateToPrice(y);

    if (time == null || price == null) return;

    const drawing = drawingEngineRef.current.drawings.find(
      (d) => d.id === currentDrawingIdRef.current,
    );
    if (!drawing) return;

    if (drawing.type === "horizontal" || drawing.type === "orderLine") {
      drawing.points[0] = { time, price };
    } else if (
      drawing.type === "trend" ||
      drawing.type === "rectangle" ||
      drawing.type === "position"
    ) {
      drawing.points[1] = { time, price };
    } else if (drawing.type === "brush") {
      drawing.points.push({ time, price });
    }

    drawingEngineRef.current.render();
  };

  const handleContainerPointerUp = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (ev.button === 2) return;
    if (!isDrawingRef.current) return;

    // ۱. پایان پروسه ترسیم
    isDrawingRef.current = false;
    currentDrawingIdRef.current = null;

    // ۲. ذخیره وضعیت جدید در تاریخچه بعد از پایان ترسیم
    if (drawingEngineRef.current && historyManagerRef.current) {
      // گرفتن یک کپی عمیق از وضعیت فعلی برای ثبت در تاریخچه
      const snapshot = JSON.parse(
        JSON.stringify(drawingEngineRef.current.drawings),
      );
      historyManagerRef.current.pushState(snapshot);
    }

    try {
      (ev.target as HTMLElement).releasePointerCapture(ev.pointerId);
    } catch (e) {}
  };

  const clearAllDrawings = () => {
    if (drawingEngineRef.current) {
      drawingEngineRef.current.drawings = [];
      drawingEngineRef.current.render();

      // ذخیره وضعیت خالی در تاریخچه
      if (historyManagerRef.current) {
        historyManagerRef.current.pushState([]);
      }
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-900 border border-slate-800 overflow-hidden p-2">
      {/* نوار ابزار رسم (Drawing Toolbar) */}
      <div className="flex items-center gap-1 pb-2 border-b border-slate-800 mb-2 overflow-x-auto">
        <button
          onClick={() =>
            setActiveTool(activeTool === "horizontal" ? null : "horizontal")
          }
          className={cn(
            "px-2.5 py-1 text-xs rounded font-medium border transition-colors",
            activeTool === "horizontal"
              ? "bg-emerald-600 text-white border-emerald-500"
              : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700",
          )}
        >
          ⎯ Horizontal
        </button>
        <button
          onClick={() => setActiveTool(activeTool === "trend" ? null : "trend")}
          className={cn(
            "px-2.5 py-1 text-xs rounded font-medium border transition-colors",
            activeTool === "trend"
              ? "bg-blue-600 text-white border-blue-500"
              : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700",
          )}
        >
          ╱ Trend
        </button>
        <button
          onClick={() =>
            setActiveTool(activeTool === "rectangle" ? null : "rectangle")
          }
          className={cn(
            "px-2.5 py-1 text-xs rounded font-medium border transition-colors",
            activeTool === "rectangle"
              ? "bg-blue-600/50 text-white border-blue-500"
              : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700",
          )}
        >
          ⬜ Rectangle
        </button>
        <button
          onClick={() =>
            setActiveTool(activeTool === "position" ? null : "position")
          }
          className={cn(
            "px-2.5 py-1 text-xs rounded font-medium border transition-colors",
            activeTool === "position"
              ? "bg-green-600/50 text-white border-green-500"
              : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700",
          )}
        >
          📊 Position
        </button>
        <button
          onClick={() =>
            setActiveTool(activeTool === "orderLine" ? null : "orderLine")
          }
          className={cn(
            "px-2.5 py-1 text-xs rounded font-medium border transition-colors",
            activeTool === "orderLine"
              ? "bg-red-600 text-white border-red-500"
              : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700",
          )}
        >
          --- Order
        </button>
        <button
          onClick={() => setActiveTool(activeTool === "brush" ? null : "brush")}
          className={cn(
            "px-2.5 py-1 text-xs rounded font-medium border transition-colors",
            activeTool === "brush"
              ? "bg-yellow-600 text-white border-yellow-500"
              : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700",
          )}
        >
          🖌️ Brush
        </button>

        <div className="flex-1" />

        <button
          onClick={clearAllDrawings}
          className="px-2.5 py-1 text-xs rounded font-medium bg-rose-900/40 text-rose-300 border border-rose-800 hover:bg-rose-900/60 transition-colors"
        >
          🗑️ Clear All
        </button>
      </div>

      {/* بخش نگهدارنده چارت و بوم نقاشی */}
      <div
        ref={containerRef}
        onPointerDown={handleContainerPointerDown}
        onPointerMove={handleContainerPointerMove}
        onPointerUp={handleContainerPointerUp}
        onContextMenu={handleContextMenu} // اضافه کردن این خط
        className={cn(
          "relative w-full h-full min-h-[320px] overflow-hidden select-none",
          activeTool ? "cursor-crosshair" : "cursor-default",
          className,
        )}
        style={{ touchAction: "none" }}
      >
        {/* دکمه BUY متحرک ارائه‌شده توسط شما */}
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
    </div>
  );
}
