import { motion } from 'motion/react';

/**
 * The one success mark used across both journeys: the 3D approved badge from
 * `Landlord - Approved Application` (2596:9127), spring-spun in, with a confetti burst.
 */
export function SuccessBadge({ burst = true, delay = 0.15 }: { burst?: boolean; delay?: number }) {
  return (
    <>
      <motion.img
        className="success-badge"
        src="/figma/approved-badge.webp"
        width={190}
        height={190}
        alt=""
        initial={{ scale: 0, rotate: -120 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 13, delay }}
      />
      {burst && <Burst delay={delay + 0.3} />}
    </>
  );
}

export function Burst({ delay = 0.45 }: { delay?: number }) {
  return (
    <div className="burst" aria-hidden>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            style={{ background: i % 2 ? '#FFDD52' : '#F32420' }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{ x: Math.cos(a) * 150, y: Math.sin(a) * 150, opacity: [0, 1, 0], scale: 1 }}
            transition={{ duration: 1, delay, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}
