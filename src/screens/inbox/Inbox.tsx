import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { ChevronsDown } from 'react-feather';
import { Screen } from '../../components/Chrome';
import { Button, Switch } from '../../components/Controls';
import { TenantBottomNav, toast } from '../../components/Feed';
import { juan, landlordThreads, listingById, listings, peso, savedLabels, threads, type Listing } from '../../data/mock';
import { useNav, useParams } from '../../nav/Navigator';
import { useStore } from '../../state/store';
import type { ScreenId } from '../registry';
import './inbox.css';

const spring = [0.32, 0.72, 0, 1] as const;

function Header({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="ih">
      <div className="ih__text">
        <h1 className="t-h3">{title}</h1>
        {sub && (
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={sub} className="t-b2 c-grey" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
              {sub}
            </motion.p>
          </AnimatePresence>
        )}
      </div>
      <div className="ih__actions">{actions}</div>
    </div>
  );
}

function RoundIcon({ src, w, h, label, onClick }: { src: string; w: number; h: number; label: string; onClick?: () => void }) {
  return (
    <motion.button type="button" className="round-icon" aria-label={label} whileTap={{ scale: 0.9 }} onClick={onClick}>
      <img src={src} width={w} height={h} alt="" />
    </motion.button>
  );
}

function Tabs<T extends string>({ tabs, value, onChange, id }: { tabs: T[]; value: T; onChange: (t: T) => void; id: string }) {
  return (
    <div className="itabs" role="tablist">
      {tabs.map((t) => (
        <button key={t} type="button" role="tab" aria-selected={t === value} className={t === value ? 'is-on' : ''} onClick={() => onChange(t)}>
          {t === value && <motion.span layoutId={`itab-${id}`} className="itabs__thumb" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
          <span>{t}</span>
        </button>
      ))}
    </div>
  );
}

/** `Card / Listing Row` — used by Favorites and Applications. */
function ListingRow({ listing, kicker, status, onOpen, onUnsave, index }: { listing: Listing; kicker: string; status?: { label: string; tone: string }; onOpen: () => void; onUnsave?: () => void; index: number }) {
  return (
    <motion.div
      layout
      className="lrow"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -80, transition: { duration: 0.25 } }}
      transition={{ duration: 0.4, ease: spring, delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="lrow__img">
        <img src={listing.id === 'cozy-loft' ? '/figma/listing-hero.webp' : listing.image} alt="" loading="lazy" />
        {onUnsave && (
          <motion.button
            type="button"
            className="glass-btn is-on lrow__heart"
            style={{ padding: 7 }}
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              onUnsave();
            }}
            aria-label="Remove from favorites"
          >
            <img src="/figma/glass-heart-on.svg" width={14} height={14} alt="" />
          </motion.button>
        )}
      </div>
      <div className="lrow__info">
        <p className="lrow__kicker">{kicker}</p>
        <div className="lrow__stack">
          <p className="t-b1-semibold c-primary lrow__title">{listing.title}</p>
          <p className="lrow__row">
            <span className="t-b2-medium">{peso(listing.price)}/month</span>
            <img src="/figma/dot-grey-4.svg" width={4} height={4} alt="" />
            <span className="t-b2 c-grey">{listing.maxOccupants ?? 4} Pax</span>
          </p>
        </div>
        <p className="lrow__row lrow__row--ll">
          <img className="lrow__ll" src={listing.id === 'cozy-loft' ? '/figma/landlord-shiela.webp' : listing.landlord.avatar} alt="" />
          {listing.landlord.name}
          <img src="/figma/dot-grey-4.svg" width={4} height={4} alt="" />
          {listing.landlord.rating.toFixed(2)}
          <img src="/figma/icon-star-yellow-12.svg" width={12} height={12} alt="" />
        </p>
        {status && (
          <motion.span layout className={`status-pill status-pill--${status.tone}`}>
            <span className="status-pill__dot" />
            {status.label}
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Favorites                                                           */
/* ------------------------------------------------------------------ */

type FavTab = 'All' | 'Available Now' | 'Price drop';

export function Favorites() {
  const nav = useNav<ScreenId>();
  const { state, toggleFavorite } = useStore();
  const [tab, setTab] = useState<FavTab>('All');
  const [sortAsc, setSortAsc] = useState(false);
  const saved = state.favorites.map(listingById);
  const shown = saved
    .filter((l) => (tab === 'Available Now' ? /ready|immediate/i.test(l.status) : tab === 'Price drop' ? l.price <= 22000 : true))
    .sort((a, b) => (sortAsc ? a.price - b.price : 0));

  return (
    <Screen footer={<TenantBottomNav active="favorites" />}>
      <div className="scroll inbox">
        <Header
          title="Favorites"
          sub={`${saved.length} saved ${saved.length === 1 ? 'property' : 'properties'}`}
          actions={
            <RoundIcon
              src="/figma/icon-sliders.svg"
              w={18.5}
              h={15.5}
              label="Sort by price"
              onClick={() => {
                setSortAsc((s) => !s);
                toast(sortAsc ? 'Sorted by date saved' : 'Sorted by price · low to high');
              }}
            />
          }
        />
        <Tabs id="fav" tabs={['All', 'Available Now', 'Price drop'] as FavTab[]} value={tab} onChange={setTab} />
        <motion.div layout className="lrows">
          <AnimatePresence mode="popLayout">
            {shown.map((l, i) => (
              <ListingRow
                key={l.id}
                index={i}
                listing={l}
                kicker={savedLabels[l.id] ?? 'Added just now'}
                onOpen={() => nav.push('viewListing', { params: { id: l.id } })}
                onUnsave={() => {
                  toggleFavorite(l.id);
                  toast('Removed from Favorites');
                }}
              />
            ))}
          </AnimatePresence>
          {shown.length === 0 && (
            <motion.div className="empty" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <img src="/figma/nav-heart-off.svg" width={24} height={24} alt="" />
              <p className="t-b1-semibold">Nothing here yet</p>
              <p className="t-b2 c-grey">Tap the heart on any listing to save it.</p>
              <Button size="md" onClick={() => nav.reset(['tenantDashboard'], { transition: 'smart' })}>
                Discover places
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Application List                                                    */
/* ------------------------------------------------------------------ */

export function ApplicationList() {
  const nav = useNav<ScreenId>();
  const { state } = useStore();
  const [tab, setTab] = useState<FavTab>('All');
  const app = state.application;
  const heroStatus =
    app.status === 'approved'
      ? { label: 'Approved', tone: 'good' }
      : app.status === 'declined'
        ? { label: 'Declined', tone: 'bad' }
        : app.status === 'submitted'
          ? { label: 'Under review', tone: 'warn' }
          : { label: 'Draft · not submitted', tone: 'neutral' };
  const rows = [
    { listing: listingById(app.listingId), kicker: app.submittedAt ? `Submitted ${app.submittedAt}` : 'Added last Monday, August 14', status: heroStatus, open: () => (app.status === 'none' ? nav.push('apply1') : nav.push('applicationStatus')) },
    { listing: listings.spacious3br, kicker: 'Listed last Friday, April 14', status: { label: 'Viewing scheduled', tone: 'neutral' }, open: () => nav.push('viewListing', { params: { id: 'spacious-3br' } }) },
    { listing: listings.riverStudio, kicker: 'Updated yesterday, April 19', status: { label: 'Under review', tone: 'warn' }, open: () => nav.push('viewListing', { params: { id: 'river-studio' } }) },
  ];
  return (
    <Screen footer={<TenantBottomNav active="account" />}>
      <div className="scroll inbox">
        <div className="inbox__back">
          <motion.button type="button" className="round-icon" onClick={nav.back} whileTap={{ scale: 0.9 }} aria-label="Back">
            <img src="/figma/icon-arrow-left.svg" width={24} height={24} alt="" />
          </motion.button>
        </div>
        <Header title="Applications" sub={`${rows.length} active applications`} actions={<RoundIcon src="/figma/icon-sliders.svg" w={18.5} h={15.5} label="Filter" onClick={() => toast('Filters coming soon')} />} />
        <Tabs id="apps" tabs={['All', 'Available Now', 'Price drop'] as FavTab[]} value={tab} onChange={setTab} />
        <div className="lrows">
          {rows.map((r, i) => (
            <ListingRow key={r.listing.id} index={i} listing={r.listing} kicker={r.kicker} status={r.status} onOpen={r.open} />
          ))}
        </div>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Messages + thread                                                   */
/* ------------------------------------------------------------------ */

type MsgTab = 'All' | 'Unread' | 'Applications';

export function Messages() {
  const nav = useNav<ScreenId>();
  const { state } = useStore();
  const [tab, setTab] = useState<MsgTab>('All');
  const [read, setRead] = useState<string[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const list = threads
    .map((t) =>
      t.name === 'Shiela Mae Smith' && state.application.status === 'approved'
        ? { ...t, snippet: 'Congrats Juan! Your application is approved 🎉', time: 'Just now', unread: true }
        : t,
    )
    .filter((t) => (tab === 'Unread' ? t.unread && !read.includes(t.name) : tab === 'Applications' ? /review|application|approved/i.test(t.snippet) : true))
    .filter((t) => !query || t.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Screen footer={<TenantBottomNav active="messages" />}>
      <div className="scroll inbox">
        <Header
          title="Messages"
          actions={
            <>
              <RoundIcon src="/figma/icon-search-18.svg" w={20} h={20} label="Search" onClick={() => setQuery((q) => (q === null ? '' : null))} />
              <RoundIcon src="/figma/icon-sliders.svg" w={18.5} h={15.5} label="Filter" onClick={() => setTab('Unread')} />
            </>
          }
        />
        <AnimatePresence initial={false}>
          {query !== null && (
            <motion.input
              autoFocus
              className="msg-search"
              placeholder="Search conversations"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              initial={{ height: 0, opacity: 0, marginTop: -24 }}
              animate={{ height: 44, opacity: 1, marginTop: 0 }}
              exit={{ height: 0, opacity: 0, marginTop: -24 }}
            />
          )}
        </AnimatePresence>
        <Tabs id="msg" tabs={['All', 'Unread', 'Applications'] as MsgTab[]} value={tab} onChange={setTab} />
        <div className="threads">
          <AnimatePresence mode="popLayout" initial={false}>
            {list.map((t, i) => {
              const unread = t.unread && !read.includes(t.name);
              return (
                <motion.button
                  layout
                  key={t.name}
                  type="button"
                  className="thread"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  onClick={() => {
                    setRead((r) => [...r, t.name]);
                    nav.push('chatThread', { params: { name: t.name } });
                  }}
                >
                  <span className="thread__avatar">
                    <img src={t.name === 'Shiela Mae Smith' ? '/figma/landlord-shiela.webp' : t.avatar} alt="" />
                  </span>
                  <span className="thread__body">
                    <span className="thread__top">
                      <b>{t.name}</b>
                      <span className="thread__prop">• {t.property}</span>
                    </span>
                    <span className={`thread__snippet ${unread ? 'is-unread' : ''}`}>{t.snippet}</span>
                  </span>
                  <span className="thread__meta">
                    <span>{t.time}</span>
                    {unread && <motion.span className="thread__dot" layoutId={`dot-${t.name}`} />}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
          {list.length === 0 && <p className="t-b2 c-grey empty-line">No conversations here.</p>}
        </div>
      </div>
    </Screen>
  );
}

const seedChat: Record<string, { me: boolean; text: string }[]> = {
  'Juan Dela Cruz': [
    { me: false, text: juan.message },
    { me: false, text: 'Is the unit still available for August?' },
  ],
  'Shiela Mae Smith': [
    { me: true, text: juan.message },
    { me: false, text: 'Hi Juan! Thanks for applying 😊 Your documents look complete.' },
    { me: false, text: 'Docs look good, reviewing tonight.' },
  ],
};

/** Chat thread — not in the Figma file (Messages was a leaf); built from the same tokens. */
export function ChatThread() {
  const nav = useNav();
  const { name = 'Shiela Mae Smith' } = useParams<{ name: string }>();
  const { state } = useStore();
  const t = [...threads, ...landlordThreads].find((x) => x.name === name) ?? threads[0];
  const [msgs, setMsgs] = useState(() => {
    const base = seedChat[name] ?? [{ me: false, text: t.snippet }];
    return state.application.status === 'approved' && name === 'Shiela Mae Smith' ? [...base, { me: false, text: 'Congrats Juan! Your application is approved 🎉 Let’s set your move-in date.' }] : base;
  });
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing]);

  const send = () => {
    if (!draft.trim()) return;
    setMsgs((m) => [...m, { me: true, text: draft.trim() }]);
    setDraft('');
    setTimeout(() => setTyping(true), 500);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { me: false, text: 'Sounds good! I’ll get back to you shortly.' }]);
    }, 2000);
  };

  return (
    <Screen
      footer={
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Message ${name.split(' ')[0]}…`} />
          <motion.button type="submit" className="composer__send" disabled={!draft.trim()} whileTap={{ scale: 0.88 }} aria-label="Send">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </form>
      }
    >
      <div className="chat__head">
        <motion.button type="button" className="round-icon" onClick={nav.back} whileTap={{ scale: 0.9 }} aria-label="Back">
          <img src="/figma/icon-arrow-left.svg" width={24} height={24} alt="" />
        </motion.button>
        <span className="thread__avatar">
          <img src={name === 'Shiela Mae Smith' ? '/figma/landlord-shiela.webp' : t.avatar} alt="" />
        </span>
        <div>
          <p className="t-b1-semibold">{name}</p>
          <p className="t-b3 c-grey">{t.property} · usually replies within a day</p>
        </div>
      </div>
      <div className="scroll chat">
        {msgs.map((m, i) => (
          <motion.div key={i} className={`bubble ${m.me ? 'is-me' : ''}`} initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 34 }}>
            {m.text}
          </motion.div>
        ))}
        <AnimatePresence>
          {typing && (
            <motion.div className="bubble bubble--typing" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <span />
              <span />
              <span />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Account                                                             */
/* ------------------------------------------------------------------ */

export function Account() {
  const nav = useNav<ScreenId>();
  const { state, update } = useStore();
  const notif = state.tenant.notifications ?? true;
  const Row = ({ icon, w, h, label, value, badge, onClick, trailing }: { icon: string; w: number; h: number; label: string; value?: string; badge?: number; onClick?: () => void; trailing?: React.ReactNode }) => (
    <motion.button type="button" className="arow" onClick={onClick} whileTap={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
      <span className="arow__icon">
        {icon === 'feather:chevrons-down' ? <ChevronsDown size={22} strokeWidth={2} color="#1e1e1e" /> : <img src={`/figma/${icon}.svg`} width={w} height={h} alt="" />}
        {!!badge && <span className="arow__badge">{badge}</span>}
      </span>
      <span className="arow__label">{label}</span>
      {value && <span className="arow__value">{value}</span>}
      {trailing ?? <img src="/figma/icon-chevron-right-grey.svg" width={6} height={10} alt="" />}
    </motion.button>
  );

  return (
    <Screen footer={<TenantBottomNav active="account" />}>
      <div className="scroll inbox inbox--account">
        <p className="t-b2 account__label">Account</p>
        <motion.div className="profile-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: spring }}>
          <div className="profile-card__avatar">
            <img src="/figma/juan-portrait.webp" alt={juan.name} />
          </div>
          <p className="t-h2">{juan.name}</p>
          <div className="profile-card__chips">
            <span className="vchip">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <circle cx="12" cy="12" r="11" fill="#fff" />
                <path d="m7 12.5 3 3 7-7" fill="none" stroke="#BA0E0A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              ID Verified
            </span>
            <span className="vchip">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <circle cx="12" cy="12" r="11" fill="#fff" />
                <path d="m7 12.5 3 3 7-7" fill="none" stroke="#BA0E0A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Employment Verified
            </span>
          </div>
          <div className="profile-card__stats">
            <button type="button" onClick={() => nav.push('reliabilityScore')}>
              <b>{juan.score}</b>
              <span>Reliability Score</span>
            </button>
            <span className="profile-card__div" />
            <div>
              <b>{juan.rating}</b>
              <span>Rating</span>
            </div>
            <span className="profile-card__div" />
            <div>
              <b>{juan.onTime}</b>
              <span>On-time</span>
            </div>
          </div>
        </motion.div>
        <div className="agroup">
          <Row icon="icon-user" w={16.6667} h={18.5} label="Personal Information" onClick={() => nav.push('apply1', { params: { review: true } })} />
          <Row icon="icon-shield-outline" w={16.6667} h={20.3333} label="Identity Verification" value="Verified" onClick={() => nav.push('reliabilityScore')} />
          <Row icon="icon-file-text" w={16.6667} h={20.3333} label="My Applications" value="3 active" badge={state.application.status === 'approved' ? 1 : undefined} onClick={() => nav.push('applicationList', { transition: 'dissolve' })} />
        </div>
        <div className="agroup">
          <Row icon="feather:chevrons-down" w={22} h={22} label="Payment Methods" value="GCash" onClick={() => toast('GCash •••• 4922 is your default')} />
          <Row
            icon="icon-bell"
            w={18.5002}
            h={20.3301}
            label="Notifications"
            onClick={() => update((s) => ({ ...s, tenant: { ...s.tenant, notifications: !notif } }))}
            trailing={<Switch on={notif} onChange={(v) => update((s) => ({ ...s, tenant: { ...s.tenant, notifications: v } }))} label="Notifications" />}
          />
          <Row icon="icon-info" w={20.3333} h={20.3333} label="Help Center" onClick={() => toast('Help Center opens in a browser')} />
        </div>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Tenant — Application status (Approved / Under review / Declined)    */
/* ------------------------------------------------------------------ */

export function ApplicationStatus() {
  const nav = useNav<ScreenId>();
  const { state } = useStore();
  const app = state.application;
  const l = listingById(app.listingId);
  const approved = app.status === 'approved';
  const declined = app.status === 'declined';
  const title = approved ? 'Application approved!' : declined ? 'Not this time' : 'Under review';
  const sub = approved
    ? 'Your application has been approved by the landlord'
    : declined
      ? `${l.landlord.name.split(' ')[0]} chose another applicant. Your Reliability Score is unaffected.`
      : `${l.landlord.name.split(' ')[0]} is reviewing your details. Switch to the landlord journey to decide.`;

  return (
    <Screen tone="light" backdrop={<div className="sent__hero approved__hero"><img src={l.id === 'cozy-loft' ? '/figma/listing-hero.webp' : l.image} alt="" /></div>}>
      <motion.button type="button" className="glass-round approved__back" whileTap={{ scale: 0.9 }} onClick={nav.back} aria-label="Back">
        <img src="/figma/glass-arrow-left-20.svg" width={20} height={20} alt="" />
      </motion.button>
      {approved ? (
        <motion.img
          className="approved__badge"
          src="/figma/approved-badge.webp"
          width={190}
          height={190}
          alt=""
          initial={{ scale: 0, rotate: -120 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 13, delay: 0.15 }}
        />
      ) : (
        <motion.div className={`approved__pending ${declined ? 'is-declined' : ''}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}>
          {declined ? '✕' : <span className="approved__spinner" />}
        </motion.div>
      )}
      {approved && <Burst />}
      <div className="approved__body">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5, ease: spring }}>
          <h1 className="t-title-3">{title}</h1>
          <p className="t-h4-regular c-grey approved__sub">{sub}</p>
        </motion.div>
        <motion.div className="applying" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5, ease: spring }}>
          <div className="applying__img">
            <img src={l.id === 'cozy-loft' ? '/figma/listing-hero.webp' : l.image} alt="" />
          </div>
          <div className="applying__info">
            <p className="applying__kicker">Applying for:</p>
            <p className="t-b1-semibold c-primary applying__title">{l.title}</p>
            <p className="applying__row">
              <span className="t-b2-medium">{peso(l.price)}/month</span>
              <img src="/figma/dot-grey-4.svg" width={4} height={4} alt="" />
              <span className="t-b2 c-grey">{l.maxOccupants ?? 4} Pax</span>
            </p>
            <p className="applying__row applying__row--small">
              {l.inclusion} free
              <img src="/figma/dot-grey-4.svg" width={4} height={4} alt="" />
              {l.rating.toFixed(2)}
              <span className="applying__stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <img key={i} src="/figma/icon-star-yellow-12.svg" width={12} height={12} alt="" />
                ))}
              </span>
            </p>
          </div>
        </motion.div>
        <motion.div className="sent__buttons" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5, ease: spring }}>
          <Button onClick={() => nav.push('chatThread', { params: { name: l.landlord.name } })}>Message Landlord</Button>
          <Button variant="secondary" className="btn--outline-light" onClick={() => nav.reset(['tenantDashboard'], { transition: 'push' })}>
            Back to dashboard
          </Button>
        </motion.div>
      </div>
    </Screen>
  );
}

function Burst() {
  return (
    <div className="burst" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            style={{ background: i % 2 ? '#FFDD52' : '#F32420' }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{ x: Math.cos(a) * 150, y: Math.sin(a) * 150, opacity: [0, 1, 0], scale: 1 }}
            transition={{ duration: 1, delay: 0.45, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}
