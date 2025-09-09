import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";

// نوع البيانات الداخلة
export type Slice = {
  label: string;
  value: number;
  color?: string;
};

export default function StatusPieChart({
  title = "Requests by Status",
  data,
  height = 300,
  showCenter = true,
}: {
  title?: string;
  data: Slice[];
  height?: number;
  showCenter?: boolean;
}) {
  const total = useMemo(
    () => Math.max(0, data.reduce((s, d) => s + (Number(d.value) || 0), 0)),
    [data]
  );

  const seriesData = data.map((d) => ({
    value: Number(d.value) || 0,
    name: d.label,
    itemStyle: d.color ? { color: d.color } : undefined,
  }));

  const option = {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    title: {
      text: title,
      left: "left",
      top: 0,
      textStyle: { fontSize: 14, fontWeight: 600, color: "#0f172a" },
    },
    legend: {
      orient: "vertical",
      right: 0,
      top: "middle",
      textStyle: { color: "#475569" },
      icon: "circle",
    },
    series: [
      {
        type: "pie",
        radius: ["62%", "85%"],
        center: ["40%", "55%"],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: "#fff", borderWidth: 2 },
        label: { show: false },
        emphasis: { scale: true },
        data: seriesData,
      },
      showCenter
        ? {
            // طبقة خفية للـcenter label
            type: "pie",
            radius: [0, 0],
            label: {
              show: true,
              position: "center",
              formatter: total ? `${total}` : "0",
              fontSize: 18,
              fontWeight: 700,
              color: "#0f172a",
            },
            labelLine: { show: false },
            tooltip: { show: false },
            data: [{ value: 0, name: "" }],
          }
        : null,
    ].filter(Boolean),
  } as any;

  return (
    <div className="rounded-2xl border bg-white shadow-card p-4">
      <ReactECharts option={option} notMerge={true} style={{ height }} />
      <div className="mt-1 text-xs text-gray-500">Total: {total}</div>
    </div>
  );
}