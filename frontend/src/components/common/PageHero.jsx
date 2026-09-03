import React from "react";
import { Link } from "react-router-dom";

function PageHero({
  image,
  breadcrumb,
  title,
  subtitle,
  primaryButton,
  secondaryButton,
  children,
  className = "",
}) {
  const renderButton = (btn, variant) => {
    if (!btn) return null;

    if (React.isValidElement(btn)) {
      return btn;
    }

    const isPrimary = variant === "primary";
    const baseClasses =
      "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition duration-200 hover:-translate-y-0.5 shadow-sm";
    const variantClasses = isPrimary
      ? "bg-amber-400 text-green-950 hover:bg-amber-300"
      : "border border-white/50 bg-white/10 text-white backdrop-blur hover:bg-white/20";

    const label = typeof btn === "string" ? btn : btn.text || btn.label;
    const to = btn.to;
    const href = btn.href;
    const onClick = btn.onClick;
    const icon = btn.icon;

    if (to) {
      return (
        <Link to={to} className={`${baseClasses} ${variantClasses}`}>
          {label}
          {icon}
        </Link>
      );
    }

    if (href) {
      return (
        <a href={href} className={`${baseClasses} ${variantClasses}`}>
          {label}
          {icon}
        </a>
      );
    }

    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} ${variantClasses}`}
      >
        {label}
        {icon}
      </button>
    );
  };

  return (
    <section
      className={`relative overflow-hidden bg-green-950 px-5 py-20 text-white lg:px-8 lg:py-24 ${className}`}
    >
      {/* Full-width Background Image */}
      {image && (
        <img
          src={image}
          alt={title || "Nepal mountain trail"}
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          onError={(event) => {
            event.currentTarget.style.opacity = "0";
          }}
        />
      )}

      {/* Hero Content Container - All left-aligned matching Adventure Kits */}
      <div className="relative mx-auto max-w-7xl">
        {/* Amber Breadcrumb */}
        {breadcrumb && (
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
            {breadcrumb}
          </p>
        )}

        {/* White Heading */}
        {title && (
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold sm:text-6xl lg:text-7xl">
            {title}
          </h1>
        )}

        {/* White Subtitle */}
        {subtitle && (
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
            {subtitle}
          </p>
        )}

        {/* Action Buttons */}
        {(primaryButton || secondaryButton) && (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {renderButton(primaryButton, "primary")}
            {renderButton(secondaryButton, "secondary")}
          </div>
        )}

        {/* Children (e.g. Search Bar) */}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export default PageHero;
