import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, Camera, FileText, Grid, Home, MessageCircle, Truck } from 'react-feather';
import { Screen } from '../../components/Chrome';
import { BackLink, Button, PhoneField, PrimaryWithSkip, ProgressBar, RadioCard, TitleBlock } from '../../components/Controls';
import { ratingShort, toast } from '../../components/Feed';
import { Overlay } from '../../components/Inputs';
import { SuccessBadge } from '../../components/Success';
import { emojiFor } from '../../data/emoji';
import { applicants, juan, landlordListings, landlordThreads, listings, peso, type ApplicantStatus } from '../../data/mock';
import { Portal, useNav, useParams } from '../../nav/Navigator';
import { draftToListing, initialDraft, useStore } from '../../state/store';
import { NotificationsStep, ReliabilityScore, rise } from '../onboarding/Onboarding';
import type { ScreenId } from '../registry';
import '../apply/apply.css';
import { conversationPreview, Header, RoundIcon, Tabs } from '../inbox/Inbox';
import '../inbox/inbox.css';
import './landlord.css';

const spring = [0.32, 0.72, 0, 1] as const;

/* ------------------------------------------------------------------ */
/* Landlord onboarding frame — header fixed, form scrolls, CTA pinned  */
/* ------------------------------------------------------------------ */

export function LandlordFrame({ step, children, cta, ctaSpace = 190 }: { step: number; children: ReactNode; cta: ReactNode; ctaSpace?: number }) {
  const nav = useNav();
  return (
    <Screen>
      <div className="step__back" style={{ left: 28, top: 19 }}>
        <BackLink onClick={nav.back} />
      </div>
      <div className="step-scroll__progress" style={{ top: 72 }}>
        <ProgressBar step={step} />
      </div>
      <div className="scroll ll-scroll" style={{ bottom: ctaSpace }}>
        <div className="ll-content">{children}</div>
      </div>
      <div className="ll-cta">{cta}</div>
    </Screen>
  );
}

export function LField({ label, value, onChange, inputMode }: { label: string; value: string; onChange: (v: string) => void; inputMode?: 'tel' | 'text' }) {
  return (
    <label className="afield tappable">
      <span className="afield__label">
        <span className="t-b1">{label}</span>
      </span>
      <span className="afield__pill">
        <input value={value} onChange={(e) => onChange(e.target.value)} inputMode={inputMode} />
      </span>
    </label>
  );
}

const local = (p: string) => p.replace('+63 ', '');

export function LandlordBasicInfo() {
  const nav = useNav<ScreenId>();
  const { state, update } = useStore();
  const ll = state.landlord;
  const [name, setName] = useState(`${ll.firstName} ${ll.lastName}`);
  const [phone, setPhone] = useState(local(ll.phone));
  const [address, setAddress] = useState(`${ll.address}, Capiz`);
  const ok = name.trim().length > 2 && phone.replace(/\D/g, '').length >= 10 && address.trim().length > 3;
  return (
    <LandlordFrame
      step={2}
      cta={
        <PrimaryWithSkip
          label="Submit"
          disabled={!ok}
          onPrimary={() => {
            update((s) => ({ ...s, landlord: { ...s.landlord, phone: `+63 ${phone}`, address: address.replace(/, Capiz$/, '') } }));
            nav.push('landlordEmergency');
          }}
          onSkip={nav.back}
        />
      }
    >
      <motion.div {...rise()}>
        <TitleBlock subtitle="2 / 5" title="Tell us about yourself" description="We'll use these details to set up your landlord profile and ensure seamless communication with future tenants." />
      </motion.div>
      <motion.div className="ll-fields" {...rise(0.06)}>
        <p className="t-h4">Identity and Verification</p>
        <LField label="Full Name" value={name} onChange={setName} />
        <PhoneField value={phone} onChange={setPhone} />
        <LField label="Address" value={address} onChange={setAddress} />
      </motion.div>
    </LandlordFrame>
  );
}

export function LandlordEmergency() {
  const nav = useNav<ScreenId>();
  const { state, update } = useStore();
  const e = state.landlord.emergency;
  const [name, setName] = useState(e.name);
  const [phone, setPhone] = useState(local(e.phone));
  const [address, setAddress] = useState(`${e.address}, Capiz`);
  const [relation, setRelation] = useState(e.relation);
  return (
    <LandlordFrame
      step={3}
      cta={
        <PrimaryWithSkip
          label="Submit"
          onPrimary={() => {
            update((s) => ({ ...s, landlord: { ...s.landlord, emergency: { name, phone: `+63 ${phone}`, address: address.replace(/, Capiz$/, ''), relation } } }));
            nav.push('landlordVerify');
          }}
          onSkip={nav.back}
        />
      }
    >
      <motion.div {...rise()}>
        <TitleBlock subtitle="3 / 5" title="Add an emergency contact" description="We'll only reach out to this person for urgent, property-related matters if we can't reach you." />
      </motion.div>
      <motion.div className="ll-fields" {...rise(0.06)}>
        <p className="t-h4">Emergency Contact</p>
        <LField label="Full Name" value={name} onChange={setName} />
        <PhoneField value={phone} onChange={setPhone} />
        <LField label="Address" value={address} onChange={setAddress} />
        <div className="ll-relations">
          <span className="t-b1">Relationship</span>
          <div className="prefs__chips" role="radiogroup">
            {['Spouse', 'Parent', 'Sibling', 'Friend'].map((r) => {
              const on = relation === r;
              return (
                <motion.button key={r} type="button" role="radio" aria-checked={on} className={`pref-chip ${on ? 'is-on' : ''}`} onClick={() => setRelation(r)} whileTap={{ scale: 0.94 }}>
                  <span>
                    {emojiFor(r)} {r}
                  </span>
                  <motion.img src={on ? '/figma/icon-x-white.svg' : '/figma/icon-plus.svg'} key={on ? 'x' : 'plus'} width={24} height={24} alt="" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ duration: 0.25, ease: spring }} />
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </LandlordFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 4 / 5 — Verify identity + ID scan modal                             */
/* ------------------------------------------------------------------ */

const ID_TYPES = ["Driver's License", 'Passport', 'PhilSys Card'];

export function LandlordVerify({ autoScan = false }: { autoScan?: boolean }) {
  const nav = useNav<ScreenId>();
  const { state, update } = useStore();
  const ll = state.landlord;
  const [idType, setIdType] = useState(ll.idType);
  const [scan, setScan] = useState<null | 'front' | 'back'>(autoScan ? 'front' : null);
  const captured = ll.idFront && ll.idBack;

  return (
    <LandlordFrame
      step={4}
      cta={
        <PrimaryWithSkip
          label={captured ? 'Continue' : 'Scan my ID'}
          skipLabel="Skip this process"
          onPrimary={() => (captured ? nav.push('landlordNotifications') : setScan(ll.idFront ? 'back' : 'front'))}
          onSkip={() => nav.push('landlordNotifications')}
        />
      }
    >
      <motion.div {...rise()}>
        <TitleBlock subtitle="4 / 5" title="Verify your Identity" description="We'll use this to verify your identity and won't share it with other hosts or guests." />
      </motion.div>
      <motion.div className="ll-fields" {...rise(0.06)}>
        <p className="t-h4">Upload a valid ID</p>
        <div className="ll-ids" role="radiogroup">
          {ID_TYPES.map((t) => (
            <RadioCard
              key={t}
              label={t}
              selected={idType === t}
              onSelect={() => {
                setIdType(t);
                if (t !== ll.idType) update((s) => ({ ...s, landlord: { ...s.landlord, idType: t, idFront: false, idBack: false } }));
                setTimeout(() => setScan('front'), 180);
              }}
            >
              <AnimatePresence>
                {idType === t && captured && (
                  <motion.span className="ll-ids__done" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    ✓ Front and back captured · verifying in under a minute
                  </motion.span>
                )}
              </AnimatePresence>
            </RadioCard>
          ))}
        </div>
        <p className="ll-privacy">
          Your info is handled according to our <u>Privacy Policy</u>. Learn more about identity verification.
        </p>
      </motion.div>
      <IdScanModal
        side={scan}
        idType={idType}
        onClose={() => setScan(null)}
        onCaptured={(side) => {
          update((s) => ({ ...s, landlord: { ...s.landlord, idType, idFront: side === 'front' ? true : s.landlord.idFront, idBack: side === 'back' ? true : s.landlord.idBack } }));
          if (side === 'front') setTimeout(() => setScan('back'), 700);
          else
            setTimeout(() => {
              setScan(null);
              toast('ID captured · verifying');
            }, 700);
        }}
      />
    </LandlordFrame>
  );
}

export function IdScanBack() {
  return <LandlordVerify autoScan />;
}

/** `Landlord / ID Scan — Front/Back`: centred card over a scrim (DISSOLVE). */
function IdScanModal({ side, idType, onClose, onCaptured }: { side: null | 'front' | 'back'; idType: string; onClose: () => void; onCaptured: (s: 'front' | 'back') => void }) {
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>('idle');
  useEffect(() => {
    setPhase('idle');
  }, [side]);
  const start = () => {
    if (!side || phase !== 'idle') return;
    setPhase('scanning');
    setTimeout(() => {
      setPhase('done');
      onCaptured(side);
    }, 1600);
  };
  return (
    <Portal>
      <AnimatePresence>
        {side && (
          <div className="idscan" role="dialog" aria-modal>
            <motion.div className="idscan__scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onClose} />
            <motion.div className="idscan__card" initial={{ opacity: 0, scale: 0.94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.25, ease: [0, 0, 0.58, 1] }}>
              <div className="idscan__head">
                <p className="t-h4">ID Verification</p>
                <motion.button type="button" onClick={onClose} whileTap={{ scale: 0.85, rotate: 90 }} aria-label="Close">
                  <img src="/figma/icon-x.svg" width={24} height={24} alt="" />
                </motion.button>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={side} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <p className="t-b1-semibold">
                    Scan the {side} of your {idType}
                  </p>
                  <p className="idscan__hint">{side === 'front' ? 'Position your document, picture side up, inside the frame.' : 'Flip it over — make sure the barcode is visible.'}</p>
                </motion.div>
              </AnimatePresence>
              <div className={`viewfinder is-${phase}`}>
                {['tl', 'tr', 'bl', 'br'].map((c) => (
                  <motion.span key={c} className={`viewfinder__corner viewfinder__corner--${c}`} animate={phase === 'scanning' ? { scale: [1, 0.9, 1] } : { scale: 1 }} transition={{ duration: 0.8, repeat: phase === 'scanning' ? Infinity : 0 }} />
                ))}
                <AnimatePresence mode="wait">
                  {phase === 'idle' && (
                    <motion.span key="cam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Camera size={52} color="#8a8a8a" strokeWidth={1.5} />
                    </motion.span>
                  )}
                  {phase !== 'idle' && (
                    <motion.div key="id" className={`mock-id mock-id--${side}`} initial={{ opacity: 0, scale: 0.85, rotate: -4 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
                      {side === 'front' ? (
                        <>
                          <span className="mock-id__photo" />
                          <span className="mock-id__lines">
                            <i />
                            <i />
                            <i />
                          </span>
                        </>
                      ) : (
                        <span className="mock-id__barcode" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                {phase === 'scanning' && <motion.span className="viewfinder__laser" initial={{ top: '8%' }} animate={{ top: ['8%', '88%', '8%'] }} transition={{ duration: 1.4, ease: 'easeInOut' }} />}
                <AnimatePresence>
                  {phase === 'done' && (
                    <motion.span className="viewfinder__ok" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
                      ✓
                    </motion.span>
                  )}
                </AnimatePresence>
                {phase === 'done' && <motion.span className="viewfinder__flash" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 0.4 }} />}
              </div>
              <div className="idscan__buttons">
                <Button onClick={start} disabled={phase !== 'idle'}>
                  {phase === 'scanning' ? 'Scanning…' : phase === 'done' ? 'Captured' : 'Scan ID'}
                </Button>
                <Button variant="secondary" className="btn--outline-light idscan__upload" onClick={start} disabled={phase !== 'idle'}>
                  Upload an image
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

export function LandlordNotifications() {
  return <NotificationsStep next="trustedTenants" role="landlord" />;
}

export function TrustedTenants() {
  return (
    <ReliabilityScore
      person={{ name: 'Shiela Mae Smith', title: 'Verified Landlord', avatar: '/figma/landlord-shiela.webp', badge: 4.95, decimals: 2, fill: true }}
      title="Peace of mind with every tenant"
      body="Our Tenant Reliability Score screens renters using verified data, so you can confidently choose the right fit for your property."
      cta="Enlist my property"
      titleWeight="semibold"
      onCta={(nav) => nav.reset(['landlordDashboard'], { transition: 'dissolve' })}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Landlord / Dashboard                                                */
/* ------------------------------------------------------------------ */

export const occupied = (id: string) => id !== 'cozy-loft' && id !== 'shiela-new';

const statusTone: Record<ApplicantStatus, string> = { 'In Review': 'warn', Pending: 'neutral', Approved: 'good', Denied: 'bad' };

export type LTab = 'home' | 'listings' | 'messages' | 'account';

export function LandlordDashboard() {
  const nav = useNav<ScreenId>();
  const { state, update } = useStore();
  const [filter, setFilter] = useState('All Listings');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<LTab>('home');
  const scrollRef = useRef<HTMLDivElement>(null);
  const decisions = state.landlord.decisions;
  const juanNew = state.application.status === 'submitted' && decisions.juan === 'In Review';

  const mine = state.draft.published ? [draftToListing(state.draft), ...landlordListings] : landlordListings;
  const shownListings = mine.filter((l) => {
    if (query && !l.title.toLowerCase().includes(query.toLowerCase())) return false;
    if (filter === 'Occupied') return occupied(l.id);
    if (filter === 'Vacant' || filter === 'New Applications') return !occupied(l.id);
    return true;
  });
  const shownApplicants = applicants
    .map((a) => ({ ...a, status: decisions[a.id] ?? a.status }))
    .filter((a) => !query || a.name.toLowerCase().includes(query.toLowerCase()))
    .filter((a) => filter !== 'New Applications' || a.status === 'In Review' || a.status === 'Pending');

  const goTab = (t: LTab) => {
    setTab(t);
    if (t === 'home') scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    else if (t === 'account') toast('Signed in as Shiela Mae Smith · Verified Landlord');
    else nav.reset([tabScreen[t]], { transition: 'smart' });
  };

  return (
    <Screen footer={<LandlordBottomNav active={tab} onPick={goTab} />}>
      <div className="scroll dash ldash" ref={scrollRef}>
        <div className="dash__head">
          <div className="ldash__search-row">
            <label className="dash-search ldash__search tappable">
              <img src="/figma/icon-search-40.svg" width={40} height={40} alt="" />
              <span className="dash-search__text">
                <input className="ldash__input" placeholder="Search your listings" value={query} onChange={(e) => setQuery(e.target.value)} />
                <span className="t-b2 c-grey">Property, tenant, or applicant</span>
              </span>
            </label>
            <motion.button type="button" className="ldash__add" whileTap={{ scale: 0.9, rotate: 90 }} onClick={() => {
                if (state.draft.published) update((s) => ({ ...s, draft: { ...initialDraft, title: '', photos: [] } }));
                nav.push('addListing1');
              }}
              aria-label="Add listing"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>
                <path d="M12 5v14M5 12h14" stroke="#1e1e1e" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </motion.button>
          </div>
          <div className="dash__chips scroll-x">
            {[
              ['🏠', 'All Listings'],
              ['🟢', 'Occupied'],
              ['🟡', 'Vacant'],
              ['📩', 'New Applications'],
            ].map(([e, l]) => (
              <motion.button key={l} type="button" className={`toggle-chip ${filter === l ? 'is-on' : ''}`} onClick={() => setFilter(l)} whileTap={{ scale: 0.94 }}>
                <span className="toggle-chip__emoji">{e}</span>
                <span>{l}</span>
                {l === 'New Applications' && juanNew && <span className="chip-dot" />}
              </motion.button>
            ))}
          </div>
        </div>

        <section className="dash-section">
          <button type="button" className="dash-section__head" onClick={() => goTab('listings')}>
            <span className="t-h4">Your Listings</span>
            <img src="/figma/icon-chevron-right-18.svg" width={18} height={18} alt="" />
          </button>
          <div className="dash-section__list scroll-x" style={{ minHeight: 272 }}>
            <AnimatePresence mode="popLayout" initial={false}>
              {shownListings.map((l, i) => (
                <motion.div
                  key={l.id}
                  layout
                  className="lcard llcard"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: spring, delay: i * 0.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    l.id === 'shiela-new'
                      ? nav.push('viewListing', { params: { id: l.id } })
                      : occupied(l.id)
                        ? toast(`${l.title} is occupied · rent on track`)
                        : nav.push('reviewApplicant', { params: { id: 'juan' } })
                  }
                >
                  <div className="lcard__image">
                    <img src={l.image} alt="" loading="lazy" />
                  </div>
                  <div className="lcard__info">
                    <span className="noissue-tag">No issues</span>
                    <p className="t-b2-medium lcard__title">{l.title}</p>
                    <p className="t-h4">{peso(l.price)} / month</p>
                    <div className="lcard__row">
                      <p className="lcard__meta">{l.id === 'shiela-new' ? `Up to ${l.maxOccupants} pax · no tenant yet` : '1 adult + 2 kids'}</p>
                      <p className="lcard__rating">
                        {ratingShort(l.rating)}
                        <img src="/figma/icon-star-12.svg" width={12} height={12} alt="" />
                      </p>
                    </div>
                  </div>
                  <div className="lcard__overlay">
                    <span className="verified-glass">
                      {l.id === 'shiela-new' ? (
                        <span>New · Vacant</span>
                      ) : occupied(l.id) ? (
                        <>
                          <img src={l.landlord.avatar} width={20} height={20} alt="" />
                          <span>Occupied</span>
                        </>
                      ) : (
                        <>
                          <img src={juan.avatar} width={20} height={20} alt="" />
                          <span className="applicants-count">+{applicants.length - 1}</span>
                          <span>Applicants</span>
                        </>
                      )}
                    </span>
                    <span className="glass-btn llcard__more">•••</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {shownListings.length === 0 && <p className="dash-section__empty t-b2 c-grey">No listings match.</p>}
          </div>
        </section>

        <section className="dash-section ldash__section">
          <div className="dash-section__head">
            <span className="t-h4">Recent Applications</span>
            <img src="/figma/icon-chevron-right-18.svg" width={18} height={18} alt="" />
          </div>
          <div className="apps">
            <AnimatePresence initial={false}>
              {shownApplicants.map((a) => (
                <motion.button
                  layout
                  key={a.id}
                  type="button"
                  className="app-row"
                  onClick={() => nav.push('reviewApplicant', { params: { id: a.id } })}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="thread__avatar">
                    <img src={a.avatar} alt="" />
                  </span>
                  <span className="app-row__body">
                    <span className="app-row__name">
                      {a.name}
                      {a.id === 'juan' && juanNew && <span className="new-badge">New</span>}
                    </span>
                    <span className="app-row__meta">
                      {a.score}
                      <svg viewBox="0 0 24 24" width="10" height="10" aria-hidden>
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" fill="none" stroke="#575757" strokeWidth="2.4" />
                      </svg>
                      • {a.id === 'juan' ? 'Cozy Loft in Uptown Center' : a.address}
                    </span>
                  </span>
                  <span className="app-row__right">
                    <motion.span key={a.status} className={`app-status app-status--${statusTone[a.status]}`} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                      {a.status}
                    </motion.span>
                    <span>{a.date}</span>
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </section>

        <section className="dash-section ldash__section">
          <button type="button" className="dash-section__head" onClick={() => goTab('messages')}>
            <span className="t-h4">Messages</span>
            <img src="/figma/icon-chevron-right-18.svg" width={18} height={18} alt="" />
          </button>
          <div className="apps">
            {landlordThreads.slice(0, 2).map((x) => (x.name === 'Juan Dela Cruz' ? { ...x, ...conversationPreview(state.conversation, 'shiela') } : x)).map((t) => (
              <motion.button key={t.name} type="button" className="app-row" whileTap={{ scale: 0.98 }} onClick={() => nav.push('chatThread', { params: { name: t.name } })}>
                <span className="thread__avatar">
                  <img src={t.avatar} alt="" />
                </span>
                <span className="app-row__body">
                  <span className="app-row__name">
                    {t.name} <span className="thread__prop">{t.property}</span>
                  </span>
                  <span className={`thread__snippet ${t.unread ? 'is-unread' : ''}`}>{t.snippet}</span>
                </span>
                <span className="app-row__right">
                  <span>{t.time}</span>
                  {t.unread && <span className="thread__dot" />}
                </span>
              </motion.button>
            ))}
          </div>
        </section>
      </div>
    </Screen>
  );
}

const tabScreen: Record<Exclude<LTab, 'account'>, ScreenId> = { home: 'landlordDashboard', listings: 'landlordListings', messages: 'landlordMessages' };

export function LandlordBottomNav({ active, onPick }: { active: LTab; onPick?: (t: LTab) => void }) {
  const nav = useNav<ScreenId>();
  const pick =
    onPick ??
    ((t: LTab) => {
      if (t === active) return;
      if (t === 'account') toast('Signed in as Shiela Mae Smith · Verified Landlord');
      else nav.reset([tabScreen[t]], { transition: 'smart' });
    });
  const items: { tab: LTab; label: string; icon: ReactNode; badge?: number }[] = [
    { tab: 'home', label: 'Home', icon: <Home size={24} strokeWidth={2} /> },
    { tab: 'listings', label: 'Listings', icon: <Grid size={24} strokeWidth={2} />, badge: 4 },
    { tab: 'messages', label: 'Messages', icon: <MessageCircle size={24} strokeWidth={2} />, badge: 1 },
    { tab: 'account', label: 'Account', icon: <img className={`bnav__avatar ${active === 'account' ? 'is-active' : ''}`} src="/figma/landlord-shiela.webp" width={24} height={24} alt="" style={{ objectPosition: 'top' }} /> },
  ];
  return (
    <nav className="bnav">
      {items.map((it) => (
        <motion.button key={it.tab} type="button" className={`bnav__item ${active === it.tab ? 'is-active' : ''}`} onClick={() => pick(it.tab)} whileTap={{ scale: 0.9 }}>
          <span className="bnav__icon">{it.icon}</span>
          <span className="t-b2">{it.label}</span>
          {it.badge && <span className="bnav__badge">{it.badge}</span>}
        </motion.button>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Landlord — Listings and Messages (WF 2290:1533, 2293:3134)          */
/* ------------------------------------------------------------------ */

type ListTab = 'All' | 'Available Now' | 'Drafts';

export function LandlordListings() {
  const nav = useNav<ScreenId>();
  const { state, update } = useStore();
  const [tab, setTab] = useState<ListTab>('All');
  const d = state.draft;
  const mine = d.published ? [draftToListing(d), ...landlordListings] : landlordListings;
  const waiting = applicants.filter((a) => (state.landlord.decisions[a.id] ?? a.status) === 'In Review' || a.status === 'Pending').length;
  const rows = tab === 'Drafts' ? [] : mine.filter((l) => tab === 'All' || !occupied(l.id));
  const showDraft = !d.published && (tab === 'Drafts' || tab === 'All');
  const draftSteps = [d.title && d.address, d.bedrooms, d.photos.length, d.rent, false].filter(Boolean).length;
  const addProperty = () => {
    if (d.published) update((s) => ({ ...s, draft: { ...initialDraft, title: '', photos: [] } }));
    nav.push('addListing1');
  };
  const sub = `${mine.length} ${mine.length === 1 ? 'property' : 'properties'} · ${waiting} awaiting review`;

  return (
    <Screen footer={<LandlordBottomNav active="listings" />}>
      <div className="scroll inbox">
        <Header
          title="Listed Properties"
          sub={sub}
          actions={
            <motion.button type="button" className="ll-addprop" whileTap={{ scale: 0.94 }} onClick={addProperty}>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
              Add property
            </motion.button>
          }
        />
        <Tabs id="llist" tabs={['All', 'Available Now', 'Drafts'] as ListTab[]} value={tab} onChange={setTab} />
        <div className="llist">
          <AnimatePresence mode="popLayout" initial={false}>
            {showDraft && (
              <motion.div layout key="draft" className="llist__card" role="button" tabIndex={0} onClick={() => nav.push('addListing1')} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, ease: spring }} whileTap={{ scale: 0.98 }}>
                <div className="llist__img">
                  <img src={d.photos[0] ?? '/figma/listing-hero.webp'} alt="" style={{ filter: 'grayscale(0.4)' }} />
                  <span className="verified-glass">
                    <span>✏️ Draft</span>
                  </span>
                </div>
                <div className="llist__body">
                  <div className="llist__top">
                    <p className="llist__title">{d.title || 'Untitled listing'}</p>
                    <span className="llist__status llist__status--draft">Draft</span>
                  </div>
                  <p className="t-h4">{d.rent ? `₱${d.rent}` : '₱—'} / month</p>
                  <div className="llist__draft">
                    <i>
                      <motion.span initial={{ width: 0 }} animate={{ width: `${(draftSteps / 5) * 100}%` }} transition={{ duration: 0.6, ease: spring, delay: 0.2 }} />
                    </i>
                    {draftSteps} of 5 steps · Continue
                  </div>
                </div>
              </motion.div>
            )}
            {rows.map((l, i) => {
              const isNew = l.id === 'shiela-new';
              const occ = occupied(l.id);
              const status = isNew ? { cls: 'new', label: 'New · Vacant' } : occ ? { cls: 'good', label: 'Occupied' } : { cls: 'warn', label: `${applicants.length} applicants` };
              return (
                <motion.div
                  layout
                  key={l.id}
                  className="llist__card"
                  role="button"
                  tabIndex={0}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: spring, delay: i * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => (isNew ? nav.push('viewListing', { params: { id: l.id } }) : occ ? toast(`${l.title} is occupied · rent on track`) : nav.push('reviewApplicant', { params: { id: 'juan' } }))}
                >
                  <div className="llist__img">
                    <img src={l.id === 'cozy-loft' ? '/figma/listing-hero.webp' : l.image} alt="" loading="lazy" />
                    <span className="verified-glass">
                      {isNew ? (
                        <span>✨ Just published</span>
                      ) : occ ? (
                        <span>🔑 Tenant since Mar</span>
                      ) : (
                        <>
                          <img src={juan.avatar} width={20} height={20} alt="" />
                          <span className="applicants-count">+{applicants.length - 1}</span>
                          <span>Applicants</span>
                        </>
                      )}
                    </span>
                    <span className="glass-btn llcard__more">•••</span>
                  </div>
                  <div className="llist__body">
                    <div className="llist__top">
                      <p className="llist__title">{l.id === 'cozy-loft' ? 'Cozy Loft in Uptown Center' : l.title}</p>
                      <span className={`llist__status llist__status--${status.cls}`}>{status.label}</span>
                    </div>
                    <p className="t-h4">{peso(l.price)} / month</p>
                    <div className="llist__row">
                      <span>{l.inclusion}</span>
                      <span className="lcard__rating">
                        {ratingShort(l.rating)}
                        <img src="/figma/icon-star-12.svg" width={12} height={12} alt="" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {!showDraft && rows.length === 0 && <p className="t-b2 c-grey empty-line">No drafts — tap Add property to start one.</p>}
        </div>
      </div>
    </Screen>
  );
}

type LMsgTab = 'All' | 'Unread' | 'Applications';

export function LandlordMessages() {
  const nav = useNav<ScreenId>();
  const { state } = useStore();
  const [tab, setTab] = useState<LMsgTab>('All');
  const [read, setRead] = useState<string[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const scoreOf = (name: string) => applicants.find((a) => a.name === name)?.score;
  const list = landlordThreads
    .map((t) => (t.name === 'Juan Dela Cruz' ? { ...t, ...conversationPreview(state.conversation, 'shiela') } : t))
    .filter((t) => (tab === 'Unread' ? t.unread && !read.includes(t.name) : tab === 'Applications' ? t.property === 'Cozy Loft in Uptown Center' : true))
    .filter((t) => !query || t.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Screen footer={<LandlordBottomNav active="messages" />}>
      <div className="scroll inbox">
        <Header title="Messages" actions={<RoundIcon src="/figma/icon-search-18.svg" w={20} h={20} label="Search" onClick={() => setQuery((q) => (q === null ? '' : null))} />} />
        <AnimatePresence initial={false}>
          {query !== null && (
            <motion.input
              autoFocus
              className="msg-search"
              placeholder="Search tenants and applicants"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              initial={{ height: 0, opacity: 0, marginTop: -24 }}
              animate={{ height: 44, opacity: 1, marginTop: 0 }}
              exit={{ height: 0, opacity: 0, marginTop: -24 }}
            />
          )}
        </AnimatePresence>
        <Tabs id="lmsg" tabs={['All', 'Unread', 'Applications'] as LMsgTab[]} value={tab} onChange={setTab} />
        <div className="threads">
          <AnimatePresence mode="popLayout" initial={false}>
            {list.map((t, i) => {
              const unread = t.unread && !read.includes(t.name);
              const score = scoreOf(t.name);
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
                    <img src={t.avatar} alt="" />
                  </span>
                  <span className="thread__body">
                    <span className="thread__top">
                      <b>{t.name}</b>
                      {score && <span className="thread__score">{score}</span>}
                    </span>
                    <span className="thread__prop">{t.property}</span>
                    <span className={`thread__snippet ${unread ? 'is-unread' : ''}`}>{t.snippet}</span>
                  </span>
                  <span className="thread__meta">
                    <span>{t.time}</span>
                    {unread && <motion.span className="thread__dot" layoutId={`ldot-${t.name}`} />}
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

/* ------------------------------------------------------------------ */
/* Landlord — Review applicant                                         */
/* ------------------------------------------------------------------ */

export function ReviewApplicant() {
  const nav = useNav<ScreenId>();
  const { id = 'juan' } = useParams<{ id: string }>();
  const { state, decide } = useStore();
  const a = applicants.find((x) => x.id === id) ?? applicants[0];
  const isJuan = a.id === 'juan';
  const first = a.name.split(' ')[0];
  const app = state.application;
  const status = state.landlord.decisions[a.id] ?? a.status;
  const income = isJuan ? Number(app.work.income.replace(/\D/g, '')) || juan.income : 38000 + a.score * 120;
  const rent = listings.cozyLoft.price;
  const ratio = income / rent;
  const [confirm, setConfirm] = useState<null | 'Approved' | 'Denied'>(null);
  const [profile, setProfile] = useState(false);
  const decided = status === 'Approved' || status === 'Denied';

  /** Card with a 44px header, Neutral/200 dividers and 32px rows (Figma `Stack` cards). */
  const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <div className="rvf-card">
      <p className="rvf-card__head">{title}</p>
      {children}
    </div>
  );
  const Row = ({ k, v }: { k: string; v: ReactNode }) => (
    <>
      <hr className="rvf-card__div" />
      <div className="rvf-card__row">
        <span>{k}</span>
        <span>{v}</span>
      </div>
    </>
  );

  return (
    <Screen>
      <div className="scroll rvf">
        <div className="rvf-head">
          <motion.button type="button" className="rvf-back" onClick={nav.back} whileTap={{ scale: 0.9 }} aria-label="Back">
            <ArrowLeft size={26} strokeWidth={2} color="#1e1e1e" />
          </motion.button>
          <div className="rvf-head__text">
            <p className="t-h3">Review applicant</p>
            <p className="t-b3 c-grey">Cozy Loft in Uptown Center</p>
          </div>
        </div>

        <div className="applying rvf-listing">
          <div className="applying__img">
            <img src="/figma/listing-hero.webp" alt="" />
          </div>
          <div className="applying__info">
            <p className="applying__kicker">Applying for:</p>
            <div className="applying__stack">
              <p className="t-b1-semibold c-primary applying__title">Cozy Loft in Uptown Center</p>
              <p className="applying__row">
                <span className="t-b2-medium">{peso(rent)}/month</span>
                <img src="/figma/dot-grey-4.svg" width={4} height={4} alt="" />
                <span className="t-b2 c-grey">Good for 6 people</span>
              </p>
            </div>
            <p className="applying__row applying__row--small">
              Water &amp; Electricity free
              <img src="/figma/dot-grey-4.svg" width={4} height={4} alt="" />
              4.86
              <span className="applying__stars">
                {Array.from({ length: 5 }, (_, i) => (
                  <img key={i} src="/figma/icon-star-yellow-12.svg" width={12} height={12} alt="" />
                ))}
              </span>
            </p>
          </div>
        </div>

        <div className="rvf-stack">
          <motion.div className="rvf-profile" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: spring }}>
            <div className="rvf-profile__avatar">
              <img src={a.avatar} alt={a.name} />
            </div>
            <p className="rvf-profile__name">{a.name}</p>
            <div className="rvf-profile__chips">
              {['ID Verified', 'Employment Verified'].map((c) => (
                <span key={c} className="rvf-chip">
                  <img src="/figma/verified-chip.svg" width={16} height={16} alt="" />
                  {c}
                </span>
              ))}
            </div>
            <div className="rvf-profile__stats">
              <div>
                <b>{a.score}</b>
                <span>Reliability Score</span>
              </div>
              <div>
                <b>{isJuan ? juan.rating : (3.9 + a.score / 120).toFixed(2)}</b>
                <span>Rating</span>
              </div>
              <div>
                <b>{isJuan ? juan.onTime : `${Math.round(a.score * 0.98)}%`}</b>
                <span>On-time</span>
              </div>
            </div>
            <motion.button type="button" className="rvf-profile__btn" whileTap={{ scale: 0.96 }} onClick={() => setProfile(true)}>
              View Profile
            </motion.button>
          </motion.div>

          <Section title="Affordability">
            <Row k="Monthly income" v={peso(income)} />
            <Row
              k="Rent-to-income"
              v={
                <span className="ratio">
                  <span className={`ratio__dot ${ratio >= 3 ? 'is-good' : 'is-warn'}`} />
                  {ratio.toFixed(1)}x rent
                </span>
              }
            />
            <Row k="Employment" v={isJuan ? `${app.work.years}, ${app.work.employer.replace(' Inc.', '')}` : '1 year, private sector'} />
          </Section>

          <Section title="Tenancy details">
            <Row k="Move-in date" v={isJuan ? app.moveIn.replace('September', 'Sept') : 'Oct 1, 2026'} />
            <Row k="Occupants" v={isJuan ? app.about.occupants : '2 adults'} />
            <Row k="Lease length" v="12 months" />
          </Section>

          <Section title="Documents">
            {[
              { t: "Driver's License", s: 'Verified Aug 5', icon: <Truck size={16} strokeWidth={2} color="#1e1e1e" /> },
              { t: 'Payslip (3 months)', s: 'Uploaded Aug 5', icon: <FileText size={16} strokeWidth={2} color="#1e1e1e" /> },
            ].map((d) => (
              <div key={d.t}>
                <hr className="rvf-card__div" />
                <div className="rvf-doc">
                  <span className="rvf-doc__icon">{d.icon}</span>
                  <span className="rvf-doc__text">
                    <b>{d.t}</b>
                    <small>{d.s}</small>
                  </span>
                  <button type="button" className="rvf-doc__view" onClick={() => toast(`Opening ${d.t} · watermark applied`)}>
                    View
                  </button>
                </div>
              </div>
            ))}
          </Section>

          <div className="rvf-message">
            <p>Message from {first}</p>
            <div className="rvf-message__box">{isJuan ? app.message : 'Hello! I’m interested in the loft and can move in next month.'}</div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {decided ? (
              <motion.div key="decided" className={`decided decided--${status === 'Approved' ? 'good' : 'bad'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {status === 'Approved' ? '✓ You approved this applicant' : '✕ You declined this applicant'}
                <button type="button" onClick={() => decide(a.id, 'In Review')}>
                  Undo
                </button>
              </motion.div>
            ) : (
              <motion.div key="actions" className="rvf-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.button type="button" className="decide-btn decide-btn--dark" whileTap={{ scale: 0.96 }} onClick={() => setConfirm('Denied')}>
                  Decline
                </motion.button>
                <motion.button type="button" className="decide-btn" whileTap={{ scale: 0.96 }} onClick={() => setConfirm('Approved')}>
                  Approve
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button type="button" className="rvf-msg-btn" whileTap={{ scale: 0.98 }} onClick={() => nav.push('chatThread', { params: { name: a.name } })}>
            Message {first} before deciding
          </motion.button>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={confirm === 'Approved' ? `Approve ${first}?` : `Decline ${first}?`}
        body={confirm === 'Approved' ? 'They’ll be notified right away and the listing will be marked as pending move-in.' : 'They’ll get a kind note. This won’t affect their Reliability Score.'}
        confirmLabel={confirm === 'Approved' ? 'Approve' : 'Decline'}
        danger={confirm === 'Denied'}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const d = confirm!;
          setConfirm(null);
          decide(a.id, d);
          nav.push('landlordApproved', { transition: 'smart', params: { id: a.id } });
        }}
      />
      <Overlay open={profile} onClose={() => setProfile(false)}>
        <div className="score-sheet">
          <p className="t-h2">Reliability breakdown</p>
          <p className="t-b2 c-grey">
            How {first}’s score of {a.score} is built
          </p>
          {[
            ['On-time payments', isJuan ? 100 : a.score, '12 of 12 months'],
            ['Verified reviews', isJuan ? 95 : a.score - 6, '4.75 average · 8 reviews'],
            ['Identity & employment', 100, 'ID + employer confirmed'],
            ['Tenancy history', isJuan ? 100 : a.score - 10, 'No disputes'],
          ].map(([k, v, sub], i) => (
            <div key={k as string} className="score-bar">
              <div className="score-bar__top">
                <b>{k}</b>
                <span>{v}</span>
              </div>
              <div className="score-bar__track">
                <motion.span initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ delay: 0.2 + i * 0.1, duration: 0.7, ease: spring }} />
              </div>
              <small>{sub}</small>
            </div>
          ))}
          <Button onClick={() => setProfile(false)}>Done</Button>
        </div>
      </Overlay>
    </Screen>
  );
}

function ConfirmDialog({ open, title, body, confirmLabel, danger, onCancel, onConfirm }: { open: boolean; title: string; body: string; confirmLabel: string; danger?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="sys-alert" role="alertdialog">
            <motion.div className="sys-alert__scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
            <motion.div className="confirm" initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
              <p className="t-h3">{title}</p>
              <p className="t-b2 c-grey">{body}</p>
              <div className="confirm__row">
                <Button variant="secondary" size="md" onClick={onCancel}>
                  Cancel
                </Button>
                <Button size="md" className={danger ? 'btn--back' : ''} onClick={onConfirm}>
                  {confirmLabel}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

/* ------------------------------------------------------------------ */
/* Landlord — Approved / Declined                                      */
/* ------------------------------------------------------------------ */

export function LandlordApproved() {
  const nav = useNav<ScreenId>();
  const { id = 'juan' } = useParams<{ id: string }>();
  const { state } = useStore();
  const a = applicants.find((x) => x.id === id) ?? applicants[0];
  const approved = (state.landlord.decisions[a.id] ?? 'Approved') !== 'Denied';
  useEffect(() => {
    const t = setTimeout(() => toast(`${a.name.split(' ')[0]} has been notified`), 900);
    return () => clearTimeout(t);
  }, [a.name]);

  return (
    <Screen tone="light" backdrop={<div className="sent__hero approved__hero"><img src="/figma/listing-hero.webp" alt="" /></div>}>
      <motion.button type="button" className="glass-round approved__back" whileTap={{ scale: 0.9 }} onClick={nav.back} aria-label="Back">
        <img src="/figma/glass-arrow-left-20.svg" width={20} height={20} alt="" />
      </motion.button>
      {approved ? (
        <SuccessBadge />
      ) : (
        <motion.div className="approved__pending is-declined" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}>
          ✕
        </motion.div>
      )}
      <div className="approved__body">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5, ease: spring }}>
          <h1 className="t-title-3">{approved ? 'Application approved!' : 'Application declined'}</h1>
          <p className="t-h4-regular c-grey approved__sub">{approved ? 'Tenant will be notified of your approval.' : `${a.name.split(' ')[0]} will receive a kind note from you.`}</p>
        </motion.div>
        <motion.div className="applying" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.5, ease: spring }}>
          <div className="applying__img">
            <img src="/figma/listing-hero.webp" alt="" />
          </div>
          <div className="applying__info">
            <p className="applying__kicker">Applying for:</p>
            <p className="t-b1-semibold c-primary applying__title">Cozy Loft in Uptown Center</p>
            <p className="applying__row">
              <span className="t-b2-medium">₱18,500/month</span>
              <img src="/figma/dot-grey-4.svg" width={4} height={4} alt="" />
              <span className="t-b2 c-grey">6 Pax</span>
            </p>
            <p className="applying__row applying__row--small">
              Water &amp; Electricity free
              <img src="/figma/dot-grey-4.svg" width={4} height={4} alt="" />
              4.86
            </p>
          </div>
        </motion.div>
        <motion.div className="sent__buttons" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5, ease: spring }}>
          <Button onClick={() => nav.push('chatThread', { params: { name: a.name } })}>Message applicant</Button>
          <Button variant="secondary" className="btn--outline-light" onClick={() => nav.reset(['landlordDashboard'], { transition: 'push' })}>
            Back to dashboard
          </Button>
        </motion.div>
      </div>
    </Screen>
  );
}
