import { AnimatePresence, motion, useAnimationControls } from 'motion/react';
import { useState, type ReactNode } from 'react';
import { Screen } from '../../components/Chrome';
import { BackLink, Button, PrimaryWithSkip, ProgressBar, RadioCard, TitleBlock } from '../../components/Controls';
import { CountUp, DateField, Dropdown, RangeSlider, SystemAlert } from '../../components/Inputs';
import { juan, preferenceTags } from '../../data/mock';
import { useNav, useParams } from '../../nav/Navigator';
import { useStore, type Role } from '../../state/store';
import type { ScreenId } from '../registry';
import './onboarding.css';

const spring = [0.32, 0.72, 0, 1] as const;

/** Content enters with a short rise after the push settles — keeps each step feeling deliberate. */
export const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: spring, delay: 0.12 + delay },
});

/**
 * Fixed onboarding frame: Back link at (20, 15), segmented progress at y=71,
 * Title Block at (28, 171) and a bottom CTA at y=722 of the Real Estate area.
 */
export function StepFrame({ step, children, cta, ctaTop = 722 }: { step?: number; children: ReactNode; cta: ReactNode; ctaTop?: number }) {
  const nav = useNav();
  return (
    <Screen>
      <div className="step__back">
        <BackLink onClick={nav.back} />
      </div>
      {step && (
        <div className="step__progress">
          <ProgressBar step={step} />
        </div>
      )}
      {children}
      <div className="step__cta" style={{ top: ctaTop }}>
        {cta}
      </div>
    </Screen>
  );
}

/** Scrolling onboarding frame (long forms): progress bar sticks to the top. */
export function ScrollStepFrame({ step, children }: { step: number; children: ReactNode }) {
  const nav = useNav();
  return (
    <Screen>
      <div className="step-scroll__back">
        <BackLink onClick={nav.back} />
      </div>
      <div className="step-scroll__progress">
        <ProgressBar step={step} />
      </div>
      <div className="scroll step-scroll">{children}</div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* 1 / 5 — Role Selection (tenant + landlord fork)                    */
/* ------------------------------------------------------------------ */

export function RoleSelection({ initialRole = null }: { initialRole?: Role | null }) {
  const nav = useNav<ScreenId>();
  const { update } = useStore();
  const params = useParams<{ role: Role }>();
  const [role, setRole] = useState<Role | null>(params.role ?? initialRole);
  const shake = useAnimationControls();

  const next = () => {
    if (!role) {
      shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
      return;
    }
    update((s) => ({ ...s, role }));
    nav.push(role === 'tenant' ? 'tenantLocation' : 'landlordBasicInfo');
  };

  return (
    <StepFrame step={1} cta={<PrimaryWithSkip label="Next" onPrimary={next} onSkip={nav.back} />}>
      <motion.div className="step__title" {...rise()}>
        <TitleBlock subtitle="1 / 5" title="How will you be using Espas.you?" description="Choose among the options below." />
      </motion.div>
      <motion.div className="role__options" {...rise(0.08)}>
        <motion.div className="role__options-inner" role="radiogroup" animate={shake}>
          <RadioCard label="I’m looking for a place to crash in" selected={role === 'tenant'} onSelect={() => setRole('tenant')} />
          <RadioCard label="I want to enlist my property" selected={role === 'landlord'} onSelect={() => setRole('landlord')} />
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {!role && (
          <motion.p className="role__hint t-b2-medium c-grey" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            Pick one to continue
          </motion.p>
        )}
      </AnimatePresence>
    </StepFrame>
  );
}

export function RoleSelectionLandlord() {
  return <RoleSelection initialRole="landlord" />;
}

/* ------------------------------------------------------------------ */
/* 2 / 5 — Location                                                    */
/* ------------------------------------------------------------------ */

export function TenantLocation() {
  const nav = useNav<ScreenId>();
  const { update } = useStore();
  const [asking, setAsking] = useState(false);
  const [located, setLocated] = useState(false);

  const allow = () => {
    setAsking(false);
    setLocated(true);
    update((s) => ({ ...s, tenant: { ...s.tenant, location: 'Manila City, Philippines' } }));
    setTimeout(() => nav.push('tenantBasicInfo'), 1100);
  };

  return (
    <StepFrame step={2} cta={<PrimaryWithSkip label="Yes, go ahead" skipLabel="No, Skip it" onPrimary={() => setAsking(true)} onSkip={() => nav.push('tenantBasicInfo')} />}>
      <motion.div className="step__title" {...rise()}>
        <TitleBlock subtitle="2 / 5" title="Do you mind sharing your location?" description="We’ll use it to find the best nearby spaces — nothing more, promise!" />
      </motion.div>
      <AnimatePresence>
        {located && (
          <motion.div className="located" initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 26 }}>
            <span className="located__pulse" />
            <span className="located__pin">📍</span>
            <span className="t-b1-semibold">Manila City, Philippines</span>
          </motion.div>
        )}
      </AnimatePresence>
      <SystemAlert
        open={asking}
        title="Allow “Espas.you” to use your location?"
        message="Your location is used to show nearby spaces and commute times."
        actions={[
          { label: 'Allow Once', onPress: allow },
          { label: 'Allow While Using App', onPress: allow, bold: true },
          {
            label: 'Don’t Allow',
            onPress: () => {
              setAsking(false);
              nav.push('tenantBasicInfo');
            },
          },
        ]}
      />
    </StepFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 3 / 5 — Preferences & needs (budget, move-in, lease)               */
/* ------------------------------------------------------------------ */

export function TenantBasicInfo() {
  const nav = useNav<ScreenId>();
  const { state, update } = useStore();
  const [budget, setBudget] = useState<[number, number]>(state.tenant.budget[0] === 12000 ? [5000, 15000] : state.tenant.budget);
  const [moveIn, setMoveIn] = useState<string | null>(null);
  const [lease, setLease] = useState<string | null>(null);

  return (
    <ScrollStepFrame step={3}>
      <div className="basic-info">
        <motion.div {...rise()}>
          <TitleBlock subtitle="3 / 5" title="Tailor your preferences and needs." description="To help us find the best place fit for your needs." />
        </motion.div>
        <motion.div className="basic-info__fields" {...rise(0.08)}>
          <RangeSlider value={budget} onChange={setBudget} />
          <DateField label="Move-in Date" value={moveIn} onChange={setMoveIn} />
          <Dropdown label="Lease Type" options={['Long-term (6+ months)', 'Short-term (1–5 months)', 'Bedspace / Shared']} value={lease} onChange={setLease} />
        </motion.div>
        <Button
          className="basic-info__next"
          onClick={() => {
            update((s) => ({ ...s, tenant: { ...s.tenant, budget }, application: moveIn ? { ...s.application, moveIn } : s.application }));
            nav.push('tenantPreferences');
          }}
        >
          Next
        </Button>
      </div>
    </ScrollStepFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 4 / 5 — Interests                                                   */
/* ------------------------------------------------------------------ */

export function TenantPreferences() {
  const nav = useNav<ScreenId>();
  const { state, update } = useStore();
  const [picked, setPicked] = useState<string[]>(state.tenant.preferences);
  const toggle = (t: string) => setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  return (
    <ScrollStepFrame step={4}>
      <div className="prefs">
        <motion.div {...rise()}>
          <TitleBlock subtitle="4 / 5" title="What are you interested in?" description="It helps us match you with the right spaces — promise, no spam." />
        </motion.div>
        <div className="prefs__chips">
          {preferenceTags.map((t, i) => {
            const on = picked.includes(t);
            return (
              <motion.button
                key={t}
                type="button"
                aria-pressed={on}
                className={`pref-chip ${on ? 'is-on' : ''}`}
                onClick={() => toggle(t)}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.035, duration: 0.4, ease: spring }}
                whileTap={{ scale: 0.94 }}
              >
                <span>{t}</span>
                <motion.img
                  src={on ? '/figma/icon-x-white.svg' : '/figma/icon-plus.svg'}
                  key={on ? 'x' : 'plus'}
                  width={24}
                  height={24}
                  alt=""
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.25, ease: spring }}
                />
              </motion.button>
            );
          })}
        </div>
        <div className="prefs__footer">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={picked.length} className="t-b2-medium c-grey" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
              {picked.length === 0 ? 'Pick at least one interest' : `${picked.length} selected`}
            </motion.p>
          </AnimatePresence>
          <Button
            disabled={picked.length === 0}
            onClick={() => {
              update((s) => ({ ...s, tenant: { ...s.tenant, preferences: picked } }));
              nav.push('tenantNotifications');
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </ScrollStepFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 5 / 5 — Notifications                                               */
/* ------------------------------------------------------------------ */

export function NotificationsStep({ next, role }: { next: ScreenId; role: Role }) {
  const nav = useNav<ScreenId>();
  const { update } = useStore();
  const [asking, setAsking] = useState(false);
  const decide = (on: boolean) => {
    setAsking(false);
    update((s) => (role === 'tenant' ? { ...s, tenant: { ...s.tenant, notifications: on } } : { ...s, landlord: { ...s.landlord, notifications: on } }));
    nav.push(next);
  };
  return (
    <StepFrame
      step={5}
      ctaTop={677}
      cta={<PrimaryWithSkip label="Yes, I want to get notified" skipLabel="Don't send me notifications" onPrimary={() => setAsking(true)} onSkip={() => decide(false)} />}
    >
      <motion.div className="step__title" {...rise()}>
        <TitleBlock subtitle="5 / 5" title="Lastly, we’ll need to get you notified." description="It helps us match you with the right spaces near you. Promise, no spam." />
      </motion.div>
      <motion.div className="notif-preview" initial={{ opacity: 0, y: -30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 22 }}>
        <img src="/figma/logo-red.svg" width={28} height={28} alt="" />
        <div>
          <p className="t-b3-semibold">Espas.you · now</p>
          <p className="t-b2">{role === 'tenant' ? 'Shiela approved your application 🎉' : 'New application: Juan Dela Cruz (100)'}</p>
        </div>
      </motion.div>
      <SystemAlert
        open={asking}
        title="“Espas.you” Would Like to Send You Notifications"
        message="Notifications may include alerts, sounds, and icon badges. These can be configured in Settings."
        actions={[
          { label: 'Don’t Allow', onPress: () => decide(false) },
          { label: 'Allow', onPress: () => decide(true), bold: true },
        ]}
      />
    </StepFrame>
  );
}

export function TenantNotifications() {
  return <NotificationsStep next="reliabilityScore" role="tenant" />;
}

/* ------------------------------------------------------------------ */
/* Reliability Score — the differentiator                              */
/* ------------------------------------------------------------------ */

type Person = { name: string; title: string; avatar: string; badge: number; decimals?: number; fill?: boolean };

const JUAN: Person = { name: juan.name, title: 'Top Applicant', avatar: '/figma/juan-portrait.webp', badge: juan.score };

type ScoreProps = {
  /** Figma: tenant title is Title/T3/Bold, Trusted Tenants is Title/T3/SemiBold. */
  titleWeight?: 'bold' | 'semibold';
  person?: Person;
  title?: string;
  body?: string;
  cta?: string;
  onCta?: (nav: ReturnType<typeof useNav<ScreenId>>) => void;
};

export function ReliabilityScore({
  person = JUAN,
  title = 'Your Tenant Reliability Score',
  body = 'Stand out to top landlords and secure your ideal space faster. Your score is built on your on-time payments and verified reviews. This gives you a competitive edge when applying.',
  cta = 'Continue',
  onCta = (nav) => nav.push('endOfOnboarding'),
  titleWeight = 'bold',
}: ScoreProps) {
  const nav = useNav<ScreenId>();
  return (
    <Screen
      tone="light"
      backdrop={
        <motion.div className="score__gradient" aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
          <motion.img
            src="/figma/reliability-gradient.svg"
            width={440}
            height={350}
            alt=""
            animate={{ scale: [1, 1.08, 1], rotate: [0, 2, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      }
    >
      <div className="score__back">
        <BackLink onClick={nav.back} tone="light" />
      </div>
      <div className="score__profile">
        <div className="score__avatar-wrap">
          <motion.div className={`score__avatar ${person.fill ? 'score__avatar--fill' : ''}`} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}>
            <img src={person.avatar} alt={person.name} />
          </motion.div>
          <svg className="score__ring" viewBox="0 0 170 170" aria-hidden>
            <motion.circle cx="85" cy="85" r="82" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, ease: spring, delay: 0.35 }} />
          </svg>
          <motion.div className="score__badge" initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.45 }}>
            <CountUp to={person.badge} delay={0.45} duration={1.1} format={(n) => n.toFixed(person.decimals ?? 0)} />
          </motion.div>
        </div>
        <motion.div className="score__name" {...rise(0.3)}>
          <p className="t-h2">{person.name}</p>
          <p className="t-h4-medium">{person.title}</p>
        </motion.div>
      </div>
      <div className="score__stack">
        <motion.div className="score__copy" {...rise(0.35)}>
          <h1 className={`score__title score__title--${titleWeight}`}>{title}</h1>
          <p className="t-h4-regular c-grey">{body}</p>
        </motion.div>
        <motion.div {...rise(0.45)} style={{ width: '100%' }}>
          <Button onClick={() => onCta(nav)}>{cta}</Button>
        </motion.div>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */
/* End of Onboarding                                                   */
/* ------------------------------------------------------------------ */

export function EndOfOnboarding() {
  const nav = useNav<ScreenId>();
  return (
    <Screen
      background="var(--surface-highlight)"
      backdrop={
        <div className="end__hero" aria-hidden>
          <motion.img src="/figma/end-house.webp" alt="" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: spring }} />
        </div>
      }
    >
      <motion.div className="end__brand" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: spring, delay: 0.1 }}>
        <img src="/figma/logo-red-104.svg" width={104.557} height={104.557} alt="" />
        <img src="/figma/wordmark-red.svg" width={139.1} height={25.4} alt="Espas.you" />
      </motion.div>
      <motion.div className="end__copy" {...rise(0.3)}>
        <h1 className="score__title">You're all set!</h1>
        <p className="t-h4-regular c-grey">We’ve tailored your feed based on your lifestyle and budget. Let's find a space that feels like home.</p>
      </motion.div>
      <motion.div className="end__cta" {...rise(0.4)}>
        <Button onClick={() => nav.reset(['tenantDashboard'], { transition: 'dissolve' })}>Continue</Button>
      </motion.div>
      <Confetti />
    </Screen>
  );
}

/** A small, brand-coloured celebration burst for the end of onboarding. */
function Confetti() {
  const pieces = Array.from({ length: 22 }, (_, i) => i);
  const colors = ['#BA0E0A', '#F32420', '#FFDD52', '#00BB89', '#FFC6C5'];
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((i) => {
        const x = (i / pieces.length) * 440 + (i % 3) * 7;
        return (
          <motion.span
            key={i}
            style={{ left: x, background: colors[i % colors.length], width: i % 2 ? 8 : 6, height: i % 2 ? 12 : 6, borderRadius: i % 3 === 0 ? 4 : 1 }}
            initial={{ y: -30, opacity: 0, rotate: 0 }}
            animate={{ y: [-30, 420 + (i % 5) * 60], opacity: [0, 1, 1, 0], rotate: 360 + i * 40, x: [0, (i % 2 ? 1 : -1) * (20 + (i % 4) * 10)] }}
            transition={{ duration: 2.2 + (i % 4) * 0.3, delay: 0.5 + (i % 6) * 0.06, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}
