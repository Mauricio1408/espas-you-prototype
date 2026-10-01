import { motion } from 'motion/react';
import { useEffect, useState, type ReactNode } from 'react';
import { HomeIndicator, Screen, StatusBar } from '../../components/Chrome';
import { Button, PasswordField, TextField } from '../../components/Controls';
import { useNav } from '../../nav/Navigator';
import { useStore } from '../../state/store';
import type { ScreenId } from '../registry';
import './auth.css';

const spring = [0.32, 0.72, 0, 1] as const;

/** `Espas.you Brand Assets / Logo + Wordmark` + tagline, as used on the auth screens. */
function BrandMark({ style }: { style?: React.CSSProperties }) {
  return (
    <motion.div
      className="brand-mark"
      style={style}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: spring, delay: 0.05 }}
    >
      <div className="brand-mark__stack">
        <div className="brand-mark__logo">
          <img src="/figma/logo-red-shadow.svg" width={96.7347} height={87.5213} alt="" />
        </div>
        <img className="brand-mark__wordmark" src="/figma/wordmark-red.svg" width={179} height={32.6} alt="Espas.you" />
      </div>
      <p className="brand-mark__tagline t-h4-medium">Space made just for you</p>
    </motion.div>
  );
}

/** Cream hero panel with the 3D house render, positioned exactly as in Figma. */
function HouseHero({ panel, house, src }: { panel: React.CSSProperties; house: React.CSSProperties; src: string }) {
  return (
    <div className="house-hero" aria-hidden>
      <div className="house-hero__panel" style={panel} />
      <motion.img
        className="house-hero__img"
        src={src}
        alt=""
        style={house}
        initial={{ opacity: 0, scale: 1.04, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, ease: spring }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Splash() {
  const nav = useNav<ScreenId>();
  useEffect(() => {
    const t = setTimeout(() => nav.replace('start', { transition: 'dissolve' }), 2200);
    return () => clearTimeout(t);
  }, [nav]);

  return (
    <button type="button" className="splash" onClick={() => nav.replace('start', { transition: 'dissolve' })} aria-label="Continue">
      <div className="splash__mark">
        <motion.img
          src="/figma/logo-red.svg"
          width={119.494}
          height={119.494}
          alt=""
          initial={{ opacity: 0, scale: 0.6, rotate: -90 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: spring }}
        />
        <motion.div
          className="splash__wordmark"
          initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 0 }}
          animate={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
          transition={{ duration: 0.9, ease: spring, delay: 0.55 }}
        >
          <img src="/figma/wordmark-red.svg" width={160} height={29.2} alt="Espas.you" />
        </motion.div>
      </div>
      <motion.span className="splash__loader" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 2, ease: 'linear' }} />
    </button>
  );
}

/* ------------------------------------------------------------------ */

export function Start() {
  const nav = useNav<ScreenId>();
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: spring, delay },
  });
  return (
    <div className="screen start">
      <div className="start__bg" aria-hidden>
        <motion.img
          src="/figma/start-bg.webp"
          alt=""
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 6, ease: 'easeOut' }}
        />
        <div className="start__scrim" />
      </div>
      <StatusBar tone="light" />
      <div className="screen__body">
        <div className="start__stack">
          <div className="start__top">
            <motion.img
              src="/figma/logo-white.svg"
              width={95.6099}
              height={84.5988}
              alt="Espas.you"
              className="start__logo"
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: spring }}
            />
            <div className="start__text">
              <h1 className="t-title-2">
                <motion.span {...rise(0.15)}>Let’s start </motion.span>
                <motion.span {...rise(0.25)}>your journey</motion.span>
              </h1>
              <motion.p className="t-h4-medium start__desc" {...rise(0.38)}>
                Discover comfort, tradition, and a place just for you.
              </motion.p>
            </div>
          </div>
          <motion.div {...rise(0.5)}>
            <Button onClick={() => nav.push('signInOptions')}>Get Started</Button>
          </motion.div>
        </div>
      </div>
      <HomeIndicator tone="light" />
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Simulates a network hop so CTAs get a real loading state. */
function useSubmit(after: () => void, ms = 700) {
  const [busy, setBusy] = useState<string | null>(null);
  const run = (id: string) => {
    if (busy) return;
    setBusy(id);
    setTimeout(() => {
      after();
      setBusy(null);
    }, ms);
  };
  return [busy, run] as const;
}

function Spinner({ light = true }: { light?: boolean }) {
  return <span className={`spinner ${light ? '' : 'spinner--dark'}`} aria-label="Loading" />;
}

function AuthOption({ className, icon, children, onClick, busy, delay }: { className: string; icon: ReactNode; children: ReactNode; onClick: () => void; busy: boolean; delay: number }) {
  return (
    <motion.button
      type="button"
      className={`auth-option ${className}`}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: spring, delay }}
    >
      {busy ? <Spinner light={!className.includes('google')} /> : icon}
      <span>{children}</span>
    </motion.button>
  );
}

export function SignInOptions() {
  const nav = useNav<ScreenId>();
  const { update } = useStore();
  const [busy, run] = useSubmit(() => {
    update((s) => ({ ...s, signedIn: true }));
    nav.push('roleSelection');
  });
  return (
    <Screen
      className="auth"
      backdrop={
        <HouseHero
            src="/figma/auth-house-modern.webp"
            panel={{ left: -353, top: 10, width: 1105, height: 623 }}
            house={{ left: -162.94, top: 261.4, width: 724.88, height: 386.57 }}
          />
      }
    >
      <BrandMark style={{ top: 94 }} />
      <div className="auth-options">
        <AuthOption className="auth-option--google" icon={<img src="/figma/social-google.svg" width={28} height={28} alt="" />} onClick={() => run('google')} busy={busy === 'google'} delay={0.2}>
          Continue with Google
        </AuthOption>
        <AuthOption className="auth-option--facebook" icon={<img src="/figma/social-facebook.svg" width={28} height={28} alt="" />} onClick={() => run('facebook')} busy={busy === 'facebook'} delay={0.28}>
          Continue with Facebook
        </AuthOption>
        <AuthOption className="auth-option--mobile" icon={<img src="/figma/icon-phone-white.svg" width={28} height={28} alt="" />} onClick={() => nav.push('logIn')} busy={false} delay={0.36}>
          Use Mobile Number
        </AuthOption>
      </div>
    </Screen>
  );
}

/* ------------------------------------------------------------------ */

function SocialRow({ onPick, busy }: { onPick: (id: string) => void; busy: string | null }) {
  return (
    <>
      <div className="continue-with">
        <img src="/figma/divider-90.svg" width={90} height={1} alt="" />
        <span className="t-b2-medium c-grey">or continue with</span>
        <img src="/figma/divider-90.svg" width={90} height={1} alt="" />
      </div>
      <div className="social-row">
        <motion.button type="button" className="social-btn social-btn--google" whileTap={{ scale: 0.95 }} onClick={() => onPick('google')} aria-label="Continue with Google">
          {busy === 'google' ? <Spinner light={false} /> : <img src="/figma/social-google-24.svg" width={24} height={24} alt="" />}
        </motion.button>
        <motion.button type="button" className="social-btn social-btn--facebook" whileTap={{ scale: 0.95 }} onClick={() => onPick('facebook')} aria-label="Continue with Facebook">
          {busy === 'facebook' ? <Spinner /> : <img src="/figma/social-facebook-24.svg" width={24} height={24} alt="" />}
        </motion.button>
      </div>
    </>
  );
}

export function LogIn() {
  const nav = useNav<ScreenId>();
  const { update } = useStore();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, run] = useSubmit(() => {
    update((s) => ({ ...s, signedIn: true }));
    nav.push('roleSelection');
  });
  const idError = tried && id.trim().length < 3 ? 'Enter your username, email or mobile number' : null;
  const pwError = tried && pw.length < 6 ? 'Password must be at least 6 characters' : null;

  return (
    <Screen
      className="auth"
      backdrop={
        <HouseHero
            src="/figma/auth-house-pool.webp"
            panel={{ left: -153, top: -117, width: 675, height: 647 }}
            house={{ left: -153.2, top: 205.9, width: 675.4, height: 360.4 }}
          />
      }
    >
      <BrandMark style={{ top: 18 }} />
      <motion.form
        className="auth-form"
        style={{ bottom: 11 }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: spring, delay: 0.15 }}
        onSubmit={(e) => {
          e.preventDefault();
          setTried(true);
          if (id.trim().length >= 3 && pw.length >= 6) run('form');
        }}
      >
        <div className="auth-form__fields">
          <TextField label="Username / Email / Mobile" value={id} onChange={(e) => setId(e.target.value)} error={idError} autoComplete="username" />
          <PasswordField label="Password" value={pw} onChange={(e) => setPw(e.target.value)} error={pwError} autoComplete="current-password" />
          <Button type="submit">{busy === 'form' ? <Spinner /> : 'Log In'}</Button>
        </div>
        <SocialRow onPick={run} busy={busy} />
        <p className="auth-form__switch t-b1">
          No account yet?{' '}
          <button type="button" className="t-b1-semibold underline" onClick={() => nav.push('signUp')}>
            Sign Up
          </button>
        </p>
      </motion.form>
    </Screen>
  );
}

export function SignUp() {
  const nav = useNav<ScreenId>();
  const { update } = useStore();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, run] = useSubmit(() => {
    update((s) => ({ ...s, signedIn: true }));
    nav.push('roleSelection');
  });
  const idError = tried && id.trim().length < 3 ? 'Enter a username, email or mobile number' : null;
  const pwError = tried && pw.length < 6 ? 'Use at least 6 characters' : null;
  const pw2Error = tried && pw2 !== pw ? 'Passwords don’t match' : null;

  return (
    <Screen
      className="auth"
      backdrop={
        <HouseHero
            src="/figma/auth-house-pool.webp"
            panel={{ left: -151, top: -160, width: 675, height: 647 }}
            house={{ left: -151.2, top: 162.9, width: 675.4, height: 360.4 }}
          />
      }
    >
      <BrandMark style={{ top: 0 }} />
      <motion.form
        className="auth-form"
        style={{ bottom: 2 }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: spring, delay: 0.15 }}
        onSubmit={(e) => {
          e.preventDefault();
          setTried(true);
          if (id.trim().length >= 3 && pw.length >= 6 && pw === pw2) run('form');
        }}
      >
        <div className="auth-form__fields">
          <TextField label="Username / Email / Mobile" value={id} onChange={(e) => setId(e.target.value)} error={idError} autoComplete="username" />
          <PasswordField label="Password" value={pw} onChange={(e) => setPw(e.target.value)} error={pwError} autoComplete="new-password" />
          <PasswordField label="Confirm Password" value={pw2} onChange={(e) => setPw2(e.target.value)} error={pw2Error} autoComplete="new-password" />
          <Button type="submit">{busy === 'form' ? <Spinner /> : 'Sign Up'}</Button>
        </div>
        <SocialRow onPick={run} busy={busy} />
        <button type="button" className="auth-form__switch t-b1-semibold underline" onClick={() => nav.push('logIn')}>
          I have an existing account
        </button>
      </motion.form>
    </Screen>
  );
}
