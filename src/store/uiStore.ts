import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api/endpoints';

interface UIState {
  homeHeroTitle: string;
  homeHeroSubtitle: string;
  homeHeroImage: string;
  homeSectionTitle: string;
  homeSectionSubtitle: string;
  customBadgeLabels: Record<string, string>;
  categoryNames: Record<string, string>;
  profileFlair: string;
  profileMenuLabels: Record<string, string>;
  fetchSettings: () => Promise<void>;
  setHomeHeroData: (data: { title?: string, subtitle?: string, image?: string, sectionTitle?: string, sectionSubtitle?: string }) => void;
  setCategoryName: (id: string, name: string) => void;
  setProfileData: (data: { flair?: string }) => void;
  setProfileMenuLabel: (index: number, label: string) => void;
  setCustomBadgeLabel: (key: string, label: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      homeHeroTitle: 'Elite Jewels Collection',
      homeHeroSubtitle: 'New Season',
      homeHeroImage: '/images/hero.png',
      homeSectionTitle: 'Популярное',
      homeSectionSubtitle: 'Смотреть все',
      customBadgeLabels: { new: 'NEW', hit: 'HIT', sale: 'SALE' },
      categoryNames: {},
      profileFlair: 'Platinum Member',
      profileMenuLabels: {},

      fetchSettings: async () => {
        try {
          const settings = await api.settings.get();
          if (settings) {
            set(settings);
          }
        } catch (err) {
          console.warn('[UIStore] Failed to fetch settings from server:', err);
        }
      },

      setHomeHeroData: (data) => {
        const newState = { 
          homeHeroTitle: data.title ?? get().homeHeroTitle,
          homeHeroSubtitle: data.subtitle ?? get().homeHeroSubtitle,
          homeHeroImage: data.image ?? get().homeHeroImage,
          homeSectionTitle: data.sectionTitle ?? get().homeSectionTitle,
          homeSectionSubtitle: data.sectionSubtitle ?? get().homeSectionSubtitle,
        };
        set(newState);
        api.settings.update(newState).catch(err => console.error('Failed to sync settings:', err));
      },
      
      setCategoryName: (id, name) => {
        const categoryNames = { ...get().categoryNames, [id]: name };
        set({ categoryNames });
        api.settings.update({ categoryNames }).catch(err => console.error('Failed to sync settings:', err));
      },

      setProfileData: (data) => {
        const newState = { 
          profileFlair: data.flair ?? get().profileFlair,
        };
        set(newState);
        api.settings.update(newState).catch(err => console.error('Failed to sync settings:', err));
      },

      setProfileMenuLabel: (index, label) => {
        const profileMenuLabels = { ...get().profileMenuLabels, [index.toString()]: label };
        set({ profileMenuLabels });
        api.settings.update({ profileMenuLabels }).catch(err => console.error('Failed to sync settings:', err));
      },

      setCustomBadgeLabel: (key, label) => {
        const customBadgeLabels = { ...get().customBadgeLabels, [key]: label };
        set({ customBadgeLabels });
        api.settings.update({ customBadgeLabels }).catch(err => console.error('Failed to sync settings:', err));
      },
    }),
    { name: 'f639-ui-storage' }
  )
);
