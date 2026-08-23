import { ArrowUpRight } from "lucide-react";

function Button({ children, variant = "primary", to, className = "", ...props }) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 ${
    variant === "primary"
      ? "bg-green-900 text-white hover:bg-green-800"
      : variant === "secondary"
        ? "border border-green-900 text-green-900 hover:bg-green-50"
        : "text-green-900 hover:bg-green-50"
  } ${className}`;
  const content = <>{children}<ArrowUpRight size={16} strokeWidth={2.5} /></>;
  return to ? <a href={to} className={classes}>{content}</a> : <button className={classes} {...props}>{content}</button>;
}

export default Button;
