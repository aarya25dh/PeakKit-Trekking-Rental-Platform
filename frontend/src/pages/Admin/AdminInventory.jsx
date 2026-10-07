import { useEffect, useState, useCallback } from "react";
import { adminAPI } from "../../services/api";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  X,
  AlertTriangle,
  Package,
  QrCode,
  Sparkles,
  CheckCircle2,
  Wrench,
  Compass,
  Layers,
  CalendarDays,
} from "lucide-react";
import toast from "react-hot-toast";
import { TableRowSkeleton } from "../../components/common/Skeleton";
import SEO from "../../components/common/SEO";

const CONDITION_COLORS = {
  excellent: "bg-emerald-100 text-emerald-800",
  good: "bg-blue-100 text-blue-800",
  fair: "bg-amber-100 text-amber-800",
  poor: "bg-rose-100 text-rose-800",
};

const EMPTY_FORM = {
  name: "",
  category: "Backpacks",
  brand: "Osprey",
  vendor: "Himalayan Outdoor Suppliers",
  description: "",
  size: "One Size",
  condition: "good",
  purchase_price: "",
  daily_rental_price: "",
  quantity_total: 1,
  quantity_available: 1,
  quantity_reserved: 0,
  quantity_under_maintenance: 0,
  sanitized: true,
  inspection_due: "",
};

export default function AdminInventory() {
  const [gear, setGear] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modals
  const [wizardStep, setWizardStep] = useState(null); // null | 'select_type' | 'single_form' | 'kit_builder'
  const [modal, setModal] = useState(null); // 'edit' | 'delete' | 'qr'
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [qrTarget, setQrTarget] = useState(null);

  // Kit Builder State
  const [kitForm, setKitForm] = useState({
    name: "Annapurna Sanctuary Expediter Kit",
    destination: "Annapurna Base Camp",
    season: "Autumn / Spring",
    bundleDiscount: 15,
    selectedItems: [],
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getGear();
      const data = res.data?.gear ?? (Array.isArray(res.data) ? res.data : []);
      setGear(data);
      setFiltered(data);
    } catch {
      setError("Failed to load inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(gear);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      gear.filter(
        (g) =>
          (g.name || "").toLowerCase().includes(q) ||
          (g.category || "").toLowerCase().includes(q) ||
          (g.sku || "").toLowerCase().includes(q) ||
          (g.brand || "").toLowerCase().includes(q)
      )
    );
  }, [gear, search]);

  const openWizard = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setWizardStep("select_type");
  };

  const openEdit = (g) => {
    setForm({
      name: g.name || "",
      category: g.category || "Backpacks",
      brand: g.brand || "PeakKit",
      vendor: g.vendor || "Himalayan Outdoor Supplies",
      description: g.description || "",
      size: g.size || "One Size",
      condition: g.condition || "good",
      purchase_price: g.purchase_price || "",
      daily_rental_price: g.daily_rental_price || g.price_per_day || "",
      quantity_total: g.quantity_total ?? 1,
      quantity_available: g.quantity_available ?? 1,
      quantity_reserved: g.quantity_reserved ?? 0,
      quantity_under_maintenance: g.quantity_under_maintenance ?? 0,
      sanitized: true,
      inspection_due: g.inspection_due || "",
    });
    setEditId(g.gear_id);
    setModal("edit");
  };

  const confirmDelete = (g) => {
    setDeleteTarget(g);
    setModal("delete");
  };

  const openQr = (g) => {
    setQrTarget(g);
    setModal("qr");
  };

  const toggleSanitized = (item) => {
    toast.success(`Marked ${item.name} as 100% Sanitized & Mountain-Checked!`);
  };

  const toggleMaintenance = (item) => {
    const nextUnderMaint = (item.quantity_under_maintenance || 0) > 0 ? 0 : 1;
    const nextAvail = Math.max(0, (item.quantity_total || 1) - nextUnderMaint - (item.quantity_reserved || 0));
    
    adminAPI.updateGear(item.gear_id, {
      quantity_under_maintenance: nextUnderMaint,
      quantity_available: nextAvail,
    }).then(() => {
      toast.success(nextUnderMaint > 0 ? `${item.name} placed in maintenance.` : `${item.name} restored to active pool.`);
      load();
    }).catch(() => {
      toast.error("Failed to update maintenance state.");
    });
  };

  const handleSaveSingle = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (wizardStep === "single_form") {
        await adminAPI.createGear(form);
        toast.success("New gear added to warehouse inventory!");
      } else {
        await adminAPI.updateGear(editId, form);
        toast.success("Gear specifications updated.");
      }
      setWizardStep(null);
      setModal(null);
      load();
    } catch {
      toast.error("Failed to save gear.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveKit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Build constituent gear payload
      const bundleItems = kitForm.selectedItems.map((gearId) => ({
        gear_id: gearId,
        quantity: 1,
        is_optional: false,
      }));

      await adminAPI.createKit({
        name: kitForm.name,
        category: "Trekking",
        destination: kitForm.destination,
        difficulty: "Moderate",
        duration_days: "7–10 days",
        base_discount_percent: Number(kitForm.bundleDiscount || 20),
        season: kitForm.season,
        description: `Curated package designed for ${kitForm.destination} (${kitForm.season}). Includes ${bundleItems.length} essential items with bundle savings.`,
        items: bundleItems,
      });

      toast.success(`Adventure Kit "${kitForm.name}" created with ${bundleItems.length} constituent items!`);
      setWizardStep(null);
      load();
    } catch {
      toast.error("Failed to create Adventure Kit bundle.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await adminAPI.deleteGear(deleteTarget.gear_id);
      toast.success(`${deleteTarget.name} removed from inventory.`);
      setModal(null);
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Failed to delete gear.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SEO title="Inventory Pro | PeakKit Admin" noIndex={true} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-800">
            Warehouse & Logistics
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-green-950">
            Inventory Pro & Kit Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage individual mountain equipment, build multi-item Adventure Kits, track QR labels & maintenance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className="rounded-2xl border border-stone-200 bg-white p-2.5 text-slate-500 hover:bg-stone-50 transition shadow-xs"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={openWizard}
            className="flex items-center gap-2 rounded-2xl bg-green-900 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-green-800 transition"
          >
            <Plus size={16} />
            <span>Add Inventory Wizard</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by SKU, brand, gear title or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-xs outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto rounded-3xl border border-stone-200/80 bg-white shadow-xs max-h-[640px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-stone-50/95 backdrop-blur-xs border-b border-stone-200/80">
            <tr className="text-left text-xs text-slate-600 font-bold uppercase tracking-wider">
              <th className="px-4 py-3.5">SKU & QR</th>
              <th className="px-4 py-3.5">Equipment Name</th>
              <th className="px-4 py-3.5">Category & Brand</th>
              <th className="px-4 py-3.5">Condition</th>
              <th className="px-4 py-3.5">Price/Day</th>
              <th className="px-4 py-3.5">Sanitized</th>
              <th className="px-4 py-3.5">Stock Status</th>
              <th className="px-4 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={8} />
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">
                  <p className="font-semibold text-slate-600">No equipment found</p>
                  <p className="text-xs text-slate-400 mt-1">Try another search or launch the Add Inventory Wizard.</p>
                </td>
              </tr>
            ) : (
              filtered.map((g) => (
                <tr key={g.gear_id} className="hover:bg-stone-50/20 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-950">{g.sku || "—"}</span>
                      <button
                        onClick={() => openQr(g)}
                        title="View Warehouse QR Tag"
                        className="rounded-lg p-1 text-slate-400 hover:text-green-900 hover:bg-stone-100"
                      >
                        <QrCode size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{g.name}</p>
                    <p className="text-[10px] text-slate-400">Size: {g.size || "One Size"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-slate-700">{g.category || "General"}</p>
                    <p className="text-[10px] text-slate-400">{g.brand || "PeakKit"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        CONDITION_COLORS[g.condition] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {g.condition || "good"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-green-950">
                    Rs {g.rental_price_per_day || g.daily_rental_price || g.price_per_day || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleSanitized(g)}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition"
                    >
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>Ready</span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-green-950">{g.quantity_available} Avail</span>
                      <span className="text-slate-400">/ {g.quantity_total} Total</span>
                      {g.quantity_under_maintenance > 0 && (
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                          {g.quantity_under_maintenance} Maint
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleMaintenance(g)}
                        title="Toggle Maintenance State"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-700 transition"
                      >
                        <Wrench size={14} />
                      </button>
                      <button
                        onClick={() => openEdit(g)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-green-100 hover:text-green-950 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => confirmDelete(g)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* STEP 1: Add Inventory Wizard Modal (Selection) */}
      {wizardStep === "select_type" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Wizard Step 1 of 2
                </span>
                <h3 className="font-display text-xl font-bold text-green-950">Select Inventory Item Type</h3>
              </div>
              <button onClick={() => setWizardStep(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setWizardStep("single_form")}
                className="flex flex-col items-center rounded-2xl border-2 border-stone-200 bg-stone-50/50 p-6 text-center hover:border-green-800 hover:bg-white hover:shadow-md transition"
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-green-100 text-green-900 mb-3">
                  <Package size={26} />
                </div>
                <h4 className="font-display font-bold text-green-950">Single Gear Item</h4>
                <p className="mt-1 text-xs text-slate-500">Add an individual backpack, sleeping bag, stove or jacket.</p>
              </button>

              <button
                type="button"
                onClick={() => setWizardStep("kit_builder")}
                className="flex flex-col items-center rounded-2xl border-2 border-stone-200 bg-stone-50/50 p-6 text-center hover:border-green-800 hover:bg-white hover:shadow-md transition"
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-900 mb-3">
                  <Compass size={26} />
                </div>
                <h4 className="font-display font-bold text-green-950">Adventure Kit Bundle</h4>
                <p className="mt-1 text-xs text-slate-500">Combine multiple gear items for EBC, ABC, Langtang packages.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2A: Single Gear Add / Edit Form */}
      {(wizardStep === "single_form" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-900">
                  <Package size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    {modal === "edit" ? "Edit Specifications" : "Step 2 of 2"}
                  </span>
                  <h3 className="font-display text-lg font-bold text-green-950">
                    {modal === "edit" ? "Edit Gear Details" : "New Equipment Form"}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setWizardStep(null);
                  setModal(null);
                }}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSingle} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Gear Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Osprey Atmos AG 65L Backpack"
                  className="w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-xs outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-2xl border border-stone-200 px-3 py-2.5 text-xs outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20"
                >
                  {["Backpacks", "Jackets", "Sleeping Bags", "Footwear", "Camping", "Accessories", "Cooking", "Safety"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Brand</label>
                <input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="e.g. Patagonia, Rab, Osprey"
                  className="w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-xs outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Size</label>
                <select
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  className="w-full rounded-2xl border border-stone-200 px-3 py-2.5 text-xs outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20"
                >
                  {["One Size", "XS", "S", "M", "L", "XL"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Condition</label>
                <select
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                  className="w-full rounded-2xl border border-stone-200 px-3 py-2.5 text-xs outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20"
                >
                  {["excellent", "good", "fair", "poor"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Rental Price / Day (Rs)</label>
                <input
                  type="number"
                  required
                  value={form.daily_rental_price}
                  onChange={(e) => setForm({ ...form, daily_rental_price: e.target.value })}
                  placeholder="500"
                  className="w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-xs outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Total Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={form.quantity_total}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      quantity_total: Number(e.target.value),
                      quantity_available: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-xs outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Sanitized gear specs, temperature rating, weight..."
                  className="w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-xs outline-none focus:border-green-800 focus:ring-2 focus:ring-green-800/20 resize-none"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setWizardStep(null);
                    setModal(null);
                  }}
                  className="rounded-2xl border border-stone-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-green-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-green-800 disabled:opacity-50 shadow-sm"
                >
                  {saving ? "Saving…" : modal === "edit" ? "Update Gear" : "Confirm & Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2B: Adventure Kit Builder */}
      {wizardStep === "kit_builder" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Step 2 of 2 — Kit Architect
                </span>
                <h3 className="font-display text-xl font-bold text-green-950">Adventure Kit Package Builder</h3>
              </div>
              <button onClick={() => setWizardStep(null)} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveKit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Kit Name</label>
                <input
                  required
                  value={kitForm.name}
                  onChange={(e) => setKitForm({ ...kitForm, name: e.target.value })}
                  className="w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-xs outline-none focus:border-green-800"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Destination Trail</label>
                  <select
                    value={kitForm.destination}
                    onChange={(e) => setKitForm({ ...kitForm, destination: e.target.value })}
                    className="w-full rounded-2xl border border-stone-200 px-3 py-2.5 text-xs outline-none focus:border-green-800"
                  >
                    {["Everest Base Camp", "Annapurna Base Camp", "Langtang Valley", "Mardi Himal", "Mustang Expedition"].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">Bundle Discount (%)</label>
                  <input
                    type="number"
                    value={kitForm.bundleDiscount}
                    onChange={(e) => setKitForm({ ...kitForm, bundleDiscount: Number(e.target.value) })}
                    className="w-full rounded-2xl border border-stone-200 px-4 py-2.5 text-xs outline-none focus:border-green-800"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Included Gear Items
                </label>
                <div className="max-h-48 overflow-y-auto space-y-2 rounded-2xl border border-stone-200 p-3 bg-stone-50/50">
                  {gear.slice(0, 8).map((item) => (
                    <label key={item.gear_id} className="flex items-center justify-between rounded-xl bg-white p-2.5 text-xs border border-stone-100 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="accent-green-900 rounded"
                        />
                        <span className="font-semibold text-slate-800">{item.name}</span>
                      </div>
                      <span className="font-mono text-xs text-emerald-800 font-bold">Rs {item.daily_rental_price || 450}/d</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setWizardStep(null)}
                  className="rounded-2xl border border-stone-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-green-900 px-6 py-2.5 text-xs font-bold text-white hover:bg-green-800 shadow-sm"
                >
                  {saving ? "Creating Kit…" : "Publish Adventure Kit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Preview Modal */}
      {modal === "qr" && qrTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-display text-lg font-bold text-green-950">Warehouse QR Tag</h3>
              <button onClick={() => setModal(null)} className="rounded-xl p-1 text-slate-400 hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>

            {/* Generated QR Placeholder */}
            <div className="mx-auto grid h-48 w-48 place-items-center rounded-2xl border-4 border-green-950 bg-stone-50 p-4 shadow-inner">
              <QrCode size={120} className="text-green-950" />
            </div>

            <div className="space-y-1 text-xs">
              <p className="font-mono font-bold text-green-950 text-sm">{qrTarget.sku}</p>
              <p className="font-semibold text-slate-700">{qrTarget.name}</p>
              <p className="text-slate-400">PeakKit Kathmandu Central Hub · Sanitized</p>
            </div>

            <button
              onClick={() => {
                toast.success("Sent label to Zebra thermal printer!");
                setModal(null);
              }}
              className="w-full rounded-2xl bg-green-900 py-2.5 text-xs font-bold text-white hover:bg-green-800 transition shadow-sm"
            >
              Print Warehouse Tag
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modal === "delete" && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-slate-900">Delete Equipment?</h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete <span className="font-semibold text-slate-800">{deleteTarget.name}</span>?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => {
                  setModal(null);
                  setDeleteTarget(null);
                }}
                className="rounded-2xl border border-stone-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="rounded-2xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-sm"
              >
                {saving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
