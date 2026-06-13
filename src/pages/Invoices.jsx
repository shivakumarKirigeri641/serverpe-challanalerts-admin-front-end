import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Search,
  Sun,
  Moon,
  Plus,
  FileText,
  Check as CheckIcon,
  Download,
  Receipt,
  IndianRupee,
  CheckCircle2,
  Clock,
  CircleSlash,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { listResource, openInvoicePdf } from "../api/admin";

const PAGE_LIMIT = 25;

const inr = (paise) =>
  "₹" +
  (Number(paise || 0) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const fmtDate = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const statusMeta = (s) => {
  const v = String(s || "").toLowerCase();
  if (v === "captured") return { label: "Paid", color: "#34D399" };
  if (v === "failed") return { label: "Failed", color: "#FB7185" };
  if (v === "created" || v === "authorized")
    return { label: "Pending", color: "#FBBF24" };
  if (!s) return { label: "No payment", color: "#3B82F6" };
  return { label: s, color: "#94A3B8" };
};

/* cursor-following spotlight */
const onSpot = (e) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};

export default function Invoices() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState("light");
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total_pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(() => new Set());

  // load (debounced search) — uses the EXISTING list API unchanged
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      listResource("invoices", { page, limit: PAGE_LIMIT, search })
        .then((res) => {
          if (!alive) return;
          setRows(res.data || []);
          setMeta(res.meta || { page: 1, total_pages: 1, total: 0 });
          setSel(new Set());
        })
        .catch((e) => toast.error(e.message || "Failed to load invoices"))
        .finally(() => alive && setLoading(false));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [page, search]);

  const metrics = useMemo(() => {
    const paid = rows.filter((r) => r.payment_status === "captured").length;
    const pending = rows.filter((r) =>
      ["created", "authorized"].includes(r.payment_status),
    ).length;
    const unpaid = rows.filter((r) => !r.payment_status).length;
    const value = rows.reduce((s, r) => s + Number(r.payment_amount_paise || 0), 0);
    return { paid, pending, unpaid, value };
  }, [rows]);

  const toggleRow = (id) =>
    setSel((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const allOn = rows.length > 0 && rows.every((r) => sel.has(r.id));
  const toggleAll = () =>
    setSel(allOn ? new Set() : new Set(rows.map((r) => r.id)));

  const openSelected = async () => {
    const chosen = rows.filter((r) => sel.has(r.id) && r.invoice_id);
    if (!chosen.length) return;
    for (const r of chosen) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await openInvoicePdf(r.invoice_id);
      } catch (e) {
        toast.error(`${r.invoice_id}: ${e.message}`);
      }
    }
  };

  return (
    <div className="xan -m-4 min-h-full p-8 lg:-m-6" data-theme={theme}>
      {/* ── Header ── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-extrabold">Invoices</h1>
          <div className="mt-1 flex gap-4 text-[11px] font-bold uppercase tracking-wider text-[var(--xmuted)]">
            <span className="text-[var(--xblue)]">All</span>
            <span>Paid</span>
            <span>Pending</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--xmuted)]"
            />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder="Search invoices…"
              className="xmono h-9 w-56 rounded-lg border border-[var(--xborder)] bg-[var(--xelev)] pl-9 pr-3 text-[12px] text-[var(--xtext)] outline-none transition focus:border-[var(--xblue)]"
            />
          </div>
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--xborder)] bg-[var(--xelev)] text-[var(--xmuted)] transition hover:text-[var(--xtext)]"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => navigate("/bulk-add")}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--xblue)] px-4 text-[14px] font-bold text-white transition"
            style={{ boxShadow: "0 0 20px rgba(59,130,246,0.4)" }}
          >
            <Plus size={15} /> New invoice
          </button>
        </div>
      </div>

      {/* ── Summary metrics strip ── */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="Total invoices" value={meta.total} icon={Receipt} accent="#3B82F6" />
        <Metric label="Paid (page)" value={metrics.paid} icon={CheckCircle2} accent="#34D399" />
        <Metric label="Pending (page)" value={metrics.pending} icon={Clock} accent="#FBBF24" />
        <Metric label="No payment (page)" value={metrics.unpaid} icon={CircleSlash} accent="#FB7185" />
        <Metric label="Value (page)" value={inr(metrics.value)} icon={IndianRupee} gradient />
      </div>

      {/* ── Bulk actions bar ── */}
      {sel.size > 0 && (
        <div
          className="xrise mb-4 flex items-center justify-between rounded-xl px-5 py-3"
          style={{
            background: "rgba(59,130,246,0.1)",
            border: "1px solid #3B82F6",
          }}
        >
          <span className="xmono text-[12px] font-bold text-[var(--xtext)]">
            {sel.size} selected
          </span>
          <div className="flex items-center gap-4 text-[11px] font-bold">
            <button onClick={openSelected} className="inline-flex items-center gap-1.5 text-[var(--xblue)]">
              <Download size={13} /> Open PDFs
            </button>
            <button onClick={() => setSel(new Set())} className="text-[var(--xmuted)] hover:text-[var(--xtext)]">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── Data table ── */}
      <div
        onMouseMove={onSpot}
        className="xspot overflow-hidden rounded-2xl border border-[var(--xborder)] bg-[var(--xpanel)]"
      >
        <div className="overflow-x-auto thin-scroll">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr
                className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--xmuted)]"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <th className="w-10 px-4 py-3">
                  <span className="xcheck" data-checked={allOn} onClick={toggleAll}>
                    {allOn && <CheckIcon size={11} color="#fff" />}
                  </span>
                </th>
                <th className="px-4 py-3">Invoice ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[var(--xmuted)]">
                    Loading invoices…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[var(--xmuted)]">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const checked = sel.has(r.id);
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-[var(--xborder)] transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                      style={{ height: 56 }}
                    >
                      <td className="px-4">
                        <span className="xcheck" data-checked={checked} onClick={() => toggleRow(r.id)}>
                          {checked && <CheckIcon size={11} color="#fff" />}
                        </span>
                      </td>
                      <td className="xmono px-4 font-semibold text-[var(--xtext)]">
                        {r.invoice_id || "—"}
                      </td>
                      <td className="xmono px-4 text-[var(--xmuted)]">{fmtDate(r.created_at)}</td>
                      <td className="px-4">
                        <div className="font-semibold text-[var(--xtext)]">
                          {r.user_name || "—"}
                        </div>
                        <div className="xmono text-[11px] text-[var(--xmuted)]">
                          {r.mobile_number ? `+91 ${r.mobile_number}` : ""}
                        </div>
                      </td>
                      <td className="px-4 text-[var(--xmuted)]">{r.plan_name || "—"}</td>
                      <td className="xmono px-4 text-right font-semibold text-[var(--xtext)]">
                        {r.payment_amount_paise != null ? inr(r.payment_amount_paise) : "—"}
                      </td>
                      <td className="px-4">
                        <StatusBadge status={r.payment_status} />
                      </td>
                      <td className="px-4 text-right">
                        {r.invoice_id && (
                          <button
                            onClick={() =>
                              openInvoicePdf(r.invoice_id).catch((e) => toast.error(e.message))
                            }
                            className="inline-grid h-7 w-7 place-items-center rounded-lg border border-[var(--xborder)] text-[var(--xmuted)] transition hover:text-[var(--xblue)]"
                            title="Open invoice PDF"
                          >
                            <FileText size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="flex items-center justify-between border-t border-[var(--xborder)] px-4 py-3 text-[12px] text-[var(--xmuted)]">
          <span className="xmono">
            Page {meta.page} / {meta.total_pages} · {meta.total} total
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--xborder)] disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              disabled={page >= meta.total_pages}
              onClick={() => setPage((p) => p + 1)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--xborder)] disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon, accent, gradient }) {
  return (
    <div
      onMouseMove={onSpot}
      className="xspot xrise rounded-2xl border p-4"
      style={
        gradient
          ? { background: "linear-gradient(135deg,#3B82F6,#2563EB)", border: "none" }
          : { background: "var(--xpanel)", borderColor: "var(--xborder)" }
      }
    >
      <div
        className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl"
        style={{
          background: gradient ? "rgba(255,255,255,0.18)" : `${accent}1A`,
          color: gradient ? "#fff" : accent,
        }}
      >
        <Icon size={18} />
      </div>
      <div
        className="xmono text-[10px] uppercase tracking-wider"
        style={{ color: gradient ? "rgba(255,255,255,0.85)" : "var(--xmuted)" }}
      >
        {label}
      </div>
      <div
        className="xmono mt-0.5 text-2xl font-bold"
        style={{ color: gradient ? "#fff" : "var(--xtext)" }}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const m = statusMeta(status);
  return (
    <span
      className="xmono inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-bold"
      style={{ color: m.color, background: `${m.color}1A` }}
    >
      <span
        className="dot-pulse h-1.5 w-1.5 rounded-full"
        style={{ background: m.color, "--dot": `${m.color}80` }}
      />
      {m.label}
    </span>
  );
}
