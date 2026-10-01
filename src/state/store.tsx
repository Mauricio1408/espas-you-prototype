import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { allListings, applicants, defaultFavorites, juan, landlords, photos, shiela, type ApplicantStatus, type Listing } from '../data/mock';

/**
 * Live mock state shared by both journeys. The tenant's application flows
 * into the landlord's dashboard, and the landlord's decision flows back to
 * the tenant — the same handshake the product is built around. Persisted to
 * localStorage so a reviewer can switch journeys without losing progress.
 */

export type Role = 'tenant' | 'landlord';

export type ChatMessage = { from: 'juan' | 'shiela'; text: string };

/** Juan ↔ Shiela conversation — one source, rendered from either side. */
export const seedConversation: ChatMessage[] = [
  { from: 'juan', text: juan.message },
  { from: 'juan', text: 'Is the unit still available for August?' },
  { from: 'shiela', text: 'Hi Juan! Yes, it’s still available 😊 Thanks for applying — your documents look complete.' },
  { from: 'shiela', text: 'Docs look good, reviewing tonight.' },
];

export type ListingDraft = {
  title: string;
  type: string;
  address: string;
  city: string;
  transit: string;
  bedrooms: number;
  bathrooms: number;
  occupants: number;
  furnishing: string;
  amenities: string[];
  photos: string[];
  rent: string;
  deposit: string;
  advance: string;
  utilities: string[];
  minLease: string;
  available: string;
  published: boolean;
};

export const initialDraft: ListingDraft = {
  title: 'Studio near Ayala MRT',
  type: 'Studio',
  address: 'Unit 12B, Uptown Center',
  city: 'Manila',
  transit: '5 min walk to Ayala MRT',
  bedrooms: 1,
  bathrooms: 1,
  occupants: 2,
  furnishing: 'Fully furnished',
  amenities: ['Air conditioning', 'Fast Wi-Fi', 'Pet-friendly'],
  photos: [photos.studioWhite, photos.studioMinimal],
  rent: '14,200',
  deposit: '2 months',
  advance: '1 month',
  utilities: ['Water'],
  minLease: '6 months',
  available: 'September 1, 2026',
  published: false,
};

/** Turns a published draft into a listing the rest of the app can render. */
export function draftToListing(d: ListingDraft): Listing {
  return {
    id: 'shiela-new',
    title: d.title,
    location: `${d.type} in ${d.city} City, Philippines`,
    price: Number(d.rent.replace(/\D/g, '')) || 0,
    inclusion: d.utilities.length ? `${d.utilities.join(' & ')} included` : 'Utilities not included',
    rating: 5,
    reviews: 0,
    image: d.photos[0] ?? photos.studioWhite,
    gallery: d.photos.length ? d.photos : [photos.studioWhite],
    status: 'Ready to move in',
    landlord: landlords.shiela,
    maxOccupants: d.occupants,
  };
}

function syncPublished(d: ListingDraft) {
  const i = allListings.findIndex((l) => l.id === 'shiela-new');
  if (i >= 0) allListings.splice(i, 1);
  if (d.published) allListings.push(draftToListing(d));
}

export type AppState = {
  role: Role | null;
  signedIn: boolean;
  tenant: {
    location: string;
    firstName: string;
    lastName: string;
    birthday: string;
    gender: string;
    phone: string;
    email: string;
    preferences: string[];
    budget: [number, number];
    notifications: boolean | null;
  };
  favorites: string[];
  filters: { moveIn: string | null; verifiedOnly: boolean; types: string[]; amenities: string[] };
  conversation: ChatMessage[];
  draft: ListingDraft;
  application: {
    status: 'none' | 'submitted' | 'approved' | 'declined';
    listingId: string;
    about: { name: string; phone: string; email: string; address: string; occupants: string; gender: string };
    work: { employer: string; jobTitle: string; income: string; years: string };
    docs: { id: boolean; payslip: boolean };
    moveIn: string;
    message: string;
    submittedAt: string | null;
  };
  landlord: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    emergency: { name: string; phone: string; address: string; relation: string };
    idType: string;
    idFront: boolean;
    idBack: boolean;
    notifications: boolean | null;
    decisions: Record<string, ApplicantStatus>;
  };
};

export const initialState: AppState = {
  role: null,
  signedIn: false,
  tenant: {
    location: 'Manila City, Philippines',
    firstName: juan.firstName,
    lastName: juan.lastName,
    birthday: 'January 14, 1998',
    gender: 'Male',
    phone: juan.phone,
    email: juan.email,
    preferences: ['🚆 Near Transit', '🔇 Quiet', '🛡️ Security'],
    budget: [12000, 20000],
    notifications: null,
  },
  favorites: defaultFavorites,
  filters: { moveIn: null, verifiedOnly: false, types: [], amenities: [] },
  conversation: seedConversation,
  draft: initialDraft,
  application: {
    status: 'none',
    listingId: 'cozy-loft',
    about: { name: juan.name, phone: juan.phone, email: juan.email, address: juan.address, occupants: juan.occupants, gender: 'Male' },
    work: { employer: juan.employer, jobTitle: juan.jobTitle, income: '68,500', years: juan.years },
    docs: { id: true, payslip: false },
    moveIn: juan.moveIn,
    message: juan.message,
    submittedAt: null,
  },
  landlord: {
    firstName: shiela.firstName,
    lastName: shiela.lastName,
    phone: shiela.phone,
    address: shiela.address,
    emergency: shiela.emergency,
    idType: "Driver's License",
    idFront: false,
    idBack: false,
    notifications: null,
    decisions: Object.fromEntries(applicants.map((a) => [a.id, a.status])),
  },
};

type Action =
  | { type: 'patch'; fn: (s: AppState) => AppState }
  | { type: 'reset' };

function reducer(state: AppState, action: Action): AppState {
  if (action.type === 'reset') return initialState;
  return action.fn(state);
}

const KEY = 'espas-you-prototype/v2';

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const state = { ...initialState, ...parsed };
    syncPublished(state.draft);
    return state;
  } catch {
    return initialState;
  }
}

type Store = {
  state: AppState;
  update: (fn: (s: AppState) => AppState) => void;
  reset: () => void;
  toggleFavorite: (id: string) => void;
  decide: (applicantId: string, status: ApplicantStatus) => void;
  send: (from: ChatMessage['from'], text: string) => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    syncPublished(state.draft);
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* private mode — state simply won't persist */
    }
  }, [state]);

  const update = useCallback((fn: (s: AppState) => AppState) => dispatch({ type: 'patch', fn }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  const toggleFavorite = useCallback(
    (id: string) =>
      update((s) => ({
        ...s,
        favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [id, ...s.favorites],
      })),
    [update],
  );

  const decide = useCallback(
    (applicantId: string, status: ApplicantStatus) =>
      update((s) => ({
        ...s,
        landlord: { ...s.landlord, decisions: { ...s.landlord.decisions, [applicantId]: status } },
        application:
          applicantId === 'juan' && s.application.status !== 'none'
            ? { ...s.application, status: status === 'Approved' ? 'approved' : status === 'Denied' ? 'declined' : 'submitted' }
            : s.application,
        conversation:
          applicantId !== 'juan'
            ? s.conversation
            : status === 'Approved'
              ? [...s.conversation, { from: 'shiela', text: 'Congrats Juan! Your application is approved 🎉 Let’s set your move-in date.' }]
              : status === 'Denied'
                ? [...s.conversation, { from: 'shiela', text: 'Thanks so much for applying, Juan. I’ve gone with another applicant this time — wishing you the best in your search.' }]
                : s.conversation.filter((m, i) => i < seedConversation.length || !/Congrats Juan|another applicant/.test(m.text)),
      })),
    [update],
  );

  const send = useCallback((from: ChatMessage['from'], text: string) => update((s) => ({ ...s, conversation: [...s.conversation, { from, text }] })), [update]);

  const value = useMemo(() => ({ state, update, reset, toggleFavorite, decide, send }), [state, update, reset, toggleFavorite, decide, send]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore outside <StoreProvider>');
  return ctx;
}
