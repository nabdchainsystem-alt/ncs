import React, { Suspense } from 'react';
import type { EChartsReactProps } from 'echarts-for-react/lib/types';

const LazyEChartsCore = React.lazy(async () => {
  const [{ echarts }, module] = await Promise.all([
    import('./registerEcharts'),
    import('echarts-for-react/lib/core'),
  ]);

  const Component = module.default;

  const Wrapped: React.FC<EChartsReactProps> = (props) => (
    <Component {...props} echarts={props.echarts ?? echarts} />
  );

  return { default: Wrapped };
});

export type AsyncEChartsProps = EChartsReactProps & { fallbackHeight?: number };

const ChartFallback: React.FC<{ height: number }> = ({ height }) => (
  <div
    className="flex items-center justify-center text-sm text-gray-500"
    style={{ minHeight: height }}
  >
    Loading chart…
  </div>
);

export function AsyncECharts({ fallbackHeight = 240, style, ...props }: AsyncEChartsProps) {
  const heightFromStyle = (() => {
    if (style && typeof style === 'object' && 'height' in style && style.height != null) {
      const raw = style.height;
      if (typeof raw === 'number') return raw;
      const parsed = parseInt(String(raw), 10);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return fallbackHeight;
  })();

  return (
    <Suspense fallback={<ChartFallback height={heightFromStyle} />}>
      <LazyEChartsCore {...props} style={style} />
    </Suspense>
  );
}
