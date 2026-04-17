import React from 'react';
import { motion } from 'framer-motion';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 2.5, duration: 0.8, ease: "easeInOut" }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-app-bg"
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="w-32 h-32 mb-8 relative"
        >
          {/* Logo Placeholder - Gold Ring Animation */}
          <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            {/* Soft background glow for the heart */}
            <motion.path
              d="M 25 35 C 10 5, 0 55, 50 95 C 100 55, 90 5, 75 35"
              stroke="var(--app-accent)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              opacity="0.15"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.15 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            {/* Main drawing open heart */}
            <motion.path
              d="M 25 35 C 10 5, 0 55, 50 95 C 100 55, 90 5, 75 35"
              stroke="var(--app-accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </svg>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-2xl font-serif tracking-[0.3em] text-app-accent uppercase"
        >
          F 63.9
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-2 text-[10px] tracking-[0.5em] text-app-text-muted uppercase font-sans"
        >
          Code of Love
        </motion.p>
      </div>

      {/* Decorative Shimmer Line */}
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: "40%", opacity: 0.2 }}
        transition={{ delay: 1.2, duration: 1.5 }}
        className="absolute bottom-20 h-[1px] bg-app-accent"
      />
    </motion.div>
  );
};
