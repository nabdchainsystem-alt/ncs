import React, { useMemo } from "react";
import type { CSSProperties } from "react";

const fmtPct = (num: number) => `${(num * 100).toFixed(0)}%`;

// نوع البيانات الداخلة
export type Slice = {
  label: string;
  value: number;
  color: string;
};

export default function StatusPieChart({
  title = "Requests by Status",
  data,
  size = 180,
  stroke = 14,
  showCenter = true,
}: {
  title?: string;
  data: Slice[];
  size?: number;
  stroke?: number;
  showCenter?: boolean;
}) {
  const total = useMemo(
    () => Math.max(0, data.reduce((s, d) => s + (d.value || 0), 0)),
    [data]
  );

  const R = (size - stroke) / 2;               // نصف القطر الفعلي
  const C = 2 * Math.PI * R;                   // محيط الدائرة
  let acc = 0;                                 // تراكم النِّسب لتحديد offset

  const keyframes = `
    @keyframes donut-reveal { from { stroke-dasharray: 0 var(--circ); } }
    .animate-donut { animation: donut-reveal .8s ease-out; }
  `;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <style dangerouslySetInnerHTML={{ __html: keyframes }} />
      <div className="font-semibold mb-2">{title}</div>
      {total === 0 ? (
        <div className="text-sm text-gray-500">No data.</div>
      ) : (
        <div className="flex items-center gap-6">
          {/* الرسم */}
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <g transform={`translate(${size / 2}, ${size / 2})`}>
              {/* الخلفية */}
              <circle r={R} cx={0} cy={0} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
              {showCenter && (
                <g aria-hidden="true">
                  <text x="0" y="-6" textAnchor="middle" className="fill-gray-800 text-sm font-semibold">
                    {total}
                  </text>
                  <text x="0" y="12" textAnchor="middle" className="fill-gray-500 text-[10px]">
                    total
                  </text>
                </g>
              )}
              {/* القطاعات */}
              {data.map((s) => {
                const pct = total ? s.value / total : 0;
                const len = pct * C;
                const dasharray = `${len} ${C - len}`;
                const dashoffset = -(acc * C);
                acc += pct;

                const style = {
                  // بنمرر المحيط كـ CSS var عشان الأنيميشن
                  ["--circ" as any]: `${C}`,
                } as CSSProperties;

                return (
                  <circle
                    key={s.label}
                    r={R}
                    cx={0}
                    cy={0}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={stroke}
                    strokeDasharray={dasharray}
                    strokeDashoffset={dashoffset}
                    style={style}
                    className="animate-donut transition-[stroke-dashoffset] duration-700 ease-out"
                  >
                    <title>{`${s.label}: ${s.value} (${fmtPct(total ? s.value/total : 0)})`}</title>
                  </circle>
                );
              })}
            </g>
          </svg>

          {/* الليجند */}
          <div className="text-sm space-y-2">
            {data.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded" style={{ background: s.color }} />
                <span className="w-28 text-gray-700">{s.label}</span>
                <span className="font-medium tabular-nums">{s.value}</span>
                <span className="text-gray-400 text-xs">{fmtPct(total ? s.value/total : 0)}</span>
              </div>
            ))}
            <div className="pt-2 text-xs text-gray-500">Total: {total}</div>
          </div>
        </div>
      )}
    </div>
  );
}