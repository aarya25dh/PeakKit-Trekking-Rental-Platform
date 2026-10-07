/**
 * SEO.jsx — PeakKit shared meta-management component.
 *
 * Usage:
 *   <SEO
 *     title="Explore Gear | PeakKit"
 *     description="Rent trekking and camping gear in Nepal."
 *     canonical="/explore"
 *     image="/og-explore.jpg"      // optional, defaults to brand OG image
 *     noIndex={false}              // true for /admin, /checkout, /profile
 *   />
 *
 * Rendered in the page component's JSX tree (before the first visible element).
 * Cleans up its side-effects on unmount.
 */

import { useEffect } from "react";

const SITE_NAME = "PeakKit";
const rawBase = import.meta.env.VITE_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173");

export function getSecureUrl(url) {
  if (!url) return url;
  if (typeof window !== "undefined" && window.location.protocol === "https:" && url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
}

export const BASE_URL = getSecureUrl(rawBase);
const DEFAULT_OG_IMAGE = `${BASE_URL}/images/hero/hero-everest.jpg`;

/**
 * Helper — create or find a <meta> element by selector and set its content.
 */
function setMeta(selector, content, attribute = "content") {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    // parse attribute key/value from selector, e.g. name="description"
    const match = selector.match(/\[(\w+(?::\w+)?)="([^"]+)"\]/);
    if (match) el.setAttribute(match[1], match[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attribute, content);
  return el;
}

/**
 * Helper — create or find a <link> element by rel (+ optional as).
 */
function setLink(rel, href, extra = {}) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

export default function SEO({
  title,
  description = "PeakKit — rent trusted trekking and camping gear in Nepal. Premium backpacks, down jackets, boots, tents, and safety gear.",
  keywords = "trekking gear rental nepal, rent hiking gear kathmandu, himalayan camping equipment, peakkit",
  canonical = "",
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
  schema = null,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `PeakKit | Premier Trekking & Camping Gear Rental in Nepal`;
  const canonicalUrl = getSecureUrl(
    canonical
      ? `${BASE_URL}${canonical.startsWith("/") ? canonical : "/" + canonical}`
      : BASE_URL
  );
  const ogImageUrl = getSecureUrl(image);

  useEffect(() => {
    // --- Document title ---
    const prevTitle = document.title;
    document.title = fullTitle;

    // --- Primary meta ---
    setMeta('meta[name="description"]', description);
    if (keywords) {
      setMeta('meta[name="keywords"]', keywords);
    }
    const robotsEl = setMeta(
      'meta[name="robots"]',
      noIndex ? "noindex, nofollow" : "index, follow"
    );

    // --- Canonical ---
    const canonicalEl = setLink("canonical", canonicalUrl);

    // --- Open Graph ---
    const ogTitle = setMeta('meta[property="og:title"]', fullTitle);
    const ogDesc = setMeta('meta[property="og:description"]', description);
    const ogUrl = setMeta('meta[property="og:url"]', canonicalUrl);
    const ogImage = setMeta('meta[property="og:image"]', image);
    const ogType = setMeta('meta[property="og:type"]', "website");
    const ogSite = setMeta('meta[property="og:site_name"]', SITE_NAME);

    // --- Twitter Card ---
    const twCard = setMeta('meta[name="twitter:card"]', "summary_large_image");
    const twTitle = setMeta('meta[name="twitter:title"]', fullTitle);
    const twDesc = setMeta('meta[name="twitter:description"]', description);
    const twImage = setMeta('meta[name="twitter:image"]', image);

    // --- JSON-LD Structured Data ---
    let schemaScript = null;
    if (schema) {
      schemaScript = document.createElement("script");
      schemaScript.type = "application/ld+json";
      schemaScript.textContent = JSON.stringify(schema);
      document.head.appendChild(schemaScript);
    }

    return () => {
      // Restore previous title on unmount
      document.title = prevTitle;
      // Restore robots to default
      robotsEl.setAttribute("content", "index, follow");
      // Remove JSON-LD script on unmount
      if (schemaScript && schemaScript.parentNode) {
        schemaScript.parentNode.removeChild(schemaScript);
      }
    };
  }, [fullTitle, description, canonicalUrl, image, noIndex, schema]);

  // Nothing rendered to DOM — all side-effects only
  return null;
}

