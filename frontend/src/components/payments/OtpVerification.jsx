import { useState, useEffect } from "react";
import { CheckCircle2, KeyRound, RefreshCw, ShieldAlert } from "lucide-react";

function OtpVerification({
  phoneOrEmail = "your registered number",
  onVerified,
  themeColor = "green",
}) {
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleVerify = (e) => {
    e?.preventDefault();
    if (!otp.trim()) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }
    if (otp.trim() === "123456") {
      setError("");
      setVerified(true);
      if (onVerified) onVerified(true);
    } else {
      setError("Invalid OTP code. Please use demo OTP: 123456");
    }
  };

  const handleResend = () => {
    if (timeLeft > 0) return;
    setSending(true);
    setError("");
    setOtp("");
    setTimeout(() => {
      setTimeLeft(30);
      setSending(false);
    }, 500);
  };

  const colorStyles = {
    green: {
      bg: "bg-emerald-50 border-emerald-200",
      btn: "bg-[#60bb46] hover:bg-[#52a43b] text-white",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
      accent: "text-emerald-700",
    },
    purple: {
      bg: "bg-purple-50 border-purple-200",
      btn: "bg-[#5c2d91] hover:bg-[#4d257a] text-white",
      badge: "bg-purple-100 text-purple-800 border-purple-300",
      accent: "text-purple-700",
    },
    yellow: {
      bg: "bg-amber-50 border-amber-200",
      btn: "bg-amber-500 hover:bg-amber-600 text-white",
      badge: "bg-amber-100 text-amber-900 border-amber-300",
      accent: "text-amber-800",
    },
  }[themeColor] || {
    bg: "bg-stone-50 border-slate-200",
    btn: "bg-green-900 hover:bg-green-800 text-white",
    badge: "bg-green-100 text-green-800 border-green-300",
    accent: "text-green-800",
  };

  if (verified) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-800">
        <CheckCircle2 size={24} className="shrink-0 text-emerald-600" />
        <div>
          <strong className="block text-sm font-semibold">
            OTP Verified Successfully
          </strong>
          <span className="text-xs text-emerald-700">
            Authorization confirmed for this transaction.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-5 ${colorStyles.bg}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
            <KeyRound size={16} className={colorStyles.accent} />
            Enter 6-Digit OTP Code
          </h4>
          <p className="mt-1 text-xs text-slate-600">
            Security code sent to{" "}
            <strong className="text-slate-800">{phoneOrEmail}</strong>
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm border border-slate-100">
          Demo OTP: <b className="text-slate-900">123456</b>
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          maxLength={6}
          value={otp}
          onChange={(e) => {
            setOtp(e.target.value.replace(/\D/g, ""));
            if (error) setError("");
          }}
          placeholder="123456"
          className="w-full sm:w-44 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-lg font-bold tracking-[0.3em] text-slate-900 outline-none transition focus:border-green-800 focus:ring-2 focus:ring-green-100"
        />

        <button
          type="button"
          onClick={handleVerify}
          className={`rounded-xl px-5 py-2.5 text-xs font-bold transition shadow-sm ${colorStyles.btn}`}
        >
          Verify OTP
        </button>

        <button
          type="button"
          disabled={timeLeft > 0 || sending}
          onClick={handleResend}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={13} className={sending ? "animate-spin" : ""} />
          {timeLeft > 0 ? `Resend (${timeLeft}s)` : "Resend OTP"}
        </button>
      </div>

      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <ShieldAlert size={14} /> {error}
        </p>
      )}
    </div>
  );
}

export default OtpVerification;
