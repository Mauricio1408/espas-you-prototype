import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

const slide = (w: number) => ({
  enter: (d: number) => ({ x: d >= 0 ? w : -w }),
  center: { x: 0 },
  exit: (d: number) => ({ x: d >= 0 ? -w : w }),
});

/**
 * Swipeable photo gallery that loops both ways: drag left for the next photo,
 * right for the previous one — the first photo wraps to the last.
 */
export function SwipeGallery({ images, width, page, onPage }: { images: string[]; width: number; page: number; onPage: (p: number) => void }) {
  const [dir, setDir] = useState(1);
  const go = (d: number) => {
    setDir(d);
    onPage((page + d + images.length) % images.length);
  };
  return (
    <div className="swipe">
      <AnimatePresence initial={false} custom={dir}>
        <motion.img
          key={page}
          src={images[page]}
          alt=""
          draggable={false}
          custom={dir}
          variants={slide(width)}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ x: { type: 'spring', stiffness: 320, damping: 34 } }}
          drag={images.length > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.9}
          dragMomentum={false}
          onDragEnd={(_, i) => {
            if (i.offset.x < -50 || i.velocity.x < -400) go(1);
            else if (i.offset.x > 50 || i.velocity.x > 400) go(-1);
          }}
        />
      </AnimatePresence>
    </div>
  );
}
