import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  setHomeHeroData: (data: { title?: string, subtitle?: string, image?: string, sectionTitle?: string, sectionSubtitle?: string }) => void;
  setCategoryName: (id: string, name: string) => void;
  setProfileData: (data: { flair?: string }) => void;
  setProfileMenuLabel: (index: number, label: string) => void;
  setCustomBadgeLabel: (key: string, label: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      homeHeroTitle: 'Elite Jewels Collection',
      homeHeroSubtitle: 'New Season',
      homeHeroImage: '/images/hero.png',
      homeSectionTitle: 'Must-Have Rings',
      homeSectionSubtitle: 'See All',
      customBadgeLabels: { new: 'NEW', hit: 'HIT', sale: 'SALE' },
      categoryNames: {},
      profileFlair: 'Platinum Member',
      profileMenuLabels: {},
      setHomeHeroData: (data) => set((state) => ({ 
        homeHeroTitle: data.title ?? state.homeHeroTitle,
        homeHeroSubtitle: data.subtitle ?? state.homeHeroSubtitle,
        homeHeroImage: data.image ?? state.homeHeroImage,
        homeSectionTitle: data.sectionTitle ?? state.homeSectionTitle,
        homeSectionSubtitle: data.sectionSubtitle ?? state.homeSectionSubtitle,
      })),
      setCategoryName: (id, name) => set((state) => ({
        categoryNames: { ...state.categoryNames, [id]: name }
      })),
      setProfileData: (data) => set((state) => ({
        profileFlair: data.flair ?? state.profileFlair,
      })),
      setProfileMenuLabel: (index, label) => set((state) => ({
        profileMenuLabels: { ...state.profileMenuLabels, [index.toString()]: label }
      })),
      setCustomBadgeLabel: (key, label) => set((state) => ({
        customBadgeLabels: { ...state.customBadgeLabels, [key]: label }
      })),
    }),
    { name: 'f639-ui-storage' }
  )
);
