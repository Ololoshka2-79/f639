import React from 'react';
import { motion } from 'framer-motion';

export const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 3.5, duration: 1, ease: "easeInOut" }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
    >
      <div className="relative flex flex-col items-center">
        {/* Main Logo Container */}
        <div className="flex flex-col items-center mb-12">
          {/* Stylized Heart Drawing */}
          <div className="w-40 h-40 relative mb-8">
            <svg viewBox="0 0 240 240" className="w-full h-full overflow-visible neon-stroke-white">
              {/* Left Stroke of the Heart - Larger and lower */}
              <motion.path
                d="M 120,70 C 80,20 20,60 20,130 C 20,200 100,240 140,250 C 170,260 160,200 130,180 C 110,165 90,180 95,205"
                stroke="white"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.2, ease: "easeInOut" }}
              />
              {/* Right Stroke of the Heart - Smaller and higher */}
              <motion.path
                d="M 120,70 C 150,35 210,60 210,110 C 210,160 160,180 130,165 C 110,155 125,120 150,125"
                stroke="white"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.8, ease: "easeInOut", delay: 0.6 }}
              />
              
              {/* Subtile Glow Pulse */}
              <motion.path
                d="M 120,70 C 80,20 20,60 20,130 C 20,200 100,240 140,250 M 120,70 C 150,35 210,60 210,110 C 210,160 160,180 130,165"
                stroke="white"
                strokeWidth="2"
                fill="none"
                opacity="0.3"
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1.02, opacity: [0, 0.4, 0] }}
                transition={{ delay: 2.5, duration: 2.5, repeat: Infinity }}
              />
            </svg>
          </div>

          {/* Branding Text with Neon Glow */}
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="text-4xl font-serif tracking-[0.2em] text-white neon-text-white mb-2"
            >
              f 63.9
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2, duration: 1 }}
              className="text-[12px] tracking-[0.6em] text-white/70 italic font-serif"
            >
              &lt;code of love&gt;
            </motion.p>
          </div>
        </div>
      </div>

      {/* Background Ambience */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ duration: 3 }}
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0%,transparent_70%)]"
      />
    </motion.div>
  );
};
