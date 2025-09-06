

import React, { CSSProperties, useMemo } from "react";

export type SparklinePoint = number;

type Props = {
  data: SparklinePoint[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  color?: string;
  fill?: string | null;         // e.g. "rgba(99,102,241,.15)" or null for no fill
  animate?: boolean;            // stroke reveal animation
  showLastDot?: boolean;        // draw a dot at the last sample
  smooth?: boolean;             // simple smoothing
  title?: string;               // optional title/tooltip
  className?: string;           // wrapper className
  style?: CSSProperties;
};

// Simple path smoothing using quadratic Bézier segments
function toSmoothPath(xs: number[], ys: number[]) {
  const n = xs.length;
  if (n === 0) return "";
  if (n === 1) return `M ${xs[0]} ${ys[0]}`;
  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < n; i++) {
    const cx = (xs[i - 1] + xs[i]) / 2;
    const cy = (ys[i - 1] + ys[i]) / 2;
    d += ` Q ${xs[i - 1]} ${ys[i - 1]} ${cx} ${cy}`;
  }
  d += ` T ${xs[n - 1]} ${ys[n - 1]}`;
  return d;
}

export default function Sparkline({
  data,
  width = 220,
  height = 60,
  strokeWidth = 2,
  color = "#0ea5e9", // sky-500
  fill = "rgba(14,165,233,0.12)",
  animate = true,
  showLastDot = true,
  smooth = true,
  title,
  className,
  style
}: Props) {
  const n = data?.length ?? 0;

  const { xs, ys, d, areaD, min, max, totalLen } = useMemo(() => {
    if (!data || data.length === 0) {
      return { xs: [], ys: [], d: "", areaD: "", min: 0, max: 0, totalLen: 0 };
    }
    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const padX = 4;
    const padTop = 6;
    const padBottom = 8;
    const innerW = width - padX * 2;
    const innerH = height - padTop - padBottom;

    const xs = data.map((_, i) => padX + (i * innerW) / Math.max(1, data.length - 1));
    const ys = data.map(v => padTop + innerH - ((v - min) / span) * innerH);

    const d = smooth ? toSmoothPath(xs, ys) : `M ${xs[0]} ${ys[0]} ` + xs.slice(1).map((x, i) => `L ${x} ${ys[i + 1]}`).join(" ");
    const areaD = d ? d + ` L ${xs[n - 1]} ${height - padBottom} L ${xs[0]} ${height - padBottom} Z` : "";

    // crude length estimate for animation (OK for our tiny chart)
    let totalLen = 0;
    for (let i = 1; i < xs.length; i++) {
      const dx = xs[i] - xs[i - 1];
      const dy = ys[i] - ys[i - 1];
      totalLen += Math.hypot(dx, dy);
    }
    return { xs, ys, d, areaD, min, max, totalLen };
  }, [data, width, height, smooth, n]);

  const lastX = xs[xs.length - 1];
  const lastY = ys[ys.length - 1];

  const pathStyle: CSSProperties = animate
    ? ({ strokeDasharray: totalLen, strokeDashoffset: totalLen, animation: "spark-stroke 900ms ease-out forwards" } as CSSProperties)
    : {};

  return (
    <div className={className} style={style}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title ?? "sparkline"}>
        <defs>
          <clipPath id="sparkClip">
            <rect x="0" y="0" width={width} height={height} rx="2" />
          </clipPath>
          <style>{`
            @keyframes spark-stroke {
              to { stroke-dashoffset: 0; }
            }
            .spark-shadow { filter: drop-shadow(0 1px 0 rgba(0,0,0,.04)); }
          `}</style>
        </defs>

        {title ? <title>{title}</title> : null}

        <g clipPath="url(#sparkClip)">
          {/* area fill */}
          {areaD && fill ? (
            <path d={areaD} fill={fill} className="spark-shadow" />
          ) : null}

          {/* stroke path */}
          {d ? (
            <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} style={pathStyle} />
          ) : (
            <text x={8} y={height / 2} fontSize={11} fill="#94a3b8">no data</text>
          )}

          {/* last point dot */}
          {showLastDot && xs.length > 0 ? (
            <circle cx={lastX} cy={lastY} r={Math.max(2.5, strokeWidth + 0.5)} fill={color} />
          ) : null}
        </g>
      </svg>
      {/* tiny legend under chart */}
      <div style={{fontSize: 11, color: "#64748b", marginTop: 2}}>
        min {min} · max {max}
      </div>
    </div>
  );
}