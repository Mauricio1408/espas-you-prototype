import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { peso, type Listing } from '../data/mock';
import { useNav } from '../nav/Navigator';
import { useStore } from '../state/store';

const spring = [0.32, 0.72, 0, 1] as const;

export const ratingShort = (r: number) => (Math.floor(r * 10) / 10).toFixed(1);

/* ------------------------------------------------------------------ */
/* Icon / Glass — Heart (toggles a favourite, with a pop + burst)      */
/* ------------------------------------------------------------------ */

export function GlassHeart({ id, size = 16, pad = 8 }: { id: string; size?: number; pad?: number }) {
  const { state, toggleFavorite } = useStore();
  const on = state.favorites.includes(id);
  const [burst, setBurst] = useState(0);
  return (
    <motion.button
      type="button"
      className={`glass-btn ${on ? 'is-on' : ''}`}
      style={{ padding: pad }}
      aria-pressed={on}
      aria-label={on ? 'Remove from favorites' : 'Save to favorites'}
      whileTap={{ scale: 0.85 }}
      onClick={(e) => {
        e.stopPropagation();
        if (!on) setBurst((b) => b + 1);
        toggleFavorite(id);
        toast(on ? 'Removed from Favorites' : 'Saved to Favorites');
      }}
    >
      <motion.img
        key={on ? 'on' : 'off'}
        src={on ? '/figma/glass-heart-on.svg' : '/figma/glass-heart.svg'}
        width={size}
        height={size}
        alt=""
        initial={{ scale: on ? 0.4 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 600, damping: 14 }}
      />
      <AnimatePresence>
        {burst > 0 && on && (
          <motion.span key={burst} className="heart-burst" initial={{ scale: 0.3, opacity: 0.9 }} animate={{ scale: 2.2, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Card / Full — Tenant View                                           */
/* ------------------------------------------------------------------ */

export function ListingCard({ listing, index = 0 }: { listing: Listing; index?: number }) {
  const nav = useNav();
  return (
    <motion.div
      layout
      className="lcard"
      role="button"
      tabIndex={0}
      onClick={() => nav.push('viewListing', { params: { id: listing.id } })}
      onKeyDown={(e) => e.key === 'Enter' && nav.push('viewListing', { params: { id: listing.id } })}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.45, ease: spring, delay: Math.min(index, 4) * 0.05 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="lcard__image">
        <img src={listing.image} alt="" loading="lazy" />
      </div>
      <div className="lcard__info">
        {listing.status && <p className="lcard__status">{listing.status}</p>}
        <div className="lcard__stack">
          <p className="t-b2-medium lcard__title">{listing.title}</p>
          <div className="lcard__stack">
            <p className="t-h4">{peso(listing.price)} / month</p>
            <div className="lcard__row">
              <p className="lcard__meta">{listing.inclusion}</p>
              <p className="lcard__rating">
                {ratingShort(listing.rating)}
                <img src="/figma/icon-star-12.svg" width={12} height={12} alt="" />
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="lcard__overlay">
        <VerifiedGlass avatar={listing.landlord.avatar} />
        <GlassHeart id={listing.id} />
      </div>
    </motion.div>
  );
}

export function VerifiedGlass({ avatar }: { avatar: string }) {
  return (
    <span className="verified-glass">
      <img src={avatar} width={20} height={20} alt="" />
      <span>Verified</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation / Bottom Nav — Tenant                                    */
/* ------------------------------------------------------------------ */

type Tab = 'discover' | 'favorites' | 'messages' | 'account';
const tabScreen: Record<Tab, string> = {
  discover: 'tenantDashboard',
  favorites: 'favorites',
  messages: 'messages',
  account: 'account',
};

export function TenantBottomNav({ active }: { active: Tab }) {
  const nav = useNav();
  const { state } = useStore();
  const go = (t: Tab) => {
    if (t === active) return;
    nav.reset([tabScreen[t]], { transition: 'smart' });
  };
  const badge = {
    favorites: state.favorites.length,
    messages: 2,
    account: state.application.status === 'approved' ? 1 : 0,
  };
  const Item = ({ tab, label, icon }: { tab: Tab; label: string; icon: React.ReactNode }) => (
    <motion.button type="button" className={`bnav__item ${active === tab ? 'is-active' : ''}`} onClick={() => go(tab)} whileTap={{ scale: 0.9 }} aria-current={active === tab ? 'page' : undefined}>
      {icon}
      <span className="t-b2">{label}</span>
      {tab !== 'discover' && badge[tab] > 0 && (
        <motion.span key={badge[tab]} className="bnav__badge" initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 15 }}>
          {badge[tab]}
        </motion.span>
      )}
    </motion.button>
  );
  return (
    <nav className="bnav">
      <Item tab="discover" label="Discover" icon={<img src={`/figma/nav-discover-${active === 'discover' ? 'on' : 'off'}.svg`} width={24} height={24} alt="" />} />
      <Item tab="favorites" label="Favorites" icon={<img src={`/figma/nav-heart-${active === 'favorites' ? 'on' : 'off'}.svg`} width={24} height={24} alt="" />} />
      <Item
        tab="messages"
        label="Messages"
        icon={<span className="bnav__icon">{active === 'messages' ? <img src="/figma/nav-message-on.svg" width={20.0001} height={20.0001} alt="" /> : <img src="/figma/nav-message-off.svg" width={24} height={24} alt="" />}</span>}
      />
      <Item
        tab="account"
        label="Account"
        icon={<img className={`bnav__avatar ${active === 'account' ? 'is-active' : ''}`} src="/figma/juan-portrait.webp" width={24} height={24} alt="" />}
      />
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Toasts — a tiny event bus so any screen can confirm an action       */
/* ------------------------------------------------------------------ */

export function toast(message: string) {
  window.dispatchEvent(new CustomEvent('espas:toast', { detail: message }));
}

export function ToastHost() {
  const [items, setItems] = useState<{ id: number; message: string }[]>([]);
  useEffect(() => {
    let n = 0;
    const on = (e: Event) => {
      const id = ++n + Date.now();
      setItems((xs) => [...xs.slice(-1), { id, message: (e as CustomEvent<string>).detail }]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 2200);
    };
    window.addEventListener('espas:toast', on);
    return () => window.removeEventListener('espas:toast', on);
  }, []);
  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            className="toast"
            initial={{ opacity: 0, y: -24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
