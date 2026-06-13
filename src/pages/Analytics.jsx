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
  WalletCards,
  Plus,
  Loader2,
} from "lucide-react";
import { getAnalytics, rechargeWallet, rechargeSmsWallet } from "../api/admin";
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
    <div className="surface-pad anim-fade-up">
      <div
        className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-white ${color}`}
      >
        <Icon size={18} />
      </div>
      <div className="text-2xl font-bold tracking-[-0.03em] text-ink">{value}</div>
      <div className="text-xs text-body">{label}</div>
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
    return <div className="text-body">Loading analytics…</div>;
  if (!a) return <div className="text-body">No analytics available.</div>;

  const k = a.kpis || {};
  const r = a.revenue || {};
  const ext = a.external_api || {};
  const notif = a.notification || {};
  const messagesSent = (notif.by_channel || []).reduce(
    (s, c) => s + (c.sent || 0),
    0,
  );
  const byKind = notif.by_kind || [];
  const kindSum = (pred) =>
    byKind.filter(pred).reduce((s, x) => s + (x.count || 0), 0);
  const vdhSent = kindSum((x) => String(x.kind).startsWith("VDH"));
  const subAlerts = kindSum((x) => String(x.kind).startsWith("SUB_"));
  const docAlerts = kindSum((x) => String(x.kind).startsWith("DOC_"));
  const otpSent = kindSum((x) => String(x.kind) === "OTP");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">
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

      {/* ─────────────── Cost & operations (admin-only spend) ─────────────── */}
      <div className="pt-2">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-ink">
          Cost &amp; operations
        </h2>
        <p className="page-subtitle">
          External API spend (RC ≈ ₹2.9/call) and notification spend
          (WhatsApp ₹0.118 · SMS ₹0.25).
        </p>
      </div>

      {/* Provider wallets — recharged by admin, auto-deducted per usage. */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <WalletCard
          title="External API wallet"
          initialBalance={ext.wallet_balance}
          perCost={ext.per_call_cost || 2.91}
          perUnit="external call"
          onRecharge={rechargeWallet}
        />
        <WalletCard
          title="SMS wallet"
          initialBalance={notif.sms_wallet_balance}
          perCost={notif.per_sms_cost || 0.25}
          perUnit="SMS"
          onRecharge={rechargeSmsWallet}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon={Radio} label="API calls (today)" value={ext.today?.calls ?? 0} color="bg-sky-500" />
        <Kpi icon={IndianRupee} label="API cost (today)" value={inr2(ext.today?.cost)} color="bg-rose-500" />
        <Kpi icon={Receipt} label="Notif. spend (total)" value={inr2(notif.total_cost)} color="bg-amber-600" />
        <Kpi icon={Wallet} label="Messages sent" value={messagesSent} color="bg-emerald-600" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon={BadgeCheck} label="VDH reports sent" value={vdhSent} color="bg-fuchsia-500" />
        <Kpi icon={Receipt} label="Subscription alerts" value={subAlerts} color="bg-orange-500" />
        <Kpi icon={FileWarning} label="Document alerts" value={docAlerts} color="bg-amber-500" />
        <Kpi icon={Radio} label="OTPs sent" value={otpSent} color="bg-blue-500" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Subscriptions by type" subtitle="Trial vs paid">
          <HBarChart
            data={(a.subscriptions_by_type || []).map((d) => ({
              label: d.type,
              value: d.count,
            }))}
          />
        </Card>
        <Card title="External API calls" subtitle="Last 14 days">
          <BarChart
            data={(ext.by_day || []).map((d) => ({
              label: d.day?.slice(5),
              value: d.calls,
            }))}
          />
        </Card>
        <Card title="External API cost by day" subtitle="₹ (RC ≈ ₹2.9/call)">
          <LineChart
            data={(ext.by_day || []).map((d) => ({
              label: d.day?.slice(5),
              value: d.cost,
            }))}
            format={(v) => inr(v)}
          />
        </Card>
        <Card title="External API by type" subtitle="Calls (label shows ₹ all-time)">
          <HBarChart
            data={(ext.by_name || []).map((d) => ({
              label: `${d.api_name} (₹${d.cost})`,
              value: d.calls,
            }))}
          />
        </Card>
        <Card title="Notification cost by channel" subtitle="₹ spent">
          <HBarChart
            data={(notif.by_channel || []).map((d) => ({
              label: d.channel,
              value: d.cost,
            }))}
            format={(v) => inr2(v)}
          />
        </Card>
        <Card title="Messages by type" subtitle="Top message kinds (count)">
          <HBarChart
            data={(notif.by_kind || []).map((d) => ({
              label: d.kind,
              value: d.count,
            }))}
          />
        </Card>
        <Card title="Notification spend by day" subtitle="₹ last 14 days">
          <LineChart
            data={(notif.cost_by_day || []).map((d) => ({
              label: d.day?.slice(5),
              value: d.cost,
            }))}
            format={(v) => inr2(v)}
          />
        </Card>
      </div>
    </div>
  );
}

function WalletCard({ title, initialBalance, perCost, perUnit, onRecharge }) {
  const cost = Number(perCost) || 0.01;
  const [balance, setBalance] = useState(Number(initialBalance || 0));
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const low = balance < cost * 20;

  const add = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0)
      return toast.error("Enter a valid amount greater than 0");
    setBusy(true);
    try {
      const data = await onRecharge(amt);
      setBalance(data.balance);
      setAmount("");
      toast.success(`Added ${inr2(amt)} · new balance ${inr2(data.balance)}`);
    } catch (e) {
      toast.error(e.message || "Recharge failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="surface-pad anim-fade-up flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span
          className="grid h-11 w-11 place-items-center rounded-xl"
          style={{
            background: low ? "#FEF2F2" : "#D4F1E0",
            color: low ? "#EF4444" : "#36B76B",
          }}
        >
          <WalletCards size={20} />
        </span>
        <div>
          <div className="text-[12px] font-medium text-body">{title}</div>
          <div className="metric-headline" style={low ? { color: "#EF4444" } : undefined}>
            {inr2(balance)}
          </div>
          <div className="text-[11px] text-subtle">
            Deducts <span className="font-semibold text-ink">{inr2(cost)}</span> per{" "}
            {perUnit} · ≈ {Math.max(0, Math.floor(balance / cost))} {perUnit}s left
          </div>
        </div>
      </div>

      {/* Recharge — adds to the existing balance */}
      <div className="flex items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-body">
            Add to balance (₹)
          </span>
          <div className="relative">
            <IndianRupee
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-subtle"
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && !busy && add()}
              inputMode="decimal"
              placeholder="500"
              className="w-32 rounded-lg border border-line bg-white py-2 pl-7 pr-3 text-sm text-ink outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
          </div>
        </label>
        <button
          onClick={add}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Recharge
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-canvas p-3">
      <div className="text-[11px] uppercase tracking-wide text-subtle">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold text-ink">{value}</div>
    </div>
  );
}
