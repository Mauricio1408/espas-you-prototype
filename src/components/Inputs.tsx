import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Portal } from '../nav/Navigator';
import { RadioDot } from './Controls';

const spring = [0.32, 0.72, 0, 1] as const;

/* ------------------------------------------------------------------ */
/* Input / Budget Range Slider                                         */
/* ------------------------------------------------------------------ */

const fmt = (n: number) => n.toLocaleString('en-PH');

export function RangeSlider({
  value,
  onChange,
  min = 0,
  max = 20000,
  step = 500,
  label = 'Budget (₱)',
}: {
  value: [number, number];
  onChange: (v: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<0 | 1 | null>(null);
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  const fromPointer = (clientX: number) => {
    const r = trackRef.current!.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return Math.round((min + t * (max - min)) / step) * step;
  };

  const startDrag = (thumb: 0 | 1) => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActive(thumb);
  };

  const onMove = (e: React.PointerEvent) => {
    if (active === null) return;
    const v = fromPointer(e.clientX);
    if (active === 0) onChange([Math.min(v, value[1] - step), value[1]]);
    else onChange([value[0], Math.max(v, value[0] + step)]);
  };

  const onTrackDown = (e: React.PointerEvent) => {
    const v = fromPointer(e.clientX);
    const nearer: 0 | 1 = Math.abs(v - value[0]) <= Math.abs(v - value[1]) ? 0 : 1;
    if (nearer === 0) onChange([Math.min(v, value[1] - step), value[1]]);
    else onChange([value[0], Math.max(v, value[0] + step)]);
  };

  const key = (thumb: 0 | 1) => (e: React.KeyboardEvent) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? step : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -step : 0;
    if (!d) return;
    e.preventDefault();
    if (thumb === 0) onChange([Math.max(min, Math.min(value[0] + d, value[1] - step)), value[1]]);
    else onChange([value[0], Math.min(max, Math.max(value[1] + d, value[0] + step))]);
  };

  const amount = `${fmt(value[0])} - ${value[1] >= max ? `${fmt(max)}+` : fmt(value[1])}`;

  return (
    <div className="range">
      <p className="t-b1 range__label">{label}</p>
      <div className="range__card">
        <motion.p className="range__amount" key={amount} initial={{ opacity: 0.6, y: 2 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.12 }}>
          {amount}
        </motion.p>
        <div className="range__stack">
          <div className="range__track" ref={trackRef} onPointerDown={onTrackDown} onPointerMove={onMove} onPointerUp={() => setActive(null)}>
            <span className="range__rail" />
            <span className="range__fill" style={{ left: `${pct(value[0])}%`, right: `${100 - pct(value[1])}%` }} />
            {([0, 1] as const).map((t) => (
              <motion.span
                key={t}
                role="slider"
                tabIndex={0}
                aria-label={t === 0 ? 'Minimum budget' : 'Maximum budget'}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={value[t]}
                className="range__thumb"
                style={{ left: `${pct(value[t])}%` }}
                animate={{ scale: active === t ? 1.25 : 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                onPointerDown={startDrag(t)}
                onPointerMove={onMove}
                onPointerUp={() => setActive(null)}
                onKeyDown={key(t)}
              />
            ))}
          </div>
          <div className="range__ticks t-b1 c-grey">
            <span>0</span>
            <span>5,000</span>
            <span>10,000</span>
            <span>15,000</span>
            <span>20,000+</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Input / Date Selector + Select Date Sheet                           */
/* ------------------------------------------------------------------ */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const formatDate = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
export const parseDate = (s: string | null | undefined) => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function DateField({ label, value, onChange, placeholder = 'mm/dd/yyyy' }: { label: string; value: string | null; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="labelled">
      <p className="t-b1 labelled__label">{label}</p>
      <motion.button type="button" className="select-pill" onClick={() => setOpen(true)} whileTap={{ scale: 0.98 }}>
        <span className={`t-h4 ${value ? '' : ''}`}>{value ?? placeholder}</span>
        <img src="/figma/icon-calendar.svg" width={24} height={24} alt="" />
      </motion.button>
      <DateSheet
        open={open}
        initial={parseDate(value) ?? new Date(2026, 7, 14)}
        onClose={() => setOpen(false)}
        onPick={(d) => {
          onChange(formatDate(d));
          setOpen(false);
        }}
      />
    </div>
  );
}

export function Calendar({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const [view, setView] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));
  const [dir, setDir] = useState(1);

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    }).filter((_, i, arr) => i < 35 || arr[35].getMonth() === view.getMonth());
  }, [view]);

  const shift = (n: number) => {
    setDir(n);
    setView((v) => new Date(v.getFullYear(), v.getMonth() + n, 1));
  };
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  return (
    <div className="calendar">
      <div className="calendar__head">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p key={value.toDateString()} className="calendar__picked" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <span>{MONTHS[value.getMonth()]}</span>
            <span>{value.getDate()}</span>
            <span>{value.getFullYear()}</span>
          </motion.p>
        </AnimatePresence>
        <img src="/figma/icon-calendar.svg" width={24} height={24} alt="" />
      </div>
      <div className="calendar__body">
        <div className="calendar__nav">
          <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={() => shift(-1)} aria-label="Previous month">
            <img src="/figma/icon-arrow-left-circle.svg" width={24} height={24} alt="" />
          </motion.button>
          <p className="t-b1-semibold">
            {MONTHS[view.getMonth()]} {view.getFullYear()}
          </p>
          <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={() => shift(1)} aria-label="Next month">
            <img src="/figma/icon-arrow-right-circle.svg" width={24} height={24} alt="" />
          </motion.button>
        </div>
        <div className="calendar__grid">
          {DAYS.map((d) => (
            <span key={d} className="calendar__dow t-b1-medium">
              {d}
            </span>
          ))}
        </div>
        <div className="calendar__months">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={view.toISOString()}
              className="calendar__grid"
              initial={{ x: dir * 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: dir * -60, opacity: 0 }}
              transition={{ duration: 0.25, ease: spring }}
            >
              {cells.map((d) => {
                const outside = d.getMonth() !== view.getMonth();
                const sel = same(d, value);
                return (
                  <button key={d.toISOString()} type="button" disabled={outside} className={`calendar__day ${outside ? 'is-outside' : ''} ${sel ? 'is-selected' : ''}`} onClick={() => onChange(d)}>
                    {sel && <motion.span layoutId="cal-sel" className="calendar__sel" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
                    <span>{d.getDate()}</span>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export function DateSheet({ open, initial, onClose, onPick, cta = 'Select Date' }: { open: boolean; initial: Date; onClose: () => void; onPick: (d: Date) => void; cta?: string }) {
  const [picked, setPicked] = useState(initial);
  return (
    <Overlay open={open} onClose={onClose}>
      <div className="date-sheet">
        <button type="button" className="date-sheet__close" onClick={onClose} aria-label="Close">
          <img src="/figma/icon-x.svg" width={32} height={32} alt="" />
        </button>
        <p className="t-h1 date-sheet__title">Select Date</p>
        <Calendar value={picked} onChange={setPicked} />
        <motion.button type="button" className="btn btn--inverted" whileTap={{ scale: 0.97 }} onClick={() => onPick(picked)}>
          {cta}
        </motion.button>
      </div>
    </Overlay>
  );
}

/* ------------------------------------------------------------------ */
/* Bottom-sheet overlay (DISSOLVE 0.25 scrim + sheet rise)            */
/* ------------------------------------------------------------------ */

export function Overlay({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <Portal>
    <AnimatePresence>
      {open && (
        <div className="overlay" role="dialog" aria-modal>
          <motion.div className="overlay__scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
          <motion.div
            className="overlay__sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.4, ease: spring }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            <span className="overlay__grabber" />
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </Portal>
  );
}

/* ------------------------------------------------------------------ */
/* Input / Base — Dropdown Select (expands into rounded radio options) */
/* ------------------------------------------------------------------ */

export function Dropdown({ label, options, value, onChange }: { label: string; options: string[]; value: string | null; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="labelled">
      <p className="t-b1 labelled__label">{label}</p>
      <motion.button type="button" className="select-pill" aria-expanded={open} onClick={() => setOpen((o) => !o)} whileTap={{ scale: 0.98 }}>
        <span className="t-h4">{value ?? 'Choose from the options'}</span>
        <motion.img src="/figma/icon-chevron-down.svg" width={24} height={24} alt="" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25, ease: spring }} />
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="dropdown__options"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: spring }}
          >
            {options.map((o, i) => (
              <motion.button
                key={o}
                type="button"
                className="select-option"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.04 * i, duration: 0.25 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onChange(o);
                  setTimeout(() => setOpen(false), 220);
                }}
              >
                <span className="select-option__dot">
                  <RadioDot on={value === o} />
                </span>
                <span className="t-h4">{o}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* iOS system alert — permission prompts for location / notifications */
/* ------------------------------------------------------------------ */

export function SystemAlert({
  open,
  title,
  message,
  actions,
}: {
  open: boolean;
  title: string;
  message: string;
  actions: { label: string; bold?: boolean; onPress: () => void }[];
}) {
  return (
    <Portal>
    <AnimatePresence>
      {open && (
        <div className="sys-alert" role="alertdialog" aria-label={title}>
          <motion.div className="sys-alert__scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
          <motion.div
            className="sys-alert__box"
            initial={{ opacity: 0, scale: 1.12 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.58, 1] }}
          >
            <div className="sys-alert__text">
              <p className="sys-alert__title">{title}</p>
              <p className="sys-alert__msg">{message}</p>
            </div>
            <div className="sys-alert__actions">
              {actions.map((a) => (
                <button key={a.label} type="button" className={a.bold ? 'is-bold' : ''} onClick={a.onPress}>
                  {a.label}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </Portal>
  );
}

/* ------------------------------------------------------------------ */
/* Animated number — counts up when it mounts or changes               */
/* ------------------------------------------------------------------ */

export function CountUp({ to, duration = 1.2, delay = 0, format = (n: number) => String(Math.round(n)) }: { to: number; duration?: number; delay?: number; format?: (n: number) => string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now() + delay * 1000;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0) / (duration * 1000)));
      setN(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, duration, delay]);
  return <>{format(n)}</>;
}
