import React, { useEffect, useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { getRefOptions } from "../api/admin";

/**
 * Generic create/edit form. Renders one input per writable column, choosing
 * the control from the column's SQL data_type reported by the backend meta.
 */
export default function RecordModal({ meta, mode, record, onClose, onSubmit }) {
  const writableCols = useMemo(
    () => meta.columns.filter((c) => c.writable),
    [meta]
  );

  const [values, setValues] = useState(() => {
    const init = {};
    writableCols.forEach((c) => {
      const v = record?.[c.name];
      init[c.name] = v === null || v === undefined ? "" : v;
    });
    return init;
  });
  const [busy, setBusy] = useState(false);

  // Load {id,label} options for any FK columns that have a reference config.
  const references = meta.references || {};
  const [refOptions, setRefOptions] = useState({});
  useEffect(() => {
    const refs = writableCols
      .map((c) => c.name)
      .filter((name) => references[name]);
    if (refs.length === 0) return;
    let active = true;
    Promise.all(
      refs.map(async (name) => {
        const ref = references[name];
        try {
          const opts = await getRefOptions(ref.resource, ref.labelField);
          return [name, opts];
        } catch {
          return [name, []];
        }
      })
    ).then((entries) => {
      if (active) setRefOptions(Object.fromEntries(entries));
    });
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line

  const setField = (name, val) => setValues((p) => ({ ...p, [name]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Build payload + check required fields before hitting the API. Empty
    // strings become null on the backend; booleans/numbers are coerced here.
    const payload = {};
    const missing = [];
    writableCols.forEach((c) => {
      let v = values[c.name];
      if (isBool(c.type)) {
        v = v === true || v === "true";
      } else if (
        c.required &&
        (v === "" || v === null || v === undefined)
      ) {
        missing.push(c.name);
      }
      payload[c.name] = v;
    });

    if (missing.length) {
      toast.error(`Please fill the required field(s): ${missing.join(", ")}`);
      return;
    }

    setBusy(true);
    await onSubmit(payload);
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="text-lg font-bold text-slate-900">
            {mode === "create" ? "New" : "Edit"} {meta.label} record
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 py-4 thin-scroll"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {writableCols.map((c) => (
              <Field
                key={c.name}
                col={c}
                value={values[c.name]}
                onChange={(v) => setField(c.name, v)}
                refOptions={references[c.name] ? refOptions[c.name] : null}
              />
            ))}
          </div>
          {writableCols.length === 0 && (
            <p className="text-sm text-slate-500">
              This resource has no editable fields.
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              disabled={busy || writableCols.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              {mode === "create" ? "Create" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const isBool = (t) => t === "boolean";
const isNum = (t) =>
  ["integer", "bigint", "numeric", "double precision", "real", "smallint"].includes(
    t
  );
const isDate = (t) => t === "date";
const isLong = (t) => ["text", "jsonb", "json"].includes(t);

function Field({ col, value, onChange, refOptions }) {
  const label = (
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {col.name}
      {col.required && <span className="text-red-500"> *</span>}
    </label>
  );

  const base =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

  // Foreign-key dropdown (friendly label, stores the id).
  if (refOptions) {
    return (
      <div>
        {label}
        <select
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          className={base}
        >
          <option value="">— select —</option>
          {refOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label ? `${o.label} (#${o.id})` : `#${o.id}`}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (isBool(col.type)) {
    return (
      <div>
        {label}
        <select
          value={String(value === "" ? "" : value)}
          onChange={(e) => onChange(e.target.value === "true")}
          className={base}
        >
          <option value="">—</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </div>
    );
  }

  if (isLong(col.type)) {
    return (
      <div className="sm:col-span-2">
        {label}
        <textarea
          rows={3}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      </div>
    );
  }

  return (
    <div>
      {label}
      <input
        type={isNum(col.type) ? "number" : isDate(col.type) ? "date" : "text"}
        step={isNum(col.type) ? "any" : undefined}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={base}
      />
    </div>
  );
}
