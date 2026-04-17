import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useHaptics } from '../../hooks/useHaptics';

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productTitle: string;
}

export const DeleteProductModal: React.FC<DeleteProductModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productTitle
}) => {
  const haptics = useHaptics();

  return (
    <AnimatePresence>
      {isOpen && (
      <div key="delete-product-modal" className="fixed inset-0 z-[110] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm bg-app-surface-1 border border-app-border rounded-[32px] p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto mb-6">
            <Trash2 size={28} />
          </div>
          
          <h3 className="text-xl font-serif text-app-text mb-2">Удалить товар?</h3>
          <p className="text-sm text-app-text-muted mb-8 leading-relaxed">
            Вы уверены, что хотите удалить «<span className="text-app-text font-bold">{productTitle}</span>»? Это действие невозможно отменить.
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              type="button"
              onClick={() => {
                haptics.impactMedium();
                onConfirm();
              }}
              className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-transform"
            >
              Удалить навсегда
            </button>
            <button 
              type="button"
              onClick={() => { onClose(); haptics.impactLight(); }}
              className="w-full py-4 rounded-2xl bg-white/5 border border-app-border text-app-text-muted font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-transform"
            >
              Отмена
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
