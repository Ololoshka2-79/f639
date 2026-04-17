import React from 'react';
import { useAdminStore } from '../../store/adminStore';
import { Settings, PencilOff, LayoutDashboard, Package, BarChart3, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptics } from '../../hooks/useHaptics';
import { useNavigate, useLocation } from 'react-router-dom';
export const AdminToolbar: React.FC = () => {
  const { isAdmin, editMode, toggleEditMode } = useAdminStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const haptics = useHaptics();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAdmin) return null;

  const menuItems = [
    { label: 'Товары', icon: Package, path: '/admin/products' },
    { label: 'Аналитика', icon: BarChart3, path: '/admin/analytics' },
  ];

  return (
    <div className="fixed bottom-32 right-6 z-[100] flex flex-col items-end gap-3 font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-2 bg-app-surface-1/95 backdrop-blur-3xl border border-app-border-strong rounded-[32px] p-2 flex flex-col gap-1 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                  haptics.impactLight();
                }}
                className={`flex items-center gap-3 pl-4 pr-6 py-3 rounded-2xl transition-all ${
                  location.pathname === item.path 
                    ? 'bg-app-accent text-app-bg' 
                    : 'text-app-text-muted hover:bg-white/5 hover:text-app-text'
                }`}
              >
                <item.icon size={18} />
                <span className="text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5">{item.label}</span>
              </button>
            ))}
            
            <div className="h-[1px] bg-app-border mx-4 my-1" />
            
            <button
               onClick={() => {
                 toggleEditMode();
                 haptics.impactMedium();
               }}
               className={`flex items-center gap-3 pl-4 pr-6 py-3 rounded-2xl transition-all ${
                 editMode ? 'text-app-accent' : 'text-app-text-muted'
               }`}
            >
               {editMode ? <PencilOff size={18} /> : <Settings size={18} />}
               <span className="text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5">
                  {editMode ? 'Режим: ВЫКЛ' : 'Режим: ВКЛ'}
               </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setIsOpen(!isOpen);
          haptics.impactLight();
        }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-3xl border transition-all duration-500 ${
          isOpen || editMode
            ? 'bg-app-accent border-app-accent text-app-bg' 
            : 'bg-app-surface-1/95 border-app-border-strong text-app-accent'
        }`}
      >
        {isOpen ? <X size={24} /> : (editMode ? <PencilOff size={24} /> : <LayoutDashboard size={24} />)}
      </motion.button>
    </div>
  );
};
