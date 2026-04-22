import React from 'react';
import { useCheckoutStore } from '../../store/checkoutStore';
import { formatCurrency } from '../../lib/utils';
import type { CartItem } from '../../types';
import { ShoppingBag, MapPin, Phone, ShieldCheck, Copy, Check } from 'lucide-react';
import { useHaptics } from '../../hooks/useHaptics';

interface SummaryStepProps {
  items: CartItem[];
  total: number;
}

export const SummaryStep: React.FC<SummaryStepProps> = ({ items, total }) => {
  const { contactInfo, deliveryData } = useCheckoutStore();
  const haptics = useHaptics();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(deliveryData.address);
    setCopied(true);
    haptics.success();
    setTimeout(() => setCopied(false), 2000);
  };

  const shippingCost = total > 50000 ? 0 : 500;
  const finalTotal = total + shippingCost;
  const deliveryTitle = 'Пункт выдачи заказов Яндекс';

  return (
    <div className="animate-in fade-in slide-in-from-right-4 space-y-8 p-6 duration-500">
      <div className="space-y-2">
        <h2 className="font-serif text-xl tracking-wide text-app-text">Подтверждение</h2>
        <p className="text-[10px] font-medium uppercase tracking-widest text-app-text-muted">
          Проверьте данные перед отправкой заявки
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4 rounded-2xl border border-app-border-strong bg-app-surface-1 p-5">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-app-text-muted">Получатель</h4>
            <div className="text-app-accent">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-app-text">{contactInfo.name}</p>
            <div className="flex items-center gap-2 text-xs text-app-text-muted">
              <Phone size={12} />
              <span>{contactInfo.phone}</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-app-text-muted">
              <MapPin size={12} className="mt-0.5 shrink-0" />
              <span className="line-clamp-6 text-app-text/90">
                <span className="font-medium">{deliveryTitle}</span>
                {deliveryData.address.trim() ? (
                  <>
                    <span className="text-app-text-muted"> · </span>
                    {deliveryData.address}
                    <button
                      onClick={handleCopy}
                      className="ml-2 inline-flex items-center gap-1 rounded-md bg-app-accent/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-app-accent transition-all active:scale-95"
                    >
                      {copied ? (
                        <>
                          <Check size={10} />
                          <span>Скопировано</span>
                        </>
                      ) : (
                        <>
                          <Copy size={10} />
                          <span>Копировать</span>
                        </>
                      )}
                    </button>
                  </>
                ) : null}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <ShoppingBag size={14} className="text-app-text-muted" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-app-text-muted">Товары ({items.length})</span>
          </div>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-xl border border-app-border-strong bg-app-surface-2 p-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f5f5f5] dark:bg-[#141414]">
                  <img src={item.product.image} alt={item.product.title} className="h-full w-full object-cover object-center" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <h5 className="line-clamp-1 text-[11px] font-medium text-app-text">{item.product.title}</h5>
                  <div className="mt-1 flex items-center gap-3">
                    {item.size ? <span className="text-[9px] uppercase text-app-text-muted">Размер: {item.size}</span> : null}
                    <span className="text-[9px] uppercase text-app-text-muted">Кол-во: {item.quantity}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center text-[11px] font-bold text-app-accent">
                  {formatCurrency(item.product.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border-2 border-app-border-strong bg-app-accent/10 p-6 shadow-sm">
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-app-text/60">Итого к оплате</span>
            </div>
            <span className="text-[var(--price-large)] font-bold text-app-accent">{formatCurrency(finalTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
