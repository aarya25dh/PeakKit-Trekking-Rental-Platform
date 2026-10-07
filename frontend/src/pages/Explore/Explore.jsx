import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Filter, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../../components/cards/ProductCard";
import PageHero from "../../components/common/PageHero";
import SEO, { BASE_URL } from "../../components/common/SEO";
import { HERO_IMAGES } from "../../data/imagePaths";
import { gearAPI } from "../../services/api";
import { products as staticProducts } from "../../utils/constants";

const chips = [
  "All gear",
  "Backpacks",
  "Jackets",
  "Sleeping Bags",
  "Footwear",
  "Camping",
  "Accessories",
  "Cooking",
  "Safety",
];

const filterGroups = {
  Category: [
    "Backpacks",
    "Jackets",
    "Sleeping Bags",
    "Footwear",
    "Camping",
    "Accessories",
    "Cooking",
    "Safety",
  ],
  Brand: [
    "Osprey",
    "Patagonia",
    "Rab",
    "Black Diamond",
    "Deuter",
    "La Sportiva",
    "Scarpa",
    "MSR",
    "PeakKit",
  ],
  Condition: ["New", "Excellent", "Good"],
  Availability: ["Available", "Reserved"],
};

function Explore() {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";

  const [query, setQuery] = useState(initialQ);
  const [activeChip, setActiveChip] = useState(
    initialCategory && chips.includes(initialCategory)
      ? initialCategory
      : "All gear"
  );
  const [selected, setSelected] = useState({});
  const [sort, setSort] = useState("Most Popular");
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(1500);

  // Dynamic server gear state
  const [gearList, setGearList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real gear from backend API
  useEffect(() => {
    setLoading(true);
    gearAPI
      .getAll()
      .then((res) => {
        if (res.data?.gear && res.data.gear.length > 0) {
          // Normalize gear items for ProductCard
          const normalized = res.data.gear.map((g) => ({
            id: g.gear_id || g.id,
            gear_id: g.gear_id,
            name: g.name,
            category: g.category || "Trekking Gear",
            brand: g.brand || "PeakKit",
            rentalPrice: parseFloat(g.daily_rental_price || g.rental_price_per_day || 500),
            price: `NPR ${Math.round(parseFloat(g.daily_rental_price || g.rental_price_per_day || 500))}`,
            condition: g.condition || "good",
            availability: g.quantity_available > 0 ? "Available" : "Reserved",
            rating: "4.9",
            reviewCount: 24,
            deposit: `NPR ${Math.round(parseFloat(g.daily_rental_price || 500) * 2.5)}`,
            image: g.image_url || "/images/products/backpack1.jpg",
          }));
          setGearList(normalized);
        } else {
          setGearList(staticProducts);
        }
      })
      .catch((err) => {
        console.warn("Falling back to static products for explore:", err);
        setGearList(staticProducts);
      })
      .finally(() => setLoading(false));
  }, []);

  // Sync state when URL params change (e.g. navigating from search results)
  useEffect(() => {
    const q = searchParams.get("q") || "";
    const cat = searchParams.get("category") || "";
    setQuery(q);
    if (cat && chips.includes(cat)) setActiveChip(cat);
  }, [searchParams]);

  const toggle = (group, value) =>
    setSelected((current) => ({
      ...current,
      [group]: current[group] === value ? "" : value,
    }));

  const scrollToCategories = () => {
    const el = document.getElementById("gear-categories");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const filtered = useMemo(() => {
    const dataset = gearList.length > 0 ? gearList : staticProducts;
    const result = dataset.filter((product) => {
      const text = `${product.name} ${product.brand} ${product.category}`.toLowerCase();
      const matchQuery = !query || text.includes(query.toLowerCase());
      const matchChip =
        activeChip === "All gear" ||
        product.category?.toLowerCase() === activeChip.toLowerCase();
      const matchCategory =
        !selected.Category ||
        product.category?.toLowerCase() === selected.Category.toLowerCase();
      const matchBrand =
        !selected.Brand ||
        product.brand?.toLowerCase() === selected.Brand.toLowerCase();
      const matchCondition =
        !selected.Condition ||
        product.condition?.toLowerCase() === selected.Condition.toLowerCase();
      const matchAvailability =
        !selected.Availability ||
        product.availability?.toLowerCase() === selected.Availability.toLowerCase();
      const matchPrice = product.rentalPrice <= price;

      return (
        matchQuery &&
        matchChip &&
        matchCategory &&
        matchBrand &&
        matchCondition &&
        matchAvailability &&
        matchPrice
      );
    });

    return [...result].sort((a, b) => {
      if (sort === "Price Low to High") return a.rentalPrice - b.rentalPrice;
      if (sort === "Price High to Low") return b.rentalPrice - a.rentalPrice;
      return parseFloat(b.rating || 4.9) - parseFloat(a.rating || 4.9);
    });
  }, [gearList, query, activeChip, selected, sort, price]);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Explore Gear",
        item: `${BASE_URL}/explore`,
      },
    ],
  };

  return (
    <div className="bg-[#f9fafb]">
      <SEO
        title="Explore Trekking & Camping Gear"
        description="Browse and rent trekking gear in Nepal — backpacks, jackets, sleeping bags, footwear, safety equipment and more. Filter by category, brand, and availability."
        canonical="/explore"
        schema={breadcrumbSchema}
      />
      <PageHero
        image={HERO_IMAGES.exploreMarketplace}
        breadcrumb="EXPLORE / CATALOG"
        title="Explore Trekking & Camping Gear"
        subtitle="Browse sanitized alpine equipment, compare specifications, and reserve gear for your upcoming Himalayan expedition."
        primaryButton={{
          text: "Explore Categories",
          onClick: scrollToCategories,
        }}
        secondaryButton={{
          text: "Build My Kit",
          to: "/adventure-kit",
        }}
      >
        <div className="mt-2 flex max-w-2xl items-center rounded-2xl border border-white/20 bg-white/95 p-2 shadow-lg backdrop-blur-md">
          <Search className="ml-3 text-slate-400" size={21} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-slate-800 outline-none placeholder:text-slate-400 text-sm"
            placeholder="Search backpacks, jackets, sleeping bags, trekking poles..."
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="rounded-full p-2 text-slate-400 hover:bg-stone-100"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </PageHero>

      <div
        id="gear-categories"
        className="sticky top-[72px] z-20 border-b border-slate-200 bg-white/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-5 py-3 lg:px-8">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveChip(chip)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeChip === chip
                  ? "bg-green-900 text-white shadow-xs"
                  : "bg-stone-100 text-slate-600 hover:bg-green-50 hover:text-green-900"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            <strong className="text-slate-900">{filtered.length}</strong> pieces ready for the trail
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 lg:hidden"
            >
              <Filter size={16} /> Filters
            </button>
            <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">
              <SlidersHorizontal size={16} />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="bg-transparent font-semibold outline-none text-xs sm:text-sm"
              >
                <option>Most Popular</option>
                <option>Price Low to High</option>
                <option>Price High to Low</option>
                <option>Highest Rated</option>
              </select>
            </label>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside
            className={`${
              open ? "fixed inset-0 z-50 block bg-black/30" : "hidden"
            } lg:relative lg:inset-auto lg:z-auto lg:block lg:bg-transparent`}
          >
            <div
              className={`${
                open
                  ? "absolute right-0 h-full w-[min(88%,340px)] overflow-y-auto bg-white p-6"
                  : ""
              } lg:sticky lg:top-36 lg:h-auto lg:w-auto lg:p-0`}
            >
              <div className="mb-6 flex items-center justify-between lg:hidden">
                <strong className="font-display text-xl">Filters</strong>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close filters"
                >
                  <X />
                </button>
              </div>
              <div className="space-y-6">
                {Object.entries(filterGroups).map(([group, values]) => (
                  <details
                    key={group}
                    open
                    className="border-b border-slate-200 pb-5"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-slate-800">
                      {group}
                      <ChevronDown size={16} />
                    </summary>
                    <div className="mt-4 grid gap-2.5">
                      {values.map((value) => (
                        <label
                          key={value}
                          className="flex items-center gap-3 text-xs font-medium text-slate-600 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={group}
                            checked={selected[group] === value}
                            onChange={() => toggle(group, value)}
                            className="accent-green-900"
                          />
                          {value}
                        </label>
                      ))}
                    </div>
                  </details>
                ))}
                <div>
                  <div className="flex justify-between text-xs font-bold">
                    <span>Max Price / Day</span>
                    <span className="text-green-900 font-bold">NPR {price}</span>
                  </div>
                  <input
                    aria-label="Maximum rental price"
                    type="range"
                    min="100"
                    max="1500"
                    step="50"
                    value={price}
                    onChange={(event) => setPrice(Number(event.target.value))}
                    className="mt-3 w-full accent-green-900"
                  />
                </div>
              </div>
            </div>
          </aside>

          <section>
            {loading ? (
              <div className="flex min-h-[40vh] flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-900" />
                <p className="mt-3 text-xs text-slate-400 font-medium">
                  Loading inventory from database...
                </p>
              </div>
            ) : (
              <>
                <AnimatePresence mode="popLayout">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((product) => (
                      <motion.div
                        key={product.id || product.gear_id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
                {filtered.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-50 text-green-900">
                      <Filter />
                    </div>
                    <h2 className="mt-5 font-display text-2xl font-semibold text-slate-800">
                      No gear matches your filters.
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Try widening your search keywords or clearing filter selections.
                    </p>
                    <button
                      onClick={() => {
                        setQuery("");
                        setActiveChip("All gear");
                        setSelected({});
                        setPrice(1500);
                      }}
                      className="mt-6 rounded-full bg-green-900 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-green-800"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default Explore;
