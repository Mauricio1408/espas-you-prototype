/**
 * One emoji per selectable option, so every toggle across the app reads like the
 * onboarding interest chips. Values stay plain strings — the emoji is display-only.
 */
const map: Record<string, string> = {
  // Favorites / applications / messages tabs
  All: '✨',
  'Available Now': '⚡',
  'Price drop': '📉',
  Unread: '📬',
  Applications: '📝',
  Drafts: '✏️',
  // Filters — move-in
  'On a later date': '📅',
  // Type of place
  Studio: '🛏️',
  Condo: '🏢',
  Apartment: '🏠',
  'Room for rent': '🚪',
  // Amenities and vibes
  'Near transit': '🚆',
  'City Center': '🏙️',
  Gym: '🏋️',
  'Near Supermarket': '🛒',
  Quiet: '🤫',
  Nightlife: '🌃',
  Security: '🛡️',
  // Add Listing
  'Fully furnished': '🛋️',
  Semi: '🪑',
  Unfurnished: '📦',
  'Air conditioning': '❄️',
  'Fast Wi-Fi': '📶',
  'Washing machine': '🧺',
  Parking: '🅿️',
  'Pet-friendly': '🐾',
  '24/7 Security': '🛡️',
  Water: '💧',
  Electricity: '⚡',
  Internet: '🌐',
  // Landlord emergency contact
  Spouse: '💍',
  Parent: '👪',
  Sibling: '🧑‍🤝‍🧑',
  Friend: '🤝',
};

export const emojiFor = (label: string) => map[label] ?? '';
