import { useEffect, useState, useCallback } from "react";
import { adminAPI } from "../../services/api";
import { Search, RefreshCw, AlertTriangle, Truck, Pencil, X } from "lucide-react";
import SEO from "../../components/common/SEO";
import toast from "react-hot-toast";
import { TableRowSkeleton } from "../../components/common/Skeleton";

const STATUS_COLORS = {
  available: "bg-emerald-100 text-emerald-700",
  on_delivery: "bg-blue-100 text-blue-700",
  off_duty: "bg-slate-100 text-slate-500",
  suspended: "bg-rose-100 text-rose-700",
};

export default function AdminDelivery() {
  const [partners, setPartners] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editModal, setEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ available: true, vehicle_type: "", phone_number: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getDeliveryPartners();
      // Backend: { count, delivery_partners: [...] }
      // DeliveryPartnerSerializer fields: id, name, phone_number, whatsapp_number, email,
      //   vehicle_type, vehicle_number, available, current_location, rating, total_deliveries, date_joined
      // Plus: assigned_orders_count (added in view)
      const data = res.data?.delivery_partners ?? (Array.isArray(res.data) ? res.data : []);
      setPartners(data);
      setFiltered(data);
    } catch {
      setError("Failed to load delivery partners.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(partners); return; }
    const q = search.toLowerCase();
    setFiltered(partners.filter((p) =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.vehicle_type || "").toLowerCase().includes(q)
    ));
  }, [partners, search]);

  const openEdit = (p) => {
    setEditTarget(p);
    setForm({ available: p.available ?? true, vehicle_type: p.vehicle_type || "", phone_number: p.phone_number || "" });
    setEditModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editTarget) return;
    setSaving(true);
    try {
      await adminAPI.updateDeliveryPartner(editTarget.id, form);
      toast.success("Delivery partner updated.");
      setEditModal(false);
      load();
    } catch {
      toast.error("Failed to update partner.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-green-900 border-t-transparent" />
    </div>
  );
  if (error) return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
      <AlertTriangle className="h-8 w-8 text-amber-500" />
      <p className="text-sm font-semibold text-slate-700">{error}</p>
      <button onClick={load} className="rounded-xl bg-green-900 px-4 py-2 text-xs font-bold text-white">Retry</button>
    </div>
  );

  return (
    <div className="space-y-5">
      <SEO title="Delivery Partners | PeakKit Admin" noIndex={true} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search name, email, vehicle…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20" />
        </div>
        <button onClick={load} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"><RefreshCw size={15} /></button>
      </div>

      {!loading && partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white py-16 text-center shadow-sm">
          <Truck className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm text-slate-400">No delivery partners registered yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-stone-200/80 bg-white shadow-xs max-h-[620px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-xs border-b border-stone-200/80">
              <tr className="text-left text-xs text-slate-600 font-bold uppercase tracking-wider">
                <th className="px-4 py-3.5">Name</th>
                <th className="px-4 py-3.5">Vehicle</th>
                <th className="px-4 py-3.5">Phone</th>
                <th className="px-4 py-3.5">Active Deliveries</th>
                <th className="px-4 py-3.5">Total</th>
                <th className="px-4 py-3.5">Rating</th>
                <th className="px-4 py-3.5">Available</th>
                <th className="px-4 py-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={8} />
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">
                    <p className="font-semibold text-slate-600">No delivery partners found</p>
                    <p className="text-xs text-slate-400 mt-1">Try another search term or refresh.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50/20 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                        {(p.name || "D")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">{p.vehicle_type || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.phone_number || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-950">{p.assigned_orders_count ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.total_deliveries ?? 0}</td>
                  <td className="px-4 py-3 text-slate-600">{p.rating != null ? `${p.rating}/5` : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${p.available ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {p.available ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-green-100 hover:text-green-950 transition"><Pencil size={14} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-slate-400">{filtered.length} partner(s)</p>

      {/* Edit Modal */}
      {editModal && editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"><Truck size={18} /></div>
                <h3 className="font-display text-lg font-bold text-slate-900">Edit Partner: {editTarget.name}</h3>
              </div>
              <button onClick={() => setEditModal(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Vehicle Type</label>
                <input value={form.vehicle_type} onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Phone Number</label>
                <input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="available" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })}
                  className="h-4 w-4 rounded accent-green-900" />
                <label htmlFor="available" className="text-sm text-slate-700">Available for delivery</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditModal(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-green-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
