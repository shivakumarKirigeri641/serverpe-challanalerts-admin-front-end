import React, { useEffect, useRef, useState } from "react";
import {
  UserPlus,
  LogIn,
  CreditCard,
  MessageSquare,
  Eye,
  FileText,
  Activity,
  Mail,
} from "lucide-react";
import { getRecentActivity } from "../api/admin";

const POLL_MS = 7000; // poll cadence

const TYPE_META = {
  subscribe: { icon: UserPlus, color: "bg-emerald-500" },
  login: { icon: LogIn, color: "bg-blue-500" },
  payment: { icon: CreditCard, color: "bg-violet-500" },
  feedback: { icon: MessageSquare, color: "bg-pink-500" },
  contact: { icon: Mail, color: "bg-rose-500" },
  visit: { icon: Eye, color: "bg-slate-400" },
  invoice: { icon: FileText, color: "bg-amber-500" },
  other: { icon: Activity, color: "bg-slate-400" },
};

const maskMobile = (m) =>
  m ? `${String(m).slice(0, 2)}****${String(m).slice(-2)}` : null;

const timeAgo = (iso) => {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export default function LiveActivity() {
  const [events, setEvents] = useState([]);
  const [live, setLive] = useState(true);
  const [, force] = useState(0); // tick to refresh relative times
  const cursor = useRef(0);
  const liveRef = useRef(true);

  useEffect(() => {
    let timer;
    let alive = true;

    const tick = async () => {
      if (liveRef.current) {
        try {
          const data = await getRecentActivity(cursor.current);
          if (!alive) return;
          const fresh = data?.events || [];
          if (fresh.length) {
            cursor.current = Math.max(
              cursor.current,
              ...fresh.map((e) => Number(e.id)),
            );
            // fresh is newest-first; prepend, cap the feed length
            setEvents((prev) => [...fresh, ...prev].slice(0, 80));
          }
        } catch {
          /* ignore poll errors — try again next tick */
        }
      }
      if (alive) timer = setTimeout(tick, POLL_MS);
    };
    tick();

    // refresh the "Xs ago" labels every 15s
    const relTimer = setInterval(() => force((n) => n + 1), 15000);

    return () => {
      alive = false;
      clearTimeout(timer);
      clearInterval(relTimer);
    };
  }, []);

  const toggleLive = () => {
    setLive((v) => {
      liveRef.current = !v;
      return !v;
    });
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-800">Live activity</h3>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              live ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                live ? "animate-pulse bg-emerald-500" : "bg-slate-300"
              }`}
            />
            {live ? "LIVE" : "PAUSED"}
          </span>
        </div>
        <button
          onClick={toggleLive}
          className="text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          {live ? "Pause" : "Resume"}
        </button>
      </div>

      <div className="max-h-[420px] space-y-1.5 overflow-y-auto thin-scroll pr-1">
        {events.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-xs text-slate-400">
            Waiting for activity…
          </div>
        ) : (
          events.map((e) => {
            const meta = TYPE_META[e.type] || TYPE_META.other;
            const Icon = meta.icon;
            const who = maskMobile(e.mobile_number);
            return (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50"
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white ${meta.color}`}
                >
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-800">
                    {e.label}
                    {!e.ok && (
                      <span className="ml-1 text-[10px] font-medium text-rose-500">
                        ({e.status_code})
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
                    {[who, e.vehicle_number, e.device]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <div className="shrink-0 text-[11px] text-slate-400">
                  {timeAgo(e.at)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
