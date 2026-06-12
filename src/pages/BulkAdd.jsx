import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  UserPlus,
  Car,
  Trash2,
  Plus,
  Loader2,
  CheckCircle2,
  FileText,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import {
  bulkSendOtp,
  bulkCreateUser,
  bulkAddVehicle,
  bulkRemoveVehicle,
  bulkCreateOrder,
  bulkVerifyPayment,
  getRefOptions,
  openInvoicePdf,
} from "../api/admin";
import { openRazorpayCheckout } from "../utils/razorpay";

const inr = (n) =>
  "₹" +
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function BulkAdd() {
  const [step, setStep] = useState("user"); // user | vehicles | done
  const [busy, setBusy] = useState(false);

  // user step
  const [form, setForm] = useState({ user_name: "", mobile_number: "", fk_states_unions: "" });
  const [states, setStates] = useState([]);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  // vehicles step
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [bill, setBill] = useState(null);
  const [reg, setReg] = useState("");

  // done
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    getRefOptions("states-unions", "state_union_name")
      .then(setStates)
      .catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const sendOtp = async () => {
    if (!/^\d{10}$/.test(form.mobile_number))
      return toast.error("Enter a valid 10-digit mobile number");
    setBusy(true);
    try {
      await bulkSendOtp(form.mobile_number);
      setOtpSent(true);
      toast.success("OTP sent to the user");
    } catch (e) {
      toast.error(e.message || "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const createUser = async () => {
    if (!form.user_name.trim()) return toast.error("Enter the user's name");
    if (!otp.trim()) return toast.error("Enter the OTP");
    setBusy(true);
    try {
      const data = await bulkCreateUser({ ...form, otp });
      setUser(data.user);
      setVehicles(data.vehicles || []);
      setBill(data.bill);
      setStep("vehicles");
      toast.success("User created — add vehicles");
    } catch (e) {
      toast.error(e.message || "Failed to create user");
    } finally {
      setBusy(false);
    }
  };

  const addVehicle = async () => {
    if (!reg.trim()) return toast.error("Enter a vehicle number");
    setBusy(true);
    try {
      const data = await bulkAddVehicle(user.id, reg.trim().toUpperCase());
      setVehicles(data.vehicles || []);
      setBill(data.bill);
      setReg("");
      toast.success(`Added ${data.vehicle?.reg_no || "vehicle"}`);
    } catch (e) {
      toast.error(e.message || "Failed to add vehicle");
    } finally {
      setBusy(false);
    }
  };

  const removeVehicle = async (rc_id) => {
    setBusy(true);
    try {
      const data = await bulkRemoveVehicle(user.id, rc_id);
      setVehicles(data.vehicles || []);
      setBill(data.bill);
    } catch (e) {
      toast.error(e.message || "Failed to remove vehicle");
    } finally {
      setBusy(false);
    }
  };

  const payAndInvoice = async () => {
    if (!vehicles.length) return toast.error("Add at least one vehicle");
    setBusy(true);
    try {
      // 1) Create the Razorpay order for the current bill.
      const order = await bulkCreateOrder(user.id);
      // 2) Open Razorpay checkout.
      const rp = await openRazorpayCheckout({
        order,
        keyId: order.key_id,
        name: "AlertMyVahan — Bulk onboarding",
        description: `${vehicles.length} vehicle(s) for ${user.user_name}`,
        prefill: { name: user.user_name, contact: user.mobile_number },
      });
      // 3) Verify the payment → subscription + invoice.
      const data = await bulkVerifyPayment({
        fk_users: user.id,
        razorpay_order_id: rp.razorpay_order_id,
        razorpay_payment_id: rp.razorpay_payment_id,
        razorpay_signature: rp.razorpay_signature,
      });
      setInvoice(data);
      setStep("done");
      toast.success("Payment successful — invoice generated");
    } catch (e) {
      toast.error(e.message || "Payment / invoice failed");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setStep("user");
    setForm({ user_name: "", mobile_number: "", fk_states_unions: "" });
    setOtpSent(false);
    setOtp("");
    setUser(null);
    setVehicles([]);
    setBill(null);
    setReg("");
    setInvoice(null);
  };

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Bulk onboarding</h1>
      <p className="mb-6 text-sm text-slate-500">
        Create a user (OTP-verified), add vehicles (each does a live RC lookup),
        then generate one invoice — all vehicles billed at the best per-vehicle rate.
      </p>

      {/* Stepper */}
      <div className="mb-5 flex items-center gap-2 text-xs">
        {["User", "Vehicles", "Invoice"].map((s, i) => {
          const active =
            (step === "user" && i === 0) ||
            (step === "vehicles" && i === 1) ||
            (step === "done" && i === 2);
          const doneStep =
            (i === 0 && step !== "user") || (i === 1 && step === "done");
          return (
            <React.Fragment key={s}>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium ${
                  active
                    ? "bg-brand-600 text-white"
                    : doneStep
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {doneStep && <CheckCircle2 size={12} />} {s}
              </span>
              {i < 2 && <span className="text-slate-300">→</span>}
            </React.Fragment>
          );
        })}
      </div>

      {/* ───────────────── Step 1: user ───────────────── */}
      {step === "user" && (
        <div className="max-w-xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <UserPlus size={16} /> User details
          </h2>
          <div className="grid gap-3">
            <Field label="Name">
              <input className="adm-input" value={form.user_name} onChange={set("user_name")} placeholder="Ramesh Kumar" />
            </Field>
            <Field label="Mobile number">
              <input
                className="adm-input"
                value={form.mobile_number}
                onChange={(e) => setForm((f) => ({ ...f, mobile_number: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                placeholder="9886122415"
                disabled={otpSent}
              />
            </Field>
            <Field label="State / Union territory">
              <select className="adm-input" value={form.fk_states_unions} onChange={set("fk_states_unions")}>
                <option value="">Select…</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </Field>

            {!otpSent ? (
              <button onClick={sendOtp} disabled={busy} className="adm-btn">
                {busy ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                Send OTP
              </button>
            ) : (
              <>
                <Field label="OTP (sent to the user)">
                  <input className="adm-input" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="4-6 digit OTP" />
                </Field>
                <div className="flex gap-2">
                  <button onClick={createUser} disabled={busy} className="adm-btn flex-1">
                    {busy ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                    Verify & create user
                  </button>
                  <button onClick={sendOtp} disabled={busy} className="adm-btn-ghost">
                    Resend
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ───────────────── Step 2: vehicles + live bill ───────────────── */}
      {step === "vehicles" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Car size={16} /> Vehicles for {user?.user_name}
              </h2>
              <span className="text-xs text-slate-400">+91 {user?.mobile_number}</span>
            </div>

            <div className="mb-4 flex gap-2">
              <input
                className="adm-input flex-1"
                value={reg}
                onChange={(e) => setReg(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && !busy && addVehicle()}
                placeholder="KA01AB1234"
              />
              <button onClick={addVehicle} disabled={busy} className="adm-btn">
                {busy ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                Add (RC lookup)
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div className="flex h-28 items-center justify-center text-sm text-slate-400">
                No vehicles yet. Each add does a live RC lookup (billed).
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {vehicles.map((v) => (
                  <li key={v.rc_id} className="flex items-center gap-3 py-2.5">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                      <Car size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-sm font-semibold text-slate-800">{v.reg_no}</div>
                      <div className="truncate text-xs text-slate-400">
                        {[v.vehicle_manufacturer_name, v.model, v.vehicle_colour].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </div>
                    <button onClick={() => removeVehicle(v.rc_id)} disabled={busy} className="text-slate-400 hover:text-rose-500">
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* live bill */}
          <BillPanel bill={bill} onFinalize={payAndInvoice} busy={busy} count={vehicles.length} />
        </div>
      )}

      {/* ───────────────── Step 3: done ───────────────── */}
      {step === "done" && (
        <div className="max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-white">
            <CheckCircle2 size={28} />
          </span>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Invoice generated</h2>
          <p className="mt-1 text-sm text-slate-500">
            {invoice?.vehicles?.length} vehicle(s) · {inr(invoice?.bill?.total)} (incl. GST)
          </p>
          <div className="mt-2 font-mono text-sm text-slate-700">{invoice?.invoice_id}</div>
          <div className="mt-5 flex justify-center gap-2">
            <button onClick={() => openInvoicePdf(invoice.invoice_id).catch((e) => toast.error(e.message))} className="adm-btn">
              <FileText size={16} /> View invoice
            </button>
            <button onClick={reset} className="adm-btn-ghost">
              <RotateCcw size={16} /> New bulk onboarding
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function BillPanel({ bill, onFinalize, busy, count }) {
  const b = bill || {};
  return (
    <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-md">
      <h3 className="text-sm font-semibold opacity-90">Live bill</h3>
      <p className="text-[11px] opacity-60">
        {b.count || 0} vehicle(s) × {inr(b.per_vehicle)} each
      </p>
      <div className="mt-4 space-y-2 text-sm">
        <Row label="Taxable value" value={inr(b.taxable_value)} />
        <Row label={`GST (${b.gst_percent ?? 0}%)`} value={inr(b.gst_amount)} />
        <div className="my-2 border-t border-white/15" />
        <Row label="Total (incl. GST)" value={inr(b.total)} bold />
      </div>
      <button
        onClick={onFinalize}
        disabled={busy || !count}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
        Pay &amp; generate invoice
      </button>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-semibold" : "opacity-75"}>{label}</span>
      <span className={bold ? "text-lg font-bold" : "font-medium"}>{value}</span>
    </div>
  );
}
