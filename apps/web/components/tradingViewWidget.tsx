'use client';

import { memo, useEffect, useRef } from 'react';

type TradingViewWidgetProps = {
  pair: string;
  theme ? : string;
  interval?: string;
  locale?: string;
};

function TradingViewWidget({
  pair,
  theme,
  interval = 'D',
  locale = 'fa',
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const formattedSymbol = `BINANCE:${pair.toUpperCase().replace('/', '')}`;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    widget.style.width = '100%';
    widget.style.height = 'calc(100% - 32px)';

    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;

    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: formattedSymbol,
      interval,
      locale,
      theme,
      timezone: 'Etc/UTC',
      style: '1',
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      save_image: true,
      calendar: false,
      details: false,
      withdateranges: false,
    });

    container.appendChild(widget);
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [formattedSymbol, interval, locale, theme]);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default memo(TradingViewWidget);
