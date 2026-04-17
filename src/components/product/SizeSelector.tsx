import React, { useState } from 'react';
import { Ruler, Info, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '../../hooks/useHaptics';

interface SizeSelectorProps {
  sizes: string[];
  selectedSize?: string;
  onSelect: (size: string) => void;
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({ sizes, selectedSize, onSelect }) => {
  const [showMeasure, setShowMeasure] = useState(false);
  const haptics = useHaptics();

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-app-accent flex items-center gap-2">
          Выберите размер
          {selectedSize && <Check size={14} className="animate-in fade-in zoom-in" />}
        </label>
        <button 
          onClick={() => { setShowMeasure(true); haptics.impactLight(); }} 
          className="flex items-center gap-2 text-[10px] text-app-text-muted hover:text-app-accent uppercase tracking-widest transition-colors font-medium"
        >
          Как узнать размер?
          <Ruler size={14} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => { onSelect(size); haptics.impactMedium(); }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-semibold border transition-all active:scale-95 ${
              selectedSize === size
                ? 'bg-app-accent border-app-accent text-app-bg shadow-[0_0_15px_rgba(201,168,106,0.3)]'
                : 'bg-white/5 border-app-border text-app-text'
            }`}
          >
            {size}
          </button>
        ))}
      </div>

      {/* Sizing Modal */}
      <AnimatePresence>
        {showMeasure && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMeasure(false)}
              className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-[110] bg-app-surface-1 rounded-t-[32px] p-8 border-t border-app-border-strong safe-area-bottom"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-serif text-app-accent">Как узнать размер?</h3>
                <button onClick={() => setShowMeasure(false)} className="p-2 text-app-text-muted"><X size={24} /></button>
              </div>
              <div className="space-y-6 text-sm text-app-text/80 leading-relaxed font-light">
                <p>Самый простой способ — измерить внутренний диаметр имеющегося у вас кольца в миллиметрах.</p>
                <div className="p-4 rounded-2xl bg-black/40 border border-app-border flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-app-accent/10 flex items-center justify-center flex-shrink-0 text-app-accent"><Info size={20} /></div>
                  <div>
                    <span className="text-[10px] text-app-accent font-bold uppercase tracking-widest">Профессиональный совет</span>
                    <p className="text-[11px] mt-1 text-app-text-muted">Помните, что пальцы могут немного отекать к вечеру, поэтому лучше проводить замеры в конце дня.</p>
                  </div>
                </div>
                <p>Если вы сомневаетесь, наш менеджер поможет сделать точный замер после оформления заказа.</p>
              </div>
              <button onClick={() => setShowMeasure(false)} className="w-full mt-10 py-4 rounded-xl border border-app-accent text-app-accent text-[10px] font-bold uppercase tracking-widest active:bg-app-accent active:text-app-bg transition-all">Понятно</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
};
