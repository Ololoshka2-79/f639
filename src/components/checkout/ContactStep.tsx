import React from 'react';
import { useCheckoutStore } from '../../store/checkoutStore';
import { User, Phone } from 'lucide-react';

export const ContactStep: React.FC = () => {
  const { contactInfo, setContactInfo } = useCheckoutStore();

  const handleChange = (field: string, value: string) => {
    if (field === 'phone') {
      let cleaned = value.replace(/[^+0-9]/g, '');
      
      // Ensure it starts with +7
      if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
      }
      if (!cleaned.startsWith('+7')) {
        // If they try to delete the 7, put it back or if they type something else after +
        cleaned = '+7' + cleaned.substring(1).replace('7', '');
      }
      
      // Simple logic: if empty or just '+', make it '+7'
      if (cleaned === '+' || cleaned === '') {
        cleaned = '+7';
      }

      setContactInfo({ [field]: cleaned });
      return;
    }
    setContactInfo({ [field]: value });
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 space-y-8 p-6 duration-500">
      <div className="space-y-2">
        <h2 className="font-serif text-xl tracking-wide text-app-text">Контактная информация</h2>
        <p className="text-[10px] font-medium uppercase tracking-widest text-app-text-muted">
          Для связи по заказу
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <User className="absolute left-4 top-4 text-app-text-muted" size={18} />
          <input
            type="text"
            placeholder="Ваше имя"
            value={contactInfo.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full rounded-[12px] border border-app-border/80 bg-app-surface-1 py-4 pl-12 pr-4 text-sm text-app-text transition-colors duration-200 focus:border-app-border-strong focus:bg-app-surface-3/50 focus:outline-none"
          />
        </div>

        <div className="relative">
          <Phone className="absolute left-4 top-4 text-app-text-muted" size={18} />
          <input
            type="tel"
            placeholder="+7 (999) 000-00-00"
            value={contactInfo.phone || '+7'}
            onChange={(e) => handleChange('phone', e.target.value)}
            onFocus={(e) => {
              if (!e.target.value) handleChange('phone', '+7');
            }}
            className="w-full rounded-[12px] border border-app-border/80 bg-app-surface-1 py-4 pl-12 pr-4 text-sm text-app-text transition-colors duration-200 focus:border-app-border-strong focus:bg-app-surface-3/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-4 rounded-[12px] border border-app-accent/15 bg-app-accent/5 p-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-app-accent/10 text-app-accent">
          <span className="text-[10px] font-bold">!</span>
        </div>
        <p className="text-[10px] leading-relaxed text-app-text-muted">
          Данные используются только для обработки этого заказа.
        </p>
      </div>
    </div>
  );
};
