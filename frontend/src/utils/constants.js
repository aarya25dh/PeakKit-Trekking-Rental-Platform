export const categories = [
  { name: "Backpacks", image: "/categories/backpacks.jpg", count: "184 pieces" },
  { name: "Jackets", image: "/categories/jackets.jpg", count: "96 pieces" },
  { name: "Sleeping Bags", image: "/categories/sleepingbags.jpg", count: "72 pieces" },
  { name: "Camping Gear", image: "/categories/camping.jpg", count: "138 pieces" },
  { name: "Cooking Gear", image: "/categories/cooking.jpg", count: "54 pieces" },
  { name: "Accessories", image: "/categories/accessories.jpg", count: "224 pieces" },
  { name: "Footwear", image: "/categories/footwear.jpg", count: "88 pieces" },
  { name: "Safety Gear", image: "/categories/safety.jpg", count: "42 pieces" },
];

export const kits = [
  { name: "Annapurna Base Camp", image: "/images/packages/abc-kit.jpg", duration: "10-12 days", season: "Mar-May · Oct-Nov", price: "NPR 8,900", tag: "Most booked" },
  { name: "Everest Base Camp", image: "/images/packages/ebc-kit.jpg", duration: "14-16 days", season: "Mar-May · Oct-Nov", price: "NPR 12,500", tag: "Premium kit" },
  { name: "Mardi Himal", image: "/images/packages/mardi-kit.jpg", duration: "5-7 days", season: "All year", price: "NPR 5,600", tag: "Easy escape" },
];

const productSeed = [
  ["Alpine Trek 45L Pack", "Backpacks", 650, 4000, 4.9, "Like new", "Osprey", "backpack1.jpg"], ["Trailkeeper 20L Daypack", "Backpacks", 380, 2500, 4.8, "Like new", "Deuter", "backpack2.jpg"], ["Himalayan Haul 65L Pack", "Backpacks", 800, 5000, 4.7, "Excellent", "Lowe Alpine", "backpack3.jpg"], ["Kathmandu Commuter Pack", "Backpacks", 300, 1800, 4.6, "Good", "The North Face", "backpack4.jpg"],
  ["Down Ridge Shell Jacket", "Jackets", 520, 3500, 4.8, "Excellent", "Rab", "jacket1.jpg"], ["Khumbu Storm Parka", "Jackets", 700, 5000, 4.9, "Like new", "Patagonia", "jacket2.jpg"], ["Langtang Fleece Layer", "Jackets", 350, 2200, 4.7, "Verified", "Columbia", "jacket3.jpg"], ["Mardi Softshell Jacket", "Jackets", 420, 2800, 4.6, "Good", "Marmot", "jacket4.jpg"],
  ["Himalayan Down 0C Bag", "Sleeping Bags", 650, 5000, 4.9, "Excellent", "Mountain Hardwear", "sleepingbag1.jpg"], ["High Camp -10C Bag", "Sleeping Bags", 900, 6500, 4.8, "Like new", "Sea to Summit", "sleepingbag2.jpg"], ["Annapurna Trek Liner", "Sleeping Bags", 280, 1600, 4.6, "Verified", "Cocoon", "sleepingbag3.jpg"], ["Mardi Summer Bag", "Sleeping Bags", 380, 2500, 4.7, "Good", "Quechua", "sleepingbag4.jpg"],
  ["Cloudrest Trek Boots", "Footwear", 750, 5000, 4.6, "Good", "Salomon", "boots1.jpg"], ["Everest Approach Boots", "Footwear", 850, 6000, 4.9, "Excellent", "La Sportiva", "boots2.jpg"], ["Trailcross Hiking Shoes", "Footwear", 500, 3500, 4.7, "Like new", "Merrell", "boots3.jpg"], ["Yak Wool Trek Socks", "Footwear", 120, 500, 4.8, "New", "PeakKit", "boots4.jpg"],
  ["Basecamp 2P Tent", "Camping", 900, 6000, 4.9, "Excellent", "MSR", "tent1.jpg"], ["Annapurna 3P Tent", "Camping", 1100, 7500, 4.8, "Like new", "Big Agnes", "tent2.jpg"], ["Trekker Sleeping Mat", "Camping", 280, 1800, 4.7, "Verified", "Therm-a-Rest", "camping1.jpg"], ["Ultralight Trekking Poles", "Camping", 320, 2200, 4.8, "Excellent", "Black Diamond", "camping2.jpg"],
  ["Summit Beam Headlamp", "Accessories", 180, 1000, 4.7, "Verified", "Petzl", "headlamp1.jpg"], ["Sherpa Sun Cap", "Accessories", 100, 400, 4.5, "New", "PeakKit", "accessory1.jpg"], ["Trekking Gaiters", "Accessories", 220, 1200, 4.6, "Good", "Outdoor Research", "accessory2.jpg"], ["Altitude Sunglasses", "Accessories", 250, 1500, 4.8, "Like new", "Julbo", "accessory3.jpg"],
  ["Annapurna Fuel Stove", "Cooking", 300, 1800, 4.7, "Excellent", "Jetboil", "cooking1.jpg"], ["Titanium Cook Set", "Cooking", 260, 1400, 4.6, "Verified", "Snow Peak", "cooking2.jpg"], ["Trek Water Filter", "Cooking", 350, 2200, 4.8, "Like new", "Katadyn", "cooking3.jpg"], ["Insulated Trail Mug", "Cooking", 130, 600, 4.5, "New", "Stanley", "cooking4.jpg"],
  ["Altitude First Aid Kit", "Safety", 180, 900, 4.8, "New", "Adventure Medical", "safety1.jpg"], ["Avalanche Safety Beacon", "Safety", 700, 5000, 4.9, "Excellent", "Mammut", "safety2.jpg"], ["Satellite Messenger", "Safety", 850, 6500, 4.7, "Verified", "Garmin", "safety3.jpg"], ["Emergency Bivy Sack", "Safety", 220, 1100, 4.6, "Like new", "SOL", "safety4.jpg"],
];

const extraProducts = ["Dolpo Trail Duffel", "Sherpa Summit Pack", "Forclaz Alpine Pack", "North Face Base Pack", "Osprey Talon Pack", "Dolpo Rain Shell", "Sherpa Insulated Hoody", "Forclaz Trek Fleece", "North Face Down Vest", "Quechua Storm Jacket", "Naturehike Down Quilt", "Forclaz Trek 5 Bag", "Sea to Summit Spark Bag", "Quechua Comfort Bag", "Dolpo Approach Shoe", "Forclaz Mountain Boot", "North Face Trail Runner", "Sherpa Wool Liner", "Naturehike Cloud Tent", "Forclaz Trekking Tent", "MSR Pocket Rocket", "Naturehike Camp Chair", "Black Diamond Trail Poles", "Dolpo Camp Tarp", "Sherpa Trek Gloves", "Forclaz Rain Gaiters", "Black Diamond Spot Lamp", "North Face Base Cap", "Dolpo Dry Bag", "Naturehike Trek Umbrella", "Forclaz Titanium Pot", "MSR Alpine Plate", "Sea to Summit Dry Sack", "Naturehike Coffee Press", "Dolpo Medical Roll", "Black Diamond Climbing Helmet", "Garmin InReach Mini", "Forclaz Emergency Blanket"].map((name, index) => [name, ["Backpacks", "Jackets", "Sleeping Bags", "Footwear", "Camping", "Accessories", "Cooking", "Safety"][index % 8], 220 + (index % 8) * 80, 1500 + (index % 6) * 800, 4.5 + (index % 5) / 10, index % 3 === 0 ? "Excellent" : "Verified", ["Dolpo", "Sherpa Adventure Gear", "The North Face", "Quechua", "Forclaz", "Black Diamond", "Naturehike", "Osprey"][index % 8], ["backpack2.jpg", "jacket2.jpg", "sleepingbag2.jpg", "boots2.jpg", "camping1.jpg", "accessory2.jpg", "cooking2.jpg", "safety2.jpg"][index % 8]]);

export const products = [...productSeed, ...extraProducts].map(([name, category, rentalPrice, deposit, rating, condition, brand, file], index) => ({
  id: `${category.toLowerCase()}-${index + 1}`, name, category, rentalPrice, price: `NPR ${rentalPrice}`, deposit: `NPR ${deposit.toLocaleString()}`, rating, reviewCount: 12 + index * 7, reviewsCount: 12 + index * 7, condition, brand, availability: index % 7 === 3 ? "Reserved" : "Available", image: `/images/products/${file}`, description: `A dependable ${category.toLowerCase()} essential, checked and maintained for Nepal's changing mountain weather.`, compatibleDestinations: index % 2 ? ["Annapurna Base Camp", "Mardi Himal"] : ["Everest Base Camp", "Langtang Valley"], destinations: index % 2 ? ["Annapurna Base Camp", "Mardi Himal"] : ["Everest Base Camp", "Langtang Valley"], season: index % 3 === 0 ? "Winter" : "All year", size: index % 4 === 0 ? "M-L" : "S-XL", rentalDuration: "1-14 days",
}));

export const destinationsCatalog = [
  ["Everest Base Camp", "14-16 days", "Challenging", "Mar-May · Oct-Nov", "NPR 12,500", "everest.jpg"], ["Annapurna Base Camp", "10-12 days", "Moderate", "Mar-May · Oct-Nov", "NPR 8,900", "annapurna.jpg"], ["Mardi Himal", "5-7 days", "Moderate", "All year", "NPR 5,600", "mardi.jpg"], ["Langtang Valley", "7-9 days", "Moderate", "Mar-May · Oct-Nov", "NPR 6,800", "langtang.jpg"], ["Gosaikunda", "5-7 days", "Moderate", "Mar-May · Oct-Nov", "NPR 5,200", "gosaikunda.jpg"], ["Ama Yangri", "2-3 days", "Easy", "Oct-May", "NPR 2,400", "ama-yangri.jpg"], ["Manaslu Circuit", "16-18 days", "Challenging", "Mar-May · Oct-Nov", "NPR 14,500", "manaslu.jpg"], ["Upper Mustang", "12-14 days", "Challenging", "May-Oct", "NPR 11,800", "upper-mustang.jpg"],
].map(([name, duration, difficulty, season, price, image]) => ({ name, duration, difficulty, season, price, image: `/images/destinations/${image}` }));

export const stats = [
  { value: "1,200+", label: "Gear items available" },
  { value: "89%", label: "Average savings by renting" },
  { value: "12", label: "Popular trekking destinations" },
  { value: "4.8★", label: "Average customer rating" },
];

export const testimonials = [
  { quote: "The kit was waiting at our hotel before breakfast. One less thing to worry about before the trail.", name: "Lena Hoffmann", role: "Trekking from Germany", image: "/avatars/user1.jpg" },
  { quote: "Good equipment, clear communication, and a genuinely local team. Mardi Himal felt wonderfully simple.", name: "Callum Reid", role: "Trekking from Australia", image: "/avatars/user2.jpg" },
  { quote: "I found the exact pack I needed and gave my old one a second life. That is what outdoor community should feel like.", name: "Aayush Shrestha", role: "PeakKit member, Kathmandu", image: "/avatars/user3.jpg" },
];

export const destinations = ["Everest Region", "Annapurna", "Langtang Valley", "Manaslu", "Mardi Himal"];
