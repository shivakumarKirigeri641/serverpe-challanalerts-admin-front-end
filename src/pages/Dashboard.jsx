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
} from "lucide-react";
import { getDashboardStats, getRevenueDetails } from "../api/admin";

const inr = (n) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function RevBox({ label, value }) {
  return (
    <div className="rounded-xl bg-white/10 p-3 backdrop-blur-sm">
      <div className="text-[11px] uppercase tracking-wide opacity-75">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold">{value}</div>
    </div>
  );
}

const CARDS = [
  { key: "total_users", label: "Total Users", icon: Users, color: "bg-blue-500" },
  { key: "active_users", label: "Active Users", icon: BadgeCheck, color: "bg-emerald-500" },
  { key: "total_vehicles", label: "Vehicles", icon: Car, color: "bg-indigo-500" },
  { key: "total_challans", label: "Challans", icon: FileWarning, color: "bg-amber-500" },
  { key: "total_fastags", label: "FASTags", icon: Radio, color: "bg-cyan-500" },
  { key: "active_subscriptions", label: "Active Subs", icon: BadgeCheck, color: "bg-violet-500" },
  { key: "open_queries", label: "Open Queries", icon: MessageSquare, color: "bg-rose-500" },
  { key: "total_feedbacks", label: "Feedbacks", icon: MessageSquare, color: "bg-pink-500" },
  { key: "captured_payments", label: "Captured Payments", icon: Wallet, color: "bg-teal-500" },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardStats(), getRevenueDetails()])
      .then(([s, r]) => {
        setStats(s);
        setRevenue(r);
      })
      .catch((e) => toast.error(e.message || "Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="mb-6 text-sm text-slate-500">
        Platform overview at a glance.
      </p>

      {loading ? (
        <div className="text-slate-500">Loading stats…</div>
      ) : (
        <>
          <div className="mb-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 p-6 text-white shadow-md">
            <div className="flex items-center gap-2 text-sm opacity-80">
              <IndianRupee size={16} /> Captured Revenue (incl. GST)
            </div>
            <div className="mt-1 text-3xl font-bold">
              {inr(revenue?.total_with_gst)}
            </div>
            <div className="mt-1 text-xs opacity-75">
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

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {CARDS.map(({ key, label, icon: Icon, color }) => (
              <div
                key={key}
                className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
              >
                <div
                  className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-white ${color}`}
                >
                  <Icon size={18} />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {stats?.[key] ?? 0}
                </div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
