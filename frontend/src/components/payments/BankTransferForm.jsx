import { useState } from "react";
import { Building2, Lock, ShieldCheck } from "lucide-react";
import { PAYMENT_IMAGES } from "../../data/imagePaths";
import OtpVerification from "./OtpVerification";

const nepalBanks = [
  "Nabil Bank",
  "Global IME",
  "NIC Asia",
  "Nepal Investment Mega",
  "Kumari Bank",
  "Prabhu Bank",
  "Siddhartha Bank",
  "Everest Bank",
  "Machhapuchhre Bank",
];

function BankTransferForm({ amount, onSuccess }) {
  const [bank, setBank] = useState(nepalBanks[0]);
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [branch, setBranch] = useState("Kathmandu Main");
  const [reference] = useState("REF-839201");
  const [phone, setPhone] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [processing, setProcessing] = useState(false);

  const isValidInitial =
    accountHolder.trim().length >= 3 &&
    accountNumber.trim().length >= 6 &&
    phone.length === 10;

  const handleGenerateOtp = (e) => {
    e.preventDefault();
    if (!isValidInitial) return;
    setShowOtp(true);
  };

  const handleTransfer = (e) => {
    e.preventDefault();
    if (!isOtpVerified || processing) return;

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const txnId = `BANK-TXN-${Math.floor(100000 + Math.random() * 900000)}`;
      onSuccess({
        method: "Bank Transfer",
        txnId,
        customerName: accountHolder,
        phone,
        bank,
        accountNumber,
        branch,
        reference,
      });
    }, 300);
  };

  return (
    <div className="space-y-6 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-14 items-center justify-center rounded-xl bg-amber-50 p-1.5 border border-amber-200">
            <img
              src={PAYMENT_IMAGES.bank}
              alt="Nepal Bank Transfer"
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              Nepal Direct Bank Transfer
            </h3>
            <p className="text-xs text-amber-800 font-semibold">
              Supported by Nepal Clearing House (NCHL / connectIPS)
            </p>
          </div>
        </div>

        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-200">
          Bank Direct
        </span>
      </div>

      {/* Read-Only Amount */}
      <div className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Payable Amount
          </span>
          <p className="text-2xl font-bold text-amber-950">
            Rs. {amount.toLocaleString()}
          </p>
        </div>
        <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-amber-900 shadow-xs border border-amber-200">
          {bank}
        </span>
      </div>

      <form onSubmit={isOtpVerified ? handleTransfer : handleGenerateOtp} className="space-y-4">
        {/* Select Bank */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Select Partner Bank
          </label>
          <div className="relative mt-1.5">
            <Building2
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={bank}
              disabled={isOtpVerified}
              onChange={(e) => setBank(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
            >
              {nepalBanks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Account Holder Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Account Holder Full Name
          </label>
          <input
            type="text"
            required
            disabled={isOtpVerified}
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            placeholder="e.g. Aayush Shrestha"
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
          />
        </div>

        {/* Account Number & Branch */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Account Number
            </label>
            <input
              type="text"
              required
              disabled={isOtpVerified}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="0123456789012"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono text-slate-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Branch Name
            </label>
            <input
              type="text"
              required
              disabled={isOtpVerified}
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="e.g. Lazimpat Branch"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* Reference & Phone */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Reference / Remarks Number
            </label>
            <input
              type="text"
              readOnly
              value={reference}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono text-slate-700 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Mobile Phone (10 Digits)
            </label>
            <input
              type="tel"
              required
              disabled={isOtpVerified}
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="98XXXXXXXX"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* OTP Flow */}
        {!showOtp && (
          <button
            type="button"
            disabled={!isValidInitial}
            onClick={() => setShowOtp(true)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 disabled:opacity-50"
          >
            <Lock size={16} />
            <span>Generate Bank OTP Authorization</span>
          </button>
        )}

        {showOtp && (
          <div className="space-y-4 pt-2">
            <OtpVerification
              phoneOrEmail={phone || "your bank registered number"}
              themeColor="yellow"
              onVerified={() => setIsOtpVerified(true)}
            />

            <button
              type="submit"
              disabled={!isOtpVerified || processing}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-4 text-sm font-bold text-slate-950 shadow-md transition hover:bg-amber-400 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  <span>Executing Bank Transfer...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Transfer Rs. {amount.toLocaleString()} to PeakKit</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100">
          <ShieldCheck size={16} className="text-amber-600 shrink-0" />
          <span>Interbank settlements are simulated through connectIPS Nepal standards.</span>
        </div>
      </form>
    </div>
  );
}

export default BankTransferForm;
