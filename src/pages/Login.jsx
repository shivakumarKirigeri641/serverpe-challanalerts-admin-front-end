import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ShieldCheck, Loader2 } from "lucide-react";
import { sendLoginOtp, verifyLoginOtp } from "../api/admin";
import { setToken } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const ADMIN_MOBILE = process.env.REACT_APP_ADMIN_MOBILE || "9886122415";

export default function Login() {
  const navigate = useNavigate();
  const { setAdmin } = useAuth();
  const [step, setStep] = useState("mobile"); // mobile | otp
  const [mobile, setMobile] = useState(ADMIN_MOBILE);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await sendLoginOtp(mobile);
      toast.success("OTP sent to the registered admin number");
      setStep("otp");
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await verifyLoginOtp(mobile, otp);
      const token = res.data?.token;
      if (!token) throw new Error("No session token returned");
      setToken(token);
      setAdmin({ role: res.data.role, mobile_number: res.data.mobile_number });
      toast.success("Welcome back, admin");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {process.env.REACT_APP_BRAND_NAME || "AlertMyVahan Admin"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Secure admin console — OTP sign in
          </p>
        </div>

        {step === "mobile" ? (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Admin mobile number
              </label>
              <input
                value={mobile}
                onChange={(e) =>
                  setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                inputMode="numeric"
                placeholder="10-digit mobile"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <button
              disabled={busy || mobile.length !== 10}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {busy && <Loader2 size={18} className="animate-spin" />}
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Enter OTP sent to {mobile}
              </label>
              <input
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                inputMode="numeric"
                autoFocus
                placeholder="OTP"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-center text-lg tracking-[0.5em] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <button
              disabled={busy || otp.length < 4}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {busy && <Loader2 size={18} className="animate-spin" />}
              Verify & Sign in
            </button>
            <button
              type="button"
              onClick={() => setStep("mobile")}
              className="w-full text-sm text-slate-500 hover:text-slate-700"
            >
              ← Change number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
