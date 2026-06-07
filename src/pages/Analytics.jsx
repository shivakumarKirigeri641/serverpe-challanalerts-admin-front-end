import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Users,
  Car,
  FileWarning,
  Radio,
  BadgeCheck,
  Wallet,
  Receipt,
  IndianRupee,
} from "lucide-react";
import { getAnalytics } from "../api/admin";
import { Card, BarChart, HBarChart, LineChart } from "../components/Charts";

const inr = (n) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const inr2 = (n) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function Kpi({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div
        className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-white ${color}`}
      >
        <Icon size={18} />
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

export default function Analytics() {
  const [a, setA] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then(setA)
      .catch((e) => toast.error(e.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="text-slate-500">Loading analytics…</div>;
  if (!a) return <div className="text-slate-500">No analytics available.</div>;

  const k = a.kpis || {};
  const r = a.revenue || {};

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">
          Platform performance — users, vehicles, logins, turnover &amp; billing.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Kpi icon={Users} label="Total Users" value={k.total_users ?? 0} color="bg-blue-500" />
        <Kpi icon={Car} label="Vehicles" value={k.total_vehicles ?? 0} color="bg-indigo-500" />
        <Kpi icon={FileWarning} label="Challans" value={k.total_challans ?? 0} color="bg-amber-500" />
        <Kpi icon={Radio} label="FASTags" value={k.total_fastags ?? 0} color="bg-cyan-500" />
        <Kpi icon={BadgeCheck} label="Active Subs" value={k.active_subscriptions ?? 0} color="bg-violet-500" />
        <Kpi icon={Wallet} label="Captured Payments" value={k.captured_payments ?? 0} color="bg-teal-500" />
        <Kpi icon={Receipt} label="Open Queries" value={k.open_queries ?? 0} color="bg-rose-500" />
        <Kpi icon={IndianRupee} label="Turnover (incl GST)" value={inr(r.total_with_gst)} color="bg-emerald-600" />
      </div>

      {/* Revenue breakdown */}
      <Card title="Turnover breakdown" subtitle={`GST @ ${r.gst_percent ?? 0}%`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total (incl. GST)" value={inr2(r.total_with_gst)} />
          <Stat label="Total (excl. GST)" value={inr2(r.total_without_gst)} />
          <Stat label="GST collected" value={inr2(r.gst_amount)} />
          <Stat label="Net received" value={inr2(r.net_received)} />
        </div>
      </Card>

      {/* Time series */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Revenue by month" subtitle="Captured payments (₹)">
          <BarChart
            data={(a.revenue_by_month || []).map((d) => ({
              label: d.month?.slice(2),
              value: d.gross,
            }))}
            format={(v) => inr(v)}
          />
        </Card>
        <Card title="New users by month">
          <BarChart
            data={(a.users_by_month || []).map((d) => ({
              label: d.month?.slice(2),
              value: d.count,
            }))}
          />
        </Card>
        <Card title="Subscriptions by month" subtitle="Total created">
          <BarChart
            data={(a.subscriptions_by_month || []).map((d) => ({
              label: d.month?.slice(2),
              value: d.total,
            }))}
          />
        </Card>
        <Card title="Invoices by month">
          <BarChart
            data={(a.invoices_by_month || []).map((d) => ({
              label: d.month?.slice(2),
              value: d.count,
            }))}
          />
        </Card>
        <Card title="Logins (OTP verifications)" subtitle="Last 14 days">
          <LineChart
            data={(a.logins_by_day || []).map((d) => ({
              label: d.day?.slice(5),
              value: d.logins,
            }))}
          />
        </Card>
        <Card title="Payments by status">
          <HBarChart
            data={(a.payments_by_status || []).map((d) => ({
              label: d.status,
              value: d.count,
            }))}
          />
        </Card>
        <Card title="Plan distribution" subtitle="Subscriptions per plan">
          <HBarChart
            data={(a.plan_distribution || []).map((d) => ({
              label: d.plan_name,
              value: d.subscriptions,
            }))}
          />
        </Card>
        <Card title="Top states / unions" subtitle="By users">
          <HBarChart
            data={(a.top_states || []).map((d) => ({
              label: d.state,
              value: d.users,
            }))}
          />
        </Card>
        <Card title="Challans by status">
          <HBarChart
            data={(a.challans_by_status || []).map((d) => ({
              label: d.status,
              value: d.count,
            }))}
          />
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold text-slate-800">{value}</div>
    </div>
  );
}
