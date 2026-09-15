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
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { products, destinationsCatalog } from "../../utils/constants";

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

// Adventure kits data for search (mirrors AdventureKit.jsx)
const allKits = [
  ["Everest Base Camp", "Challenging", "14–16 days", "NPR 12,500"],
  ["Annapurna Base Camp", "Moderate", "10–12 days", "NPR 8,900"],
  ["Mardi Himal", "Moderate", "5–7 days", "NPR 5,600"],
  ["Langtang Valley", "Moderate", "7–9 days", "NPR 6,800"],
  ["Gosaikunda", "Moderate", "5–7 days", "NPR 5,200"],
  ["Ama Yangri", "Easy", "2–3 days", "NPR 2,400"],
  ["Upper Mustang", "Challenging", "12–14 days", "NPR 11,800"],
  ["Manaslu Circuit", "Challenging", "16–18 days", "NPR 14,500"],
  ["Shivapuri Hike", "Easy", "1 day", "NPR 1,200"],
  ["Nagarkot Sunrise", "Easy", "1 day", "NPR 900"],
  ["Champadevi", "Easy", "1 day", "NPR 850"],
  ["Phulchowki", "Moderate", "1 day", "NPR 1,400"],
  ["Weekend Camping", "Easy", "2 days", "NPR 3,800"],
  ["Family Camping", "Easy", "2 days", "NPR 5,600"],
  ["Solo Camping", "Moderate", "2 days", "NPR 3,200"],
  ["Luxury Camping", "Easy", "2 days", "NPR 8,500"],
];

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
  const searchRef = useRef(null);

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

  // Build search results from all corpora
  const searchResults = (() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results = [];

    // Explore Gear products
    products.forEach((p) => {
      if (
        `${p.name} ${p.brand} ${p.category} ${p.description || ""}`.toLowerCase().includes(q)
      ) {
        results.push({ type: "gear", label: p.name, sub: `${p.category} · ${p.brand}`, to: `/product/${p.id}` });
      }
    });

    // Adventure Kits
    allKits.forEach(([name, difficulty, duration]) => {
      if (`${name} ${difficulty} ${duration}`.toLowerCase().includes(q)) {
        results.push({
          type: "kit",
          label: `${name} Kit`,
          sub: `${difficulty} · ${duration}`,
          to: `/adventure-kit/${name.toLowerCase().replaceAll(" ", "-")}`,
        });
      }
    });

    // Destinations
    destinationsCatalog.forEach((d) => {
      if (`${d.name} ${d.difficulty} ${d.duration}`.toLowerCase().includes(q)) {
        results.push({
          type: "destination",
          label: d.name,
          sub: `${d.difficulty} · ${d.duration}`,
          to: `/adventure-kit/${d.name.toLowerCase().replaceAll(" ", "-")}`,
        });
      }
    });

    return results.slice(0, 8);
  })();

  const typeLabel = { gear: "Gear", kit: "Kit", destination: "Destination" };
  const typeColor = {
    gear: "bg-amber-100 text-amber-800",
    kit: "bg-green-100 text-green-800",
    destination: "bg-blue-100 text-blue-800",
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
        className={`mx-auto flex max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8 ${
          scrolled ? "h-16" : "h-[72px]"
        }`}
      >
        {/* Left Section: Logo, Navigation links (equal spacing), and Search bar (immediately after Community) */}
        <div className="flex shrink-0 items-center gap-4 xl:gap-5">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-0.5 text-green-900"
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
            <span className="hidden h-9 w-9 items-center justify-center rounded-xl bg-green-900 text-white">
              <Compass size={21} />
            </span>
            <span className="font-display text-xl font-bold tracking-tight">
              PEAKKIT
            </span>
          </Link>

          {/* Navigation links with equal spacing */}
          <nav className="hidden shrink-0 items-center gap-4 xl:gap-5 lg:flex">
            {links.map(([label, path]) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `whitespace-nowrap text-sm font-semibold transition ${
                    isActive
                      ? "text-green-900 font-bold"
                      : "text-slate-500 hover:text-green-900"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Search bar with live results dropdown */}
          <div ref={searchRef} className="relative hidden xl:flex">
            <label className="flex shrink-0 items-center gap-2 rounded-full bg-stone-100 px-3 py-2">
              <Search size={16} className="shrink-0 text-slate-400" />
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
                className="w-36 xl:w-44 bg-transparent text-xs outline-none placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setSearchOpen(false); }}
                  className="shrink-0 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </label>

            {/* Results dropdown */}
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute left-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      navigate(result.to);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-stone-50"
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
            )}

            {/* No results */}
            {searchOpen && searchQuery.trim() && searchResults.length === 0 && (
              <div className="absolute left-0 top-12 z-50 w-72 rounded-2xl border border-slate-200 bg-white px-4 py-5 text-center shadow-xl">
                <p className="text-xs text-slate-500">No results for <strong>"{searchQuery}"</strong></p>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Icons (equal spacing) and Auth Group (Login/Profile & Join Button on the far right) */}
        <div className="hidden shrink-0 items-center justify-end gap-3 md:flex">
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
