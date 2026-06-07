import React from "react";

/**
 * Renders the child relations of an expanded parent row, one sub-grid per
 * relation (e.g. violation details under a challan).
 *
 *  - relations: [{ resource, label, fk }]  (from the parent meta)
 *  - data:      { [childResource]: rows[] } (loaded lazily by ResourcePage)
 */
const fmt = (v) => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "✓" : "✗";
  if (typeof v === "object") return JSON.stringify(v);
  const s = String(v);
  return s.length > 60 ? s.slice(0, 57) + "…" : s;
};

export default function NestedChildren({ relations, data }) {
  if (!data) {
    return <div className="text-sm text-slate-400">Loading related records…</div>;
  }

  return (
    <div className="space-y-4">
      {relations.map((rel) => {
        const rows = data[rel.resource] || [];
        const columns = rows.length ? Object.keys(rows[0]) : [];
        return (
          <div key={rel.resource}>
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
              {rel.label}
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                {rows.length}
              </span>
            </div>
            {rows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-400">
                No {rel.label.toLowerCase()} found.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white thin-scroll">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-100 uppercase tracking-wide text-slate-500">
                    <tr>
                      {columns.map((c) => (
                        <th key={c} className="whitespace-nowrap px-2.5 py-1.5 font-semibold">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        {columns.map((c) => (
                          <td key={c} className="whitespace-nowrap px-2.5 py-1.5 text-slate-700">
                            {fmt(r[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
