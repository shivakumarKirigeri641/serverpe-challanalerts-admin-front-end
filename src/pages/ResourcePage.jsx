import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronRight as ChevronExpand,
  Lock,
  RefreshCw,
  FileText,
} from "lucide-react";
import {
  getResourceMeta,
  listResource,
  createResource,
  updateResource,
  deleteResource,
  listChildren,
  openInvoicePdf,
} from "../api/admin";
import RecordModal from "../components/RecordModal";
import NestedChildren from "../components/NestedChildren";

const PAGE_LIMIT = 25;

export default function ResourcePage() {
  const { resource } = useParams();
  const [meta, setMeta] = useState(null);
  const [rows, setRows] = useState([]);
  const [pageMeta, setPageMeta] = useState({ page: 1, total_pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState(""); // "", "true", "false"
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', record }
  const [expanded, setExpanded] = useState(null); // row id currently expanded
  const [childCache, setChildCache] = useState({}); // { rowId: { childResource: rows } }

  const loadMeta = useCallback(async () => {
    const m = await getResourceMeta(resource);
    setMeta(m);
  }, [resource]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listResource(resource, {
        page,
        limit: PAGE_LIMIT,
        search,
        is_active: activeFilter,
      });
      setRows(res.data || []);
      setPageMeta(res.meta || { page: 1, total_pages: 1, total: 0 });
      setExpanded(null);
      setChildCache({});
    } catch (e) {
      toast.error(e.message || "Failed to load records");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [resource, page, search, activeFilter]);

  // Reset state when switching resource.
  useEffect(() => {
    setMeta(null);
    setPage(1);
    setSearch("");
    setActiveFilter("");
    loadMeta().catch((e) => toast.error(e.message));
  }, [resource, loadMeta]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const onSubmit = async (values) => {
    try {
      if (modal.mode === "create") {
        await createResource(resource, values);
        toast.success("Record created");
      } else {
        await updateResource(resource, modal.record.id, values);
        toast.success("Record updated");
      }
      setModal(null);
      loadList();
    } catch (e) {
      toast.error(e.message || "Save failed");
    }
  };

  const hasChildren = (meta?.children?.length || 0) > 0;

  const toggleExpand = async (rowId) => {
    if (expanded === rowId) {
      setExpanded(null);
      return;
    }
    setExpanded(rowId);
    if (!childCache[rowId]) {
      try {
        const entries = await Promise.all(
          meta.children.map(async (rel) => {
            const res = await listChildren(resource, rowId, rel.resource);
            return [rel.resource, res.data || []];
          })
        );
        setChildCache((prev) => ({
          ...prev,
          [rowId]: Object.fromEntries(entries),
        }));
      } catch (e) {
        toast.error(e.message || "Failed to load nested rows");
      }
    }
  };

  const onDelete = async (row, mode) => {
    const ok = window.confirm(
      mode === "hard"
        ? `Permanently DELETE record #${row.id}? This cannot be undone.`
        : `Deactivate (soft delete) record #${row.id}?`
    );
    if (!ok) return;
    try {
      await deleteResource(resource, row.id, mode);
      toast.success(mode === "hard" ? "Record deleted" : "Record deactivated");
      loadList();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
  };

  // Curated, friendly columns: prefer the backend `display` config; otherwise
  // fall back to row keys minus noisy/internal columns.
  const HIDDEN = new Set([
    "raw_response",
    "challan_details",
    "split_present_address",
    "split_permanent_address",
    "blacklist_details",
    "acquirer_data",
    "notes",
    "upi",
    "request_body",
    "query_params",
    "user_agent",
    "device_info",
    "linked_invoice_path",
    "invoice_path",
    "pic_path",
  ]);
  const columns =
    meta?.display?.length > 0
      ? meta.display
      : (rows.length ? Object.keys(rows[0]) : meta?.columns.map((c) => c.name) || [])
          .filter((k) => !HIDDEN.has(k))
          .map((k) => ({ key: k, label: k }));

  const fmt = (v) => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "boolean") return v ? "✓" : "✗";
    if (typeof v === "object") return JSON.stringify(v);
    const s = String(v);
    return s.length > 60 ? s.slice(0, 57) + "…" : s;
  };

  const canWrite = meta && !meta.readonly;
  const totalCols = columns.length + 1 + (hasChildren ? 1 : 0);

  // Resolve the viewable invoice id for a row (invoices vs. payments shapes).
  const invoiceIdOf = (row) => {
    if (row.invoice_path && row.invoice_id) return row.invoice_id;
    if (row.linked_invoice_path && row.linked_invoice_id)
      return row.linked_invoice_id;
    return null;
  };

  const viewInvoice = async (invoiceId) => {
    try {
      await openInvoicePdf(invoiceId);
    } catch (e) {
      toast.error(e.message || "Could not open invoice");
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            {meta?.label || resource}
            {meta?.readonly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                <Lock size={12} /> read-only
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500">
            {pageMeta.total} record{pageMeta.total === 1 ? "" : "s"} ·{" "}
            <span className="font-mono">{meta?.table}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadList}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          {canWrite && (
            <button
              onClick={() => setModal({ mode: "create", record: {} })}
              className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus size={16} /> New
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {meta?.search?.length > 0 && (
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              placeholder={`Search ${meta.search.join(", ")}`}
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>
        )}
        {!meta?.readonly && (
          <select
            value={activeFilter}
            onChange={(e) => {
              setPage(1);
              setActiveFilter(e.target.value);
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white thin-scroll">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {hasChildren && <th className="w-8 px-2 py-2" />}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="whitespace-nowrap px-3 py-2 font-semibold"
                >
                  {col.label}
                </th>
              ))}
              <th className="sticky right-0 bg-slate-50 px-3 py-2 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={totalCols} className="px-3 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={totalCols} className="px-3 py-8 text-center text-slate-400">
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <React.Fragment key={row.id}>
                <tr className="hover:bg-slate-50">
                  {hasChildren && (
                    <td className="px-2 py-2 align-top">
                      <button
                        onClick={() => toggleExpand(row.id)}
                        className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                        title="Show related records"
                      >
                        {expanded === row.id ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronExpand size={16} />
                        )}
                      </button>
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="whitespace-nowrap px-3 py-2 text-slate-700"
                    >
                      {fmt(row[col.key])}
                    </td>
                  ))}
                  <td className="sticky right-0 bg-white px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      {invoiceIdOf(row) && (
                        <button
                          onClick={() => viewInvoice(invoiceIdOf(row))}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-brand-50 hover:text-brand-600"
                          title="View invoice PDF"
                        >
                          <FileText size={16} />
                        </button>
                      )}
                      {canWrite && (
                        <>
                          <button
                            onClick={() => setModal({ mode: "edit", record: row })}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-brand-50 hover:text-brand-600"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => onDelete(row, "soft")}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600"
                            title="Deactivate (soft delete)"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => onDelete(row, "hard")}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Permanent delete"
                          >
                            <Trash2 size={16} className="fill-current opacity-70" />
                          </button>
                        </>
                      )}
                      {meta?.readonly && (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </div>
                  </td>
                </tr>
                {hasChildren && expanded === row.id && (
                  <tr>
                    <td colSpan={totalCols} className="bg-slate-50 px-4 py-3">
                      <NestedChildren
                        relations={meta.children}
                        data={childCache[row.id]}
                      />
                    </td>
                  </tr>
                )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
        <span>
          Page {pageMeta.page} of {pageMeta.total_pages || 1}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <button
            disabled={page >= (pageMeta.total_pages || 1)}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-40"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {modal && meta && (
        <RecordModal
          meta={meta}
          mode={modal.mode}
          record={modal.record}
          onClose={() => setModal(null)}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}
