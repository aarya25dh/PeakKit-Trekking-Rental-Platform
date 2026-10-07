import { useEffect, useState, useCallback } from "react";
import { adminAPI } from "../../services/api";
import { Search, RefreshCw, AlertTriangle, RotateCcw, CheckCircle2, X } from "lucide-react";
import SEO from "../../components/common/SEO";
import toast from "react-hot-toast";
import { TableRowSkeleton } from "../../components/common/Skeleton";

const CONDITION_OPTS = ["excellent", "good", "fair", "poor"];

export default function AdminReturns() {
  const [pendingReturns, setPendingReturns] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inspectModal, setInspectModal] = useState(false);
  const [inspectTarget, setInspectTarget] = useState(null);
  const [form, setForm] = useState({ condition_after: "good", damage_notes: "", damage_fee: 0, cleaning_required: false });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getPendingReturns();
      // Backend: { count, pending_returns: [...] } — OrderListSerializer shape
      // Fields: id, order_id, customer_name, destination, order_status, rental_start_date, rental_end_date,
      //         rental_days, return_date, daily_rental_price, payment_status, total_amount
      const data = res.data?.pending_returns ?? (Array.isArray(res.data) ? res.data : []);
      setPendingReturns(data);
      setFiltered(data);
    } catch {
      setError("Failed to load pending returns.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(pendingReturns); return; }
    const q = search.toLowerCase();
    setFiltered(pendingReturns.filter((r) =>
      (r.order_id || "").toLowerCase().includes(q) ||
      (r.customer_name || "").toLowerCase().includes(q) ||
      (r.destination || "").toLowerCase().includes(q)
    ));
  }, [pendingReturns, search]);

  const openInspect = (r) => {
    setInspectTarget(r);
    setForm({ condition_after: "good", damage_notes: "", damage_fee: 0, cleaning_required: false });
    setInspectModal(true);
  };

  const handleInspect = async (e) => {
    e.preventDefault();
    if (!inspectTarget) return;
    setSaving(true);
    try {
      // inspectOrder uses order_id (string like PK-2026-000001)
      await adminAPI.inspectOrder(inspectTarget.order_id, form);
      toast.success(`Inspection saved for ${inspectTarget.order_id}`);
      setInspectModal(false);
      load();
    } catch {
      toast.error("Failed to save inspection.");
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
      <SEO title="Gear Returns | PeakKit Admin" noIndex={true} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search order ID, customer, destination…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20" />
        </div>
        <button onClick={load} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"><RefreshCw size={15} /></button>
      </div>

      {!loading && pendingReturns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white py-20 text-center shadow-sm">
          <CheckCircle2 className="h-12 w-12 text-emerald-300 mb-3" />
          <p className="font-semibold text-slate-700">All caught up!</p>
          <p className="text-sm text-slate-400 mt-1">No overdue returns.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-stone-200/80 bg-white shadow-xs max-h-[620px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-xs border-b border-stone-200/80">
              <tr className="text-left text-xs text-slate-600 font-bold uppercase tracking-wider">
                <th className="px-4 py-3.5">Order ID</th>
                <th className="px-4 py-3.5">Customer</th>
                <th className="px-4 py-3.5">Destination</th>
                <th className="px-4 py-3.5">Return Date</th>
                <th className="px-4 py-3.5">Days</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={7} />
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                    <p className="font-semibold text-slate-600">No returns match your search</p>
                    <p className="text-xs text-slate-400 mt-1">Try another search term or refresh.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                <tr key={r.order_id || i} className="hover:bg-stone-50/20 transition">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-green-950">{r.order_id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{r.customer_name || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.destination || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {r.return_date ? new Date(r.return_date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.rental_days ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-700">{r.order_status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openInspect(r)}
                      className="flex items-center gap-1.5 rounded-xl bg-green-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-800 transition">
                      <RotateCcw size={12} />Inspect
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-slate-400">{filtered.length} return(s) pending</p>

      {/* Inspect Modal */}
      {inspectModal && inspectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><RotateCcw size={18} /></div>
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900">Gear Inspection</h3>
                  <p className="text-xs text-slate-400">{inspectTarget.order_id} · {inspectTarget.customer_name}</p>
                </div>
              </div>
              <button onClick={() => setInspectModal(false)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={handleInspect} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Condition After Return</label>
                <select value={form.condition_after} onChange={(e) => setForm({ ...form, condition_after: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20">
                  {CONDITION_OPTS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Damage Notes</label>
                <textarea rows={3} value={form.damage_notes} onChange={(e) => setForm({ ...form, damage_notes: e.target.value })} placeholder="Describe any damage…"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20 resize-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Damage Fee (Rs)</label>
                <input type="number" min={0} value={form.damage_fee} onChange={(e) => setForm({ ...form, damage_fee: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="cleaning" checked={form.cleaning_required} onChange={(e) => setForm({ ...form, cleaning_required: e.target.checked })}
                  className="h-4 w-4 rounded accent-green-900" />
                <label htmlFor="cleaning" className="text-sm text-slate-700">Cleaning Required</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setInspectModal(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-xl bg-green-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-800 disabled:opacity-50">{saving ? "Saving…" : "Save Inspection"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
