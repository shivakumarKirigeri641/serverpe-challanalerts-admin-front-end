import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  BarChart3,
  Database,
  LogOut,
  Menu,
  X,
  Lock,
  UserPlus,
  Receipt,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { getResources, logout } from "../api/admin";

const GROUP_ORDER = [
  "Catalog",
  "Customers",
  "Vehicles",
  "Billing",
  "Agreements",
  "System",
  "Other",
];
import { useAuth } from "../auth/AuthContext";

export default function Layout() {
  const navigate = useNavigate();
  const { admin, signOut } = useAuth();
  const [resources, setResources] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getResources()
      .then(setResources)
      .catch((e) => toast.error(e.message || "Failed to load resources"));
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (_) {
      /* ignore */
    }
    signOut();
    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
      isActive
        ? "bg-brand-600/10 text-brand-600"
        : "text-body hover:bg-hover hover:text-ink"
    }`;

  // Group resources for a tidy, sectioned sidebar.
  const grouped = resources.reduce((acc, r) => {
    const g = r.group || "Other";
    (acc[g] = acc[g] || []).push(r);
    return acc;
  }, {});
  const groupNames = Object.keys(grouped).sort(
    (a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b)
  );

  const Sidebar = (
    <aside className="flex h-full w-[220px] flex-col border-r border-line bg-white">
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white shadow-card">
            <ShieldCheck size={18} />
          </span>
          <span className="text-[17px] font-bold tracking-[-0.02em] text-ink">
            {process.env.REACT_APP_BRAND_NAME || "Admin"}
          </span>
        </div>
        <button
          className="text-subtle lg:hidden"
          onClick={() => setOpen(false)}
        >
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 thin-scroll">
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
          Main Menu
        </p>
        <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>
          <LayoutDashboard size={17} /> Dashboard
        </NavLink>
        <NavLink
          to="/analytics"
          className={linkClass}
          onClick={() => setOpen(false)}
        >
          <BarChart3 size={17} /> Analytics
        </NavLink>

        <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-subtle">
          Tools
        </p>
        <NavLink
          to="/bulk-add"
          className={linkClass}
          onClick={() => setOpen(false)}
        >
          <UserPlus size={17} /> Bulk onboarding
        </NavLink>
        <NavLink
          to="/invoices"
          className={linkClass}
          onClick={() => setOpen(false)}
        >
          <Receipt size={17} /> Invoices
        </NavLink>
        {groupNames.map((group) => (
          <div key={group}>
            <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-subtle">
              {group}
            </p>
            {grouped[group].map((r) => (
              <NavLink
                key={r.route}
                to={`/resources/${r.route}`}
                className={linkClass}
                onClick={() => setOpen(false)}
              >
                {r.readonly ? <Lock size={16} /> : <Database size={16} />}
                <span className="truncate">{r.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="space-y-1 border-t border-line p-3">
        <a
          href="https://www.alertmyvahan.in"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-body transition hover:bg-hover hover:text-ink"
        >
          <HelpCircle size={17} /> Help &amp; support
        </a>
        <div className="px-3 pb-1 pt-1 text-[11px] text-subtle">
          {admin?.mobile_number} · {admin?.role}
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-red-500 transition hover:bg-red-50"
        >
          <LogOut size={17} /> Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <div className="hidden lg:block">{Sidebar}</div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">{Sidebar}</div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-line bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="text-ink">
            <Menu size={22} />
          </button>
          <span className="font-semibold text-ink">
            {process.env.REACT_APP_BRAND_NAME || "Admin"}
          </span>
        </header>
        <main className="flex-1 overflow-y-auto bg-canvas p-4 lg:p-6 thin-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
