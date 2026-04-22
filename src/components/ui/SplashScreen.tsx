import React from 'react';
import { motion } from 'framer-motion';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 4.5, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
    >
      <div className="relative flex flex-col items-center">
        {/* Centered Pendant Heart - Thinner and more delicate */}
        <div className="mb-14 w-40 h-48 relative flex justify-center">
          <svg viewBox="0 0 200 240" className="w-full h-full overflow-visible">
            <motion.path
              d="M 92,95 C 92,70 70,45 45,70 C 20,95 25,185 100,235 C 175,185 180,95 155,70 C 130,45 108,70 108,95"
              stroke="white"
              strokeWidth="0.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ 
                duration: 3.2, 
                ease: [0.45, 0, 0.55, 1],
                opacity: { duration: 1.5 }
              }}
            />
            {/* Subtle secondary glow stroke */}
            <motion.path
              d="M 92,95 C 92,70 70,45 45,70 C 20,95 25,185 100,235 C 175,185 180,95 155,70 C 130,45 108,70 108,95"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              className="opacity-20 blur-[2px]"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3.5, ease: "easeInOut" }}
            />
          </svg>
        </div>

        {/* Branding Text - Exquisite and Modern */}
        <div className="text-center flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 1.5, ease: "easeOut" }}
            style={{ fontFamily: '"Bodoni Moda", serif' }}
            className="text-4xl font-extralight tracking-[0.4em] text-white mb-4 mr-[-0.4em]"
          >
            F 63.9
          </motion.h1>
          
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "60px", opacity: 0.4 }}
            transition={{ delay: 2.2, duration: 1.5 }}
            className="h-[1px] bg-white mb-4"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.8, duration: 1.2 }}
            style={{ fontFamily: '"Bodoni Moda", serif' }}
            className="text-[10px] tracking-[1em] text-white/40 uppercase font-light mr-[-1em]"
          >
            code of love
          </motion.p>
        </div>
      </div>

      {/* Very subtle background light pulse */}
      <motion.div 
        animate={{ 
          opacity: [0.05, 0.12, 0.05],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity,
          ease: "easeInOut" 
        }}
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,transparent_70%)]"
      />
    </motion.div>
  );
};
