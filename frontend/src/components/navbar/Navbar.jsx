import {
  Bell,
  CheckCheck,
  Compass,
  Heart,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  Truck,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { LOGO_IMAGES } from "../../data/imagePaths";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { searchAPI } from "../../services/api.js";
import { analytics } from "../../services/analytics.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNotifications } from "../../context/NotificationContext.jsx";

const POPULAR_SEARCHES = [
  "Everest Base Camp Kit",
  "Down Jacket -20°C",
  "Osprey Atmos AG 65L",
  "Langtang Trek",
  "Alpine Tent 2P",
];

const links = [
  ["Explore Gear", "/explore"],
  ["Gear Advisor", "/gear-advisor"],
  ["Adventure Kits", "/adventure-kit"],
  ["Rentals", "/rentals"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Community", "/community"],
];

function CountLink({ to, label, children, count }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="relative shrink-0 rounded-full p-2 text-slate-600 hover:bg-stone-100"
    >
      {children}
      {count > 0 && (
        <b className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-amber-400 px-1 text-[10px] text-green-950">
          {count}
        </b>
      )}
    </Link>
  );
}



function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const { items: cartItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced server-side search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearchOpen(false);
      setSearchLoading(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }
    setSearchLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchAPI.search(q);
        const data = res.data;
        const results = [];
        (data.gear || []).forEach((g) =>
          results.push({ type: "gear", label: g.name, sub: `${g.category} · ${g.brand}`, to: `/product/${g.id}` })
        );
        (data.kits || []).forEach((k) =>
          results.push({ type: "kit", label: k.name, sub: "Adventure Kit", to: k.url || `/adventure-kit/${k.name.toLowerCase().replaceAll(" ", "-")}` })
        );
        (data.categories || []).forEach((c) =>
          results.push({ type: "category", label: c.name, sub: "Browse category", to: c.url || `/explore?category=${encodeURIComponent(c.name)}` })
        );
        (data.destinations || []).forEach((d) =>
          results.push({ type: "destination", label: d.name, sub: "Destination", to: d.url || `/adventure-kit/${d.name.toLowerCase().replaceAll(" ", "-")}` })
        );
        setSearchResults(results.slice(0, 8));
        setSearchOpen(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const typeLabel = { gear: "Gear", kit: "Kit", destination: "Destination", category: "Category" };
  const typeColor = {
    gear: "bg-amber-100 text-amber-800",
    kit: "bg-green-100 text-green-800",
    destination: "bg-blue-100 text-blue-800",
    category: "bg-stone-100 text-stone-700",
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    setOpen(false);
    await logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <header
      className={`sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      <div
        className={`mx-auto flex max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1560px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 ${
          scrolled ? "h-16" : "h-[72px]"
        }`}
      >
        {/* Left Section: Logo */}
        <div className="flex shrink-0 items-center">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 text-green-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-800 rounded-xl"
          >
            <img
              src={LOGO_IMAGES.logo}
              alt="PeakKit"
              className="h-9 w-auto max-w-36 object-contain"
              onError={(event) => {
                event.currentTarget.style.display = "none";
                event.currentTarget.nextElementSibling.style.display = "flex";
              }}
            />
            <span className="hidden h-9 w-9 items-center justify-center rounded-xl bg-green-900 text-white shadow-xs">
              <Compass size={21} />
            </span>
            <span className="font-display text-xl font-bold tracking-tight">
              PEAKKIT
            </span>
          </Link>
        </div>

        {/* Center Section: Navigation links evenly distributed */}
        <nav className="hidden shrink-0 items-center justify-center gap-4 xl:gap-6 lg:flex">
          {links.map(([label, path]) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `whitespace-nowrap text-sm font-semibold transition hover:-translate-y-0.5 ${
                  isActive
                    ? "text-green-900 font-bold"
                    : "text-slate-600 hover:text-green-900"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right Section: Search Bar (~300px) + Wishlist + Cart + Auth */}
        <div className="hidden shrink-0 items-center justify-end gap-3 md:flex">
          {/* Search bar (~300px width) with live results dropdown */}
          <div ref={searchRef} className="relative">
            <label className="flex w-60 xl:w-72 items-center gap-2 rounded-full bg-stone-100/90 border border-stone-200/80 px-3.5 py-2 transition focus-within:border-green-800 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-800/20">
              <Search size={15} className="shrink-0 text-slate-400" />
              <input
                aria-label="Search trekking gear"
                placeholder="Search gear or destinations"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => searchQuery && setSearchOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
                  if (e.key === "Enter" && searchResults.length > 0) {
                    navigate(searchResults[0].to);
                    setSearchOpen(false);
                    setSearchQuery("");
                  }
                }}
                className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                  className="shrink-0 rounded-full p-0.5 text-slate-400 hover:bg-stone-200/60 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </label>

            {/* Results dropdown */}
            {searchOpen && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-stone-200 bg-white p-2.5 shadow-xl shadow-stone-200/80">
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Search Results
                    </span>
                    {searchResults.map((result, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          analytics.trackSearch(searchQuery);
                          navigate(result.to);
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-stone-50"
                      >
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${typeColor[result.type]}`}>
                          {typeLabel[result.type]}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-800">{result.label}</p>
                          <p className="truncate text-[10px] text-slate-400">{result.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : !searchQuery.trim() ? (
                  <div className="p-2 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Popular Searches
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_SEARCHES.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => {
                              analytics.trackSearch(term);
                              navigate(`/explore?q=${encodeURIComponent(term)}`);
                              setSearchOpen(false);
                            }}
                            className="rounded-full bg-stone-100 hover:bg-green-50 hover:text-green-900 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : searchLoading ? (
                  <div className="px-4 py-5 text-center">
                    <p className="text-xs text-slate-400">Searching mountain inventory…</p>
                  </div>
                ) : (
                  <div className="px-4 py-5 text-center">
                    <p className="text-xs text-slate-500">No results for <strong>"{searchQuery}"</strong></p>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(`/explore?q=${encodeURIComponent(searchQuery)}`);
                        setSearchOpen(false);
                      }}
                      className="mt-2 text-xs font-bold text-emerald-800 hover:underline"
                    >
                      Search full catalog →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Icons: Wishlist | Cart | Notification with equal spacing */}
          <div className="flex items-center gap-1.5">
            <CountLink
              to="/wishlist"
              label="Wishlist"
              count={wishlistItems.length}
            >
              <Heart size={19} />
            </CountLink>
            <CountLink to="/cart" label="Cart" count={cartItems.length}>
              <ShoppingBag size={19} />
            </CountLink>

            {/* Notification Bell (Only for authenticated users) */}
            {isAuthenticated && (
              <div className="relative shrink-0">
                <button
                  type="button"
                  aria-label="Notifications"
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    setProfileOpen(false);
                  }}
                  className="relative rounded-full p-2 text-slate-600 hover:bg-stone-100 transition"
                >
                  <Bell size={19} />
                  {unreadCount > 0 && (
                    <b className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-green-950 shadow-xs">
                      {unreadCount}
                    </b>
                  )}
                </button>

                {/* Notification Drawer / Dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-green-950">
                          Notifications
                        </h3>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition"
                          >
                            <CheckCheck size={14} />
                            <span>Mark all read</span>
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label="Close notifications"
                          onClick={() => setNotifOpen(false)}
                          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 max-h-96 space-y-2 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((item) => {
                          const isUnread = !item.is_read;
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                if (isUnread) markAsRead(item.id);
                              }}
                              className={`group relative flex items-start gap-3 rounded-2xl p-3 text-left transition cursor-pointer ${
                                isUnread
                                  ? "bg-emerald-50/70 hover:bg-emerald-50"
                                  : "bg-white hover:bg-stone-50 border border-slate-100"
                              }`}
                            >
                              <div
                                className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs ${
                                  item.notification_type === "delivery"
                                    ? "bg-amber-100 text-amber-900"
                                    : item.notification_type === "payment"
                                    ? "bg-emerald-100 text-emerald-900"
                                    : "bg-stone-200 text-slate-700"
                                }`}
                              >
                                {item.notification_type === "delivery" ? (
                                  <Truck size={15} />
                                ) : item.notification_type === "payment" ? (
                                  <Package size={15} />
                                ) : (
                                  <Bell size={15} />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className="text-xs font-bold text-green-950">
                                    {item.title}
                                  </h4>
                                  {isUnread && (
                                    <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                                  )}
                                </div>
                                <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">
                                  {item.message}
                                </p>
                                <div className="mt-1.5 flex items-center justify-between">
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(
                                      item.created_at
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}{" "}
                                    ·{" "}
                                    {new Date(
                                      item.created_at
                                    ).toLocaleDateString([], {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                  {item.related_order_id && (
                                    <Link
                                      to={`/tracking/${item.related_order_id}`}
                                      onClick={() => setNotifOpen(false)}
                                      className="text-[10px] font-bold text-emerald-800 hover:underline"
                                    >
                                      Track {item.related_order_id} →
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Login/Profile and Join button remain grouped on the far right */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              /* After login: Show profile/avatar icon, Show My Account dropdown, Show Logout */
              <div className="relative shrink-0">
                <button
                  type="button"
                  aria-label="My Account"
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-1.5 rounded-full p-1 text-slate-700 hover:bg-stone-100 transition"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-green-900 text-xs font-bold text-white shadow-xs">
                    {user?.first_name ? (
                      user.first_name[0].toUpperCase()
                    ) : (
                      <User size={16} />
                    )}
                  </span>
                </button>

                {/* My Account Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    <div className="border-b border-slate-100 px-3 py-2">
                      <p className="text-xs font-bold text-green-950 truncate">
                        {user?.first_name
                          ? `${user.first_name} ${user.last_name || ""}`
                          : "My Account"}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <div className="mt-1 space-y-0.5">
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-100 transition"
                      >
                        <User size={14} /> Profile & Settings
                      </Link>
                      <Link
                        to="/rentals"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-stone-100 transition"
                      >
                        <Package size={14} /> My Rentals & Orders
                      </Link>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut size={14} /> Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Before login: Show Login, Show Join PeakKit, Hide My Account */
              <>
                <Link
                  to="/login"
                  className="shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold text-green-900 hover:bg-green-50"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="shrink-0 whitespace-nowrap rounded-full bg-green-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800"
                >
                  Join PeakKit
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="shrink-0 rounded-lg p-2 text-slate-700 md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="border-t border-slate-200 bg-white px-5 py-5 md:hidden">
          {/* Mobile search */}
          <div className="mb-4">
            <label className="flex items-center gap-2 rounded-2xl bg-stone-100 px-3.5 py-2.5 border border-stone-200">
              <Search size={16} className="text-slate-400" />
              <input
                placeholder="Search gear or destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
                    setOpen(false);
                  }
                }}
                className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </label>
          </div>
          {isAuthenticated && user && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-stone-50 p-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-green-900 text-sm font-bold text-white">
                {user?.first_name ? (
                  user.first_name[0].toUpperCase()
                ) : (
                  <User size={18} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-green-950 truncate">
                  {user.first_name} {user.last_name || ""}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          )}

          <nav className="grid gap-1">
            {links.map(([label, path]) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 font-medium text-slate-700 hover:bg-stone-100"
              >
                {label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <>
                <NavLink
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 font-medium text-slate-700 hover:bg-stone-100"
                >
                  Profile & Settings
                </NavLink>
                <NavLink
                  to="/rentals"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 font-medium text-slate-700 hover:bg-stone-100"
                >
                  My Rentals & Orders
                </NavLink>
              </>
            )}
          </nav>

          <div className="mt-4">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                <LogOut size={16} /> Log out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-green-900 px-4 py-3 text-center text-sm font-semibold text-green-900"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-green-900 px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  Join PeakKit
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
