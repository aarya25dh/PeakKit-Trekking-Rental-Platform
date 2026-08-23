import { Headphones, MapPinned, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
const items = [[ShieldCheck, "Sanitized after every rental"], [Sparkles, "Verified outdoor brands"], [WalletCards, "Flexible security deposit"], [MapPinned, "Pickup & delivery in Kathmandu"], [Headphones, "24-hour customer support"]];
function TrustStrip() { return <section className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-8 gap-y-4 px-5 py-7 lg:justify-between lg:px-8">{items.map(([Icon, text]) => <span key={text} className="flex items-center gap-2 text-xs font-semibold text-slate-600"><Icon size={17} className="text-green-700" />{text}</span>)}</div></section>; }
export default TrustStrip;
