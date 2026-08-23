import { X } from "lucide-react";
import { useEffect, useState } from "react";

const messages = ["Autumn trekking season is live — complete Annapurna kit from Rs. 2,850.", "Free pickup in Kathmandu Valley for rentals over Rs. 3,000.", "Save up to 89% compared to buying trekking gear."];
function AnnouncementBar() {
  const [index, setIndex] = useState(0); const [visible, setVisible] = useState(true);
  useEffect(() => { const timer = setInterval(() => setIndex((current) => (current + 1) % messages.length), 4500); return () => clearInterval(timer); }, []);
  if (!visible) return null;
  return <div className="relative z-50 flex min-h-10 items-center justify-center bg-amber-400 px-10 text-center text-xs font-bold text-green-950 sm:text-sm"><span>{messages[index]}</span><button onClick={() => setVisible(false)} aria-label="Dismiss announcement" className="absolute right-4 rounded-full p-1 hover:bg-amber-300"><X size={16} /></button></div>;
}
export default AnnouncementBar;
