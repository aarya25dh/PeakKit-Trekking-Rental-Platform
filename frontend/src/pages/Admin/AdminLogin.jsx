import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mountain, ArrowRight, ShieldCheck, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import { LOGO_IMAGES } from "../../data/imagePaths";
import SEO from "../../components/common/SEO";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.email || !formData.password) {
      setErrorMessage("Please fill in both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await authAPI.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      const userObj = response.data?.user;

      // STRICT ADMIN PERMISSION CHECK:
      // Only accounts with is_staff === true are permitted to access the admin portal
      if (!userObj?.is_staff) {
        // Clear any token data if set and reject
        await logout();
        const accessDeniedMsg = "Admin access is required to continue.";
        setErrorMessage(accessDeniedMsg);
        toast.error(accessDeniedMsg);
        return;
      }

      // Valid admin credentials
      login(response.data);
      toast.success(`Welcome to PeakKit Admin, ${userObj.first_name || "Admin"}!`);
      navigate("/admin/dashboard");
    } catch (err) {
      let msg = "Invalid email or password.";
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === "string") {
          msg = data;
        } else if (data.detail) {
          msg = data.detail;
        } else if (data.email) {
          msg = Array.isArray(data.email) ? data.email[0] : data.email;
        } else if (data.password) {
          msg = Array.isArray(data.password) ? data.password[0] : data.password;
        } else if (data.non_field_errors) {
          msg = Array.isArray(data.non_field_errors)
            ? data.non_field_errors[0]
            : data.non_field_errors;
        } else if (data.message) {
          msg = data.message;
        }
      }
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100/70 px-4 py-12 sm:px-6 lg:px-8">
      <SEO
        title="Admin Login"
        description="PeakKit Staff Administrator Login"
        canonical="/admin/login"
        noIndex={true}
      />
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-3xl border border-stone-200/80 bg-white p-8 shadow-xl shadow-stone-200/50 sm:p-10">
          {/* Brand Header */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-green-950">
              <img
                src={LOGO_IMAGES.logo}
                alt="PeakKit"
                className="h-10 w-auto object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                  event.currentTarget.nextElementSibling.style.display = "flex";
                }}
              />
              <span className="hidden h-10 w-10 items-center justify-center rounded-2xl bg-green-900 text-white">
                <Mountain size={22} />
              </span>
              <span className="font-display text-2xl font-bold tracking-tight">
                PEAKKIT
              </span>
            </Link>

            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                <ShieldCheck size={14} className="text-amber-700" />
                Staff Portal
              </span>
            </div>

            <h1 className="mt-3 font-display text-2xl font-semibold text-green-950 sm:text-3xl">
              PeakKit Admin
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to manage PeakKit equipment, orders & operations.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700"
            >
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Staff Email
              </label>
              <div className="relative mt-1.5">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="admin-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@peakkit.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-green-800 focus:bg-white focus:ring-2 focus:ring-green-800/20"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="admin-password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50/50 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-green-800 focus:bg-white focus:ring-2 focus:ring-green-800/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-green-900 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-green-950/15 transition hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-800/40 disabled:opacity-50"
            >
              {submitting ? "Authenticating..." : "Sign In to Admin Portal"}{" "}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Back link */}
          <div className="mt-8 border-t border-stone-100 pt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-green-900"
            >
              ← Back to customer login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
