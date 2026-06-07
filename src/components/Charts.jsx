import React from "react";

/* Lightweight, dependency-free charts (CSS/SVG) for the analytics page. */

export function Card({ title, subtitle, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 ${className}`}
    >
      {title && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

const PALETTE = [
  "#6366F1",
  "#22C55E",
  "#F59E0B",
  "#06B6D4",
  "#EC4899",
  "#8B5CF6",
  "#EF4444",
  "#14B8A6",
  "#3B82F6",
  "#A3A3A3",
];

/** Vertical bar chart. data: [{ label, value }]. Supports a 2nd series. */
export function BarChart({ data, format = (v) => v, height = 160 }) {
  if (!data || data.length === 0)
    return <Empty />;
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);
  return (
    <div className="flex items-end gap-2 overflow-x-auto thin-scroll" style={{ height }}>
      {data.map((d, i) => {
        const h = ((Number(d.value) || 0) / max) * (height - 34);
        return (
          <div key={i} className="flex min-w-[34px] flex-1 flex-col items-center">
            <div className="mb-1 text-[10px] font-medium text-slate-500">
              {format(d.value)}
            </div>
            <div
              className="w-full rounded-t-md transition-all"
              style={{
                height: Math.max(h, 2),
                background: PALETTE[i % PALETTE.length],
              }}
              title={`${d.label}: ${format(d.value)}`}
            />
            <div className="mt-1 w-full truncate text-center text-[10px] text-slate-400">
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal bars — good for distributions / top-N. */
export function HBarChart({ data, format = (v) => v }) {
  if (!data || data.length === 0) return <Empty />;
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-28 shrink-0 truncate text-xs text-slate-600" title={d.label}>
            {d.label}
          </div>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${((Number(d.value) || 0) / max) * 100}%`,
                background: PALETTE[i % PALETTE.length],
              }}
            />
          </div>
          <div className="w-16 shrink-0 text-right text-xs font-medium text-slate-700">
            {format(d.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Simple SVG line/area chart. data: [{ label, value }]. */
export function LineChart({ data, format = (v) => v, height = 160 }) {
  if (!data || data.length < 2) return <Empty />;
  const w = Math.max(data.length * 48, 240);
  const pad = 24;
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);
  const stepX = (w - pad * 2) / (data.length - 1);
  const y = (v) => height - pad - ((Number(v) || 0) / max) * (height - pad * 2);
  const pts = data.map((d, i) => [pad + i * stepX, y(d.value)]);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");
  const area = `${path} L${pts[pts.length - 1][0]},${height - pad} L${pts[0][0]},${
    height - pad
  } Z`;
  return (
    <div className="overflow-x-auto thin-scroll">
      <svg width={w} height={height}>
        <path d={area} fill="#6366F133" />
        <path d={path} fill="none" stroke="#6366F1" strokeWidth="2" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r="3" fill="#6366F1" />
            <text x={p[0]} y={height - 6} textAnchor="middle" fontSize="9" fill="#94a3b8">
              {data[i].label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex h-32 items-center justify-center text-xs text-slate-400">
      No data yet.
    </div>
  );
}
