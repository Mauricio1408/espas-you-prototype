import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { applicants, defaultFavorites, juan, shiela, type ApplicantStatus } from '../data/mock';

/**
 * Live mock state shared by both journeys. The tenant's application flows
 * into the landlord's dashboard, and the landlord's decision flows back to
 * the tenant — the same handshake the product is built around. Persisted to
 * localStorage so a reviewer can switch journeys without losing progress.
 */

export type Role = 'tenant' | 'landlord';

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
  filters: { moveIn: string | null; maxPrice: number; petFriendly: boolean; furnished: boolean; type: string };
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
  filters: { moveIn: null, maxPrice: 30000, petFriendly: false, furnished: true, type: 'Any' },
  application: {
    status: 'none',
    listingId: 'cozy-loft',
    about: { name: juan.name, phone: juan.phone, email: juan.email, address: juan.address, occupants: juan.occupants, gender: 'Male' },
    work: { employer: juan.employer, jobTitle: juan.jobTitle, income: '52,000', years: juan.years },
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

const KEY = 'espas-you-prototype/v1';

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { ...initialState, ...parsed };
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
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
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
      })),
    [update],
  );

  const value = useMemo(() => ({ state, update, reset, toggleFavorite, decide }), [state, update, reset, toggleFavorite, decide]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore outside <StoreProvider>');
  return ctx;
}
