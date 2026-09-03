import {
  CATEGORY_IMAGES,
  DESTINATION_IMAGES,
  PACKAGE_IMAGES,
} from "../data/imagePaths";

export const categories = [
  { name: "Backpacks", image: CATEGORY_IMAGES.backpacks, count: "184 pieces" },
  { name: "Jackets", image: CATEGORY_IMAGES.jackets, count: "96 pieces" },
  { name: "Sleeping Bags", image: CATEGORY_IMAGES.sleepingBags, count: "72 pieces" },
  { name: "Camping Gear", image: CATEGORY_IMAGES.camping, count: "138 pieces" },
  { name: "Cooking Gear", image: CATEGORY_IMAGES.cooking, count: "54 pieces" },
  { name: "Accessories", image: CATEGORY_IMAGES.accessories, count: "224 pieces" },
  { name: "Footwear", image: CATEGORY_IMAGES.footwear, count: "88 pieces" },
  { name: "Safety Gear", image: CATEGORY_IMAGES.safety, count: "42 pieces" },
];

export const kits = [
  { name: "Annapurna Base Camp", image: PACKAGE_IMAGES.abcKit, duration: "10-12 days", season: "Mar-May · Oct-Nov", price: "NPR 8,900", tag: "Most booked" },
  { name: "Everest Base Camp", image: PACKAGE_IMAGES.ebcKit, duration: "14-16 days", season: "Mar-May · Oct-Nov", price: "NPR 12,500", tag: "Premium kit" },
  { name: "Mardi Himal", image: PACKAGE_IMAGES.mardiKit, duration: "5-7 days", season: "All year", price: "NPR 5,600", tag: "Easy escape" },
];

const productSeed = [
  ["Alpine Trek 45L Pack", "Backpacks", 650, 4000, 4.9, "Like new", "Osprey", "backpack1.jpg"],
  ["Trailkeeper 20L Daypack", "Backpacks", 380, 2500, 4.8, "Like new", "Deuter", "backpack2.jpg"],
  ["Himalayan Haul 65L Pack", "Backpacks", 800, 5000, 4.7, "Excellent", "Lowe Alpine", "backpack3.jpg"],
  ["Kathmandu Commuter Pack", "Backpacks", 300, 1800, 4.6, "Good", "The North Face", "backpack4.jpg"],
  ["Down Ridge Shell Jacket", "Jackets", 520, 3500, 4.8, "Excellent", "Rab", "jacket1.jpg"],
  ["Khumbu Storm Parka", "Jackets", 700, 5000, 4.9, "Like new", "Patagonia", "jacket2.jpg"],
  ["Langtang Fleece Layer", "Jackets", 350, 2200, 4.7, "Verified", "Columbia", "jacket3.jpg"],
  ["Mardi Softshell Jacket", "Jackets", 420, 2800, 4.6, "Good", "Marmot", "jacket4.jpg"],
  ["Himalayan Down 0C Bag", "Sleeping Bags", 650, 5000, 4.9, "Excellent", "Mountain Hardwear", "sleepingbag1.jpg"],
  ["High Camp -10C Bag", "Sleeping Bags", 900, 6500, 4.8, "Like new", "Sea to Summit", "sleepingbag2.jpg"],
  ["Annapurna Trek Liner", "Sleeping Bags", 280, 1600, 4.6, "Verified", "Cocoon", "sleepingbag3.jpg"],
  ["Mardi Summer Bag", "Sleeping Bags", 380, 2500, 4.7, "Good", "Quechua", "sleepingbag4.jpg"],
  ["Cloudrest Trek Boots", "Footwear", 750, 5000, 4.6, "Good", "Salomon", "boots1.jpg"],
  ["Everest Approach Boots", "Footwear", 850, 6000, 4.9, "Excellent", "La Sportiva", "boots2.jpg"],
  ["Trailcross Hiking Shoes", "Footwear", 500, 3500, 4.7, "Like new", "Merrell", "boots3.jpg"],
  ["Yak Wool Trek Socks", "Footwear", 120, 500, 4.8, "New", "PeakKit", "boots4.jpg"],
  ["Basecamp 2P Tent", "Camping", 900, 6000, 4.9, "Excellent", "MSR", "tent1.jpg"],
  ["Annapurna 3P Tent", "Camping", 1100, 7500, 4.8, "Like new", "Big Agnes", "tent2.jpg"],
  ["Trekker Sleeping Mat", "Camping", 280, 1800, 4.7, "Verified", "Therm-a-Rest", "camping1.jpg"],
  ["Ultralight Trekking Poles", "Camping", 320, 2200, 4.8, "Excellent", "Black Diamond", "pole1.jpg"],
  ["Summit Beam Headlamp", "Accessories", 180, 1000, 4.7, "Verified", "Petzl", "headlamp1.jpg"],
  ["Sherpa Sun Cap", "Accessories", 100, 400, 4.5, "New", "PeakKit", "accessory1.jpg"],
  ["Trekking Gaiters", "Accessories", 220, 1200, 4.6, "Good", "Outdoor Research", "accessory2.jpg"],
  ["Altitude Sunglasses", "Accessories", 250, 1500, 4.8, "Like new", "Julbo", "accessory3.jpg"],
  ["Annapurna Fuel Stove", "Cooking", 300, 1800, 4.7, "Excellent", "Jetboil", "cooking1.jpg"],
  ["Titanium Cook Set", "Cooking", 260, 1400, 4.6, "Verified", "Snow Peak", "cooking2.jpg"],
  ["Trek Water Filter", "Cooking", 350, 2200, 4.8, "Like new", "Katadyn", "cooking3.jpg"],
  ["Insulated Trail Mug", "Cooking", 130, 600, 4.5, "New", "Stanley", "cooking4.jpg"],
  ["Altitude First Aid Kit", "Safety", 180, 900, 4.8, "New", "Adventure Medical", "safety1.jpg"],
  ["Avalanche Safety Beacon", "Safety", 700, 5000, 4.9, "Excellent", "Mammut", "safety2.jpg"],
  ["Satellite Messenger", "Safety", 850, 6500, 4.7, "Verified", "Garmin", "safety3.jpg"],
  ["Emergency Bivy Sack", "Safety", 220, 1100, 4.6, "Like new", "SOL", "safety4.jpg"],
];

const extraProductDefs = [
  // Backpacks
  ["Dolpo Trail Duffel 55L", "Backpacks", 450, 3000, 4.8, "Excellent", "Dolpo", "backpack5.jpg"],
  ["Sherpa Summit Pack 30L", "Backpacks", 500, 3500, 4.9, "Like new", "Sherpa Adventure Gear", "backpack6.jpg"],
  ["Forclaz Alpine Pack 50L", "Backpacks", 580, 3800, 4.7, "Verified", "Forclaz", "backpack2.jpg"],
  ["North Face Base Pack 40L", "Backpacks", 620, 4200, 4.8, "Excellent", "The North Face", "backpack3.jpg"],
  ["Osprey Talon Pack 33L", "Backpacks", 680, 4500, 4.9, "Like new", "Osprey", "backpack4.jpg"],

  // Jackets
  ["Dolpo Rain Shell Pro", "Jackets", 480, 3200, 4.7, "Verified", "Dolpo", "jacket5.jpg"],
  ["Sherpa Insulated Hoody", "Jackets", 560, 3900, 4.9, "Like new", "Sherpa Adventure Gear", "jacket6.jpg"],
  ["Forclaz Trek 900 Fleece", "Jackets", 320, 2000, 4.6, "Good", "Forclaz", "jacket2.jpg"],
  ["North Face Down Vest", "Jackets", 490, 3400, 4.8, "Excellent", "The North Face", "jacket3.jpg"],
  ["Quechua Storm Jacket", "Jackets", 420, 2700, 4.7, "Verified", "Quechua", "jacket4.jpg"],

  // Sleeping Bags
  ["Naturehike Down Quilt 0C", "Sleeping Bags", 580, 4000, 4.8, "Excellent", "Naturehike", "sleepingbag5.jpg"],
  ["Forclaz Trek 500 0C Bag", "Sleeping Bags", 520, 3600, 4.7, "Verified", "Forclaz", "sleepingbag6.jpg"],
  ["Sea to Summit Spark Bag -5C", "Sleeping Bags", 850, 6000, 4.9, "Like new", "Sea to Summit", "sleepingbag2.jpg"],
  ["Quechua Comfort -2C Bag", "Sleeping Bags", 460, 3100, 4.6, "Good", "Quechua", "sleepingbag3.jpg"],

  // Footwear
  ["Dolpo Mountain Approach Shoe", "Footwear", 680, 4600, 4.8, "Excellent", "Dolpo", "boots5.jpg"],
  ["Forclaz Alpine Trekking Boot", "Footwear", 720, 5000, 4.9, "Like new", "Forclaz", "boots6.jpg"],
  ["North Face Ultra Trail Runner", "Footwear", 650, 4200, 4.7, "Verified", "The North Face", "boots2.jpg"],
  ["Sherpa Yak Wool Liner Socks", "Footwear", 150, 600, 4.8, "New", "Sherpa Adventure Gear", "boots3.jpg"],

  // Camping
  ["Naturehike Cloud Up 2P Tent", "Camping", 820, 5500, 4.9, "Like new", "Naturehike", "tent3.jpg"],
  ["Forclaz Trekking 3P Dome Tent", "Camping", 950, 6500, 4.8, "Excellent", "Forclaz", "tent4.jpg"],
  ["Naturehike Ultralight Camp Chair", "Camping", 240, 1500, 4.6, "Good", "Naturehike", "camping3.jpg"],
  ["Black Diamond Trail Pro Poles", "Camping", 360, 2400, 4.8, "Excellent", "Black Diamond", "pole2.jpg"],
  ["Dolpo Ultralight Camp Tarp", "Camping", 290, 1800, 4.7, "Verified", "Dolpo", "camping4.jpg"],

  // Accessories
  ["Sherpa Thermal Trek Gloves", "Accessories", 180, 900, 4.7, "Verified", "Sherpa Adventure Gear", "accessory4.jpg"],
  ["Forclaz Waterproof Rain Gaiters", "Accessories", 210, 1100, 4.6, "Good", "Forclaz", "accessory5.jpg"],
  ["Black Diamond Spot 400 Lamp", "Accessories", 220, 1300, 4.9, "Like new", "Black Diamond", "headlamp2.jpg"],
  ["North Face Base Sun Cap", "Accessories", 120, 500, 4.5, "New", "The North Face", "accessory6.jpg"],
  ["Dolpo Dry Bag 20L", "Accessories", 160, 800, 4.7, "Excellent", "Dolpo", "accessory1.jpg"],
  ["Naturehike Trekking Umbrella", "Accessories", 190, 1000, 4.6, "Verified", "Naturehike", "accessory2.jpg"],

  // Cooking
  ["Forclaz Titanium 1L Pot", "Cooking", 240, 1400, 4.8, "Excellent", "Forclaz", "cooking5.jpg"],
  ["MSR Alpine Compact Plate", "Cooking", 140, 700, 4.6, "New", "MSR", "cooking6.jpg"],
  ["MSR Pocket Rocket Deluxe Stove", "Cooking", 340, 2100, 4.9, "Like new", "MSR", "cooking2.jpg"],
  ["Naturehike Trail Coffee Press", "Cooking", 220, 1200, 4.7, "Verified", "Naturehike", "cooking3.jpg"],

  // Safety
  ["Dolpo Expedition Medical Roll", "Safety", 260, 1300, 4.8, "New", "Dolpo", "safety5.jpg"],
  ["Black Diamond Climbing Helmet", "Safety", 420, 2800, 4.9, "Like new", "Black Diamond", "safety6.jpg"],
  ["Garmin InReach Mini 2 Satellite", "Safety", 920, 7000, 4.9, "Excellent", "Garmin", "safety2.jpg"],
  ["Forclaz Thermal Emergency Blanket", "Safety", 120, 500, 4.7, "New", "Forclaz", "safety3.jpg"]
];

const extraProducts = extraProductDefs;

export const products = [...productSeed, ...extraProducts].map(([name, category, rentalPrice, , rating, condition, brand, file], index) => {
  const calculatedDeposit = Math.round(rentalPrice * 0.6 * 3);
  return {
    id: `${category.toLowerCase().replace(/\s+/g, "-")}-${index + 1}`,
    name,
    category,
    rentalPrice,
    price: `NPR ${rentalPrice}`,
    deposit: `NPR ${calculatedDeposit.toLocaleString()} (60% of 3-day rental)`,
    depositRate: 0.6,
    rating,
    reviewCount: 12 + index * 7,
    reviewsCount: 12 + index * 7,
    condition,
    brand,
    availability: index % 7 === 3 ? "Reserved" : "Available",
    image: `/images/products/${file}`,
    description: `A dependable ${category.toLowerCase()} essential, checked and maintained for Nepal's changing mountain weather.`,
    compatibleDestinations: index % 2 ? ["Annapurna Base Camp", "Mardi Himal"] : ["Everest Base Camp", "Langtang Valley"],
    destinations: index % 2 ? ["Annapurna Base Camp", "Mardi Himal"] : ["Everest Base Camp", "Langtang Valley"],
    season: index % 3 === 0 ? "Winter" : "All year",
    size: index % 4 === 0 ? "M-L" : "S-XL",
    rentalDuration: "1-14 days",
  };
});

export const destinationsCatalog = [
  ["Everest Base Camp", "14-16 days", "Challenging", "Mar-May · Oct-Nov", "NPR 12,500", DESTINATION_IMAGES.everest],
  ["Annapurna Base Camp", "10-12 days", "Moderate", "Mar-May · Oct-Nov", "NPR 8,900", DESTINATION_IMAGES.annapurna],
  ["Mardi Himal", "5-7 days", "Moderate", "All year", "NPR 5,600", DESTINATION_IMAGES.mardi],
  ["Langtang Valley", "7-9 days", "Moderate", "Mar-May · Oct-Nov", "NPR 6,800", DESTINATION_IMAGES.langtang],
  ["Gosaikunda", "5-7 days", "Moderate", "Mar-May · Oct-Nov", "NPR 5,200", DESTINATION_IMAGES.gosaikunda],
  ["Ama Yangri", "2-3 days", "Easy", "Oct-May", "NPR 2,400", DESTINATION_IMAGES.amaYangri],
  ["Manaslu Circuit", "16-18 days", "Challenging", "Mar-May · Oct-Nov", "NPR 14,500", DESTINATION_IMAGES.manaslu],
  ["Upper Mustang", "12-14 days", "Challenging", "May-Oct", "NPR 11,800", DESTINATION_IMAGES.upperMustang],
].map(([name, duration, difficulty, season, price, image]) => ({ name, duration, difficulty, season, price, image }));

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
