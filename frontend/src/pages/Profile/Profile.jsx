import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "react-hot-toast";
import PageHero from "../../components/common/PageHero";
import { HERO_IMAGES } from "../../data/imagePaths";
import { profileAPI } from "../../services/api";

function Profile() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    address: "",
    city: "",
    province: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await profileAPI.get();
      if (res.data) {
        setFormData({
          first_name: res.data.first_name || "",
          last_name: res.data.last_name || "",
          email: res.data.email || "",
          phone_number: res.data.phone_number || "",
          address: res.data.address || "",
          city: res.data.city || "",
          province: res.data.province || "",
        });
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        address: formData.address,
        city: formData.city,
        province: formData.province,
      };
      await profileAPI.update(payload);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="bg-[#f9fafb] pb-24">
      <PageHero
        image={HERO_IMAGES.langtang}
        breadcrumb="PEAKKIT / MEMBER PROFILE"
        title="Your PeakKit Profile"
        subtitle="Manage your personal details, verified trekking credentials, and expedition delivery addresses."
      />

      <div className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
        {loading ? (
          <div className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 space-y-8"
          >
            {/* Header / Avatar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-900 font-display font-bold text-xl shadow-inner">
                  {(formData.first_name?.[0] || "A") +
                    (formData.last_name?.[0] || "D")}
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-green-950">
                    {formData.first_name} {formData.last_name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Verified PeakKit Trekker Member</span>
                  </p>
                </div>
              </div>

              <Link
                to="/rentals"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <span>View Order History →</span>
              </Link>
            </div>

            {/* Form Fields Grid */}
            <div className="grid gap-6 sm:grid-cols-2">
              {/* First Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  placeholder="First name"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-green-800 focus:ring-2 focus:ring-green-800/10"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  placeholder="Last name"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-green-800 focus:ring-2 focus:ring-green-800/10"
                />
              </div>

              {/* Email Address (Read-Only) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Email Address (Account ID)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    className="w-full rounded-2xl border border-slate-200 bg-stone-100/70 px-4 py-3 pl-10 text-sm font-medium text-slate-500 outline-none cursor-not-allowed"
                  />
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-3.5 text-slate-400"
                  />
                  <Lock
                    size={13}
                    className="absolute right-3.5 top-4 text-slate-400"
                  />
                </div>
              </div>

              {/* Phone Number (Read-Only) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Registered Mobile / WhatsApp
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    readOnly
                    className="w-full rounded-2xl border border-slate-200 bg-stone-100/70 px-4 py-3 pl-10 text-sm font-medium text-slate-500 outline-none cursor-not-allowed"
                  />
                  <Phone
                    size={16}
                    className="absolute left-3.5 top-3.5 text-slate-400"
                  />
                  <Lock
                    size={13}
                    className="absolute right-3.5 top-4 text-slate-400"
                  />
                </div>
              </div>

              {/* Street Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Primary Delivery Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g. House 42, Gairidhara Road"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 pl-10 text-sm font-medium text-slate-800 outline-none transition focus:border-green-800 focus:ring-2 focus:ring-green-800/10"
                  />
                  <MapPin
                    size={16}
                    className="absolute left-3.5 top-3.5 text-slate-400"
                  />
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Kathmandu"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-green-800 focus:ring-2 focus:ring-green-800/10"
                />
              </div>

              {/* Province */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Province
                </label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  placeholder="e.g. Bagmati"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-green-800 focus:ring-2 focus:ring-green-800/10"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end border-t border-slate-100 pt-6">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-green-900 px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-green-800 disabled:opacity-50"
              >
                <Save size={16} />
                <span>{saving ? "Saving Changes..." : "Save Profile"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

export default Profile;
