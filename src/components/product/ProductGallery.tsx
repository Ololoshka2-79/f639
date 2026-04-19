import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '../../hooks/useHaptics';
import { useProductLightboxStore } from '../../store/productLightboxStore';

interface ProductGalleryProps {
  images: string[];
}

const SWIPE_CLOSE_DISTANCE = 72;
const SWIPE_CLOSE_VELOCITY = 420;
const FULLSCREEN_TRANSITION = { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const };

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const haptics = useHaptics();
  const dismissGestureRef = useRef(false);
  const lastFullscreenCloseAt = useRef(0);
  const wasFullscreenRef = useRef(false);

  const isFullscreen = useProductLightboxStore((s) => s.isOpen);
  const activeImageIndex = useProductLightboxStore((s) => s.activeImageIndex);
  const setLightboxOpen = useProductLightboxStore((s) => s.setOpen);
  const openFullscreenInStore = useProductLightboxStore((s) => s.openFullscreen);

  const closeFullscreenViewer = useCallback(() => {
    if (!useProductLightboxStore.getState().isOpen) return;
    setLightboxOpen(false);
    document.body.style.overflow = '';
  }, [setLightboxOpen]);

  const openFullscreenViewer = useCallback(
    (imageList: string[], index: number) => {
      if (!imageList.length) return;
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now - lastFullscreenCloseAt.current < 320) return;
      const i = Math.max(0, Math.min(index, imageList.length - 1));
      dismissGestureRef.current = false;
      openFullscreenInStore(i);
      haptics.impactLight();
      document.body.style.overflow = 'hidden';
    },
    [openFullscreenInStore, haptics],
  );

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (wasFullscreenRef.current && !isFullscreen) {
      lastFullscreenCloseAt.current =
        typeof performance !== 'undefined' ? performance.now() : Date.now();
    }
    wasFullscreenRef.current = isFullscreen;
    if (!isFullscreen) {
      document.body.style.overflow = '';
      dismissGestureRef.current = false;
    }
  }, [isFullscreen]);



  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth === 0) return;
    const active = Math.round(scrollLeft / clientWidth);
    if (active !== currentIndex) setCurrentIndex(active);
  };

  const fullscreenSrc = images[activeImageIndex] ?? images[0];

  return (
    <div className="group relative aspect-[4/5] w-full overflow-hidden bg-app-bg">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((src, i) => (
          <div key={`gallery-img-${i}`} className="h-full w-full shrink-0 snap-center relative">
            <img
              src={src}
              alt={`Product ${i + 1}`}
              onClick={() => openFullscreenViewer(images, i)}
              className="h-full w-full cursor-zoom-in object-cover pb-12"
            />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-app-bg to-transparent" />

      {images.length > 1 && (
        <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center gap-2">
          {images.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === i ? 'w-6 bg-app-accent' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {isFullscreen && fullscreenSrc && (
          <motion.div
            key="product-fullscreen"
            role="presentation"
            className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FULLSCREEN_TRANSITION}
            onClick={closeFullscreenViewer}
          >
            <motion.div
              className="pointer-events-none flex max-h-full max-w-full items-center justify-center px-4"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={FULLSCREEN_TRANSITION}
            >
              <motion.img
                key={activeImageIndex}
                src={fullscreenSrc}
                alt=""
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.85}
                onPointerDown={() => {
                  dismissGestureRef.current = false;
                }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > SWIPE_CLOSE_DISTANCE || info.velocity.y > SWIPE_CLOSE_VELOCITY) {
                    dismissGestureRef.current = true;
                    closeFullscreenViewer();
                    haptics.impactLight();
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (dismissGestureRef.current) {
                    e.preventDefault();
                  }
                }}
                className="pointer-events-auto max-h-[85vh] w-auto max-w-full cursor-grab object-contain active:cursor-grabbing"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
