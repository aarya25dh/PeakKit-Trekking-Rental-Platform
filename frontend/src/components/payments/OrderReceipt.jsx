import { Download, Printer, QrCode } from "lucide-react";
import { toast } from "react-hot-toast";
import { LOGO_IMAGES } from "../../data/imagePaths";

function OrderReceipt({
  orderId = "PK-2026-483920",
  txnId = "TXN-PK-483920",
  customerName = "Aayush Shrestha",
  phone = "+977-9841234567",
  email = "aayush@example.com",
  pickupDate = "18 Sep 2026",
  returnDate = "25 Sep 2026",
  items = [],
  rentalSubtotal = 2400,
  deposits = 5000,
  deliveryFee = 100,
  voucherDiscount = 0,
  grandTotal = 7500,
  paymentMethod = "eSewa",
  address = "Kathmandu, Nepal",
}) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.success(`Downloading PDF receipt for Order #${orderId}...`);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-lg text-slate-800 printable-receipt">
      {/* Receipt Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <div className="flex items-center gap-2">
            <img
              src={LOGO_IMAGES.logo}
              alt="PeakKit"
              className="h-9 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="font-display text-2xl font-bold tracking-tight text-green-950">
              PEAKKIT
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Nepal's Premier Trekking & High-Altitude Equipment Rental
          </p>
          <p className="text-[11px] text-slate-400">
            Thamel Hub #3, Kathmandu · +977-1-4412345 · support@peakkit.np
          </p>
        </div>

        <div className="sm:text-right">
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-900">
            Official Rental Invoice
          </span>
          <p className="mt-3 font-mono text-sm font-bold text-slate-900">
            Order #{orderId}
          </p>
          <p className="font-mono text-xs text-slate-500">
            Txn: {txnId}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Customer & Rental Info Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 rounded-2xl bg-stone-50 p-5 text-xs border border-slate-100">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Customer Details
          </span>
          <strong className="text-sm text-slate-900 block font-semibold">
            {customerName}
          </strong>
          <p className="text-slate-600 mt-0.5">{phone}</p>
          <p className="text-slate-600">{email}</p>
          <p className="text-slate-500 mt-1">{address}</p>
        </div>

        <div className="sm:text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            Rental Schedule & Payment
          </span>
          <p className="text-slate-700">
            Pickup Date: <strong className="text-slate-900 font-semibold">{pickupDate}</strong>
          </p>
          <p className="text-slate-700">
            Return Date: <strong className="text-slate-900 font-semibold">{returnDate}</strong>
          </p>
          <p className="text-slate-700 mt-1">
            Paid via: <strong className="text-green-900 font-bold">{paymentMethod}</strong>
          </p>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200 text-[11px] uppercase text-slate-400 font-bold">
              <th className="py-3">Gear Item Description</th>
              <th className="py-3 text-center">Condition</th>
              <th className="py-3 text-center">Qty</th>
              <th className="py-3 text-right">Daily Rate</th>
              <th className="py-3 text-right">Total (NPR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                <td className="py-3.5 pr-2 font-medium text-slate-900">
                  {item.name}
                  <span className="block text-[11px] text-slate-400 font-normal">
                    {item.brand} · {item.category}
                  </span>
                </td>
                <td className="py-3.5 text-center text-slate-600">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                    {item.condition || "Verified"}
                  </span>
                </td>
                <td className="py-3.5 text-center font-bold text-slate-800">
                  {item.quantity || 1}
                </td>
                <td className="py-3.5 text-right font-mono text-slate-600">
                  Rs. {(item.rentalPrice || 500).toLocaleString()}
                </td>
                <td className="py-3.5 text-right font-mono font-bold text-slate-900">
                  Rs. {((item.rentalPrice || 500) * (item.quantity || 1)).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Breakdown & Totals */}
      <div className="mt-8 flex flex-col sm:flex-row justify-between gap-6 border-t-2 border-slate-200 pt-6">
        {/* QR Code Verification */}
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-stone-50 p-4">
          <div className="grid h-16 w-16 place-items-center rounded-xl bg-white p-1 border border-slate-200 shadow-xs">
            <QrCode size={48} className="text-slate-800" />
          </div>
          <div className="text-xs">
            <span className="block font-bold text-slate-900">
              Verified Digital Receipt
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Scan with PeakKit mobile app for pickup counter check-in.
            </p>
          </div>
        </div>

        {/* Totals Table */}
        <div className="w-full sm:w-72 space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Rental Subtotal:</span>
            <b className="font-mono text-slate-900">Rs. {rentalSubtotal.toLocaleString()}</b>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>Security Deposit:</span>
            <b className="font-mono text-slate-900">Rs. {deposits.toLocaleString()}</b>
          </div>

          <div className="flex justify-between text-slate-600">
            <span>Delivery Fee:</span>
            <b className="font-mono text-slate-900">
              {deliveryFee > 0 ? `Rs. ${deliveryFee.toLocaleString()}` : "Free"}
            </b>
          </div>

          {voucherDiscount > 0 && (
            <div className="flex justify-between text-emerald-700 font-semibold">
              <span>Voucher Savings:</span>
              <b className="font-mono">- Rs. {voucherDiscount.toLocaleString()}</b>
            </div>
          )}

          <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-green-950">
            <span>Total Paid / Due:</span>
            <span className="font-display text-lg text-amber-700">
              Rs. {grandTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Print / Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-6 no-print">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          <Printer size={15} /> Print Receipt
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-full bg-green-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-green-800 transition"
        >
          <Download size={15} /> Download PDF
        </button>
      </div>
    </div>
  );
}

export default OrderReceipt;
