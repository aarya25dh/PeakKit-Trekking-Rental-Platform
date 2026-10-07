import { useState, useRef, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  CalendarCheck,
  Users,
  Truck,
  RotateCcw,
  BarChart3,
  FileSpreadsheet,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Mountain,
  ShieldCheck,
  Download,
  TrendingUp,
  Globe,
  Sparkles,
  ChevronDown,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../services/api";
import toast from "react-hot-toast";
import SEO from "../components/common/SEO";

const navItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Orders", path: "/admin/orders", icon: ShoppingBag },
  { name: "Inventory", path: "/admin/inventory", icon: Package },
  { name: "Reservations", path: "/admin/reservations", icon: CalendarCheck },
  { name: "Customers", path: "/admin/customers", icon: Users },
  { name: "Delivery Partners", path: "/admin/delivery", icon: Truck },
  { name: "Returns & Damage", path: "/admin/returns", icon: RotateCcw },
  { name: "Analytics", path: "/admin/analytics", icon: BarChart3 },
  { name: "Marketing & GA4", path: "/admin/marketing", icon: TrendingUp },
  { name: "SEO Health", path: "/admin/seo-health", icon: Globe },
  { name: "Recommendations", path: "/admin/recommendations", icon: Sparkles },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [exporting, setExporting] = useState("");

  const dropdownRef = useRef(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    try {
      await logout();
      toast.success("Signed out of Admin Portal");
      navigate("/admin/login");
    } catch {
      navigate("/admin/login");
    }
  };

  const handleExport = async (type, filename) => {
    try {
      setExporting(type);
      await adminAPI.downloadCsv(type, filename);
      toast.success(`${type.toUpperCase()} exported successfully`);
    } catch {
      toast.error(`Failed to export ${type}`);
    } finally {
      setExporting("");
    }
  };

  const currentTitle =
    navItems.find((item) => location.pathname.startsWith(item.path))?.name ||
    (location.pathname === "/admin/profile" ? "Admin Profile" : "Admin Portal");

  return (
    <div className="flex min-h-screen bg-stone-100/70 text-slate-900">
      <SEO
        title={currentTitle}
        description="PeakKit Staff Administrator Operations"
        canonical={location.pathname}
        noIndex={true}
      />
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-stone-200/80 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-stone-100 px-6">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-900 text-amber-300 shadow-md shadow-green-950/15">
              <Mountain className="h-6 w-6" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-green-950">
                PeakKit
              </span>
              <div className="flex items-center gap-1.5">
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  Admin Portal
                </span>
              </div>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-xl p-2 text-slate-400 hover:bg-stone-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Operations
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path === "/admin/seo-health" &&
                (location.pathname === "/admin/seo" ||
                  location.pathname === "/admin/seo-ranking" ||
                  location.pathname === "/admin/seo-health"));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-green-900 text-white shadow-md shadow-green-950/20"
                    : "text-slate-600 hover:bg-stone-100 hover:text-green-950"
                }`}
              >
                <Icon
                  size={19}
                  className={`transition-colors ${
                    isActive ? "text-amber-300" : "text-slate-400 group-hover:text-green-900"
                  }`}
                />
                {item.name}
              </NavLink>
            );
          })}

          <div className="pt-5">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Data & Tools
            </p>
            <button
              onClick={() => {
                setCsvModalOpen(true);
                setMobileOpen(false);
              }}
              className="mt-1.5 flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-stone-100 hover:text-green-950"
            >
              <FileSpreadsheet size={19} className="text-slate-400" />
              CSV Exports
            </button>
            <Link
              to="/"
              target="_blank"
              className="mt-1 flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-stone-100 hover:text-green-950"
            >
              <ExternalLink size={19} className="text-slate-400" />
              View Customer Store
            </Link>
          </div>
        </nav>

        {/* Admin User Footer Card */}
        <div className="border-t border-stone-100 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-stone-50 border border-stone-200/60 p-3">
            <Link
              to="/admin/profile"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-900 font-display font-bold text-white shadow-xs hover:opacity-90 transition"
              title="View Profile"
            >
              {user?.first_name ? user.first_name[0].toUpperCase() : "A"}
            </Link>
            <Link to="/admin/profile" className="min-w-0 flex-1 group">
              <p className="truncate text-xs font-bold text-green-950 group-hover:underline">
                {user?.first_name} {user?.last_name || "(Staff)"}
              </p>
              <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
            </Link>
            <button
              onClick={handleLogout}
              title="Logout"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-red-600"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-stone-200/80 bg-white/95 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl border border-stone-200 p-2 text-slate-600 hover:bg-stone-50 lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight text-green-950">
                {currentTitle}
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                PeakKit Operations & Equipment Rental Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCsvModalOpen(true)}
              className="hidden items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-stone-100 md:flex"
            >
              <Download size={14} />
              Export Data
            </button>

            <div className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 sm:flex">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Verified Staff</span>
            </div>

            {/* Clickable Profile Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                aria-label="Admin account menu"
                aria-haspopup="true"
                aria-expanded={profileDropdownOpen}
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 p-1.5 pr-2.5 transition hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-green-800/30"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-900 font-display text-xs font-bold text-white shadow-xs">
                  {user?.first_name ? user.first_name[0].toUpperCase() : "A"}
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-500 transition-transform duration-200 ${
                    profileDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-stone-200/90 bg-white p-2 shadow-xl shadow-stone-200/70 animate-in fade-in zoom-in-95 duration-100">
                  {/* Account Header */}
                  <div className="border-b border-stone-100 px-3.5 py-3">
                    <p className="font-display text-sm font-bold text-green-950 truncate">
                      {user?.first_name} {user?.last_name || "Admin"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900">
                        <ShieldCheck size={11} /> Staff Administrator
                      </span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate("/admin/profile");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-stone-100 hover:text-green-950"
                    >
                      <User size={15} className="text-slate-500" />
                      Profile & Settings
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <LogOut size={15} className="text-red-500" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* CSV Export Modal */}
      {csvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-green-900">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-green-950">
                    Export PostgreSQL Data
                  </h3>
                  <p className="text-xs text-slate-500">Download formatted CSV reports</p>
                </div>
              </div>
              <button
                onClick={() => setCsvModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-stone-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-2.5">
              {[
                { type: "orders", label: "Orders Directory (CSV)", desc: "All customer rental orders" },
                { type: "rentals", label: "Active Rentals Schedule", desc: "Current rental bookings & return dates" },
                { type: "customers", label: "Customer Base & Spend", desc: "User stats, phone, and lifetime spend" },
                { type: "inventory", label: "Equipment Inventory List", desc: "SKU catalog, stock counts & conditions" },
              ].map((item) => (
                <button
                  key={item.type}
                  disabled={exporting === item.type}
                  onClick={() => handleExport(item.type, `${item.type}_export_${new Date().toISOString().slice(0,10)}.csv`)}
                  className="flex w-full items-center justify-between rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5 text-left transition hover:border-green-800 hover:bg-white disabled:opacity-50"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.label}</p>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                  </div>
                  <Download size={16} className="text-green-900" />
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setCsvModalOpen(false)}
                className="rounded-full border border-stone-200 px-5 py-2 text-xs font-bold text-slate-600 hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
