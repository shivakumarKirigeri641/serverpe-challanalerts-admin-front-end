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
  subscribe: { icon: UserPlus, color: "bg-brand-600" },
  login: { icon: LogIn, color: "bg-brand-500" },
  payment: { icon: CreditCard, color: "bg-accent-500" },
  feedback: { icon: MessageSquare, color: "bg-brand-500" },
  contact: { icon: Mail, color: "bg-accent-600" },
  visit: { icon: Eye, color: "bg-subtle" },
  invoice: { icon: FileText, color: "bg-accent-500" },
  other: { icon: Activity, color: "bg-subtle" },
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
    <div className="surface-pad anim-slide-in self-start">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="card-heading">Live activity</h3>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              live ? "bg-brand-100 text-brand-700" : "bg-hover text-subtle"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                live ? "animate-pulse bg-brand-600" : "bg-subtle"
              }`}
            />
            {live ? "LIVE" : "PAUSED"}
          </span>
        </div>
        <button
          onClick={toggleLive}
          className="text-xs font-medium text-body hover:text-ink"
        >
          {live ? "Pause" : "Resume"}
        </button>
      </div>

      <div className="max-h-[420px] space-y-1.5 overflow-y-auto thin-scroll pr-1">
        {events.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-xs text-subtle">
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
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-hover"
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white ${meta.color}`}
                >
                  <Icon size={14} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {e.label}
                    {!e.ok && (
                      <span className="ml-1 text-[10px] font-medium text-red-500">
                        ({e.status_code})
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[11px] text-subtle">
                    {[who, e.vehicle_number, e.device]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <div className="shrink-0 text-[11px] text-subtle">
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
