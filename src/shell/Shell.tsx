import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { listingById } from '../data/mock';
import { Navigator, type Entry, type NavApi } from '../nav/Navigator';
import { pathTo, registry, screenIds, type Journey, type ScreenId } from '../screens/registry';
import { useStore } from '../state/store';
import { Device } from './Device';

const FIGMA_FILE = 'https://www.figma.com/design/lPeEnqhDEuaoXA6W6Ot3Uq/Espas.you-V2';
const REPO = 'https://github.com/Mauricio1408/espas-you-prototype';

const journeyStart: Record<Journey, ScreenId[]> = {
  tenant: ['splash'],
  landlord: pathTo('roleSelectionLandlord' as ScreenId),
};

function useIsMobile() {
  const q = '(max-width: 699px)';
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return m;
}

export function Shell() {
  const nav = useRef<NavApi<ScreenId> | null>(null);
  const [stack, setStack] = useState<Entry<ScreenId>[]>([]);
  const [journey, setJourney] = useState<Journey>('tenant');
  const [navKey, setNavKey] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const mobile = useIsMobile();
  const { state, reset, update } = useStore();

  const current = stack[stack.length - 1]?.screen ?? 'splash';
  const meta = registry[current];

  const sections = useMemo(() => {
    const out = new Map<string, ScreenId[]>();
    for (const id of screenIds) {
      const m = registry[id];
      if (m.journey !== 'shared' && m.journey !== journey) continue;
      out.set(m.section, [...(out.get(m.section) ?? []), id]);
    }
    return [...out.entries()];
  }, [journey]);

  const startJourney = (j: Journey) => {
    setJourney(j);
    update((s) => ({ ...s, role: j }));
    setNavKey((k) => k + 1);
  };

  const jump = (id: ScreenId) => {
    const j = registry[id].journey;
    if (j !== 'shared' && j !== journey) setJourney(j);
    nav.current?.reset(pathTo(id), { transition: 'dissolve' });
    setDrawer(false);
  };

  const app = (
    <Device bezel={!mobile}>
      <Navigator<ScreenId>
        key={navKey}
        initial={journeyStart[journey]}
        apiRef={nav}
        onChange={setStack}
        render={(id) => {
          const C = registry[id].component;
          return <C />;
        }}
      />
    </Device>
  );

  const appStatus = {
    none: 'Not yet applied',
    submitted: 'Submitted · awaiting landlord',
    approved: 'Approved by landlord',
    declined: 'Declined by landlord',
  }[state.application.status];

  const panel = (
    <aside className="panel">
      <header className="panel__head">
        <img src="/figma/logo-red.svg" width={40} height={40} alt="" />
        <div>
          <img src="/figma/wordmark-red.svg" width={110} height={20} alt="Espas.you" />
          <p className="panel__kicker">Interactive prototype · case study</p>
        </div>
      </header>

      <p className="panel__lede">
        A trust-first rental app for the Philippines. Tenants build a <strong>Reliability Score</strong>; landlords review verified
        applicants. Coded from the Figma hi-fi, using the prototype’s own motion spec.
      </p>

      <div className="segmented" role="tablist" aria-label="Journey">
        {(['tenant', 'landlord'] as Journey[]).map((j) => (
          <button key={j} role="tab" aria-selected={journey === j} className={journey === j ? 'is-active' : ''} onClick={() => startJourney(j)}>
            {journey === j && <motion.span layoutId="seg" className="segmented__thumb" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
            <span>{j === 'tenant' ? 'Tenant journey' : 'Landlord journey'}</span>
          </button>
        ))}
      </div>

      <section className="panel__card">
        <p className="panel__label">Now viewing</p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={current} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            <h2 className="panel__title">{meta.title}</h2>
            <p className="panel__meta">
              HF · {meta.section} ·{' '}
              <a href={`${FIGMA_FILE}?node-id=${meta.figma.replace(':', '-')}`} target="_blank" rel="noreferrer">
                Figma {meta.figma}
              </a>
            </p>
            {meta.note && <p className="panel__note">{meta.note}</p>}
          </motion.div>
        </AnimatePresence>
        <div className="panel__actions">
          <button className="ghost-btn" onClick={() => nav.current?.back()} disabled={stack.length < 2}>
            ← Back
          </button>
          <button className="ghost-btn" onClick={() => startJourney(journey)}>
            ↺ Restart journey
          </button>
        </div>
      </section>

      <section className="panel__card">
        <p className="panel__label">Live shared state</p>
        <dl className="state-list">
          <div>
            <dt>Application</dt>
            <dd className={`state-pill state-pill--${state.application.status}`}>{appStatus}</dd>
          </div>
          <div>
            <dt>Listing</dt>
            <dd>{listingById(state.application.listingId).title}</dd>
          </div>
          <div>
            <dt>Saved homes</dt>
            <dd>{state.favorites.length}</dd>
          </div>
        </dl>
        <p className="panel__hint">Apply as Juan, then switch to the landlord journey to approve him — the decision flows back.</p>
        <button
          className="ghost-btn ghost-btn--quiet"
          onClick={() => {
            reset();
            startJourney(journey);
          }}
        >
          Reset demo data
        </button>
      </section>

      <section className="panel__card panel__card--index">
        <p className="panel__label">Screens</p>
        {sections.map(([section, ids]) => (
          <div key={section} className="index-group">
            <p className="index-group__title">{section}</p>
            {ids.map((id) => (
              <button key={id} className={`index-item ${id === current ? 'is-current' : ''}`} onClick={() => jump(id)}>
                {id === current && <motion.span layoutId="index-dot" className="index-item__dot" />}
                {registry[id].title}
              </button>
            ))}
          </div>
        ))}
      </section>

      <section className="panel__card">
        <p className="panel__label">Motion spec</p>
        <ul className="spec">
          <li>
            <b>Push left</b> 350ms ease-out <span>forward step</span>
          </li>
          <li>
            <b>Smart animate</b> 300ms ease-in-out <span>tab switch</span>
          </li>
          <li>
            <b>Dissolve</b> 250ms ease-out <span>overlay / success</span>
          </li>
          <li>
            <b>Back</b> reverses the opening transition
          </li>
        </ul>
        <p className="panel__hint">Click anywhere inert on the phone to flash its hotspots.</p>
      </section>

      <footer className="panel__foot">
        <a href={FIGMA_FILE} target="_blank" rel="noreferrer">
          Figma file
        </a>
        <a href={REPO} target="_blank" rel="noreferrer">
          Source on GitHub
        </a>
      </footer>
    </aside>
  );

  if (mobile) {
    return (
      <div className="shell shell--mobile">
        {app}
        <button className="drawer-tab" onClick={() => setDrawer(true)} aria-label="Open screen index">
          <span />
          <span />
          <span />
        </button>
        <AnimatePresence>
          {drawer && (
            <>
              <motion.div className="drawer-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)} />
              <motion.div
                className="drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
              >
                {panel}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="shell">
      {panel}
      {app}
    </div>
  );
}
