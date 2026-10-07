import { useEffect, useState, useCallback } from "react";
import { adminAPI } from "../../services/api";
import { Search, RefreshCw, AlertTriangle, Users, ChevronRight, X } from "lucide-react";
import { TableRowSkeleton } from "../../components/common/Skeleton";
import SEO from "../../components/common/SEO";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getCustomers();
      // Backend: { count, customers: [{id, name, email, phone, date_joined, total_orders, lifetime_spend, is_staff}] }
      const data = res.data?.customers ?? (Array.isArray(res.data) ? res.data : []);
      setCustomers(data);
      setFiltered(data);
    } catch {
      setError("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(customers); return; }
    const q = search.toLowerCase();
    setFiltered(customers.filter((c) =>
      (c.email || "").toLowerCase().includes(q) ||
      (c.name || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(q)
    ));
  }, [customers, search]);

  const initials = (c) => {
    const parts = (c.name || c.email || "?").split(" ");
    return parts.map((p) => p[0]).slice(0, 2).join("").toUpperCase();
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
    <div className="flex gap-6">
      <SEO title="Customers & Adventurers | PeakKit Admin" noIndex={true} />
      <div className={`flex flex-col flex-1 min-w-0 space-y-5 ${selected ? "lg:max-w-[calc(100%-360px)]" : ""}`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search name, email, phone…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20" />
          </div>
          <button onClick={load} className="rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"><RefreshCw size={15} /></button>
        </div>

        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white py-16 text-center shadow-sm">
            <Users className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">No customers found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-stone-200/80 bg-white shadow-xs max-h-[620px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-xs border-b border-stone-200/80">
                <tr className="text-left text-xs text-slate-600 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5">Phone</th>
                  <th className="px-4 py-3.5">Total Orders</th>
                  <th className="px-4 py-3.5">Lifetime Spend</th>
                  <th className="px-4 py-3.5">Joined</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5" />
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
                      <p className="font-semibold text-slate-600">No customers match your search</p>
                      <p className="text-xs text-slate-400 mt-1">Try another search term or refresh.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                  <tr key={c.id} className={`cursor-pointer transition hover:bg-stone-50/30 ${selected?.id === c.id ? "bg-stone-50" : ""}`} onClick={() => setSelected(c)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-950">{initials(c)}</div>
                        <span className="font-semibold text-slate-800">{c.name || "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.email}</td>
                    <td className="px-4 py-3 text-slate-600">{c.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-950">{c.total_orders ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {c.lifetime_spend != null ? `Rs ${Number(c.lifetime_spend).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.date_joined || "—"}</td>
                    <td className="px-4 py-3">
                      {c.is_staff ? (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">Admin</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">Customer</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><ChevronRight size={16} className="text-slate-300" /></td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-slate-400">{filtered.length} customer(s)</p>
      </div>

      {/* Side Panel */}
      {selected && (
        <div className="hidden lg:flex flex-col w-[340px] shrink-0 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden max-h-[calc(100vh-10rem)]">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 font-bold text-green-950">{initials(selected)}</div>
              <div>
                <p className="font-display font-bold text-slate-900">{selected.name}</p>
                <p className="text-xs text-slate-400">{selected.email}</p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {[
              ["Phone", selected.phone || "—"],
              ["Total Orders", selected.total_orders ?? 0],
              ["Lifetime Spend", selected.lifetime_spend != null ? `Rs ${Number(selected.lifetime_spend).toLocaleString()}` : "—"],
              ["Active Rental", selected.current_rental || "None"],
              ["Joined", selected.date_joined || "—"],
              ["Role", selected.is_staff ? "Admin / Staff" : "Customer"],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="w-28 shrink-0 text-xs font-semibold text-slate-500">{label}</span>
                <span className="text-xs text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
