import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '../../hooks/useHaptics';
import { useProductLightboxStore } from '../../store/productLightboxStore';

interface ProductGalleryProps {
  images: string[];
}

const FULLSCREEN_TRANSITION = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };
const MAX_SCALE = 4;
const MIN_SCALE = 1;

// ── Pinch-to-zoom logic (native touch, no library needed) ──────────────
function usePinchZoom() {
  const scaleRef = useRef(1);
  const originRef = useRef({ x: 0, y: 0 });
  const lastPinchDistRef = useRef<number | null>(null);
  const pointerCacheRef = useRef<PointerEvent[]>([]);
  const imgRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const reset = useCallback(() => {
    scaleRef.current = 1;
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    lastPinchDistRef.current = null;
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointerCacheRef.current.push(e.nativeEvent);
    if (!imgRef.current) return;
    imgRef.current.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const cache = pointerCacheRef.current;
    // update cache
    const idx = cache.findIndex((ev) => ev.pointerId === e.pointerId);
    if (idx >= 0) cache[idx] = e.nativeEvent;

    if (cache.length < 2) {
      // single-finger pan (only when zoomed)
      if (scaleRef.current > 1) {
        setTranslate((prev) => ({
          x: prev.x + e.movementX,
          y: prev.y + e.movementY,
        }));
      }
      return;
    }

    // two-finger pinch
    const [p1, p2] = cache;
    const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);

    if (lastPinchDistRef.current === null) {
      lastPinchDistRef.current = dist;
      originRef.current = {
        x: (p1.clientX + p2.clientX) / 2,
        y: (p1.clientY + p2.clientY) / 2,
      };
      return;
    }

    const ratio = dist / lastPinchDistRef.current;
    lastPinchDistRef.current = dist;
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scaleRef.current * ratio));
    scaleRef.current = next;
    setScale(next);
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointerCacheRef.current = pointerCacheRef.current.filter(
      (ev) => ev.pointerId !== e.pointerId
    );
    if (pointerCacheRef.current.length < 2) {
      lastPinchDistRef.current = null;
    }
    if (scaleRef.current <= 1.05) reset();
  }, [reset]);

  // Double-tap to toggle zoom
  const lastTapRef = useRef(0);
  const onDoubleTap = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (scaleRef.current > 1) {
        reset();
      } else {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const cx = e.clientX - rect.left - rect.width / 2;
        const cy = e.clientY - rect.top - rect.height / 2;
        scaleRef.current = 2.5;
        setScale(2.5);
        setTranslate({ x: -cx * 0.8, y: -cy * 0.8 });
      }
    }
    lastTapRef.current = now;
  }, [reset]);

  return { imgRef, scale, translate, reset, onPointerDown, onPointerMove, onPointerUp, onDoubleTap };
}

// ── Fullscreen pinch overlay ───────────────────────────────────────────
const FullscreenZoomImage: React.FC<{ src: string; onSwipeDown: () => void }> = ({ src, onSwipeDown }) => {
  const { imgRef, scale, translate, reset, onPointerDown, onPointerMove, onPointerUp, onDoubleTap } = usePinchZoom();
  const haptics = useHaptics();
  const startYRef = useRef<number | null>(null);

  const handlePointerDownCombined = useCallback((e: React.PointerEvent) => {
    onPointerDown(e);
    if (scale <= 1) startYRef.current = e.clientY;
  }, [onPointerDown, scale]);

  const handlePointerUpCombined = useCallback((e: React.PointerEvent) => {
    onPointerUp(e);
    if (startYRef.current !== null && scale <= 1) {
      const dy = e.clientY - startYRef.current;
      if (dy > 80) {
        haptics.impactLight();
        onSwipeDown();
      }
    }
    startYRef.current = null;
  }, [onPointerUp, scale, onSwipeDown, haptics]);

  return (
    <div
      ref={imgRef}
      className="flex items-center justify-center w-full h-full select-none"
      style={{ touchAction: scale > 1 ? 'none' : 'pan-y' }}
      onPointerDown={handlePointerDownCombined}
      onPointerMove={onPointerMove}
      onPointerUp={handlePointerUpCombined}
      onClick={onDoubleTap}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="max-h-[90vh] max-w-full w-auto object-contain"
        style={{
          transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
          transition: scale === 1 ? 'transform 0.3s cubic-bezier(0.22,1,0.36,1)' : 'none',
          willChange: 'transform',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
      {scale > 1 && (
        <button
          className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-black/50 text-white text-[10px] font-bold uppercase tracking-wider"
          onClick={(e) => { e.stopPropagation(); reset(); }}
        >
          Сбросить
        </button>
      )}
    </div>
  );
};


// ── Main Gallery ───────────────────────────────────────────────────────
export const ProductGallery: React.FC<ProductGalleryProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const haptics = useHaptics();
  const lastFullscreenCloseAt = useRef(0);
  const wasFullscreenRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const now = performance.now();
      if (now - lastFullscreenCloseAt.current < 320) return;
      const i = Math.max(0, Math.min(index, imageList.length - 1));
      openFullscreenInStore(i);
      haptics.impactLight();
      document.body.style.overflow = 'hidden';
    },
    [openFullscreenInStore, haptics],
  );

  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (wasFullscreenRef.current && !isFullscreen) {
      lastFullscreenCloseAt.current = performance.now();
    }
    wasFullscreenRef.current = isFullscreen;
    if (!isFullscreen) document.body.style.overflow = '';
  }, [isFullscreen]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth === 0) return;
    const active = Math.round(scrollLeft / clientWidth);
    if (active !== currentIndex) {
      setCurrentIndex(active);
      haptics.selection();
    }
  };

  const fullscreenSrc = images[activeImageIndex] ?? images[0];

  if (!images.length) return null;

  return (
    <div className="group relative aspect-[4/5] w-full overflow-hidden bg-app-bg">
      {/* Swiper */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {images.map((src, i) => (
          <div
            key={`gallery-img-${i}`}
            className="h-full w-full shrink-0 snap-center relative overflow-hidden"
          >
            <img
              src={src}
              alt={`Product ${i + 1}`}
              onClick={() => openFullscreenViewer(images, i)}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="h-full w-full cursor-zoom-in object-cover pb-12 transition-opacity duration-300 opacity-0"
              style={{ animationFillMode: 'forwards' }}
              onLoad={(e) => {
                (e.target as HTMLImageElement).style.opacity = '1';
              }}
            />
          </div>
        ))}
      </div>

      {/* Gradient */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-app-bg to-transparent" />

      {/* Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: currentIndex === i ? 20 : 6, opacity: currentIndex === i ? 1 : 0.4 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`h-1.5 rounded-full ${currentIndex === i ? 'bg-app-accent' : 'bg-white'}`}
            />
          ))}
        </div>
      )}

      {/* Fullscreen lightbox */}
      <AnimatePresence>
        {isFullscreen && fullscreenSrc && (
          <motion.div
            key="product-fullscreen"
            role="presentation"
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FULLSCREEN_TRANSITION}
            onClick={closeFullscreenViewer}
          >
            {/* Tinted close area */}
            <div className="absolute inset-0" />

            {/* Close hint */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 opacity-50">
              <div className="h-1 w-10 rounded-full bg-white" />
              <span className="text-white text-[9px] uppercase tracking-widest">Смахните вниз</span>
            </div>

            {/* Zoom image — stops click propagation so background click = close */}
            <div
              className="relative z-10 w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <FullscreenZoomImage
                key={activeImageIndex}
                src={fullscreenSrc}
                onSwipeDown={closeFullscreenViewer}
              />
            </div>

            {/* Image counter */}
            {images.length > 1 && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-white/10 text-white text-[10px] font-bold tracking-widest">
                {activeImageIndex + 1} / {images.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
