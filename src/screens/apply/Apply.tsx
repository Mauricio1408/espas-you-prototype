import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import { Screen } from '../../components/Chrome';
import { Button, PhoneField, ProgressBar, TextAction, TitleBlock } from '../../components/Controls';
import { toast } from '../../components/Feed';
import { SuccessBadge } from '../../components/Success';
import { DateField, Dropdown } from '../../components/Inputs';
import { listingById, peso } from '../../data/mock';
import { useNav, useParams } from '../../nav/Navigator';
import { useStore } from '../../state/store';
import type { ScreenId } from '../registry';
import './apply.css';

const spring = [0.32, 0.72, 0, 1] as const;

/* ------------------------------------------------------------------ */
/* Shared frame: fixed progress + "Applying for" card, scrolling form */
/* ------------------------------------------------------------------ */

function ApplyingFor() {
  const { state } = useStore();
  const l = listingById(state.application.listingId);
  const isHero = l.id === 'cozy-loft';
  return (
    <div className="applying">
      <div className="applying__img">
        <img src={isHero ? '/figma/listing-hero.webp' : l.image} alt="" />
      </div>
      <div className="applying__info">
        <p className="applying__kicker">Applying for:</p>
        <div className="applying__stack">
          <p className="t-b1-semibold c-primary applying__title">{l.title}</p>
          <p className="applying__row">
            <span className="t-b2-medium">{peso(l.price)}/month</span>
            <img src="/figma/dot-grey-4.svg" width={4} height={4} alt="" />
            <span className="t-b2 c-grey">{l.maxOccupants ?? 4} Pax</span>
          </p>
        </div>
        <p className="applying__row applying__row--small">
          <span className="applying__ll">
            <img src={isHero ? '/figma/landlord-shiela.webp' : l.landlord.avatar} alt="" />
            <span className="applying__ll-check" />
          </span>
          {l.landlord.name}
          <img src="/figma/dot-grey-4.svg" width={4} height={4} alt="" />
          {l.rating.toFixed(2)}
          <span className="applying__stars">
            {Array.from({ length: 5 }, (_, i) => (
              <img key={i} src="/figma/icon-star-yellow-12.svg" width={12} height={12} alt="" />
            ))}
          </span>
        </p>
      </div>
    </div>
  );
}

function ApplyFrame({ step, children }: { step: number; children: ReactNode }) {
  return (
    <Screen>
      <div className="apply__head">
        <ProgressBar step={step} total={4} segWidth={85.5} />
        <ApplyingFor />
        <img src="/figma/divider-dashed.svg" width={392} height={1} alt="" />
      </div>
      <div className="scroll apply__scroll">
        <div className="apply__content">{children}</div>
      </div>
    </Screen>
  );
}

const rise = (d = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, ease: spring, delay: 0.1 + d } });

function Field({ label, value, onChange, verified, prefix, inputMode, error }: { label: string; value: string; onChange: (v: string) => void; verified?: boolean; prefix?: string; inputMode?: 'tel' | 'email' | 'numeric' | 'text'; error?: string | null }) {
  return (
    <label className="afield tappable">
      <span className="afield__label">
        <span className="t-b1">{label}</span>
        {verified && (
          <span className="verified-chip">
            <img src="/figma/dot-green.svg" width={8} height={8} alt="" />
            Verified
          </span>
        )}
      </span>
      <span className={`afield__pill ${error ? 'is-error' : ''}`}>
        {prefix && <span className="afield__prefix">{prefix}</span>}
        <input value={value} onChange={(e) => onChange(e.target.value)} inputMode={inputMode} />
      </span>
      <AnimatePresence>
        {error && (
          <motion.span className="field__error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </label>
  );
}

const TIERS = [
  { key: 'tight', label: 'Tight', emoji: '⚠️', min: 0 },
  { key: 'stretch', label: 'Stretch', emoji: '🤏', min: 2 },
  { key: 'good', label: 'Comfortable', emoji: '✅', min: 3 },
] as const;
const SCALE = 5; // track runs 0× → 5× rent

/**
 * Affordability meter. Pattern from Mobbin: Redfin's affordability calculator (a zoned
 * track with a knob and a named tier) + Realtor.com's Affordable / Stretch / Difficult pills.
 */
function Affordability({ income, rent }: { income: number; rent: number }) {
  const ratio = income && rent ? income / rent : 0;
  const tier = [...TIERS].reverse().find((t) => ratio >= t.min) ?? TIERS[0];
  const pos = Math.min(ratio, SCALE) / SCALE;
  const copy = {
    good: 'You meet the 3× guideline most landlords look for.',
    stretch: `Most landlords look for 3× rent (${peso(rent * 3)}). Your Reliability Score still counts in your favour.`,
    tight: `Below the 2× minimum. Add a co-earner or pick a listing under ${peso(Math.floor(income / 3 / 100) * 100)}.`,
  }[tier.key];
  return (
    <motion.div layout className={`afford afford--${tier.key}`}>
      <div className="afford__head">
        <span className="afford__kicker">Rent affordability</span>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={tier.key} className="afford__pill" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 28 }}>
            {tier.emoji} {tier.label}
          </motion.span>
        </AnimatePresence>
      </div>
      <p className="afford__figure">
        <motion.span key={ratio.toFixed(1)} className="afford__ratio" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          {income ? ratio.toFixed(1) : '—'}×
        </motion.span>
        <span className="afford__of">your monthly rent</span>
      </p>
      <div className="afford__track" role="meter" aria-valuemin={0} aria-valuemax={SCALE} aria-valuenow={Number(ratio.toFixed(1))} aria-label="Income to rent ratio">
        {TIERS.map((t, i) => {
          const from = t.min / SCALE;
          const to = (TIERS[i + 1]?.min ?? SCALE) / SCALE;
          return <span key={t.key} className={`afford__zone afford__zone--${t.key} ${t.key === tier.key ? 'is-on' : ''}`} style={{ left: `${from * 100}%`, width: `calc(${(to - from) * 100}% - 3px)` }} />;
        })}
        <motion.span className="afford__knob" initial={false} animate={{ left: `${pos * 100}%` }} transition={{ type: 'spring', stiffness: 220, damping: 22 }} />
      </div>
      <div className="afford__scale">
        <span style={{ left: 0 }}>0×</span>
        <span style={{ left: '40%' }}>2×</span>
        <span className="is-guide" style={{ left: '60%' }}>3× guideline</span>
        <span style={{ left: '100%' }}>5×</span>
      </div>
      <div className="afford__foot">
        <img src="/figma/icon-shield.svg" width={22} height={22} alt="" />
        <p className="t-b3">{copy}</p>
      </div>
      <p className="afford__math">
        {peso(income)} income ÷ {peso(rent)} rent
      </p>
    </motion.div>
  );
}

function StepButtons({ next = 'Next', onNext, disabled, busy }: { next?: string; onNext: () => void; disabled?: boolean; busy?: boolean }) {
  const nav = useNav();
  return (
    <div className="apply__buttons">
      <Button onClick={onNext} disabled={disabled || busy}>
        {busy ? <span className="spinner" /> : next}
      </Button>
      <TextAction onClick={nav.back}>Back</TextAction>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1 / 4 — About you                                                   */
/* ------------------------------------------------------------------ */

export function Apply1() {
  const nav = useNav<ScreenId>();
  const { review } = useParams<{ review: boolean }>();
  const { state, update } = useStore();
  const [a, setA] = useState(state.application.about);
  const [tried, setTried] = useState(false);
  const set = (k: keyof typeof a) => (v: string) => setA((x) => ({ ...x, [k]: v }));
  const phoneErr = tried && !/^\+?[\d\s-]{10,}$/.test(a.phone) ? 'Enter a valid mobile number' : null;
  const emailErr = tried && !/^\S+@\S+\.\S+$/.test(a.email) ? 'Enter a valid email' : null;

  return (
    <ApplyFrame step={1}>
      <motion.div {...rise()}>
        <TitleBlock subtitle="1 / 4" title="About you" description="Details are pre-filled from your verified profile." />
      </motion.div>
      <motion.div className="apply__fields" {...rise(0.06)}>
        <Field label="Full name" value={a.name} onChange={set('name')} verified />
        <PhoneField label="Contact number" value={a.phone.replace(/^\+63\s?/, '')} onChange={(v) => set('phone')(`+63 ${v}`)} error={phoneErr} />
        <Field label="Email address" value={a.email} onChange={set('email')} inputMode="email" error={emailErr} />
        <Field label="Current Address" value={a.address} onChange={set('address')} />
        <Dropdown label="Occupants" options={['1 adult', '1 adult + pet', '2 adults', '2 adults + child']} value={a.occupants} onChange={set('occupants')} />
      </motion.div>
      <StepButtons
        next={review ? 'Save changes' : 'Next'}
        onNext={() => {
          setTried(true);
          if (!/^\+?[\d\s-]{10,}$/.test(a.phone) || !/^\S+@\S+\.\S+$/.test(a.email)) return;
          update((s) => ({ ...s, application: { ...s.application, about: a } }));
          if (review) nav.back();
          else nav.push('apply2');
        }}
      />
    </ApplyFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 2 / 4 — Work & income (live affordability check)                    */
/* ------------------------------------------------------------------ */

const toNumber = (s: string) => Number(s.replace(/[^\d]/g, '')) || 0;

export function Apply2() {
  const nav = useNav<ScreenId>();
  const { review } = useParams<{ review: boolean }>();
  const { state, update } = useStore();
  const [w, setW] = useState(state.application.work);
  const [status, setStatus] = useState<string | null>('Employed');
  const rent = listingById(state.application.listingId).price;
  const income = toNumber(w.income);

  return (
    <ApplyFrame step={2}>
      <motion.div {...rise()}>
        <TitleBlock subtitle="2 / 4" title="Work & Income" description="Landlords use this to check affordability" />
      </motion.div>
      <motion.div className="apply__fields" {...rise(0.06)}>
        <Dropdown label="Employment Status" options={['Employed', 'Self-employed', 'Freelancer', 'Student']} value={status} onChange={setStatus} />
        <Field label="Employer / Company" value={w.employer} onChange={(v) => setW({ ...w, employer: v })} />
        <Field label="Job title" value={w.jobTitle} onChange={(v) => setW({ ...w, jobTitle: v })} />
        <Field label="Monthly income" prefix="₱" value={w.income} inputMode="numeric" onChange={(v) => setW({ ...w, income: toNumber(v) ? toNumber(v).toLocaleString('en-PH') : '' })} />
        <Field label="Years employed" value={w.years} onChange={(v) => setW({ ...w, years: v })} />
        <Affordability income={income} rent={rent} />
      </motion.div>
      <StepButtons
        next={review ? 'Save changes' : 'Next'}
        onNext={() => {
          update((s) => ({ ...s, application: { ...s.application, work: w } }));
          if (review) nav.back();
          else nav.push('apply3');
        }}
      />
    </ApplyFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 3 / 4 — Upload documents (simulated upload with progress)           */
/* ------------------------------------------------------------------ */

function DocRow({ title, sub, done, optional, onUpload, onReplace }: { title: string; sub: string; done: boolean; optional?: boolean; onUpload: () => void; onReplace: () => void }) {
  const [progress, setProgress] = useState<number | null>(null);
  useEffect(() => {
    if (progress === null) return;
    if (progress >= 100) {
      const t = setTimeout(() => {
        setProgress(null);
        onUpload();
      }, 200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setProgress((p) => Math.min(100, (p ?? 0) + 7 + Math.random() * 14)), 90);
    return () => clearTimeout(t);
  }, [progress, onUpload]);

  return (
    <motion.button
      type="button"
      layout
      className={`doc ${done ? 'is-done' : ''} ${progress !== null ? 'is-uploading' : ''}`}
      onClick={() => (done ? onReplace() : progress === null && setProgress(0))}
      whileTap={{ scale: 0.98 }}
    >
      <span className="doc__icon">
        <AnimatePresence mode="popLayout" initial={false}>
          {done ? (
            <motion.span key="done" className="doc__check" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                <motion.path d="M20 6 9 17l-5-5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.1 }} />
              </svg>
            </motion.span>
          ) : progress !== null ? (
            <motion.svg key="ring" className="doc__ring" viewBox="0 0 36 36" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <circle cx="18" cy="18" r="15" />
              <motion.circle cx="18" cy="18" r="15" className="doc__ring-fill" animate={{ pathLength: progress / 100 }} transition={{ duration: 0.1 }} />
            </motion.svg>
          ) : (
            <motion.span key="up" className="doc__up" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <img src="/figma/icon-upload.svg" width={18} height={18} alt="" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="doc__text">
        <span className="doc__title">
          {title}
          {optional && !done && <span className="doc__optional">Optional</span>}
        </span>
        <span className="doc__sub">{progress !== null ? `Uploading… ${Math.round(progress)}%` : sub}</span>
      </span>
      {done && <span className="doc__replace">Replace</span>}
    </motion.button>
  );
}

export function Apply3() {
  const nav = useNav<ScreenId>();
  const { state, update } = useStore();
  const docs = state.application.docs;
  const [cert, setCert] = useState(false);
  const setDoc = (k: 'id' | 'payslip', v: boolean) => update((s) => ({ ...s, application: { ...s.application, docs: { ...s.application.docs, [k]: v } } }));

  return (
    <ApplyFrame step={3}>
      <motion.div {...rise()}>
        <TitleBlock subtitle="3 / 4" title="Upload documents" description="Only the landlord of this listing can see these" />
      </motion.div>
      <motion.div className="apply__docs" {...rise(0.06)}>
        <DocRow title="Valid government ID" sub="Driver's License • Uploaded Aug 5" done={docs.id} onUpload={() => setDoc('id', true)} onReplace={() => setDoc('id', false)} />
        <DocRow title="Proof of Income" sub={docs.payslip ? 'Payslip (3 months) • Uploaded just now' : 'Payslip or bank statement • Last 3 months'} done={docs.payslip} onUpload={() => { setDoc('payslip', true); toast('Payslip uploaded'); }} onReplace={() => setDoc('payslip', false)} />
        <DocRow title="Employment Certificate" sub={cert ? 'Certificate • Uploaded just now' : 'Speeds up landlord approval • Last 3 months'} done={cert} optional onUpload={() => setCert(true)} onReplace={() => setCert(false)} />
        <div className="income-card is-good income-card--small">
          <img src="/figma/icon-shield.svg" width={28} height={28} alt="" />
          <p className="t-b3">Files are encrypted and shared only with Shiela. You can remove them anytime.</p>
        </div>
      </motion.div>
      <AnimatePresence>
        {!(docs.id && docs.payslip) && (
          <motion.p className="apply__nudge t-b2-medium c-grey" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            Upload your ID and proof of income to continue
          </motion.p>
        )}
      </AnimatePresence>
      <StepButtons onNext={() => nav.push('apply4')} disabled={!(docs.id && docs.payslip)} />
    </ApplyFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 4 / 4 — Review & submit                                             */
/* ------------------------------------------------------------------ */

function ReviewCard({ title, rows, onEdit }: { title: string; rows: [string, string][]; onEdit: () => void }) {
  return (
    <div className="review">
      <div className="review__head">
        <p className="t-b1-semibold">{title}</p>
        <motion.button type="button" className="review__edit" whileTap={{ scale: 0.92 }} onClick={onEdit}>
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

export function Apply4() {
  const nav = useNav<ScreenId>();
  const { state, update } = useStore();
  const app = state.application;
  const [moveIn, setMoveIn] = useState<string | null>(app.moveIn);
  const [message, setMessage] = useState(app.message);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = () => {
    setBusy(true);
    setTimeout(() => {
      update((s) => ({
        ...s,
        application: { ...s.application, moveIn: moveIn ?? s.application.moveIn, message, status: 'submitted', submittedAt: 'Today, 9:41 AM' },
        landlord: { ...s.landlord, decisions: { ...s.landlord.decisions, juan: 'In Review' } },
        conversation: [{ from: 'juan' as const, text: message }, ...s.conversation.slice(1)],
      }));
      nav.push('apply5', { transition: 'smart' });
    }, 900);
  };

  return (
    <ApplyFrame step={4}>
      <motion.div {...rise()}>
        <TitleBlock subtitle="4 / 4" title="Review & Submit" description="Shiela will see exactly this." />
      </motion.div>
      <motion.div className="apply__fields apply__fields--review" {...rise(0.06)}>
        <ReviewCard
          title="About you"
          onEdit={() => nav.push('apply1', { params: { review: true } })}
          rows={[
            ['Name', app.about.name],
            ['Contact', app.about.phone],
            ['Occupants', app.about.occupants],
          ]}
        />
        <ReviewCard
          title="Work & income"
          onEdit={() => nav.push('apply2', { params: { review: true } })}
          rows={[
            ['Employer', app.work.employer],
            ['Job title', app.work.jobTitle],
            ['Monthly income', `₱${app.work.income}`],
          ]}
        />
        <ReviewCard
          title="Documents"
          onEdit={nav.back}
          rows={[
            ['Government ID', app.docs.id ? "Driver's License ✓" : 'Missing'],
            ['Proof of income', app.docs.payslip ? 'Payslip ✓' : 'Missing'],
          ]}
        />
        <DateField label="Preferred Move-in Date" value={moveIn} onChange={setMoveIn} />
        <label className="afield tappable">
          <span className="afield__label">
            <span className="t-b1">Message to landlord (optional)</span>
            <span className="t-b3 c-grey">{message.length}/300</span>
          </span>
          <textarea className="amessage" value={message} maxLength={300} rows={4} onChange={(e) => setMessage(e.target.value)} />
        </label>
        <label className="consent tappable">
          <motion.span className={`consent__box ${consent ? 'is-on' : ''}`} animate={{ scale: consent ? [1, 1.15, 1] : 1 }} transition={{ duration: 0.25 }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            {consent && (
              <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
                <motion.path d="M20 6 9 17l-5-5" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.2 }} />
              </svg>
            )}
          </motion.span>
          <span className="t-b2">I confirm this information is true and consent to Espas.you sharing it with this landlord.</span>
        </label>
      </motion.div>
      <StepButtons next="Submit application" onNext={submit} disabled={!consent} busy={busy} />
    </ApplyFrame>
  );
}

/* ------------------------------------------------------------------ */
/* Application sent                                                    */
/* ------------------------------------------------------------------ */

export function Apply5() {
  const nav = useNav<ScreenId>();
  const { state } = useStore();
  const l = listingById(state.application.listingId);
  const steps = [
    { title: 'Submitted', sub: state.application.submittedAt ?? 'Today, 9:41 AM', state: 'done' },
    { title: 'Under review', sub: 'Landlord is checking your details', state: 'current' },
    { title: 'Decision', sub: "You'll get a notification either way", state: 'todo' },
  ] as const;

  return (
    <Screen tone="light" background="var(--surface-default)" backdrop={<div className="sent__hero"><img src={l.id === 'cozy-loft' ? '/figma/listing-hero.webp' : l.image} alt="" /></div>}>
      <SuccessBadge />
      <div className="sent__body">
        <motion.div {...rise(0.35)}>
          <h1 className="t-title-3">Application sent!</h1>
          <p className="t-h4-regular c-grey sent__sub">{l.landlord.name.split(' ').slice(0, 2).join(' ')} usually replies within a day.</p>
        </motion.div>
        <motion.div className="timeline" {...rise(0.45)}>
          {steps.map((s, i) => (
            <div key={s.title} className={`timeline__row is-${s.state}`}>
              <span className="timeline__dot">
                {s.state === 'done' && (
                  <svg viewBox="0 0 24 24" width="10" height="10" aria-hidden>
                    <path d="M20 6 9 17l-5-5" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {s.state === 'current' && <span className="timeline__ping" />}
              </span>
              {i < steps.length - 1 && (
                <motion.span className="timeline__line" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.8 + i * 0.3, duration: 0.4 }} />
              )}
              <div>
                <p className="t-b1-semibold">{s.title}</p>
                <p className="t-b3 c-grey">{s.sub}</p>
              </div>
            </div>
          ))}
        </motion.div>
        <motion.div className="sent__buttons" {...rise(0.55)}>
          <Button onClick={() => nav.push('applicationStatus')}>Track application</Button>
          <Button variant="secondary" className="btn--light" onClick={() => nav.reset(['tenantDashboard'], { transition: 'push' })}>
            Keep browsing
          </Button>
        </motion.div>
      </div>
    </Screen>
  );
}
