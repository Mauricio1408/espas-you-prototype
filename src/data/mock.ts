/**
 * Mock content — the same seed as the Flutter app (`lib/data/mock_data.dart`)
 * and the Obsidian `Content Data` stub, so Figma, Flutter and this prototype
 * all tell one story: "Cozy Loft in Uptown Center, ₱18,500, Shiela Mae Smith,
 * Juan Dela Cruz".
 *
 * Photos are the Unsplash images used as `Property Photo /` components in the
 * Figma UI Kit (free licence, no people, no UI mockups).
 */

const u = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?w=${w}&q=80&fm=jpg&fit=crop`;
const face = (id: string) =>
  `https://images.unsplash.com/${id}?w=200&h=200&q=80&fm=jpg&fit=crop&crop=faces`;

export const photos = {
  loftWarm: u('photo-1502672260266-1c1ef2d93688'),
  studioMinimal: u('photo-1493809842364-78817add7ffb'),
  studioWhite: u('photo-1522708323590-d24dbb6b0267'),
  aptOpenPlan: u('photo-1560448204-e02f11c3d0e2'),
  houseDusk: u('photo-1568605114967-8130f3a36994'),
  houseGarden: u('photo-1600585154340-be6161a56a0c'),
  housePool: u('photo-1600596542815-ffad4c1539a9'),
  loftBalcony: u('photo-1600607687939-ce8a6c25118c'),
  loftWindows: u('photo-1600566753086-00f18fb6b3ea'),
  aptClassic: u('photo-1598928506311-c55ded91a20c'),
  bathroom: u('photo-1584622650111-993a426fbf0a'),
  aptWarmWood: u('photo-1560185007-5f0bb1866cab'),
};

export const avatars = {
  // Persona photos come from the Figma file so every surface shows the same people.
  shiela: '/figma/landlord-shiela.webp',
  juan: '/figma/juan-portrait.webp',
  sofia: face('photo-1494790108377-be9c29b29330'),
  maryJoy: face('photo-1438761681033-6461ffad8d80'),
  bryan: face('photo-1506794778202-cad84cf45f1d'),
  ana: face('photo-1544005313-94ddf0286df2'),
  mark: face('photo-1507003211169-0a1dd7228f2d'),
  carlo: face('photo-1472099645785-5658abf4ff4e'),
};

export type Landlord = { name: string; rating: number; reviews: number; avatar: string };

export type Listing = {
  id: string;
  title: string;
  location: string;
  price: number;
  inclusion: string;
  rating: number;
  reviews: number;
  image: string;
  status: string;
  landlord: Landlord;
  gallery?: string[];
  maxOccupants?: number;
  /** Map position, in % of the map canvas. */
  pin?: { x: number; y: number };
};

export const landlords = {
  shiela: { name: 'Shiela Mae Smith', rating: 4.95, reviews: 426, avatar: avatars.shiela },
  annaLee: { name: 'Anna Lee', rating: 4.78, reviews: 132, avatar: avatars.ana },
  carlos: { name: 'Carlos Mendoza', rating: 4.92, reviews: 88, avatar: avatars.carlo },
} satisfies Record<string, Landlord>;

const L = (l: Listing) => l;

export const listings = {
  cozyLoft: L({
    id: 'cozy-loft',
    title: 'Cozy Loft in Uptown Center',
    location: 'Apartment in Manila City, Philippines',
    price: 18500,
    inclusion: 'Electricity & Water',
    rating: 4.86,
    reviews: 426,
    image: '/figma/listing-hero.webp',
    status: 'Ready to move in',
    landlord: landlords.shiela,
    gallery: ['/figma/listing-hero.webp', photos.aptWarmWood, photos.bathroom, photos.loftWindows],
    maxOccupants: 6,
    pin: { x: 52, y: 46 },
  }),
  spaciousLoft: L({
    id: 'spacious-loft',
    title: 'Spacious Loft with Balcony',
    location: 'Apartment in Makati, Philippines',
    price: 25000,
    inclusion: 'Internet included',
    rating: 4.7,
    reviews: 210,
    image: photos.loftBalcony,
    status: 'Move in September',
    landlord: landlords.shiela,
    pin: { x: 30, y: 30 },
  }),
  twoBedApt: L({
    id: '2br-apt',
    title: '2-Bedroom Apartment',
    location: 'Apartment in Quezon City, Philippines',
    price: 16500,
    inclusion: 'Water & WiFi included',
    rating: 4.9,
    reviews: 154,
    image: photos.studioWhite,
    status: 'Ready to move in',
    landlord: landlords.annaLee,
    pin: { x: 74, y: 28 },
  }),
  studioGym: L({
    id: 'studio-gym',
    title: 'Studio with Gym Access',
    location: 'Studio in BGC, Philippines',
    price: 19500,
    inclusion: 'Gym and Pool Access',
    rating: 4.5,
    reviews: 97,
    image: photos.studioMinimal,
    status: 'Move-in Ready',
    landlord: landlords.carlos,
    pin: { x: 70, y: 62 },
  }),
  studioPark: L({
    id: 'studio-park',
    title: 'Cozy Studio Near Park',
    location: 'Studio in Pasig, Philippines',
    price: 15000,
    inclusion: 'Pet-friendly building',
    rating: 4.6,
    reviews: 61,
    image: photos.aptWarmWood,
    status: 'Move-in ready September',
    landlord: landlords.annaLee,
    pin: { x: 22, y: 58 },
  }),
  condo3br: L({
    id: 'condo-3br',
    title: 'Modern 3-Bedroom Condo',
    location: 'Condo in Ortigas, Philippines',
    price: 35000,
    inclusion: 'Gym and pool access',
    rating: 4.8,
    reviews: 203,
    image: photos.aptOpenPlan,
    status: 'Immediate occupancy',
    landlord: landlords.carlos,
  }),
  cottage: L({
    id: 'cottage',
    title: 'Charming 1-Bedroom Cottage',
    location: 'House in Tagaytay, Philippines',
    price: 28000,
    inclusion: 'Garden access',
    rating: 4.6,
    reviews: 45,
    image: photos.houseGarden,
    status: 'Immediate occupancy',
    landlord: landlords.annaLee,
  }),
  cityApt: L({
    id: 'city-apt',
    title: 'New City Apartment',
    location: 'Apartment in Manila City, Philippines',
    price: 16500,
    inclusion: 'Close to public transit',
    rating: 4.9,
    reviews: 77,
    image: photos.aptClassic,
    status: 'Immediate Move-In',
    landlord: landlords.shiela,
  }),
  studioLoft: L({
    id: 'studio-loft',
    title: 'Cozy Studio Loft',
    location: 'Studio in Manila City, Philippines',
    price: 18500,
    inclusion: 'Downtown location',
    rating: 4.2,
    reviews: 33,
    image: photos.bathroom,
    status: 'Immediate Move-In',
    landlord: landlords.carlos,
  }),
  familyHouse: L({
    id: 'family-house',
    title: 'Spacious Family House',
    location: 'House in Cavite, Philippines',
    price: 40000,
    inclusion: 'Near schools and parks',
    rating: 4.8,
    reviews: 112,
    image: photos.houseDusk,
    status: 'Move in November',
    landlord: landlords.annaLee,
  }),
  luxuryCondo: L({
    id: 'luxury-condo',
    title: 'Luxury Condo Suite',
    location: 'Condo in BGC, Philippines',
    price: 50000,
    inclusion: 'Gym & pool access',
    rating: 4.9,
    reviews: 300,
    image: photos.housePool,
    status: 'Move in November',
    landlord: landlords.carlos,
  }),
  downtownStudio: L({
    id: 'downtown-studio',
    title: 'Cozy Downtown Studio',
    location: 'Studio in Manila City, Philippines',
    price: 15000,
    inclusion: 'Near metros & cafes',
    rating: 4.3,
    reviews: 52,
    image: photos.studioWhite,
    status: 'Immediate move-in',
    landlord: landlords.shiela,
  }),
  familyApt: L({
    id: 'family-apt',
    title: 'Spacious Family Apartment',
    location: 'Apartment in Quezon City, Philippines',
    price: 32000,
    inclusion: 'Pet-friendly',
    rating: 4.7,
    reviews: 90,
    image: photos.aptOpenPlan,
    status: 'Available from July',
    landlord: landlords.annaLee,
  }),
  cityViewLoft: L({
    id: 'city-view-loft',
    title: 'Modern Loft with City View',
    location: 'Loft in Makati, Philippines',
    price: 15000,
    inclusion: 'Parking lot included',
    rating: 4.5,
    reviews: 41,
    image: photos.loftWindows,
    status: 'Available July 15',
    landlord: landlords.carlos,
  }),
  riverStudio: L({
    id: 'river-studio',
    title: 'Modern Studio by the River',
    location: 'Studio in Marikina, Philippines',
    price: 22000,
    inclusion: 'Internet included',
    rating: 4.92,
    reviews: 88,
    image: photos.aptWarmWood,
    status: 'Ready to move in',
    landlord: landlords.carlos,
    maxOccupants: 2,
  }),
  spacious3br: L({
    id: 'spacious-3br',
    title: 'Spacious 3BR Apartment',
    location: 'Apartment in Pasig, Philippines',
    price: 45000,
    inclusion: 'Gym & pool access',
    rating: 4.78,
    reviews: 132,
    image: photos.houseDusk,
    status: 'Ready to move in',
    landlord: landlords.annaLee,
    maxOccupants: 8,
  }),
  sunny2br: L({
    id: 'sunny-2br',
    title: 'Sunny 2-Bedroom Apartment',
    location: 'Apartment in Manila City, Philippines',
    price: 16500,
    inclusion: 'Water & WiFi included',
    rating: 4.9,
    reviews: 154,
    image: photos.aptWarmWood,
    status: 'Occupied',
    landlord: landlords.shiela,
  }),
};

export const allListings: Listing[] = Object.values(listings);
export const listingById = (id: string) => allListings.find((l) => l.id === id) ?? listings.cozyLoft;
export const mapListings = allListings.filter((l) => l.pin);

export const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`;

export const lifestyleChips = [
  { emoji: '🏢', label: 'Urban' },
  { emoji: '🚆', label: 'Far from City' },
  { emoji: '💸', label: 'Zero Deposit' },
  { emoji: '🐾', label: 'Pet Friendly' },
];

export const feed = [
  { title: 'Best Picks Around You', items: [listings.cozyLoft, listings.spaciousLoft, listings.twoBedApt, listings.studioGym] },
  { title: 'Move-in Ready', items: [listings.studioPark, listings.condo3br, listings.cottage, listings.cityApt] },
  { title: 'Top Rated Landlords', items: [listings.studioLoft, listings.familyHouse, listings.luxuryCondo, listings.cozyLoft] },
  { title: 'Below ₱16,000/month', items: [listings.downtownStudio, listings.familyApt, listings.cityViewLoft, listings.studioPark] },
];

export const defaultFavorites = ['cozy-loft', 'spacious-3br', 'river-studio'];
export const savedLabels: Record<string, string> = {
  'cozy-loft': 'Added last Monday, August 14',
  'spacious-3br': 'Listed last Friday, April 14',
  'river-studio': 'Updated yesterday, April 19',
  'spacious-loft': 'Added 2 weeks ago',
  'condo-3br': 'Added 3 weeks ago',
  cottage: 'Added last month',
};

export type Thread = {
  name: string;
  property: string;
  snippet: string;
  time: string;
  avatar: string;
  unread?: boolean;
};

export const threads: Thread[] = [
  { name: 'Shiela Mae Smith', property: 'Uptown Center', snippet: 'Docs look good, reviewing tonight.', time: '30 minutes ago', avatar: avatars.shiela, unread: true },
  { name: 'Ana Reyes', property: 'Studio near BGC', snippet: 'Thanks! Reviewing your application.', time: '1 hour ago', avatar: avatars.ana, unread: true },
  { name: 'Mark Santos', property: 'Makati CBD', snippet: 'Yes, parking is included.', time: '4 hours ago', avatar: avatars.mark },
  { name: 'Carlo Dizon', property: 'Pasig studio', snippet: 'Water and electricity are included.', time: '8 hours ago', avatar: avatars.carlo },
];

export const landlordThreads: Thread[] = [
  { name: 'Juan Dela Cruz', property: 'Cozy Loft in Uptown Center', snippet: 'Is the unit still available for August?', time: '2 hours', avatar: avatars.juan, unread: true },
  { name: 'Mary Joy Santillan', property: 'Spacious Loft with Balcony', snippet: 'Can I bring my pet dog?', time: '4 days ago', avatar: avatars.maryJoy },
];

export type ApplicantStatus = 'In Review' | 'Denied' | 'Approved' | 'Pending';
export type Applicant = {
  id: string;
  name: string;
  score: number;
  address: string;
  status: ApplicantStatus;
  date: string;
  avatar: string;
};

export const applicants: Applicant[] = [
  { id: 'juan', name: 'Juan Dela Cruz', score: 100, address: 'Bayag, Leon, Iloilo', status: 'In Review', date: 'Sep 11', avatar: avatars.juan },
  { id: 'sofia', name: 'Sofia Martinez', score: 64, address: '178 Oak Blvd, Unit 5', status: 'Denied', date: 'Oct 27', avatar: avatars.sofia },
  { id: 'maryjoy', name: 'Mary Joy Santillan', score: 87, address: '403 Elm St, Apt 12B', status: 'Approved', date: 'Aug 03', avatar: avatars.maryJoy },
  { id: 'bryan', name: 'Bryan Kieth', score: 92, address: '210 Pine Ave, Apt 12', status: 'Pending', date: 'Sep 12', avatar: avatars.bryan },
];

export const landlordListings = [listings.cozyLoft, listings.spaciousLoft, listings.sunny2br, listings.familyApt];

export const preferenceTags = [
  '🚆 Near Transit',
  '🔇 Quiet',
  '⛹️ Gym',
  '🏙️ City Center',
  '🏪 Near Supermarket',
  '💸 Affordable',
  '🌃 Nightlife',
  '🛡️ Security',
  '✅ Verified Landlord',
];

/** Personas — Content Data stub is the source of truth. */
export const juan = {
  firstName: 'Juan',
  lastName: 'Dela Cruz',
  name: 'Juan Dela Cruz',
  score: 100,
  rating: 4.75,
  onTime: '100%',
  phone: '+63 927-179-4922',
  email: 'juandelacruz@gmail.com',
  address: 'Bayag, Leon, Iloilo',
  occupants: '1 adult + pet',
  employer: 'Brightline Media Inc.',
  jobTitle: 'Marketing Manager',
  income: 68500,
  years: '2 years',
  moveIn: 'September 1, 2026',
  avatar: avatars.juan,
  message:
    "Hi Shiela! I'm a marketing manager working nearby and I'm looking for a long-term place. Happy to answer any questions.",
};

export const shiela = {
  firstName: 'Shiela Mae',
  lastName: 'Smith',
  name: 'Shiela Mae Smith',
  phone: '+63 934-134-3456',
  address: 'Poblacion, Dumalag',
  emergency: { name: 'Ramon Joseph Smith', phone: '+63 917-882-1043', address: 'Poblacion, Dumalag', relation: 'Spouse' },
  avatar: avatars.shiela,
};

/* ---------- Map search (Figma "Tenant Search - Map View") ---------- */

const mapOnly = {
  uptownRoom: L({
    id: 'uptown-room',
    title: 'Bright Room near UP Town Center',
    location: 'Room in Quezon City, Philippines',
    price: 14200,
    inclusion: 'Water included',
    rating: 4.71,
    reviews: 58,
    image: photos.aptClassic,
    status: 'Ready to move in',
    landlord: landlords.annaLee,
    maxOccupants: 2,
  }),
  gardenStudio: L({
    id: 'teachers-garden',
    title: 'Garden Studio in Teachers Village',
    location: 'Studio in Quezon City, Philippines',
    price: 12750,
    inclusion: 'Pet-friendly garden',
    rating: 4.64,
    reviews: 37,
    image: photos.houseGarden,
    status: 'Ready to move in',
    landlord: landlords.carlos,
    maxOccupants: 2,
  }),
  katipunanLoft: L({
    id: 'katipunan-loft',
    title: 'Industrial Loft on Katipunan',
    location: 'Loft in Quezon City, Philippines',
    price: 16900,
    inclusion: 'Internet included',
    rating: 4.8,
    reviews: 112,
    image: photos.loftWindows,
    status: 'Move in September',
    landlord: landlords.annaLee,
    maxOccupants: 3,
  }),
  blueRidge: L({
    id: 'blue-ridge',
    title: 'Townhouse in Blue Ridge',
    location: 'Townhouse in Quezon City, Philippines',
    price: 19800,
    inclusion: 'Parking included',
    rating: 4.9,
    reviews: 64,
    image: photos.houseDusk,
    status: 'Ready to move in',
    landlord: landlords.carlos,
    maxOccupants: 5,
  }),
};
Object.assign(listings, mapOnly);
allListings.push(...Object.values(mapOnly));

export type MapPin = {
  emoji: string;
  /** Position on the 1803 × 1014 map canvas (Figma screen coords + map offset). */
  x: number;
  y: number;
  listing?: Listing;
  label?: string;
  petFriendly?: boolean;
};

/** Pin positions are lifted from the Figma frame (Real Estate x/y + 1008, y + 104). */
export const mapPins: MapPin[] = [
  { emoji: '🏢', x: 123 + 1008, y: 291 + 104, listing: listings.cozyLoft, petFriendly: true },
  { emoji: '🏠', x: 222 + 1008, y: 435 + 104, listing: mapOnly.uptownRoom },
  { emoji: '🌳', x: 47 + 1008, y: 471 + 104, listing: mapOnly.gardenStudio, petFriendly: true },
  { emoji: '🏭', x: 298 + 1008, y: 245 + 104, listing: mapOnly.katipunanLoft },
  { emoji: '🏰', x: 234 + 1008, y: 569 + 104, listing: mapOnly.blueRidge },
  { emoji: '🏠', x: 165 + 1008, y: 191 + 104, label: '₱8,260' },
  { emoji: '🚜', x: 100 + 1008, y: 669 + 104, label: '₱13,450' },
];

/** Lifestyle chips on the dashboard filter the feed. */
export const lifestyleMatch: Record<string, (l: Listing) => boolean> = {
  Urban: (l) => /Manila|Makati|BGC|Ortigas|Quezon|Pasig/.test(l.location),
  'Far from City': (l) => /Tagaytay|Cavite|Marikina/.test(l.location),
  'Zero Deposit': (l) => ['2br-apt', 'studio-park', 'downtown-studio', 'city-apt', 'cottage'].includes(l.id),
  'Pet Friendly': (l) => /pet/i.test(l.inclusion) || ['cozy-loft', 'cottage', 'family-house'].includes(l.id),
};
