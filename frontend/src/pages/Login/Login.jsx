import { ArrowRight, Mountain, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";
import SEO from "../../components/common/SEO";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get("redirect") || searchParams.get("next");

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

      // REJECT ADMIN / STAFF CREDENTIALS ON CUSTOMER PORTAL
      if (userObj?.is_staff || userObj?.is_superuser) {
        if (typeof logout === "function") {
          await logout();
        }
        const adminMsg = "Staff and administrator accounts must log in via the Staff Portal (/admin/login).";
        setErrorMessage(adminMsg);
        toast.error(adminMsg);
        return;
      }

      // Save tokens and user in context & localStorage
      login(response.data);

      const name = userObj?.first_name || "adventurer";
      toast.success(`Welcome back, ${name}!`);

      // Normal customer login lands on customer website or intended redirect
      if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("/admin")) {
        navigate(redirectParam);
      } else {
        navigate("/");
      }
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
    <main className="grid min-h-[680px] lg:grid-cols-2">
      <SEO
        title="Log In"
        description="Sign in to your PeakKit account to manage gear rentals, tracking, and reservations."
        canonical="/login"
        noIndex={true}
      />
      <div className="relative hidden overflow-hidden bg-green-950 lg:block">
        <img
          src="/images/hero/hero-everest.jpg"
          alt="Mountain trail in Nepal"
          className="h-full w-full object-cover opacity-60"
          onError={(event) => {
            event.currentTarget.style.opacity = "0";
          }}
        />
        <div className="absolute inset-0 bg-green-950/40 p-12 text-white">
          <Link to="/" className="font-display text-2xl font-bold">
            PEAKKIT
          </Link>
          <div className="absolute bottom-14 max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
              Expedition Portal
            </p>
            <h2 className="mt-4 font-display text-5xl font-semibold">
              Ready for your next Himalayan summit.
            </h2>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-16 sm:px-12">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-stone-200/80 bg-white p-8 shadow-xl shadow-stone-200/50 sm:p-10">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-green-900 text-amber-300 shadow-sm">
                <Mountain size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-700">
                  Member Portal
                </p>
                <h1 className="font-display text-2xl font-bold text-green-950 sm:text-3xl">
                  Welcome back.
                </h1>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Sign in to manage your rentals, saved gear, and expeditions.
            </p>

            {errorMessage && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-800 focus:bg-white focus:ring-2 focus:ring-green-800/20"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs font-semibold text-green-800 hover:text-green-950 hover:underline transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-800 focus:bg-white focus:ring-2 focus:ring-green-800/20"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-green-900 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-green-950/15 transition hover:bg-green-800 active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? "Signing in..." : "Continue with Email"}{" "}
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-stone-50 transition"
              >
                Continue with Google
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-slate-500">
              New explorer?{" "}
              <Link to="/register" className="font-bold text-green-900 hover:underline">
                Create an account
              </Link>
            </p>
          </form>

          {/* Administrator Access Card */}
          <div className="mt-6 rounded-3xl border border-stone-200/80 bg-stone-50/90 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
                <ShieldCheck size={20} className="text-amber-800" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-green-950">
                  Staff & Administrator Access
                </h3>
                <p className="text-[11px] text-slate-500 truncate">
                  Manage inventory, rental orders & logistics.
                </p>
              </div>
            </div>
            <Link
              to="/admin/login"
              className="mt-3.5 flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-green-950 shadow-2xs transition hover:border-green-800 hover:bg-stone-50 group"
            >
              <span>Sign In to Admin Portal</span>
              <ArrowRight
                size={14}
                className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-green-900"
              />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Login;
