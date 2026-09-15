import { Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home/Home";
import PageFrame from "../pages/PageFrame";
import Explore from "../pages/Explore/Explore";
import ProductDetails from "../pages/ProductDetails/ProductDetails";
import Community from "../pages/Community/Community";
import GearAdvisor from "../pages/GearAdvisor/GearAdvisor";
import AdventureKit from "../pages/AdventureKit/AdventureKit";
import Wishlist from "../pages/Wishlist/Wishlist";
import Cart from "../pages/Cart/Cart";
import About from "../pages/About/About";
import Contact from "../pages/Contact/Contact";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import Checkout from "../pages/Checkout/Checkout";
import Rentals from "../pages/Rentals/Rentals";
import Profile from "../pages/Profile/Profile";
import TrackingPage from "../pages/Tracking/TrackingPage";

const pages = {
  "/wishlist": "Your wishlist",
  "/cart": "Your cart",
  "/checkout": "Checkout",
  "/rentals": "Your rentals",
  "/profile": "Your profile",
  "/login": "Welcome back",
  "/register": "Join the community",
  "/about": "The PeakKit story",
  "/contact": "Talk to the team",
  "/product-details": "Gear details",
  "/admin": "Admin dashboard",
  "/admin/inventory": "Inventory",
  "/admin/orders": "Orders",
};

function AppRoutes() {
  const handledPaths = [
    "/wishlist",
    "/cart",
    "/checkout",
    "/rentals",
    "/profile",
    "/about",
    "/contact",
    "/login",
    "/register",
  ];

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/gear-advisor" element={<GearAdvisor />} />
        <Route path="/community" element={<Community />} />
        <Route path="/adventure-kit" element={<AdventureKit />} />
        <Route path="/adventure-kit/:kitName" element={<AdventureKit />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/rentals" element={<Rentals />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tracking/:orderId" element={<TrackingPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {Object.entries(pages)
          .filter(([path]) => !handledPaths.includes(path))
          .map(([path, title]) => (
            <Route key={path} path={path} element={<PageFrame title={title} />} />
          ))}
      </Route>
    </Routes>
  );
}

export default AppRoutes;
