import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '../../hooks/useHaptics';
import { useProductLightboxStore } from '../../store/productLightboxStore';

interface ProductGalleryProps {
  images: string[];
}

const FULLSCREEN_TRANSITION = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };
const MAX_SCALE = 4;

// ── High Performance Gesture Handler (Direct DOM, 60fps) ─────────────
function usePinchZoom() {
  const stateRef = useRef({
    scale: 1,
    x: 0,
    y: 0,
    lastPinchDist: 0,
    lastPoint: { x: 0, y: 0 },
    pointers: new Map<number, PointerEvent>(),
    isAnimating: false,
    swipeY: 0,
    startTime: 0,
    startY: 0
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateDOM = useCallback(() => {
    if (!imgRef.current) return;
    const { scale, x, y, swipeY } = stateRef.current;
    
    // Use translate3d for GPU acceleration
    const ty = y + swipeY;
    imgRef.current.style.transform = `translate3d(${x}px, ${ty}px, 0) scale(${scale})`;
    
    // Update touch action dynamically
    if (containerRef.current) {
      containerRef.current.style.touchAction = scale > 1 ? 'none' : 'pan-x';
    }
    
    // Visual feedback for swipe
    if (swipeY > 0 && scale <= 1) {
      const opacity = Math.max(0.2, 1 - swipeY / 400);
      if (containerRef.current) {
        containerRef.current.style.opacity = opacity.toString();
      }
    } else if (containerRef.current) {
      containerRef.current.style.opacity = '1';
    }
    
    stateRef.current.isAnimating = false;
  }, []);

  const requestUpdate = useCallback(() => {
    if (!stateRef.current.isAnimating) {
      stateRef.current.isAnimating = true;
      requestAnimationFrame(updateDOM);
    }
  }, [updateDOM]);

  const reset = useCallback((animate = true) => {
    stateRef.current.scale = 1;
    stateRef.current.x = 0;
    stateRef.current.y = 0;
    stateRef.current.swipeY = 0;
    if (animate && imgRef.current) {
      imgRef.current.style.transition = 'transform 0.3s cubic-bezier(0.2, 0, 0.2, 1)';
    }
    requestUpdate();
    setTimeout(() => {
      if (imgRef.current) imgRef.current.style.transition = '';
    }, 300);
  }, [requestUpdate]);

  const onPointerDown = (e: React.PointerEvent) => {
    const { pointers } = stateRef.current;
    pointers.set(e.pointerId, e.nativeEvent);
    stateRef.current.startTime = Date.now();
    stateRef.current.startY = e.clientY;

    if (pointers.size === 1) {
      stateRef.current.lastPoint = { x: e.clientX, y: e.clientY };
    } else if (pointers.size === 2) {
      const pts = Array.from(pointers.values());
      stateRef.current.lastPinchDist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
    }
    
    if (imgRef.current) {
      imgRef.current.setPointerCapture(e.pointerId);
      imgRef.current.style.transition = ''; // Disable transitions during move
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const { pointers, scale, lastPoint, lastPinchDist } = stateRef.current;
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, e.nativeEvent);

    if (pointers.size === 1) {
      const dx = e.clientX - lastPoint.x;
      const dy = e.clientY - lastPoint.y;
      
      if (scale > 1) {
        stateRef.current.x += dx;
        stateRef.current.y += dy;
        requestUpdate();
      } else {
        // Swipe down logic
        const sdy = e.clientY - stateRef.current.startY;
        if (sdy > 0) {
          stateRef.current.swipeY = sdy;
          requestUpdate();
        }
      }
      stateRef.current.lastPoint = { x: e.clientX, y: e.clientY };
    } else if (pointers.size === 2) {
      const pts = Array.from(pointers.values());
      const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
      const ratio = dist / lastPinchDist;
      
      const newScale = Math.min(MAX_SCALE, Math.max(0.5, scale * ratio));
      stateRef.current.scale = newScale;
      stateRef.current.lastPinchDist = dist;
      requestUpdate();
    }
  };

  const onPointerUp = (e: React.PointerEvent, onSwipeDown: () => void) => {
    const { pointers, scale, swipeY, startTime } = stateRef.current;
    pointers.delete(e.pointerId);
    
    if (pointers.size === 0) {
      const duration = Date.now() - startTime;
      const velocity = swipeY / duration;

      if (scale <= 1) {
        if (swipeY > 150 || (swipeY > 50 && velocity > 0.5)) {
          onSwipeDown();
        } else {
          reset();
        }
      } else if (scale < 1.1) {
        reset();
      }
    }
  };

  const onDoubleTap = (_e: React.MouseEvent) => {
    if (stateRef.current.scale > 1) {
      reset();
    } else {
      stateRef.current.scale = 2.5;
      requestUpdate();
    }
  };

  // Prevent native scroll interruption during custom gestures (swipe down, zoom)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let isVertical = false;
    let isChecking = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isChecking = true;
        isVertical = false;
      } else {
        isChecking = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        // Multi-touch (pinch): lock native scrolling
        e.preventDefault();
        return;
      }
      
      if (isChecking) {
        const dx = Math.abs(e.touches[0].clientX - startX);
        const dy = Math.abs(e.touches[0].clientY - startY);
        
        // Wait for 3px movement to determine direction
        if (dx > 3 || dy > 3) {
          isChecking = false;
          // If mostly vertical, it's a swipe down
          isVertical = dy > dx;
        }
      }

      // Lock scroll if doing vertical swipe down, OR if zoomed in
      if (isVertical || stateRef.current.scale > 1) {
        e.preventDefault();
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return { imgRef, containerRef, onPointerDown, onPointerMove, onPointerUp, onDoubleTap, reset };
}

const FullscreenZoomImage: React.FC<{ src: string; onSwipeDown: () => void }> = ({ src, onSwipeDown }) => {
  const { imgRef, containerRef, onPointerDown, onPointerMove, onPointerUp, onDoubleTap } = usePinchZoom();
  const haptics = useHaptics();

  // Optimize URL for viewer
  const optimizedSrc = (src || '').includes('cloudinary') 
    ? src.replace('/upload/', '/upload/f_auto,q_auto,w_1600,c_limit/') 
    : (src || '');

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-center w-full h-full select-none"
      style={{ touchAction: 'pan-x' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => onPointerUp(e, onSwipeDown)}
      onPointerCancel={(e) => onPointerUp(e, onSwipeDown)}
      onClick={(e) => {
        const now = Date.now();
        if ((window as any)._lastTap && now - (window as any)._lastTap < 300) {
          onDoubleTap(e);
          haptics.impactLight();
        }
        (window as any)._lastTap = now;
      }}
    >
      <img
        ref={imgRef}
        src={optimizedSrc}
        alt=""
        draggable={false}
        className="max-h-[calc(0.9*var(--tg-height,100vh))] max-w-full w-auto object-contain will-change-transform"
        style={{
          userSelect: 'none',
          pointerEvents: 'none',
        }}
        onLoad={(e) => {
          (e.target as HTMLImageElement).classList.add('loaded');
        }}
      />
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
  const fullscreenScrollRef = useRef<HTMLDivElement>(null);

  const isFullscreen = useProductLightboxStore((s) => s.isOpen);
  const activeImageIndex = useProductLightboxStore((s) => s.activeImageIndex);
  const setLightboxOpen = useProductLightboxStore((s) => s.setOpen);
  const openFullscreenInStore = useProductLightboxStore((s) => s.openFullscreen);

  const closeFullscreenViewer = useCallback(() => {
    if (!useProductLightboxStore.getState().isOpen) return;
    setLightboxOpen(false);
    document.body.style.overflow = '';
  }, [setLightboxOpen]);

  const handleFullscreenScroll = () => {
    if (!fullscreenScrollRef.current) return;
    const { scrollLeft, clientWidth } = fullscreenScrollRef.current;
    if (clientWidth === 0) return;
    const active = Math.round(scrollLeft / clientWidth);
    if (active !== useProductLightboxStore.getState().activeImageIndex) {
      useProductLightboxStore.getState().openFullscreen(active);
      haptics.selection();
    }
  };

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
    const wasOpen = wasFullscreenRef.current;
    if (wasOpen && !isFullscreen) {
      lastFullscreenCloseAt.current = performance.now();
    }
    wasFullscreenRef.current = isFullscreen;
    if (!isFullscreen) document.body.style.overflow = '';
    
    // Sync scroll position ONLY when opening
    if (isFullscreen && !wasOpen && fullscreenScrollRef.current) {
      const container = fullscreenScrollRef.current;
      // Use requestAnimationFrame to ensure DOM is ready and visible
      requestAnimationFrame(() => {
        container.scrollLeft = container.clientWidth * activeImageIndex;
      });
    }
  }, [isFullscreen, activeImageIndex]);

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

  // Preload neighboring images
  useEffect(() => {
    if (!isFullscreen || !images.length) return;
    const preload = (index: number) => {
      const url = images[index];
      if (url) {
        const img = new Image();
        img.src = url.includes('cloudinary') 
          ? url.replace('/upload/', '/upload/f_auto,q_auto,w_1600,c_limit/') 
          : url;
      }
    };
    preload(activeImageIndex + 1);
    preload(activeImageIndex - 1);
  }, [isFullscreen, activeImageIndex, images]);

  if (!images.length) return null;

  return (
    <div className="group relative aspect-[3/4] w-full overflow-hidden bg-app-bg">
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
            className="h-full w-full shrink-0 snap-center relative overflow-hidden flex items-center justify-center"
          >
            <img
              src={src}
              alt={`Product ${i + 1}`}
              onClick={() => openFullscreenViewer(images, i)}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="h-full w-full cursor-zoom-in object-cover transition-opacity duration-300 opacity-0"
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

            {/* Native Scroll Container for Fullscreen */}
            <div
              ref={fullscreenScrollRef}
              onScroll={handleFullscreenScroll}
              className="relative z-10 w-full h-full flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden no-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((src, i) => (
                <div key={`fs-img-${i}`} className="w-full h-full shrink-0 snap-center relative flex items-center justify-center">
                  <FullscreenZoomImage
                    src={src}
                    onSwipeDown={closeFullscreenViewer}
                  />
                </div>
              ))}
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
