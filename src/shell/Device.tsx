import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ToastHost } from '../components/Feed';

const W = 440;
const H = 950;

/**
 * Hosts the 440 × 950 artboard. Scales it to fit its container and, like
 * Figma's presentation mode, flashes the tappable hotspots when the viewer
 * clicks somewhere inert.
 */
export function Device({ children, bezel }: { children: ReactNode; bezel: boolean }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [hint, setHint] = useState(false);
  const hintTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const frame = bezel ? 28 : 0;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      const pad = bezel ? 48 : 0;
      setScale(Math.min((width - pad) / (W + frame), (height - pad) / (H + frame), bezel ? 1 : 2));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [bezel]);

  const onPointerDown = (e: React.PointerEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest('button, a, input, textarea, select, [role="button"], label.tappable, .no-hint')) return;
    setHint(true);
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(false), 650);
  };

  return (
    <div className="stage" ref={stageRef}>
      <div className={`phone ${bezel ? 'phone--bezel' : ''}`} style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <div className={`device ${hint ? 'hint' : ''}`} onPointerDownCapture={onPointerDown}>
          {children}
          <ToastHost />
        </div>
      </div>
    </div>
  );
}
