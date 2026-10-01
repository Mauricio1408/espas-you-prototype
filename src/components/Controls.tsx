import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react';
import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';

const press = { scale: 0.97 };
const pressTransition = { type: 'spring', stiffness: 600, damping: 30 } as const;

type ButtonProps = HTMLMotionProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'lg' | 'md' | 'sm';
  icon?: ReactNode;
  full?: boolean;
};

/** `Button / Default` — 60px pill, Mona Sans SemiBold 24. */
export function Button({ variant = 'primary', size = 'lg', icon, full = true, className = '', children, ...rest }: ButtonProps) {
  return (
    <motion.button
      type="button"
      whileTap={rest.disabled ? undefined : press}
      transition={pressTransition}
      className={`btn btn--${variant} btn--${size} ${full ? 'btn--full' : ''} ${className}`}
      {...rest}
    >
      {icon}
      <span>{children as ReactNode}</span>
    </motion.button>
  );
}

/** `Button / Primary + Skip` — primary CTA with a quiet secondary text action under it. */
export function PrimaryWithSkip({
  label,
  skipLabel = 'Back',
  onPrimary,
  onSkip,
  disabled,
}: {
  label: string;
  skipLabel?: string;
  onPrimary: () => void;
  onSkip?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="primary-skip">
      <Button onClick={onPrimary} disabled={disabled}>
        {label}
      </Button>
      <motion.button type="button" className="primary-skip__skip" whileTap={{ opacity: 0.5 }} onClick={onSkip}>
        {skipLabel}
      </motion.button>
    </div>
  );
}

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: string;
  trailing?: ReactNode;
  error?: string | null;
  tone?: 'white' | 'grey';
};

/**
 * `Input / Text` — 60px white pill. The Figma label doubles as placeholder;
 * once a value is entered it floats to a small caption so the field stays
 * self-describing.
 */
export function TextField({ label, trailing, error, tone = 'white', className = '', value, ...rest }: FieldProps) {
  const id = useId();
  const filled = value !== undefined && String(value).length > 0;
  return (
    <div className={`field-wrap ${className}`}>
      <label htmlFor={id} className={`field field--${tone} ${filled ? 'is-filled' : ''} ${error ? 'is-error' : ''}`}>
        <span className="field__label">{label}</span>
        <input id={id} className="field__input" value={value} aria-invalid={!!error} {...rest} />
        {trailing}
      </label>
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            className="field__error"
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/** `Input / Password` — the Base/eye toggles visibility (Figma: CHANGE_TO). */
export function PasswordField(props: Omit<FieldProps, 'type' | 'trailing'>) {
  const [shown, setShown] = useState(false);
  return (
    <TextField
      {...props}
      type={shown ? 'text' : 'password'}
      trailing={
        <motion.button
          type="button"
          className="field__eye"
          aria-label={shown ? 'Hide password' : 'Show password'}
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.preventDefault();
            setShown((s) => !s);
          }}
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.img
              key={shown ? 'off' : 'on'}
              src={shown ? '/figma/icon-eye-off.svg' : '/figma/icon-eye.svg'}
              width={24}
              height={24}
              alt=""
              initial={{ opacity: 0, scale: 0.7, rotate: -20 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotate: 20 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>
        </motion.button>
      }
    />
  );
}

/** Radio circle, 24px — white fill + 0.86px Neutral/300 ring, filled with Red/300 when on. */
export function RadioDot({ on }: { on: boolean }) {
  return (
    <span className={`radio-dot ${on ? 'is-on' : ''}`} aria-hidden>
      <motion.span
        className="radio-dot__fill"
        initial={false}
        animate={{ scale: on ? 1 : 0, opacity: on ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      />
    </span>
  );
}

/** `Input / Radio Select` — 12px-radius card, the whole card is the hit area. */
export function RadioCard({ label, selected, onSelect, children }: { label: ReactNode; selected: boolean; onSelect: () => void; children?: ReactNode }) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`radio-card ${selected ? 'is-selected' : ''}`}
      onClick={onSelect}
      whileTap={{ scale: 0.985 }}
      transition={pressTransition}
    >
      <span className="radio-card__row">
        <RadioDot on={selected} />
        <span className="radio-card__label">{label}</span>
      </span>
      {children}
    </motion.button>
  );
}

/** `Onboarding / Progress Bar` — 5 segmented dashes; the active one fills left→right. */
export function ProgressBar({ step, total = 5, segWidth = 66 }: { step: number; total?: number; segWidth?: number }) {
  return (
    <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className="progress__seg" style={{ width: segWidth }}>
          <motion.span
            className="progress__fill"
            initial={{ scaleX: i < step - 1 ? 1 : 0 }}
            animate={{ scaleX: i < step ? 1 : 0 }}
            transition={{ duration: 0.5, delay: i === step - 1 ? 0.2 : 0, ease: [0.32, 0.72, 0, 1] }}
          />
        </span>
      ))}
    </div>
  );
}

/** `Onboarding / Title Block`. */
export function TitleBlock({ subtitle, title, description }: { subtitle?: string; title: ReactNode; description?: ReactNode }) {
  return (
    <div className="title-block">
      {subtitle && <p className="title-block__subtitle t-h4-medium">{subtitle}</p>}
      <div className="title-block__stack">
        <h1 className="t-title-3">{title}</h1>
        {description && <p className="t-h4-regular c-grey">{description}</p>}
      </div>
    </div>
  );
}

/** Back affordance added to every onboarding screen (arrow-left + "Back"). */
export function BackLink({ onClick, label = 'Back', tone = 'dark' }: { onClick: () => void; label?: string; tone?: 'dark' | 'light' }) {
  return (
    <motion.button type="button" className={`back-link back-link--${tone}`} onClick={onClick} whileTap={{ x: -3, opacity: 0.6 }}>
      <span className="back-link__icon">
        <img src="/figma/icon-arrow-left.svg" width={24} height={24} alt="" />
      </span>
      <span className="t-h4-medium">{label}</span>
    </motion.button>
  );
}

/** Chip / tag toggle used for preferences, lifestyle filters and quick filters. */
export function Chip({ selected, onClick, children, className = '' }: { selected?: boolean; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      className={`chip ${selected ? 'is-selected' : ''} ${className}`}
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      transition={pressTransition}
      layout
    >
      {children}
    </motion.button>
  );
}

/** iOS-style switch (`Toggle / Switch`). */
export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'is-on' : ''}`} onClick={() => onChange(!on)}>
      <motion.span className="switch__knob" layout transition={{ type: 'spring', stiffness: 700, damping: 35 }} />
    </button>
  );
}
