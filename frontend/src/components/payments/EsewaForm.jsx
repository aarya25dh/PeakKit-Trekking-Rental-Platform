import { useState } from "react";
import { Lock, ShieldCheck, Smartphone } from "lucide-react";
import { PAYMENT_IMAGES } from "../../data/imagePaths";
import OtpVerification from "./OtpVerification";

function EsewaForm({ amount, onSuccess }) {
  const [esewaId, setEsewaId] = useState("");
  const [mpin, setMpin] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [processing, setProcessing] = useState(false);

  const isValidInitial = esewaId.length >= 10 && mpin.length >= 4;

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!isValidInitial) return;
    setShowOtp(true);
  };

  const handleFinalPayment = (e) => {
    e.preventDefault();
    if (!isOtpVerified || processing) return;

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const txnId = `ESEWA-TXN-${Math.floor(100000 + Math.random() * 900000)}`;
      onSuccess({
        method: "eSewa",
        txnId,
        customerName: `eSewa User (${esewaId})`,
        phone: esewaId,
        email: `${esewaId}@esewa.com.np`,
        merchant: "PeakKit Nepal",
        merchantCode: "PEAKKIT123",
      });
    }, 300);
  };

  return (
    <div className="space-y-6 rounded-3xl border border-emerald-300 bg-white p-6 shadow-sm sm:p-8">
      {/* eSewa Branded Header */}
      <div className="flex items-center justify-between border-b border-emerald-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-14 items-center justify-center rounded-xl bg-emerald-50 p-1.5 border border-emerald-200">
            <img
              src={PAYMENT_IMAGES.esewa}
              alt="eSewa"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              eSewa Payment Gateway
            </h3>
            <p className="text-xs text-emerald-700 font-semibold">
              Verified Merchant Checkout
            </p>
          </div>
        </div>

        <span className="rounded-full bg-[#60bb46]/15 px-3 py-1 text-xs font-bold text-[#3e7a2b] border border-[#60bb46]/30">
          Instant Wallet
        </span>
      </div>

      {/* Merchant Details Box */}
      <div className="grid grid-cols-2 gap-3 rounded-2xl bg-emerald-50/70 p-4 border border-emerald-200 text-xs">
        <div>
          <span className="text-slate-500 block uppercase text-[10px] font-bold">
            Merchant Name
          </span>
          <strong className="text-slate-900 font-semibold">
            PeakKit Nepal
          </strong>
        </div>
        <div>
          <span className="text-slate-500 block uppercase text-[10px] font-bold">
            Merchant Code
          </span>
          <strong className="font-mono text-emerald-900 font-semibold">
            PEAKKIT123
          </strong>
        </div>
      </div>

      {/* Read-Only Amount */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Payable Amount
          </span>
          <p className="text-2xl font-bold text-[#2d581f]">
            Rs. {amount.toLocaleString()}
          </p>
        </div>
        <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-xs border border-slate-200">
          NPR Currency
        </span>
      </div>

      <form onSubmit={isOtpVerified ? handleFinalPayment : handleSendOtp} className="space-y-4">
        {/* eSewa ID */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            eSewa ID / Registered Mobile Number
          </label>
          <div className="relative mt-1.5">
            <Smartphone
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="tel"
              required
              disabled={isOtpVerified}
              maxLength={10}
              value={esewaId}
              onChange={(e) => setEsewaId(e.target.value.replace(/\D/g, ""))}
              placeholder="98XXXXXXXX"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#60bb46] focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* MPIN */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            eSewa MPIN (4-6 Digits)
          </label>
          <input
            type="password"
            required
            disabled={isOtpVerified}
            maxLength={6}
            value={mpin}
            onChange={(e) => setMpin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono text-slate-900 outline-none transition focus:border-[#60bb46] focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50"
          />
        </div>

        {/* OTP Flow */}
        {!showOtp && (
          <button
            type="button"
            disabled={!isValidInitial}
            onClick={() => setShowOtp(true)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#60bb46] px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#52a43b] disabled:opacity-50"
          >
            <Smartphone size={16} />
            <span>Send eSewa OTP Code</span>
          </button>
        )}

        {showOtp && (
          <div className="space-y-4 pt-2">
            <OtpVerification
              phoneOrEmail={esewaId || "98XXXXXXXX"}
              themeColor="green"
              onVerified={() => setIsOtpVerified(true)}
            />

            <button
              type="submit"
              disabled={!isOtpVerified || processing}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#60bb46] px-6 py-4 text-sm font-bold text-white shadow-md transition hover:bg-[#52a43b] disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Authorizing eSewa Transaction...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Complete Payment (Rs. {amount.toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100">
          <ShieldCheck size={16} className="text-[#60bb46] shrink-0" />
          <span>Secured directly with F1Soft / eSewa Nepal simulated gateway.</span>
        </div>
      </form>
    </div>
  );
}

export default EsewaForm;
