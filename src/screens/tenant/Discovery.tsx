import { animate, AnimatePresence, motion, useMotionValue, useScroll, useTransform } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { Screen } from '../../components/Chrome';
import { Button, Switch } from '../../components/Controls';
import { GlassHeart, ListingCard, TenantBottomNav, toast } from '../../components/Feed';
import { SwipeGallery } from '../../components/SwipeGallery';
import { emojiFor } from '../../data/emoji';
import { Calendar, formatDate, Overlay } from '../../components/Inputs';
import { feed, lifestyleChips, lifestyleMatch, listingById, mapPins, peso, photos, type Listing, type MapPin } from '../../data/mock';
import { useNav, useParams } from '../../nav/Navigator';
import { useStore } from '../../state/store';
import type { ScreenId } from '../registry';
import './tenant.css';

const spring = [0.32, 0.72, 0, 1] as const;

/* ------------------------------------------------------------------ */
/* Tenant / Dashboard                                                  */
/* ------------------------------------------------------------------ */

export function TenantDashboard() {
  const nav = useNav<ScreenId>();
  const [chips, setChips] = useState<string[]>(['Urban']);
  const toggle = (c: string) => setChips((xs) => (xs.includes(c) ? xs.filter((x) => x !== c) : [...xs, c]));

  const sections = useMemo(
    () =>
      feed.map((s) => ({
        ...s,
        items: s.items.filter((l, i) => chips.length === 0 || (i === 0 && l.id === 'cozy-loft') || chips.some((c) => lifestyleMatch[c]?.(l))),
      })),
    [chips],
  );

  return (
    <Screen footer={<TenantBottomNav active="discover" />}>
      <div className="scroll dash">
        <div className="dash__head">
          <motion.button type="button" layoutId="search-bar" className="dash-search" onClick={() => nav.push('mapView', { transition: 'smart' })} whileTap={{ scale: 0.98 }} transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}>
            <img src="/figma/icon-search-40.svg" width={40} height={40} alt="" />
            <span className="dash-search__text">
              <span className="t-h4">What's your next destination?</span>
              <span className="t-b2 c-grey">Try searching near your favorite cafe...</span>
            </span>
          </motion.button>
          <div className="dash__chips scroll-x">
            {lifestyleChips.map((c) => {
              const on = chips.includes(c.label);
              return (
                <motion.button key={c.label} type="button" className={`toggle-chip ${on ? 'is-on' : ''}`} aria-pressed={on} onClick={() => toggle(c.label)} whileTap={{ scale: 0.94 }}>
                  <span className="toggle-chip__emoji">{c.emoji}</span>
                  <span>{c.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
        {sections.map((s) => (
          <section key={s.title} className="dash-section">
            <button type="button" className="dash-section__head" onClick={() => nav.push('mapView', { transition: 'smart' })}>
              <span className="t-h4">{s.title}</span>
              <img src="/figma/icon-chevron-right-18.svg" width={18} height={18} alt="" />
            </button>
            <div className="dash-section__list scroll-x">
              <AnimatePresence mode="popLayout" initial={false}>
                {s.items.length === 0 ? (
                  <motion.p key="empty" className="dash-section__empty t-b2 c-grey" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    No matches for these filters — try another chip.
                  </motion.p>
                ) : (
                  s.items.map((l, i) => <ListingCard key={`${s.title}-${l.id}`} listing={l} index={i} />)
                )}
              </AnimatePresence>
            </div>
          </section>
        ))}
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* Tenant Search — Map View (+ Active Listing sheet + Filters)         */
/* ------------------------------------------------------------------ */

const MAP_W = 1803;
const MAP_H = 1014;

export function MapView({ initialListing, openFilters = false }: { initialListing?: string; openFilters?: boolean }) {
  const nav = useNav<ScreenId>();
  const params = useParams<{ listing: string }>();
  const { state, update } = useStore();
  const preselect = params.listing ?? initialListing;
  const [active, setActive] = useState<MapPin | null>(() => (preselect ? mapPins.find((p) => p.listing?.id === preselect) ?? null : null));
  const [filters, setFilters] = useState(openFilters);
  const clampX = (v: number) => Math.min(0, Math.max(440 - MAP_W, v));
  const clampY = (v: number) => Math.min(0, Math.max(950 - MAP_H, v));
  const initialPin = active;
  const x = useMotionValue(initialPin ? clampX(220 - initialPin.x - 50) : -1008);
  const y = useMotionValue(initialPin ? clampY(300 - initialPin.y) : -44);

  /** Selecting a pin pans the map so the pin sits centred above the sheet. */
  const select = (p: MapPin) => {
    setActive(p);
    animate(x, clampX(220 - p.x - 50), { type: 'spring', stiffness: 120, damping: 22 });
    animate(y, clampY(300 - p.y), { type: 'spring', stiffness: 120, damping: 22 });
  };

  const f = state.filters;
  const typeOf = (l: Listing) => (/^Room/.test(l.location) ? 'Room for rent' : /^Studio|^Loft/.test(l.location) ? 'Studio' : /^Condo/.test(l.location) ? 'Condo' : 'Apartment');
  const pinMatches = (p: MapPin) => !!p.listing && (f.types.length === 0 || f.types.includes(typeOf(p.listing)));

  return (
    <Screen
      tone="light"
      background="#e8e6e1"
      className="map-screen"
      backdrop={
        <>
          {/* Draggable map canvas — the Figma map export, positioned exactly as in the frame. */}
          <div className="map">
            <motion.div
              className="map__canvas"
              style={{ x, y, width: MAP_W, height: MAP_H }}
              drag
              dragConstraints={{ left: 440 - MAP_W, right: 0, top: 950 - MAP_H, bottom: 0 }}
              dragElastic={0.08}
              dragMomentum
            >
              <img src="/figma/map.webp" width={MAP_W} height={MAP_H} alt="Map of Uptown Center, Quezon City" draggable={false} />
              <div className="map__tint" />
              {mapPins.map((p, i) => {
                const isActive = active === p;
                const ok = pinMatches(p);
                return (
                  <motion.button
                    key={i}
                    type="button"
                    className={`pin ${isActive ? 'is-active' : ''} ${ok ? '' : 'is-inactive'}`}
                    style={{ left: p.x, top: p.y }}
                    disabled={!ok}
                    initial={{ opacity: 0, y: 12, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: isActive ? 1.08 : 1 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 24, delay: active ? 0 : 0.1 + i * 0.04 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => select(p)}
                  >
                    {p.emoji} {p.listing ? peso(p.listing.price) : p.label}
                  </motion.button>
                );
              })}
              <AnimatePresence>
                {active && <motion.div className="map__dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={() => setActive(null)} />}
              </AnimatePresence>
            </motion.div>
          </div>
        </>
      }
    >
      <motion.div layoutId="search-bar" className="map-search" transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}>
        <motion.button type="button" className="map-tool map-tool--back" onClick={nav.back} whileTap={{ scale: 0.9 }} aria-label="Back">
          <img src="/figma/icon-arrow-left-map.svg" width={20.488} height={20.488} alt="" />
        </motion.button>
        <div className="map-search__field">
          <p className="t-b1-semibold">Uptown Center, Manila</p>
          <p className="map-search__sub">
            Apartment / Studio
            <img src="/figma/dot-2.svg" width={2} height={2} alt="" />
            {f.moveIn ? `From ${f.moveIn.replace(/, \d{4}$/, '')}` : 'Available Now'}
          </p>
        </div>
        <motion.button type="button" className="map-tool map-tool--filter" onClick={() => setFilters(true)} whileTap={{ scale: 0.9 }} aria-label="Filters">
          <img src="/figma/icon-filter-blobs.svg" width={17.143} height={17.143} alt="" />
          {(f.moveIn || f.verifiedOnly || f.types.length > 0 || f.amenities.length > 0) && <span className="map-tool__dot" />}
        </motion.button>
      </motion.div>

      <AnimatePresence>{active?.listing && <ListingSheet key={active.listing.id} listing={active.listing} onClose={() => setActive(null)} />}</AnimatePresence>

      <FilterSheet open={filters} onClose={() => setFilters(false)} onApply={(next) => update((s) => ({ ...s, filters: { ...s.filters, ...next } }))} />
    </Screen>
  );
}

/** `Tenant / Active Listing` — the map with the hero pin selected and its sheet up. */
export function ActiveListing() {
  return <MapView initialListing="cozy-loft" />;
}

/** `Sheet / Map Listing View` — gallery, quick actions, CTA row. */
function ListingSheet({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const nav = useNav<ScreenId>();
  const gallery = listing.gallery ?? [listing.image, photos.aptWarmWood, photos.bathroom, photos.loftWindows];
  const [page, setPage] = useState(0);
  const { state, update } = useStore();
  const applied = state.application.status !== 'none' && state.application.listingId === listing.id;
  const apply = () => {
    if (applied) return nav.push('applicationStatus');
    update((s) => ({ ...s, application: { ...s.application, listingId: listing.id } }));
    nav.push('apply1');
  };
  return (
    <motion.div
      className="lsheet"
      initial={{ y: 520, opacity: 0.6 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 520, opacity: 0 }}
      transition={{ duration: 0.42, ease: spring }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.05, bottom: 0.7 }}
      onDragEnd={(_, i) => (i.offset.y > 110 || i.velocity.y > 500) && onClose()}
    >
      <div className="lsheet__gallery">
        <SwipeGallery images={gallery} width={390} page={page} onPage={setPage} />
        <div className="lsheet__dots">
          {gallery.map((_, i) => (
            <motion.span key={i} animate={{ width: i === page ? 20 : 8, opacity: i === page ? 1 : 0.6 }} transition={{ duration: 0.25 }} />
          ))}
        </div>
        <div className="lsheet__tags">
          <span className="avail-tag">
            <img src="/figma/dot-green.svg" width={10} height={10} alt="" />
            Available
          </span>
          <div className="lsheet__actions">
            <GlassHeart id={listing.id} size={18} pad={9} />
            <motion.button type="button" className="glass-btn" style={{ padding: 9 }} whileTap={{ scale: 0.85 }} onClick={() => nav.push('viewListing', { params: { id: listing.id } })} aria-label="Preview">
              <img src="/figma/glass-eye-18.svg" width={18} height={18} alt="" />
            </motion.button>
            <motion.button type="button" className="lsheet__close" whileTap={{ scale: 0.85, rotate: 90 }} onClick={onClose} aria-label="Close">
              <img src="/figma/icon-x-white-24.svg" width={24} height={24} alt="" />
            </motion.button>
          </div>
        </div>
      </div>
      <div className="lsheet__details">
        <div className="lsheet__stack">
          <div className="lsheet__stack lsheet__stack--20">
            <div className="lsheet__stack">
              <div className="lsheet__row">
                <span className="verified-row">
                  <span className="verified-badge">
                    <img src="/figma/verified-badge.svg" width={19.86} height={19.86} alt="" />
                    <img className="verified-badge__check" src="/figma/verified-check.svg" width={12} height={12} alt="" />
                  </span>
                  <span className="t-b2 c-grey">Verified Landlord</span>
                </span>
                <span className="lsheet__rating">
                  <img src="/figma/icon-star-20.svg" width={20} height={20} alt="" />
                  <b>{listing.rating.toFixed(2)}</b>
                  <span>({listing.reviews})</span>
                </span>
              </div>
              <p className="t-h4 c-primary">{listing.id === 'cozy-loft' ? 'Cozy Loft in Uptown Center, Manila' : listing.title}</p>
            </div>
            <p className="t-h2">{peso(listing.price)} / month</p>
          </div>
          <p className="lsheet__meta">
            {/included/i.test(listing.inclusion) ? listing.inclusion : `${listing.inclusion} Included`}
            <img src="/figma/dot-4.svg" width={4} height={4} alt="" />
            Up to {listing.maxOccupants ?? 4} pax
          </p>
        </div>
        <div className="lsheet__cta">
          <motion.button type="button" className="pill-btn" whileTap={{ scale: 0.96 }} onClick={() => nav.push('viewListing', { params: { id: listing.id } })}>
            View Details
          </motion.button>
          <motion.button type="button" className="pill-btn pill-btn--primary" whileTap={{ scale: 0.96 }} onClick={apply}>
            {applied ? 'View application' : 'Apply now'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

type Filters = { moveIn: string | null; verifiedOnly: boolean; types: string[]; amenities: string[] };

const PLACE_TYPES = ['Studio', 'Condo', 'Apartment', 'Room for rent'];
const VIBES = ['Near transit', 'City Center', 'Gym', 'Near Supermarket', 'Quiet', 'Nightlife', 'Security'];

/** `Toggle / Option` — Default: white + Neutral/200 stroke · Active: Red/300 fill. */
function ToggleOption({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <motion.button type="button" aria-pressed={on} className={`toggle-option ${on ? 'is-on' : ''}`} onClick={onClick} whileTap={{ scale: 0.95 }}>
      {emojiFor(label)} {label}
    </motion.button>
  );
}

/** `Sheet / Base` + `Modal / Filter Content`, structure and spacing per Figma frame 2662:12774. */
function FilterSheet({ open, onClose, onApply }: { open: boolean; onClose: () => void; onApply: (f: Filters) => void }) {
  const { state } = useStore();
  const [later, setLater] = useState(!!state.filters.moveIn);
  const [date, setDate] = useState<Date>(new Date(2026, 7, 14));
  const [verified, setVerified] = useState(state.filters.verifiedOnly);
  const [types, setTypes] = useState<string[]>(state.filters.types);
  const [vibes, setVibes] = useState<string[]>(state.filters.amenities);
  const flip = (xs: string[], x: string) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);
  const none = !later && !verified && types.length === 0 && vibes.length === 0;
  const count = Math.max(3, Math.round(1000 * (later ? 0.64 : 1) * (verified ? 0.82 : 1) * (types.length ? types.length * 0.22 : 1) * Math.pow(0.86, vibes.length)));
  const label = none ? '1000+' : String(count);

  return (
    <Overlay open={open} onClose={onClose}>
      <div className="filters">
        <button type="button" className="date-sheet__close" onClick={onClose} aria-label="Close">
          <img src="/figma/icon-x.svg" width={32} height={32} alt="" />
        </button>
        <p className="filters__title">Filters</p>
        <div className="filters__scroll scroll">
          <div className="filters__content">
            <div className="filters__group">
              <p className="filters__label">Move-in date</p>
              <div className="seg-control" role="tablist">
                {['Available Now', 'On a later date'].map((t, i) => {
                  const on = (i === 1) === later;
                  return (
                    <button key={t} type="button" role="tab" aria-selected={on} className={`seg-control__opt ${on ? 'is-on' : ''}`} onClick={() => setLater(i === 1)}>
                      {on && <motion.span layoutId="seg-control" className="seg-control__thumb" transition={{ type: 'spring', stiffness: 500, damping: 36 }} />}
                      <span className="seg-control__label">
                        {emojiFor(t)} {t}
                      </span>
                    </button>
                  );
                })}
              </div>
              <AnimatePresence initial={false}>
                {later && (
                  <motion.div className="filters__calendar" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: spring }}>
                    <Calendar value={date} onChange={setDate} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <hr className="filters__divider" />
            <div className="filters__group">
              <div className="filters__row">
                <p className="filters__label">Verified landlords only</p>
                <Switch on={verified} onChange={setVerified} label="Verified landlords only" />
              </div>
              <p className="filters__desc">This ensures that only verified landlords from our system are shown</p>
            </div>
            <hr className="filters__divider" />
            <div className="filters__group">
              <p className="filters__label">Type of place</p>
              <div className="toggle-grid">
                {PLACE_TYPES.map((t) => (
                  <ToggleOption key={t} label={t} on={types.includes(t)} onClick={() => setTypes((xs) => flip(xs, t))} />
                ))}
              </div>
            </div>
            <hr className="filters__divider" />
            <div className="filters__group">
              <p className="filters__label">Amenities and Vibes</p>
              <div className="toggle-wrap">
                {VIBES.map((t) => (
                  <ToggleOption key={t} label={t} on={vibes.includes(t)} onClick={() => setVibes((xs) => flip(xs, t))} />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="filters__footer">
          <Button
            onClick={() => {
              onApply({ moveIn: later ? formatDate(date) : null, verifiedOnly: verified, types, amenities: vibes });
              onClose();
            }}
          >
            Show{' '}
            <motion.span key={label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'inline-block' }}>
              {label}
            </motion.span>{' '}
            places
          </Button>
          <button
            type="button"
            className="primary-skip__skip"
            onClick={() => {
              setLater(false);
              setVerified(false);
              setTypes([]);
              setVibes([]);
              onApply({ moveIn: null, verifiedOnly: false, types: [], amenities: [] });
            }}
          >
            Remove filters
          </button>
        </div>
      </div>
    </Overlay>
  );
}

/* ------------------------------------------------------------------ */
/* Tenant / View Listing                                               */
/* ------------------------------------------------------------------ */

const amenities = ['❄️ Air conditioning', '👥 Good for 6 Persons', '📶 Fast Wi-Fi', '🧺 In-unit washing machine', '🐾 Pet-friendly', '🏋️ Gym access'];
const moreAmenities = ['🍳 Full kitchen', '🧹 Laundry area', '🚗 Street parking', '🔐 Keyless entry', '📺 Smart TV', '🛗 Elevator', '🚿 Hot shower', '🌿 Shared roof deck'];

function Amenity({ item }: { item: string }) {
  const [emoji, ...rest] = item.split(' ');
  return (
    <>
      <span className="amenity__emoji" aria-hidden>
        {emoji}
      </span>
      {rest.join(' ')}
    </>
  );
}

export function ViewListing() {
  const nav = useNav<ScreenId>();
  const params = useParams<{ id: string }>();
  const listing = listingById(params.id ?? 'cozy-loft');
  const isHero = listing.id === 'cozy-loft';
  const { state, update } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const headerBg = useTransform(scrollY, [300, 380], [0, 1]);
  const heroScale = useTransform(scrollY, [-200, 0], [1.4, 1]);
  const [page, setPage] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [readMore, setReadMore] = useState(false);
  const gallery = isHero ? ['/figma/listing-hero.webp', ...(listing.gallery ?? []).slice(1)] : listing.gallery ?? [listing.image, photos.aptWarmWood, photos.bathroom];
  const applied = state.application.status !== 'none' && state.application.listingId === listing.id;

  const rooms = [
    { img: '/figma/room-furnishing.webp', title: 'Furnishing Status', sub: 'Fully furnished' },
    { img: '/figma/room-bedroom.webp', title: 'Bedroom', sub: isHero ? '4 Double Beds' : '2 Double Beds' },
    { img: '/figma/room-bathroom.webp', title: 'Bathroom', sub: isHero ? '2 shared bathrooms' : '1 private bathroom' },
    { img: '/figma/room-area.webp', title: 'Housing Area', sub: isHero ? '100 square meters' : '48 square meters' },
  ];

  return (
    <Screen
      tone="light"
      footer={
        <div className="action-bar">
          <div className="action-bar__price">
            <p className="t-h3 underline">{peso(listing.price)}/month</p>
            <p className="t-b2 c-grey">{listing.maxOccupants ?? 4} pax</p>
          </div>
          <motion.button
            type="button"
            className="pill-btn pill-btn--primary action-bar__cta"
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              if (applied) nav.push('applicationStatus');
              else {
                update((s) => ({ ...s, application: { ...s.application, listingId: listing.id } }));
                nav.push('apply1');
              }
            }}
          >
            {applied ? 'View application' : 'Apply now'}
          </motion.button>
        </div>
      }
    >
      <div className="vl" ref={scrollRef}>
        <div className="vl__hero">
          <motion.div className="vl__track" style={{ scale: heroScale }}>
            <SwipeGallery images={gallery} width={440} page={page} onPage={setPage} />
          </motion.div>
          <div className="vl__hero-tags">
            <span className="glass-tag">{listing.location.split(' in ')[0]}</span>
            <span className="glass-tag">
              {isHero && page >= gallery.length / 2 ? 20 - (gallery.length - 1 - page) : page + 1} / {isHero ? 20 : gallery.length}
            </span>
          </div>
        </div>

        <div className="vl__body">
          <motion.div className="vl__intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: spring, delay: 0.15 }}>
            <h1 className="vl__title">{isHero ? 'Cozy Loft in Uptown Center, Manila' : listing.title}</h1>
            <div className="vl__sub">
              <p className="t-b1-semibold">{listing.location}</p>
              <p className="vl__beds">
                {isHero ? '4 Double Beds' : '2 Double Beds'}
                <img src="/figma/dot-grey-4.svg" width={4} height={4} alt="" />
                Shared bathroom
              </p>
            </div>
          </motion.div>

          <div className="vl__stats">
            <div className="vl__stat">
              <p className="t-h3">{listing.rating.toFixed(2)}</p>
              <span className="vl__stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <motion.img key={i} src="/figma/icon-star-yellow-12.svg" width={12} height={12} alt="" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.06, type: 'spring', stiffness: 500, damping: 15 }} />
                ))}
              </span>
            </div>
            <img className="vl__vdiv" src="/figma/divider-v45.svg" width={45} height={1} alt="" />
            <div className="vl__fav">
              <img src="/figma/laurel-left.svg" width={20} height={37.551} alt="" style={{ transform: 'scaleY(-1) rotate(180deg)' }} />
              <p>
                Tenant
                <br />
                Favorite
              </p>
              <img src="/figma/laurel-right.svg" width={20} height={37.551} alt="" />
            </div>
            <img className="vl__vdiv" src="/figma/divider-v45.svg" width={45} height={1} alt="" />
            <div className="vl__stat">
              <p className="t-h3">{listing.reviews}</p>
              <p className="t-b1-medium c-grey">Reviews</p>
            </div>
          </div>

          <img src="/figma/divider-dashed.svg" width={392} height={1} alt="" />

          <div className="landlord-row">
            <div className="landlord-row__avatar">
              <div className="landlord-row__ring">
                <img src={isHero ? '/figma/landlord-shiela.webp' : listing.landlord.avatar} alt="" />
              </div>
              <span className="landlord-row__check">
                <img src="/figma/icon-check-white-12.svg" width={12} height={12} alt="" />
              </span>
            </div>
            <div className="landlord-row__text">
              <p className="landlord-row__meta">
                <span>
                  {listing.landlord.rating.toFixed(2)}
                  <img src="/figma/icon-star-grey-12.svg" width={12} height={12} alt="" />
                </span>
                <img src="/figma/dot-grey-4.svg" width={4} height={4} alt="" />
                Verified Landlord
              </p>
              <p className="landlord-row__name">{listing.landlord.name}</p>
            </div>
          </div>

          <img src="/figma/divider-solid.svg" width={392} height={1} alt="" />

          <div className="vl__block">
            <h2 className="vl__h2">Where you’ll live</h2>
            <div className="rooms">
              {rooms.map((r, i) => (
                <motion.div key={r.title} className="room" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, root: scrollRef }} transition={{ delay: (i % 2) * 0.08, duration: 0.45, ease: spring }}>
                  <div className="room__img">
                    <img src={r.img} alt="" loading="lazy" />
                  </div>
                  <div className="room__text">
                    <p className="t-b1-semibold">{r.title}</p>
                    <p className="t-b2 room__sub">{r.sub}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <img src="/figma/divider-solid.svg" width={392} height={1} alt="" />

          <div className="vl__block">
            <h2 className="vl__h2">What this place offers</h2>
            <div className="amenities">
              {amenities.map((a) => (
                <p key={a} className="amenity">
                  <Amenity item={a} />
                </p>
              ))}
              <AnimatePresence initial={false}>
                {moreOpen &&
                  moreAmenities.map((a, i) => (
                    <motion.p key={a} className="amenity" initial={{ opacity: 0, x: -10, height: 0 }} animate={{ opacity: 1, x: 0, height: 24 }} exit={{ opacity: 0, height: 0 }} transition={{ delay: i * 0.03, duration: 0.25 }}>
                      <Amenity item={a} />
                    </motion.p>
                  ))}
              </AnimatePresence>
            </div>
            <Button variant="primary" size="md" className="btn--dark" onClick={() => setMoreOpen((o) => !o)}>
              {moreOpen ? 'Show less' : 'Show 8 others'}
            </Button>
          </div>

          <img src="/figma/divider-solid.svg" width={392} height={1} alt="" />

          <div className="vl__block">
            <h2 className="vl__h2">Lease terms &amp; House Rules</h2>
            <ul className="rules">
              <li>6 Months Minimum Lease Duration</li>
              <li>1 month advance, 1 month deposit</li>
              <li>No Smoking</li>
              <li>Avoid making noise at midnight</li>
            </ul>
          </div>

          <img src="/figma/divider-solid.svg" width={392} height={1} alt="" />

          <div className="vl__block vl__block--about">
            <h2 className="vl__h2">About this place</h2>
            <p className="vl__about">
              Welcome to your new home in the heart of Uptown Center, Manila! This cozy loft offers the perfect blend of comfort and convenience, nestled just minutes away from vibrant shopping malls, gourmet restaurants, and serene parks. You'll enjoy easy access to public transportation, making your daily commute a breeze. The neighborhood is known for its friendly and respectful community, ensuring a peaceful and welcoming atmosphere for all residents.
            </p>
            <AnimatePresence initial={false}>
              {readMore && (
                <motion.div className="vl__about vl__about--more" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: spring }}>
                  <p>
                    The loft sits on the fourth floor of a secured building with 24/7 guards and keycard access. Inside you’ll find four double beds across two sleeping areas, two shared bathrooms with hot showers, and a full kitchen.
                  </p>
                  <p>Shiela lives nearby and typically responds within the day. Electricity and water are included in the rent.</p>
                </motion.div>
              )}
            </AnimatePresence>
            <Button variant="primary" size="md" className="btn--dark" onClick={() => setReadMore((r) => !r)}>
              {readMore ? 'Show less' : 'Read more'}
            </Button>
          </div>
        </div>
      </div>

      <motion.div className="vl__bar" style={{ opacity: headerBg }}>
        <p className="t-b1-semibold">{listing.title}</p>
      </motion.div>
      <div className="vl__top">
        <motion.button type="button" className="glass-round" whileTap={{ scale: 0.88 }} onClick={nav.back} aria-label="Back">
          <img src="/figma/glass-arrow-left-20.svg" width={20} height={20} alt="" />
        </motion.button>
        <div className="vl__top-right">
          <motion.button
            type="button"
            className="glass-round"
            whileTap={{ scale: 0.88 }}
            aria-label="Share"
            onClick={() => {
              navigator.clipboard?.writeText(`https://espas.you/l/${listing.id}`).catch(() => {});
              toast('Link copied to clipboard');
            }}
          >
            <img src="/figma/glass-share-20.svg" width={20} height={20} alt="" />
          </motion.button>
          <GlassHeart id={listing.id} size={20} pad={10} />
        </div>
      </div>
    </Screen>
  );
}

/** Jumper entry for the Filters frame: the map with the filter sheet already open. */
export function MapFiltersEntry() {
  return <MapView openFilters />;
}
