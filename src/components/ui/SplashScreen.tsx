import React from 'react';
import { motion } from 'framer-motion';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 4, duration: 1, ease: "easeInOut" }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
    >
      <div className="relative flex flex-col items-center">
        {/* Centered Pendant Heart */}
        <div className="mb-12 w-48 h-56 relative flex justify-center">
          <svg viewBox="0 0 200 240" className="w-full h-full overflow-visible neon-stroke-white">
            {/* Pendant Loop (Top) */}
            <motion.circle
              cx="100"
              cy="25"
              r="8"
              stroke="white"
              strokeWidth="2.5"
              fill="none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
            />
            
            {/* Elegant Balanced Heart Lobe - Left */}
            <motion.path
              d="M 100,33 C 60,33 20,80 20,145 C 20,205 85,225 96,232"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
            
            {/* Elegant Balanced Heart Lobe - Right */}
            <motion.path
              d="M 100,33 C 140,33 180,80 180,145 C 180,205 115,225 104,232"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </svg>
        </div>

        {/* Branding Text - Refined and Elegant */}
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5, duration: 1.2 }}
            style={{ fontFamily: '"Bodoni Moda", serif' }}
            className="text-5xl font-normal tracking-[0.1em] text-white neon-text-white mb-3"
          >
            f 63.9
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
            style={{ fontFamily: '"Bodoni Moda", serif' }}
            className="text-[12px] tracking-[0.8em] text-white/60 uppercase font-light"
          >
            code of love
          </motion.p>
        </div>
      </div>

      {/* Decorative Background Glow */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ duration: 4 }}
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]"
      />
    </motion.div>
  );
};
