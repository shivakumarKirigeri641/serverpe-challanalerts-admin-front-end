import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Users,
  Car,
  FileWarning,
  Radio,
  BadgeCheck,
  MessageSquare,
  Wallet,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronDown,
  Info,
} from "lucide-react";
import {
  getDashboardStats,
  getRevenueDetails,
  getDashboardOverview,
} from "../api/admin";
import LiveActivity from "../components/LiveActivity";

const STATS_REFRESH_MS = 20000; // KPIs auto-refresh while you're logged in

const inr = (n) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const inr0 = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

function RevBox({ label, value }) {
  return (
    <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
      <div className="text-[11px] uppercase tracking-wide opacity-80">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold">{value}</div>
    </div>
  );
}

const CARDS = [
  { key: "total_users", label: "Total Users", icon: Users, color: "bg-brand-600" },
  { key: "active_users", label: "Active Users", icon: BadgeCheck, color: "bg-brand-500" },
  { key: "total_vehicles", label: "Vehicles", icon: Car, color: "bg-accent-500" },
  { key: "total_challans", label: "Challans", icon: FileWarning, color: "bg-accent-500" },
  { key: "total_fastags", label: "FASTags", icon: Radio, color: "bg-brand-500" },
  { key: "active_subscriptions", label: "Active Subs", icon: BadgeCheck, color: "bg-brand-600" },
  { key: "open_queries", label: "Open Queries", icon: MessageSquare, color: "bg-accent-600" },
  { key: "total_feedbacks", label: "Feedbacks", icon: MessageSquare, color: "bg-brand-500" },
  { key: "captured_payments", label: "Captured Payments", icon: Wallet, color: "bg-brand-600" },
];

// Icon + accent for the headline metric grid.
const METRIC_META = {
  users: { icon: Users, color: "#36B76B", bg: "#D4F1E0" },
  revenue: { icon: IndianRupee, color: "#F4A13A", bg: "#FEF4E8" },
  subscriptions: { icon: BadgeCheck, color: "#36B76B", bg: "#D4F1E0" },
  messages: { icon: MessageSquare, color: "#F4A13A", bg: "#FEF4E8" },
};

function Trend({ pct, trend }) {
  const up = trend === "up";
  return (
    <span className={`trend-badge ${up ? "trend-up" : "trend-down"}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(pct)}%
    </span>
  );
}

function MetricCard({ metric, index }) {
  const meta = METRIC_META[metric.key] || METRIC_META.users;
  const Icon = meta.icon;
  return (
    <div
      className="surface-pad anim-fade-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="mb-3 flex items-start justify-between">
        <span className="text-[12px] font-medium text-body">{metric.label}</span>
        <span
          className="grid h-8 w-8 place-items-center rounded-lg"
          style={{ background: meta.bg, color: meta.color }}
        >
          <Icon size={16} />
        </span>
      </div>
      <div className="metric-headline">
        {metric.is_currency ? inr0(metric.value) : metric.value}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Trend pct={metric.delta_pct} trend={metric.trend} />
        <span className="text-[11px] text-subtle">vs prior 7 days</span>
      </div>
    </div>
  );
}

function ActivityChart({ data }) {
  const max = Math.max(...data.flatMap((d) => [d.users, d.payments]), 1);
  const px = (v) => Math.max((Number(v) / max) * 150, v > 0 ? 4 : 0);
  return (
    <div className="surface-pad anim-fade-up">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="card-heading">Activity</h3>
        <div className="flex items-center gap-4 text-[11px] text-body">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-600" /> New users
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-500" /> Payments
          </span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-2" style={{ height: 180 }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-[150px] items-end gap-[3px]">
              <div
                className="anim-grow w-3.5 rounded-t bg-brand-600"
                style={{ height: px(d.users), animationDelay: `${i * 0.1}s` }}
                title={`${d.users} new users`}
              />
              <div
                className="anim-grow w-3.5 rounded-t bg-accent-500"
                style={{ height: px(d.payments), animationDelay: `${i * 0.1 + 0.05}s` }}
                title={`${d.payments} payments`}
              />
            </div>
            <span className="text-[10px] text-subtle">{d.dow}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressCard({ title, bigValue, status, bars }) {
  const healthy = status === "Healthy";
  return (
    <div className="surface-pad anim-fade-up">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="card-heading">{title}</h3>
        <Info size={14} className="text-subtle" />
      </div>
      <div className="flex items-center gap-2">
        <span className="metric-headline">{bigValue}</span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            healthy ? "bg-brand-100 text-brand-700" : "bg-accent-50 text-accent-600"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              healthy ? "bg-brand-600" : "bg-accent-500"
            }`}
          />
          {status}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {bars.map((b, i) => (
          <div key={i}>
            <div className="mb-1 flex items-center justify-between text-[11px] text-body">
              <span>{b.label}</span>
              <span className="font-semibold text-ink">{b.pct}%</span>
            </div>
            <div className="h-[7px] overflow-hidden rounded-full bg-hover">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${b.pct}%`, background: b.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanTable({ rows }) {
  return (
    <div className="surface anim-fade-up overflow-hidden">
      <div className="border-b border-line p-5">
        <h3 className="card-heading">Plan performance</h3>
        <p className="micro mt-0.5">Subscribers, active rate &amp; price per plan</p>
      </div>
      <div className="overflow-x-auto thin-scroll">
        <table className="min-w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-wide text-subtle">
              <th className="px-5 py-2.5 font-semibold">Plan</th>
              <th className="px-5 py-2.5 font-semibold">Subscribers</th>
              <th className="px-5 py-2.5 font-semibold">Active</th>
              <th className="px-5 py-2.5 font-semibold">Active rate</th>
              <th className="px-5 py-2.5 text-right font-semibold">Price</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-xs text-subtle">
                  No plans yet.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr
                  key={i}
                  className="border-t border-line-light text-[12px] hover:bg-hover"
                >
                  <td className="px-5 py-3 font-medium text-ink">{r.plan}</td>
                  <td className="px-5 py-3 font-semibold text-ink">{r.subscribers}</td>
                  <td className="px-5 py-3 text-body">{r.active}</td>
                  <td className="px-5 py-3">
                    <span
                      className="font-semibold"
                      style={{ color: r.active_rate >= 50 ? "#36B76B" : "#F4A13A" }}
                    >
                      {r.active_rate}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-ink">
                    {inr0(r.price)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = (showToast) =>
      Promise.all([
        getDashboardStats(),
        getRevenueDetails(),
        getDashboardOverview(),
      ])
        .then(([s, r, o]) => {
          if (!alive) return;
          setStats(s);
          setRevenue(r);
          setOverview(o);
        })
        .catch((e) => showToast && toast.error(e.message || "Failed to load stats"))
        .finally(() => alive && setLoading(false));

    load(true); // initial
    const timer = setInterval(() => load(false), STATS_REFRESH_MS); // live refresh
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Platform overview at a glance.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-[13px] font-medium text-body shadow-card">
          <Calendar size={15} className="text-subtle" />
          {overview?.period || "Last 7 days"}
          <ChevronDown size={15} className="text-subtle" />
        </div>
      </div>

      {loading ? (
        <div className="text-body">Loading dashboard…</div>
      ) : (
        <>
          {/* Revenue band */}
          <div className="mb-5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-800 p-6 text-white shadow-card">
            <div className="flex items-center gap-2 text-sm opacity-90">
              <IndianRupee size={16} /> Captured Revenue (incl. GST)
            </div>
            <div className="mt-1 text-3xl font-bold tracking-[-0.03em]">
              {inr(revenue?.total_with_gst)}
            </div>
            <div className="mt-1 text-xs opacity-80">
              {revenue?.captured_count ?? 0} captured payment
              {revenue?.captured_count === 1 ? "" : "s"} · GST @{" "}
              {revenue?.gst_percent ?? 0}%
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <RevBox label="Total without GST" value={inr(revenue?.total_without_gst)} />
              <RevBox label={`GST (${revenue?.gst_percent ?? 0}%)`} value={inr(revenue?.gst_amount)} />
              <RevBox label="Refunded" value={inr(revenue?.refunded)} />
              <RevBox label="Net received" value={inr(revenue?.net_received)} />
            </div>
          </div>

          {/* Metric grid (trend badges) */}
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(overview?.metrics || []).map((m, i) => (
              <MetricCard key={m.key} metric={m} index={i} />
            ))}
          </div>

          {/* Main + right activity column */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <ActivityChart data={overview?.activity || []} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ProgressCard
                  title="Growth"
                  bigValue={overview?.growth?.value ?? 0}
                  status={overview?.growth?.status || "Stable"}
                  bars={[
                    { label: "Benchmark (prior 30d)", pct: overview?.growth?.benchmark_pct ?? 0, color: "#F4A13A" },
                    { label: "Current (last 30d)", pct: overview?.growth?.current_pct ?? 0, color: "#36B76B" },
                  ]}
                />
                <ProgressCard
                  title="Retention"
                  bigValue={`${overview?.retention?.value_pct ?? 0}%`}
                  status={overview?.retention?.status || "Stable"}
                  bars={[
                    { label: "Paid share", pct: overview?.retention?.benchmark_pct ?? 0, color: "#F4A13A" },
                    { label: "Active subscriptions", pct: overview?.retention?.current_pct ?? 0, color: "#36B76B" },
                  ]}
                />
              </div>

              <PlanTable rows={overview?.plan_performance || []} />

              {/* Platform totals */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {CARDS.map(({ key, label, icon: Icon, color }, i) => (
                  <div
                    key={key}
                    className="surface anim-fade-up p-4"
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <div
                      className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-white ${color}`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="text-xl font-bold tracking-[-0.03em] text-ink">
                      {stats?.[key] ?? 0}
                    </div>
                    <div className="text-[11px] text-body">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live activity feed — auto-updates while you're logged in */}
            <LiveActivity />
          </div>
        </>
      )}
    </div>
  );
}
