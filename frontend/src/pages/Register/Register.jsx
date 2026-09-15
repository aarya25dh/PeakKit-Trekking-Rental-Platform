import { ArrowRight, Mountain } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/api";

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!formData.email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      setErrorMessage("Please enter your phone number.");
      return;
    }
    if (!formData.password) {
      setErrorMessage("Please enter a password.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (!formData.agreeTerms) {
      setErrorMessage("Please agree to the PeakKit terms and privacy policy.");
      return;
    }

    // Split name into first and last name
    const nameParts = formData.fullName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || nameParts[0];

    setSubmitting(true);
    try {
      const response = await authAPI.register({
        first_name: firstName,
        last_name: lastName,
        email: formData.email.trim(),
        phone_number: formData.phoneNumber.trim(),
        password: formData.password,
        confirm_password: formData.confirmPassword,
      });

      // Save tokens and user in context & localStorage
      login(response.data);

      toast.success("Account created successfully!");

      // Redirect to homepage without page reload
      navigate("/");
    } catch (err) {
      let msg = "Registration failed. Please check your information.";
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === "string") {
          msg = data;
        } else if (data.email) {
          msg = Array.isArray(data.email) ? data.email[0] : data.email;
        } else if (data.phone_number) {
          msg = Array.isArray(data.phone_number)
            ? data.phone_number[0]
            : data.phone_number;
        } else if (data.password) {
          msg = Array.isArray(data.password) ? data.password[0] : data.password;
        } else if (data.confirm_password) {
          msg = Array.isArray(data.confirm_password)
            ? data.confirm_password[0]
            : data.confirm_password;
        } else if (data.detail) {
          msg = data.detail;
        } else if (data.message) {
          msg = data.message;
        } else {
          // Flatten first field error
          const firstKey = Object.keys(data)[0];
          if (firstKey && data[firstKey]) {
            const val = data[firstKey];
            msg = `${firstKey.replace("_", " ")}: ${
              Array.isArray(val) ? val[0] : val
            }`;
          }
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
      {/* Left: hero image panel — mirrors Login page */}
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
              Join the community
            </p>
            <h1 className="mt-4 font-display text-5xl font-semibold">
              Make room for more mountains.
            </h1>
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex items-center justify-center px-5 py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-green-900">
            <Mountain />
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            Join PeakKit
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-green-950">
            Create your account.
          </h1>
          <p className="mt-3 text-slate-500">Save gear, build kits, reach new summits.</p>

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="mt-8 grid gap-4">
            <input
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full name"
              required
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-800"
            />
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
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Phone number"
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
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              required
              className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-green-800"
            />
            <label className="flex items-start gap-3 text-sm text-slate-500">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                className="mt-1 accent-green-900"
              />{" "}
              I agree to the PeakKit terms and privacy policy.
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-full bg-green-900 px-5 py-3 font-bold text-white transition hover:bg-green-800 disabled:opacity-50"
            >
              {submitting ? "Creating account..." : "Create account"}{" "}
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
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-green-900">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default Register;
