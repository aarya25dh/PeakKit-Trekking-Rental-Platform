import { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, ShieldCheck, Calendar, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import SEO from "../../components/common/SEO";
import { useAuth } from "../../context/AuthContext";
import { profileAPI } from "../../services/api";
import toast from "react-hot-toast";

export default function AdminProfile() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
    city: "",
    province: "",
    is_staff: true,
  });

  useEffect(() => {
    profileAPI
      .get()
      .then((res) => {
        if (res.data) {
          setProfileData({
            first_name: res.data.first_name || user?.first_name || "",
            last_name: res.data.last_name || user?.last_name || "",
            email: res.data.email || user?.email || "",
            phone_number: res.data.phone_number || "",
            address: res.data.address || "",
            city: res.data.city || "",
            province: res.data.province || "",
            is_staff: Boolean(res.data.is_staff ?? user?.is_staff),
          });
        }
      })
      .catch(() => {
        // Fallback to auth context
        if (user) {
          setProfileData((prev) => ({
            ...prev,
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            email: user.email || "",
            is_staff: Boolean(user.is_staff),
          }));
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await profileAPI.update({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        address: profileData.address,
        city: profileData.city,
        province: profileData.province,
      });
      if (res.data) {
        updateUser(res.data);
      }
      toast.success("Admin profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEO title="Admin Profile | PeakKit Admin" noIndex={true} />
      {/* Header Banner */}
      <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-green-900 font-display text-2xl font-bold text-white shadow-md shadow-green-950/20">
              {profileData.first_name ? profileData.first_name[0].toUpperCase() : "A"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-green-950">
                  {profileData.first_name} {profileData.last_name || "(Staff)"}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                  <ShieldCheck size={13} />
                  Staff Administrator
                </span>
              </div>
              <p className="text-sm text-slate-500">{profileData.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Editable Personal Details */}
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-lg font-bold text-green-950">
              Personal Information
            </h2>
            <p className="text-xs text-slate-500">
              Update your administrator account details.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  First Name
                </label>
                <input
                  type="text"
                  value={profileData.first_name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, first_name: e.target.value })
                  }
                  required
                  className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-800 focus:bg-white focus:ring-2 focus:ring-green-800/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileData.last_name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, last_name: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-800 focus:bg-white focus:ring-2 focus:ring-green-800/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full cursor-not-allowed rounded-2xl border border-stone-200 bg-stone-100/70 py-3 pl-10 pr-4 text-sm text-slate-500 outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Email is locked as the primary administrator credential.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Phone Number
                </label>
                <div className="relative mt-1.5">
                  <Phone
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={profileData.phone_number || "Not set"}
                    disabled
                    className="w-full cursor-not-allowed rounded-2xl border border-stone-200 bg-stone-100/70 py-3 pl-10 pr-4 text-sm text-slate-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  City
                </label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) =>
                    setProfileData({ ...profileData, city: e.target.value })
                  }
                  placeholder="Kathmandu"
                  className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-800 focus:bg-white focus:ring-2 focus:ring-green-800/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Province
                </label>
                <input
                  type="text"
                  value={profileData.province}
                  onChange={(e) =>
                    setProfileData({ ...profileData, province: e.target.value })
                  }
                  placeholder="Bagmati"
                  className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-800 focus:bg-white focus:ring-2 focus:ring-green-800/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Warehouse / Office Address
                </label>
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) =>
                    setProfileData({ ...profileData, address: e.target.value })
                  }
                  placeholder="Thamel, Kathmandu"
                  className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-800 focus:bg-white focus:ring-2 focus:ring-green-800/20"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-green-900 px-6 py-3 text-sm font-bold text-white shadow-md shadow-green-950/15 transition hover:bg-green-800 disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? "Saving Changes..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Role & System Privileges */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm">
            <h2 className="font-display text-base font-bold text-green-950">
              Staff Privileges
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Role permissions assigned to your staff credential.
            </p>

            <div className="mt-4 space-y-3">
              {[
                ["Inventory Management", "Add, edit, inspect & stock gear"],
                ["Rental Order Control", "Advance status, assign riders"],
                ["Customer Oversight", "Inspect customer history & spend"],
                ["Financial Analytics", "View revenue & export CSVs"],
                ["Damage Inspections", "Assess gear returns & deposits"],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="flex items-start gap-2.5 rounded-2xl bg-stone-50 p-3"
                >
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{title}</p>
                    <p className="text-[11px] text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
