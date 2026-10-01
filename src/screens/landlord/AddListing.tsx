import { AnimatePresence, motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { Camera, Minus, Plus, X } from 'react-feather';
import { Screen } from '../../components/Chrome';
import { Button, TitleBlock } from '../../components/Controls';
import { toast } from '../../components/Feed';
import { CountUp, DateField, Dropdown } from '../../components/Inputs';
import { peso, photos } from '../../data/mock';
import { useNav, useParams } from '../../nav/Navigator';
import { useStore, type ListingDraft } from '../../state/store';
import { rise } from '../onboarding/Onboarding';
import type { ScreenId } from '../registry';
import { LandlordFrame, LField } from './Landlord';
import './addlisting.css';

/**
 * Add Listing 1–5 + Published. The Figma file only has these as wireframes
 * (WF · 03 Landlord Journey, 2310:1312 → 2311:1522); this is the hi-fi build
 * of that flow using the same tokens and components as the rest of the app.
 */

const spring = [0.32, 0.72, 0, 1] as const;
const SAMPLE_PHOTOS = [photos.studioWhite, photos.studioMinimal, photos.aptClassic, photos.bathroom, photos.aptWarmWood, photos.loftWindows, photos.aptOpenPlan, photos.loftBalcony];

function useDraft() {
  const { state, update } = useStore();
  const set = <K extends keyof ListingDraft>(k: K, v: ListingDraft[K]) => update((s) => ({ ...s, draft: { ...s.draft, [k]: v } }));
  return { d: state.draft, set };
}

/** `Toggle / Option` single- or multi-select group. */
function Options({ options, value, onChange, grid }: { options: string[]; value: string[]; onChange: (v: string[]) => void; grid?: boolean }) {
  return (
    <div className={grid ? 'toggle-grid' : 'toggle-wrap'}>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <motion.button key={o} type="button" aria-pressed={on} className={`toggle-option ${on ? 'is-on' : ''}`} whileTap={{ scale: 0.95 }} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}>
            {o}
          </motion.button>
        );
      })}
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="al-group">
      <p className="t-b1">{label}</p>
      {children}
    </div>
  );
}

function NextButton({ label = 'Next', review, onNext, disabled }: { label?: string; review?: boolean; onNext: () => void; disabled?: boolean }) {
  const nav = useNav();
  return (
    <Button disabled={disabled} onClick={() => (review ? nav.back() : onNext())}>
      {review ? 'Save changes' : label}
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* 1 / 5 — Location                                                    */
/* ------------------------------------------------------------------ */

export function AddListing1() {
  const nav = useNav<ScreenId>();
  const { review } = useParams<{ review: boolean }>();
  const { d, set } = useDraft();
  const ok = d.title.trim().length > 2 && d.address.trim().length > 3 && d.city.trim().length > 1;
  return (
    <LandlordFrame step={1} ctaSpace={110} cta={<NextButton review={review} disabled={!ok} onNext={() => nav.push('addListing2')} />}>
      <motion.div {...rise()}>
        <TitleBlock subtitle="1 / 5" title="Where's your property?" description="Renters search by area first, so be precise." />
      </motion.div>
      <motion.div className="ll-fields" {...rise(0.06)}>
        <LField label="Listing title" value={d.title} onChange={(v) => set('title', v)} />
        <Group label="Property type">
          <Options grid options={['Condo', 'Apartment', 'Studio', 'Room for rent']} value={[d.type]} onChange={(v) => v.length && set('type', v[v.length - 1])} />
        </Group>
        <LField label="Complete address" value={d.address} onChange={(v) => set('address', v)} />
        <LField label="City" value={d.city} onChange={(v) => set('city', v)} />
        <LField label="Nearest transit / landmark" value={d.transit} onChange={(v) => set('transit', v)} />
      </motion.div>
    </LandlordFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 2 / 5 — The space                                                   */
/* ------------------------------------------------------------------ */

function Stepper({ label, value, onChange, min = 0, max = 12 }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="stepper">
      <span className="t-b1">{label}</span>
      <div className="stepper__ctrl">
        <motion.button type="button" whileTap={{ scale: 0.85 }} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`Fewer ${label}`}>
          <Minus size={16} strokeWidth={2.4} />
        </motion.button>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={value} className="stepper__value" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.18 }}>
            {value}
          </motion.span>
        </AnimatePresence>
        <motion.button type="button" whileTap={{ scale: 0.85 }} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`More ${label}`}>
          <Plus size={16} strokeWidth={2.4} />
        </motion.button>
      </div>
    </div>
  );
}

export function AddListing2() {
  const nav = useNav<ScreenId>();
  const { review } = useParams<{ review: boolean }>();
  const { d, set } = useDraft();
  return (
    <LandlordFrame step={2} ctaSpace={110} cta={<NextButton review={review} onNext={() => nav.push('addListing3')} />}>
      <motion.div {...rise()}>
        <TitleBlock subtitle="2 / 5" title="Tell us about the space" description="This is what filters match against." />
      </motion.div>
      <motion.div className="ll-fields" {...rise(0.06)}>
        <div className="steppers">
          <Stepper label="Bedrooms" value={d.bedrooms} onChange={(v) => set('bedrooms', v)} />
          <Stepper label="Bathrooms" value={d.bathrooms} min={1} onChange={(v) => set('bathrooms', v)} />
          <Stepper label="Max occupants" value={d.occupants} min={1} onChange={(v) => set('occupants', v)} />
        </div>
        <Group label="Furnishing">
          <Options options={['Fully furnished', 'Semi', 'Unfurnished']} value={[d.furnishing]} onChange={(v) => v.length && set('furnishing', v[v.length - 1])} />
        </Group>
        <Group label="Amenities">
          <Options options={['Air conditioning', 'Fast Wi-Fi', 'Washing machine', 'Parking', 'Pet-friendly', '24/7 Security']} value={d.amenities} onChange={(v) => set('amenities', v)} />
        </Group>
      </motion.div>
    </LandlordFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 3 / 5 — Photos                                                      */
/* ------------------------------------------------------------------ */

export function AddListing3() {
  const nav = useNav<ScreenId>();
  const { review } = useParams<{ review: boolean }>();
  const { d, set } = useDraft();
  const add = () => {
    const next = SAMPLE_PHOTOS.find((p) => !d.photos.includes(p));
    if (next && d.photos.length < 8) set('photos', [...d.photos, next]);
  };
  const slots = Array.from({ length: 6 }, (_, i) => d.photos[i + 1]);
  return (
    <LandlordFrame
      step={3}
      ctaSpace={150}
      cta={
        <div className="al-cta">
          <NextButton review={review} onNext={() => nav.push('addListing4')} />
          {!review && (
            <button type="button" className="al-skip" onClick={() => nav.push('addListing4')}>
              Skip for now
            </button>
          )}
        </div>
      }
    >
      <motion.div {...rise()}>
        <TitleBlock subtitle="3 / 5" title="Add photos" description="Listings with 5+ photos get 2x more views." />
      </motion.div>
      <motion.div className="ll-fields" {...rise(0.06)}>
        <motion.button type="button" className={`cover ${d.photos[0] ? 'has-photo' : ''}`} whileTap={{ scale: 0.98 }} onClick={() => !d.photos[0] && add()}>
          <AnimatePresence mode="wait">
            {d.photos[0] ? (
              <motion.img key={d.photos[0]} src={d.photos[0]} alt="Cover" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} />
            ) : (
              <motion.span key="empty" className="cover__empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Camera size={24} strokeWidth={1.8} />
                <b>Upload cover photo</b>
                <small>This is the first thing renters see</small>
              </motion.span>
            )}
          </AnimatePresence>
          {d.photos[0] && <span className="cover__tag">Cover</span>}
        </motion.button>
        <div className="thumbs">
          {slots.map((p, i) =>
            p ? (
              <motion.div key={p} className="thumb" layout initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <img src={p} alt="" />
                <button type="button" className="thumb__x" aria-label="Remove photo" onClick={() => set('photos', d.photos.filter((x) => x !== p))}>
                  <X size={12} strokeWidth={3} />
                </button>
              </motion.div>
            ) : (
              <motion.button key={`empty-${i}`} type="button" className="thumb thumb--empty" layout whileTap={{ scale: 0.92 }} onClick={add} aria-label="Add photo">
                <Plus size={20} strokeWidth={2} />
              </motion.button>
            ),
          )}
        </div>
        <p className="t-b3 c-grey">
          <motion.span key={d.photos.length} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'inline-block' }}>
            {d.photos.length}
          </motion.span>{' '}
          of 8 photos added
        </p>
      </motion.div>
    </LandlordFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 4 / 5 — Price & terms                                               */
/* ------------------------------------------------------------------ */

export function AddListing4() {
  const nav = useNav<ScreenId>();
  const { review } = useParams<{ review: boolean }>();
  const { d, set } = useDraft();
  const rentOk = Number(d.rent.replace(/\D/g, '')) > 0;
  return (
    <LandlordFrame step={4} ctaSpace={110} cta={<NextButton review={review} disabled={!rentOk} onNext={() => nav.push('addListing5')} />}>
      <motion.div {...rise()}>
        <TitleBlock subtitle="4 / 5" title="Set your price" description="You can change this anytime after publishing." />
      </motion.div>
      <motion.div className="ll-fields" {...rise(0.06)}>
        <label className="afield tappable">
          <span className="afield__label">
            <span className="t-b1">Monthly rent (PHP)</span>
          </span>
          <span className="afield__pill">
            <span className="afield__prefix">₱</span>
            <input
              value={d.rent}
              inputMode="numeric"
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, ''));
                set('rent', n ? n.toLocaleString('en-PH') : '');
              }}
            />
          </span>
        </label>
        <Dropdown label="Security deposit" options={['1 month', '2 months', '3 months']} value={d.deposit} onChange={(v) => set('deposit', v)} />
        <Dropdown label="Advance payment" options={['None', '1 month', '2 months']} value={d.advance} onChange={(v) => set('advance', v)} />
        <Group label="Utilities included">
          <Options options={['Water', 'Electricity', 'Internet']} value={d.utilities} onChange={(v) => set('utilities', v)} />
        </Group>
        <Dropdown label="Minimum lease" options={['1 month', '3 months', '6 months', '12 months']} value={d.minLease} onChange={(v) => set('minLease', v)} />
        <DateField label="Available from" value={d.available} onChange={(v) => set('available', v)} />
      </motion.div>
    </LandlordFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 5 / 5 — Review & publish                                            */
/* ------------------------------------------------------------------ */

function ReviewBlock({ title, rows, edit }: { title: string; rows: [string, string][]; edit: ScreenId }) {
  const nav = useNav<ScreenId>();
  return (
    <div className="review">
      <div className="review__head">
        <p className="t-b1-semibold">{title}</p>
        <motion.button type="button" className="review__edit" whileTap={{ scale: 0.92 }} onClick={() => nav.push(edit, { params: { review: true } })}>
          Edit
        </motion.button>
      </div>
      {rows.map(([k, v]) => (
        <div key={k} className="review__row">
          <span>{k}</span>
          <span>{v}</span>
        </div>
      ))}
    </div>
  );
}

export function AddListing5() {
  const nav = useNav<ScreenId>();
  const { d, set } = useDraft();
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const rent = Number(d.rent.replace(/\D/g, ''));
  return (
    <LandlordFrame
      step={5}
      ctaSpace={170}
      cta={
        <div className="al-cta">
          <Button
            disabled={!consent || busy}
            onClick={() => {
              setBusy(true);
              setTimeout(() => {
                set('published', true);
                nav.push('addListingPublished', { transition: 'smart' });
              }, 900);
            }}
          >
            {busy ? <span className="spinner" /> : 'Publish listing'}
          </Button>
          <Button
            variant="secondary"
            className="btn--outline-light"
            onClick={() => {
              toast('Draft saved');
              nav.reset(['landlordDashboard'], { transition: 'push' });
            }}
          >
            Save as draft
          </Button>
        </div>
      }
    >
      <motion.div {...rise()}>
        <TitleBlock subtitle="5 / 5" title="Review & publish" description="This is how renters will see your listing." />
      </motion.div>
      <motion.div className="ll-fields" {...rise(0.06)}>
        <div className="al-preview">
          <img src={d.photos[0] ?? photos.studioWhite} alt="" />
          <div className="al-preview__info">
            <span className="al-preview__status">
              <i /> Ready to Move In
            </span>
            <p className="t-b2-medium">{d.title}</p>
            <p className="t-b1-semibold">{peso(rent)} / month</p>
          </div>
        </div>
        <ReviewBlock
          title="Location"
          edit="addListing1"
          rows={[
            ['Type', d.type],
            ['Address', d.address],
            ['City', d.city],
          ]}
        />
        <ReviewBlock
          title="The space"
          edit="addListing2"
          rows={[
            ['Bedrooms', String(d.bedrooms)],
            ['Bathrooms', String(d.bathrooms)],
            ['Furnishing', d.furnishing],
            ['Amenities', `${d.amenities.length} selected`],
          ]}
        />
        <ReviewBlock
          title="Price & terms"
          edit="addListing4"
          rows={[
            ['Monthly rent', peso(rent)],
            ['Deposit', d.deposit],
            ['Min. lease', d.minLease],
            ['Available', d.available.replace('September', 'Sept')],
          ]}
        />
        <label className="consent tappable">
          <motion.span className={`consent__box ${consent ? 'is-on' : ''}`} animate={{ scale: consent ? [1, 1.15, 1] : 1 }} transition={{ duration: 0.25 }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            {consent && (
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
                <motion.path d="M20 6 9 17l-5-5" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2 }} />
              </svg>
            )}
          </motion.span>
          <span className="t-b2">I confirm the details above are accurate and I have the right to rent out this property.</span>
        </label>
      </motion.div>
    </LandlordFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Published                                                           */
/* ------------------------------------------------------------------ */

export function AddListingPublished() {
  const nav = useNav<ScreenId>();
  const { d } = useDraft();
  return (
    <Screen>
      <div className="al-done">
        <motion.div className="al-done__check" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}>
          <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden>
            <motion.path d="M20 6 9 17l-5-5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.4 }} />
          </svg>
        </motion.div>
        <motion.div className="al-done__text" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5, ease: spring }}>
          <h1 className="t-title-3">Your listing is live!</h1>
          <p className="t-h4-regular c-grey">
            {d.title} is now visible to renters in {d.city}.
          </p>
        </motion.div>
        <motion.div className="review" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5, ease: spring }}>
          <div className="review__row">
            <span>Listing status</span>
            <span className="al-active">
              <i /> Active
            </span>
          </div>
          <div className="review__row">
            <span>Verified landlord badge</span>
            <span>Applied</span>
          </div>
          <div className="review__row">
            <span>Matching renters nearby</span>
            <span>
              <CountUp to={38} delay={0.6} duration={1.2} />
            </span>
          </div>
        </motion.div>
        <motion.div className="sent__buttons" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5, ease: spring }}>
          <Button onClick={() => nav.push('viewListing', { params: { id: 'shiela-new' } })}>View listing</Button>
          <Button variant="secondary" className="btn--outline-light" onClick={() => nav.reset(['landlordDashboard'], { transition: 'push' })}>
            Back to dashboard
          </Button>
        </motion.div>
      </div>
    </Screen>
  );
}
