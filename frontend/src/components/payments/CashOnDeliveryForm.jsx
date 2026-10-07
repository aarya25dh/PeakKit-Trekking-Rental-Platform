import { useState, useEffect } from "react";
import { Banknote, Calendar, MapPin, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { PAYMENT_IMAGES } from "../../data/imagePaths";

const deliveryZones = [
  { name: "Inside Kathmandu Ring Road", fee: 100, estimate: "Tomorrow, 2:00 PM - 5:00 PM" },
  { name: "Lalitpur Sub-Metropolitan", fee: 120, estimate: "Tomorrow, 3:00 PM - 6:00 PM" },
  { name: "Outside Ring Road (Kathmandu)", fee: 150, estimate: "Within 24-36 hours" },
  { name: "Kirtipur Area", fee: 150, estimate: "Within 24-36 hours" },
  { name: "Bhaktapur District", fee: 180, estimate: "Within 24-48 hours" },
  { name: "Pokhara Hub Delivery", fee: 450, estimate: "2-3 Days via Express Courier" },
  { name: "Other District in Nepal", fee: 600, estimate: "3-4 Days via Road Express" },
];

function CashOnDeliveryForm({
  amount,
  onDeliveryChange,
  onSuccess,
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Kathmandu");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [postalCode, setPostalCode] = useState("44600");
  const [instructions, setInstructions] = useState("");
  const [selectedZone, setSelectedZone] = useState(deliveryZones[0]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (onDeliveryChange) {
      onDeliveryChange(selectedZone.name, selectedZone.fee);
    }
  }, [selectedZone, onDeliveryChange]);

  const handleZoneChange = (zoneName) => {
    const zone = deliveryZones.find((z) => z.name === zoneName) || deliveryZones[0];
    setSelectedZone(zone);
  };

  const isFormValid =
    fullName.trim().length >= 3 &&
    phone.replace(/\D/g, "").length === 10 &&
    address.trim().length >= 5 &&
    city.trim().length >= 2;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid || processing) return;

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const orderId = `PK-COD-${Math.floor(100000 + Math.random() * 900000)}`;
      onSuccess({
        method: "Cash on Delivery",
        txnId: `COD-DUE-${Date.now().toString().slice(-6)}`,
        orderId,
        customerName: fullName,
        phone,
        deliveryAddress: `${address}, ${area ? area + ", " : ""}${landmark ? "Near " + landmark + ", " : ""}${city} (${postalCode})`,
        zone: selectedZone.name,
        deliveryFee: selectedZone.fee,
        estimatedDelivery: selectedZone.estimate,
        instructions,
        amountDue: amount,
      });
    }, 300);
  };

  return (
    <div className="space-y-6 rounded-3xl border border-orange-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-orange-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-14 items-center justify-center rounded-xl bg-orange-50 p-1.5 border border-orange-200">
            <img
              src={PAYMENT_IMAGES.cod}
              alt="Cash on Delivery"
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <Banknote className="text-orange-600" size={24} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">
              Cash on Delivery (COD)
            </h3>
            <p className="text-xs text-orange-800 font-semibold">
              Pay when your trekking gear arrives
            </p>
          </div>
        </div>

        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-900 border border-orange-200">
          Doorstep Payment
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name & Phone */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Recipient Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Pasang Lhamu Sherpa"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Active Mobile Phone (10 Digits)
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="98XXXXXXXX"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {/* Delivery Zone / Distance Dropdown */}
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Delivery Zone / Destination Area
            </label>
            <span className="text-xs font-bold text-orange-700">
              Delivery Fee: Rs. {selectedZone.fee}
            </span>
          </div>
          <div className="relative mt-1.5">
            <Truck
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              value={selectedZone.name}
              onChange={(e) => handleZoneChange(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
            >
              {deliveryZones.map((z) => (
                <option key={z.name} value={z.name}>
                  {z.name} (Rs. {z.fee})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Street Address */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Street Address / House Number
          </label>
          <div className="relative mt-1.5">
            <MapPin
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House 42, Gairidhara Road"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-orange-600 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        {/* City, Area, Landmark, Postal Code */}
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              City
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Kathmandu"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-600"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Area / Ward
            </label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Ward 1"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-600"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Nearby Landmark
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Opposite Embassy"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-600"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Postal Code
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="44600"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-orange-600"
            />
          </div>
        </div>

        {/* Special instructions */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Delivery Instructions (Optional)
          </label>
          <textarea
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Call upon arrival at the gate, please sanitize gear on delivery."
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-orange-600"
          />
        </div>

        {/* COD Estimate Card */}
        <div className="grid gap-3 sm:grid-cols-2 rounded-2xl bg-orange-50/70 p-4 border border-orange-200">
          <div className="flex items-center gap-2.5">
            <Calendar size={18} className="text-orange-700 shrink-0" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-orange-900">
                Estimated Delivery
              </span>
              <strong className="text-xs font-semibold text-slate-900">
                {selectedZone.estimate}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:border-l sm:border-orange-200 sm:pl-3">
            <Banknote size={18} className="text-orange-700 shrink-0" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-orange-900">
                Cash Due on Delivery
              </span>
              <strong className="text-base font-bold text-green-950">
                Rs. {amount.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* Security badge */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100">
          <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
          <span>Pay with Cash or QR scan upon physical gear receipt & inspection.</span>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!isFormValid || processing}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-4 text-sm font-bold text-white shadow-md transition hover:from-orange-700 hover:to-amber-700 disabled:opacity-50"
        >
          {processing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Confirming Cash on Delivery Order...</span>
            </>
          ) : (
            <>
              <PackageCheck size={18} />
              <span>Place COD Order (Rs. {amount.toLocaleString()})</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default CashOnDeliveryForm;
