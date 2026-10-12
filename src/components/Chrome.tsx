import type { CSSProperties, ReactNode } from 'react';

type Tone = 'light' | 'dark';

/** `Chrome / Top Bar — Status` (iOS 9:41 bar). `light` = white glyphs. */
export function StatusBar({ tone = 'dark', hidden }: { tone?: Tone; hidden?: boolean }) {
  return (
    <div className={`status-bar status-bar--${tone}`} style={hidden ? { visibility: 'hidden' } : undefined} aria-hidden>
      <p className="status-bar__time">9:41</p>
      <div className="status-bar__island" />
      <div className="status-bar__levels">
        <img src={`/figma/status-cellular-${tone}.svg`} width={19.2} height={12.226} alt="" />
        <img src={`/figma/status-wifi-${tone}.svg`} width={17.142} height={12.328} alt="" />
        <img src={`/figma/status-battery-${tone}.svg`} width={27.328} height={13} alt="" />
      </div>
    </div>
  );
}

/** Line colour per Figma frame: #1E1E1E, Neutral/400 #575757, white, or #F5F5F5 over dark sheets. */
export type Indicator = 'dark' | 'grey' | 'light' | 'offwhite';

/** `Chrome / Bottom Bar — Home Indicator`. */
export function HomeIndicator({ tone = 'dark' }: { tone?: Indicator }) {
  return <img className="home-indicator" src={`/figma/home-indicator-${tone}.svg`} width={440} height={40} alt="" aria-hidden />;
}

type ScreenProps = {
  children: ReactNode;
  /** Glyph colour of the status bar + home indicator. */
  tone?: Tone;
  background?: string;
  className?: string;
  style?: CSSProperties;
  /** Rendered behind the chrome (full-bleed photos, maps). */
  backdrop?: ReactNode;
  /** Rendered above the body, below the home indicator (bottom navs, sticky CTAs). */
  footer?: ReactNode;
  hideHomeIndicator?: boolean;
  /** Home-indicator colour when it differs from the status-bar tone (Figma varies it per frame). */
  indicator?: Indicator;
  /** Figma hides the status bar on a few frames (Trusted Tenants); the 60px it occupies stays. */
  hideStatusBar?: boolean;
};

/** A 440 × 950 frame: status bar, flexible body, home indicator. */
export function Screen({ children, tone = 'dark', background, className = '', style, backdrop, footer, hideHomeIndicator, indicator, hideStatusBar }: ScreenProps) {
  return (
    <div className={`screen ${className}`} style={{ background, ...style }}>
      {backdrop}
      <StatusBar tone={tone} hidden={hideStatusBar} />
      <div className="screen__body">{children}</div>
      {footer}
      {!hideHomeIndicator && <HomeIndicator tone={indicator ?? tone} />}
    </div>
  );
}
