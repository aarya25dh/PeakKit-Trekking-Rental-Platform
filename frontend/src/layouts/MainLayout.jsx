import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/navbar/Navbar";
import Footer from "../components/footer/Footer";
import AnnouncementBar from "../components/home/AnnouncementBar";

function MainLayout() {
  const location = useLocation();
  return <div className="min-h-screen bg-[#f9fafb] text-slate-900"><AnnouncementBar /><Navbar /><AnimatePresence mode="wait"><motion.main key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}><Outlet /></motion.main></AnimatePresence><Footer /></div>;
}

export default MainLayout;
