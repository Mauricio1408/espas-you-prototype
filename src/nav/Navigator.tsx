import { AnimatePresence, LayoutGroup, motion, PresenceContext, type Transition as MotionTransition, type Variants } from 'motion/react';
import { createPortal } from 'react-dom';
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';

/**
 * Screen-stack navigator that reproduces the Figma prototype's transition
 * conventions (see the vault's `Prototype Wiring` stub):
 *
 *   Forward / next step   PUSH LEFT      0.35s ease-out
 *   Back                  BACK           reverses whatever opened the screen
 *   Lateral tab switch    SMART_ANIMATE  0.30s ease-in-out  (shared layoutIds morph)
 *   Modal / success       DISSOLVE       0.25s ease-out
 */
export type TransitionKind = 'push' | 'smart' | 'dissolve' | 'none';

export type Entry<S extends string = string> = {
  key: number;
  screen: S;
  params: Record<string, unknown>;
  transition: TransitionKind;
};

type Direction = 'forward' | 'back';

export type NavApi<S extends string = string> = {
  stack: Entry<S>[];
  current: Entry<S>;
  push: (screen: S, opts?: { transition?: TransitionKind; params?: Record<string, unknown> }) => void;
  replace: (screen: S, opts?: { transition?: TransitionKind; params?: Record<string, unknown> }) => void;
  back: () => void;
  /** Replace the whole stack — used by tab bars and the case-study jumper. */
  reset: (screens: S[], opts?: { transition?: TransitionKind; params?: Record<string, unknown> }) => void;
  canGoBack: boolean;
};

const NavContext = createContext<NavApi | null>(null);
const EntryContext = createContext<Entry | null>(null);
const LayerContext = createContext<HTMLElement | null>(null);

/** Renders children over the whole current screen (sheets, alerts, toasts). */
export function Portal({ children }: { children: ReactNode }) {
  const el = useContext(LayerContext);
  return el ? createPortal(children, el) : null;
}

/**
 * Root of one screen layer; exposes itself as the portal target.
 *
 * It also resets PresenceContext: descendants that declare `exit` props must
 * not register with the navigator's AnimatePresence, or a single unfinished
 * inner exit would keep the outgoing screen (and every later one) mounted.
 */
function LayerRoot({ children }: { children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  return (
    <div className="layer-root" ref={setEl}>
      <PresenceContext.Provider value={null}>
        <LayerContext.Provider value={el}>{children}</LayerContext.Provider>
      </PresenceContext.Provider>
    </div>
  );
}

export function useNav<S extends string = string>() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav outside <Navigator>');
  return ctx as unknown as NavApi<S>;
}

export function useParams<T extends Record<string, unknown>>() {
  return (useContext(EntryContext)?.params ?? {}) as Partial<T>;
}

const EASE_OUT = [0, 0, 0.58, 1] as const;
const EASE_IN_OUT = [0.42, 0, 0.58, 1] as const;

const timing: Record<TransitionKind, MotionTransition> = {
  push: { duration: 0.35, ease: EASE_OUT },
  smart: { duration: 0.3, ease: EASE_IN_OUT },
  dissolve: { duration: 0.25, ease: EASE_OUT },
  none: { duration: 0 },
};

type Custom = { kind: TransitionKind; dir: Direction };

/**
 * Layer variants. `custom` is read at exit time too, so an exiting screen
 * always animates with the *latest* navigation's kind and direction.
 */
const layer: Variants = {
  initial: ({ kind, dir }: Custom) => {
    if (kind === 'push') return dir === 'forward' ? { x: '100%', opacity: 1, zIndex: 2 } : { x: '-28%', opacity: 1, zIndex: 1 };
    if (kind === 'dissolve') return dir === 'forward' ? { opacity: 0, x: 0, zIndex: 2 } : { opacity: 1, x: 0, zIndex: 1 };
    if (kind === 'smart') return { opacity: 0, x: 0, zIndex: 2 };
    return { opacity: 1, x: 0, zIndex: 2 };
  },
  enter: ({ kind }: Custom) => ({ x: 0, opacity: 1, transition: timing[kind] }),
  exit: ({ kind, dir }: Custom) => {
    const t = timing[kind];
    if (kind === 'push') return dir === 'forward' ? { x: '-28%', zIndex: 1, transition: t } : { x: '100%', zIndex: 2, transition: t };
    if (kind === 'dissolve') return dir === 'forward' ? { opacity: 1, zIndex: 1, transition: t } : { opacity: 0, zIndex: 2, transition: t };
    if (kind === 'smart') return { opacity: 0, zIndex: 1, transition: t };
    return { opacity: 0, transition: t };
  },
};

/** Dims the screen being covered by a push, like iOS. */
const shade: Variants = {
  initial: ({ kind, dir }: Custom) => ({ opacity: kind === 'push' && dir === 'back' ? 0.12 : 0 }),
  enter: ({ kind }: Custom) => ({ opacity: 0, transition: timing[kind] }),
  exit: ({ kind, dir }: Custom) => ({ opacity: kind === 'push' && dir === 'forward' ? 0.12 : 0, transition: timing[kind] }),
};

type Props<S extends string> = {
  initial: S[];
  render: (screen: S) => ReactNode;
  onChange?: (stack: Entry<S>[]) => void;
  /** Imperative handle for UI outside the device (the case-study jumper). */
  apiRef?: React.RefObject<NavApi<S> | null>;
};

export function Navigator<S extends string>({ initial, render, onChange, apiRef }: Props<S>) {
  const keyRef = useRef(1);
  const make = (screen: S, transition: TransitionKind, params: Record<string, unknown> = {}): Entry<S> => ({
    key: keyRef.current++,
    screen,
    params,
    transition,
  });

  const [state, setState] = useState<{ stack: Entry<S>[]; custom: Custom }>(() => ({
    stack: initial.map((s) => make(s, 'none')),
    custom: { kind: 'none', dir: 'forward' },
  }));

  const commit = useCallback((stack: Entry<S>[], custom: Custom) => setState({ stack, custom }), []);

  // Report stack changes after commit (never from inside a state updater).
  const onChangeRef = useRef(onChange);
  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    onChangeRef.current?.(state.stack);
  }, [state.stack]);

  const push = useCallback<NavApi<S>['push']>(
    (screen, opts = {}) => {
      const kind = opts.transition ?? 'push';
      setState((s) => {
        const stack = [...s.stack, make(screen, kind, opts.params)];
        return { stack, custom: { kind, dir: 'forward' } };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const replace = useCallback<NavApi<S>['replace']>(
    (screen, opts = {}) => {
      const kind = opts.transition ?? 'push';
      setState((s) => {
        const stack = [...s.stack.slice(0, -1), make(screen, kind, opts.params)];
        return { stack, custom: { kind, dir: 'forward' } };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const back = useCallback(() => {
    setState((s) => {
      if (s.stack.length < 2) return s;
      const popped = s.stack[s.stack.length - 1];
      const stack = s.stack.slice(0, -1);
      return { stack, custom: { kind: popped.transition === 'none' ? 'push' : popped.transition, dir: 'back' } };
    });
  }, []);

  const reset = useCallback<NavApi<S>['reset']>(
    (screens, opts = {}) => {
      const kind = opts.transition ?? 'dissolve';
      const stack = screens.map((s, i) => make(s, i === screens.length - 1 ? kind : 'push', i === screens.length - 1 ? opts.params : {}));
      commit(stack, { kind, dir: 'forward' });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commit],
  );

  const current = state.stack[state.stack.length - 1];
  const api = useMemo<NavApi<S>>(
    () => ({ stack: state.stack, current, push, replace, back, reset, canGoBack: state.stack.length > 1 }),
    [state.stack, current, push, replace, back, reset],
  );

  useLayoutEffect(() => {
    if (apiRef) apiRef.current = api;
  }, [apiRef, api]);

  return (
    <NavContext.Provider value={api as unknown as NavApi}>
      <LayoutGroup>
        <div className="nav-viewport">
          <AnimatePresence initial={false} custom={state.custom}>
            <motion.div
              key={current.key}
              className="nav-layer"
              custom={state.custom}
              variants={layer}
              initial="initial"
              animate="enter"
              exit="exit"
              data-screen={current.screen}
            >
              <EntryContext.Provider value={current as Entry}>
                <LayerRoot>{render(current.screen)}</LayerRoot>
              </EntryContext.Provider>
              <motion.div className="nav-shade" custom={state.custom} variants={shade} aria-hidden />
            </motion.div>
          </AnimatePresence>
        </div>
      </LayoutGroup>
    </NavContext.Provider>
  );
}
