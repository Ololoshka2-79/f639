import React, { useState } from 'react';
import { Search, MapPin, ChevronRight, Clock } from 'lucide-react';
import { useHaptics } from '../../hooks/useHaptics';

interface PVZ {
  id: string;
  city: string;
  address: string;
  eta: string;
  price: number;
}

interface YandexPVZSelectorProps {
  onSelect: (pvz: PVZ) => void;
  onOpenMap: () => void;
  pvzList: PVZ[];
}

export const YandexPVZSelector: React.FC<YandexPVZSelectorProps> = ({ onSelect, onOpenMap, pvzList }) => {
  const [search, setSearch] = useState('');
  const haptics = useHaptics();

  const filtered = pvzList.filter(p => 
    p.city.toLowerCase().includes(search.toLowerCase()) || 
    p.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Search Header */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted" size={18} />
        <input
          type="text"
          placeholder="Поиск города или адреса..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-app-surface-1 border border-app-border rounded-2xl py-4 pl-12 pr-4 text-sm text-app-text focus:outline-none focus:border-app-border-strong focus:bg-app-surface-3/50 transition-colors"
        />
      </div>

      {/* PVZ List */}
      <div className="flex flex-col gap-3">
        {filtered.map((pvz) => (
          <button
            key={pvz.id}
            onClick={() => {
              onSelect(pvz);
              haptics.selection();
            }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-app-surface-1 border border-app-border hover:border-app-accent/30 transition-all group text-left"
          >
            <div className="w-10 h-10 rounded-full bg-app-accent/10 flex items-center justify-center text-app-accent">
              <MapPin size={20} />
            </div>
            
            <div className="flex-1">
              <h4 className="text-sm font-medium text-app-text">{pvz.address}</h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-app-text-muted uppercase tracking-wider">{pvz.city}</span>
                <div className="flex items-center gap-1 text-[10px] text-app-accent font-medium">
                  <Clock size={10} />
                  <span>{pvz.eta}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-xs font-semibold text-app-accent">
                {pvz.price === 0 ? 'Бесплатно' : `${pvz.price} ₽`}
              </span>
              <ChevronRight size={16} className="text-app-text-muted group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-app-text-muted">Пункт выдачи не найден</p>
          </div>
        )}
      </div>

      <button 
        onClick={onOpenMap}
        className="text-center text-[10px] text-app-accent uppercase tracking-[0.2em] font-bold py-2 hover:opacity-80 transition-opacity"
      >
        Показать на карте
      </button>
    </div>
  );
};
