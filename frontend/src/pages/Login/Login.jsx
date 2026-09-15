import { ArrowRight, Mountain } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

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

      // Save tokens and user in context & localStorage
      login(response.data);

      const name = response.data?.user?.first_name || "adventurer";
      toast.success(`Welcome back, ${name}!`);

      // Redirect to homepage without page reload
      navigate("/");
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
              Welcome back to the trail
            </p>
            <h1 className="mt-4 font-display text-5xl font-semibold">
              Your next adventure is closer than you think.
            </h1>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-green-900">
            <Mountain />
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            Member login
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-green-950">
            Welcome back.
          </h1>
          <p className="mt-3 text-slate-500">Pick up where you left off.</p>

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="mt-8 grid gap-4">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              required
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-800"
            />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-800"
            />
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm font-semibold text-green-800"
              >
                Forgot password?
              </button>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-full bg-green-900 px-5 py-3 font-bold text-white transition hover:bg-green-800 disabled:opacity-50"
            >
              {submitting ? "Logging in..." : "Continue with email"}{" "}
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700"
            >
              Continue with Google
            </button>
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            New to PeakKit?{" "}
            <Link to="/register" className="font-bold text-green-900">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default Login;
