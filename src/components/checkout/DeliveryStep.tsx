import React from 'react';
import { useCheckoutStore } from '../../store/checkoutStore';
import { MapPin } from 'lucide-react';

const ADDR_MIN = 8;

export const DeliveryStep: React.FC = () => {
  const { deliveryData, setDeliveryData } = useCheckoutStore();

  return (
    <div className="animate-in fade-in slide-in-from-right-4 space-y-8 p-6 duration-500">
      <div className="space-y-2">
        <h2 className="font-serif text-xl tracking-wide text-app-text">Доставка</h2>
        <p className="text-[10px] font-medium uppercase tracking-widest text-app-text-muted">
          Способ: пункт выдачи заказов Яндекс
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-app-text-muted">
          Как получите заказ
        </p>

        <div className="flex w-full flex-col gap-1 rounded-[12px] border border-app-accent bg-app-accent/10 p-4 text-left">
          <span className="flex items-center gap-2 text-[11px] font-semibold text-app-text">
            <MapPin size={16} className="text-app-accent" />
            Пункт выдачи заказов Яндекс
          </span>
          <span className="text-[10px] leading-relaxed text-app-text-muted">
            Укажите ниже адрес удобного для вас ПВЗ.
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-app-text-muted">
          <MapPin size={14} className="text-app-accent" />
          Адрес ПВЗ
        </label>
        <textarea
          value={deliveryData.address}
          onChange={(e) =>
            setDeliveryData({
              address: e.target.value,
              fulfillment: 'yandex_pvz',
              mode: 'pickup',
              pvzId: null,
            })
          }
          placeholder="Укажите точный адрес удобного для Вас пункта выдачи заказов Яндекс"
          rows={5}
          className="w-full resize-y rounded-[12px] border border-app-border/80 bg-app-surface-1 px-4 py-3 text-sm leading-relaxed text-app-text placeholder:text-app-text-muted/45 focus:border-app-border-strong focus:outline-none"
        />
        {deliveryData.address.trim().length > 0 && deliveryData.address.trim().length < ADDR_MIN ? (
          <p className="text-[10px] text-app-text-muted">Минимум {ADDR_MIN} символов.</p>
        ) : null}
      </div>
    </div>
  );
};
