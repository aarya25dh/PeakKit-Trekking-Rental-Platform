import { useState } from "react";
import { CreditCard, LoaderCircle, X } from "lucide-react";

const methods = [
  ["Credit / Debit Card", "/images/payments/visa.png"],
  ["PayPal", "/images/payments/paypal.png"],
  ["eSewa", "/images/payments/esewa.png"],
  ["Khalti", "/images/payments/khalti.png"],
  ["Bank Transfer", "/images/payments/bank.png"],
];
const fields = {
  "Credit / Debit Card": ["Card Number", "Cardholder Name", "Expiry Month", "Expiry Year", "CVV", "Email", "Phone Number", "Billing ZIP Code", "Voucher Code"],
  PayPal: ["Email", "Password", "Phone Number"],
  eSewa: ["eSewa ID", "Registered Phone Number", "MPIN", "Voucher Code"],
  Khalti: ["Khalti ID", "Phone Number", "MPIN", "Promo Code"],
  "Bank Transfer": ["Account Holder", "Account Number", "Branch", "Reference ID"],
};

function PaymentModal({ amount, onClose, onSuccess }) {
  const [method, setMethod] = useState("");
  const [processing, setProcessing] = useState(false);
  const [bank, setBank] = useState("Nabil Bank");
  const submit = (event) => { event.preventDefault(); setProcessing(true); window.setTimeout(() => { setProcessing(false); onSuccess(method); }, 900); };
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-green-950/70 p-4"><div className="my-6 w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">{!method ? <MethodPicker amount={amount} onClose={onClose} choose={setMethod} /> : <form onSubmit={submit} className="w-full"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Secure payment</p><h2 className="mt-2 font-display text-3xl font-semibold text-green-950">{method}</h2><p className="mt-2 text-sm text-slate-500">Payable amount: <strong className="text-green-900">NPR {amount.toLocaleString()}</strong></p></div><button type="button" onClick={onClose} aria-label="Close payment" className="rounded-full p-2 text-slate-400 hover:bg-stone-100"><X /></button></div><div className="mt-6 flex items-center justify-between rounded-xl bg-stone-50 p-4 text-sm font-semibold"><span className="flex items-center gap-2"><CreditCard size={17} /> Simulated gateway</span>{method === "Credit / Debit Card" && <span className="flex gap-2"><img src="/images/payments/visa.png" alt="Visa" className="h-5 w-9 object-contain" /><img src="/images/payments/mastercard.png" alt="Mastercard" className="h-5 w-9 object-contain" /></span>}</div>{method === "Bank Transfer" && <select value={bank} onChange={(event) => setBank(event.target.value)} className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3"><option>Nabil Bank</option><option>Global IME</option><option>NIC Asia</option><option>Siddhartha Bank</option><option>Kumari Bank</option><option>Everest Bank</option><option>Machhapuchhre Bank</option></select>}<div className="mt-5 grid gap-3 sm:grid-cols-2">{fields[method].map((label) => <input required key={label} type={label === "Email" ? "email" : label === "Password" || label === "MPIN" ? "password" : "text"} placeholder={label} className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-700" />)}</div><label className="mt-5 flex items-center gap-3 text-sm text-slate-500"><input type="checkbox" className="accent-green-900" /> Remember this payment method</label><button disabled={processing} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-green-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-60">{processing ? <><LoaderCircle size={17} className="animate-spin" /> Processing payment...</> : `Pay NPR ${amount.toLocaleString()} securely`}</button><button type="button" onClick={() => setMethod("")} className="mt-4 w-full text-sm text-slate-500">Choose another method</button></form>}</div></div>;
}

function MethodPicker({ amount, onClose, choose }) {
  return <><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">Secure simulation</p><h2 className="mt-2 font-display text-3xl font-semibold text-green-950">Choose payment method</h2><p className="mt-2 text-sm text-slate-500">Amount payable: <strong className="text-green-900">NPR {amount.toLocaleString()}</strong></p></div><button onClick={onClose} aria-label="Close payment" className="rounded-full p-2 text-slate-400 hover:bg-stone-100"><X /></button></div><div className="mt-7 grid gap-3 sm:grid-cols-2">{methods.map(([name, logo]) => <button key={name} onClick={() => choose(name)} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:-translate-y-0.5 hover:border-green-700 hover:shadow-md"><div className="grid h-12 w-16 place-items-center rounded-xl bg-stone-50 p-2"><img src={logo} alt={`${name} logo`} className="max-h-full max-w-full object-contain" /></div><span className="text-sm font-bold text-slate-800">{name}</span></button>)}</div><button onClick={onClose} className="mt-6 text-sm text-slate-500">Cancel</button></>;
}

export default PaymentModal;
