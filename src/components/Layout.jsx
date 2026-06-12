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
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
      isActive
        ? "bg-brand-600 text-white"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
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
    <aside className="flex h-full w-64 flex-col bg-slate-900">
      <div className="flex items-center justify-between px-4 py-4">
        <span className="text-lg font-bold text-white">
          {process.env.REACT_APP_BRAND_NAME || "Admin"}
        </span>
        <button
          className="text-slate-400 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 thin-scroll">
        <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>
          <LayoutDashboard size={18} /> Dashboard
        </NavLink>
        <NavLink
          to="/analytics"
          className={linkClass}
          onClick={() => setOpen(false)}
        >
          <BarChart3 size={18} /> Analytics
        </NavLink>
        <NavLink
          to="/bulk-add"
          className={linkClass}
          onClick={() => setOpen(false)}
        >
          <UserPlus size={18} /> Bulk onboarding
        </NavLink>
        {groupNames.map((group) => (
          <div key={group}>
            <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
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
      <div className="border-t border-slate-800 p-3">
        <div className="mb-2 px-2 text-xs text-slate-400">
          {admin?.mobile_number} · {admin?.role}
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-slate-800"
        >
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
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
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} className="text-slate-700">
            <Menu size={22} />
          </button>
          <span className="font-semibold">
            {process.env.REACT_APP_BRAND_NAME || "Admin"}
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 thin-scroll">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
