import { promises as fs } from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve('server', 'data');
const settingsPath = path.resolve(dataDir, 'settings.json');

const DEFAULT_SETTINGS = {
  homeHeroTitle: 'Elite Jewels Collection',
  homeHeroSubtitle: 'New Season',
  homeHeroImage: '/images/hero.png',
  homeSectionTitle: 'Популярное',
  homeSectionSubtitle: 'Смотреть все',
  customBadgeLabels: { new: 'NEW', hit: 'HIT', sale: 'SALE' },
  categoryNames: {},
  profileFlair: 'Platinum Member',
  profileMenuLabels: {},
};

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(settingsPath);
  } catch {
    await fs.writeFile(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf8');
  }
}

export async function getSettings() {
  await ensureStore();
  const raw = await fs.readFile(settingsPath, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(newSettings) {
  const current = await getSettings();
  const updated = { ...current, ...newSettings };
  await fs.writeFile(settingsPath, JSON.stringify(updated, null, 2), 'utf8');
  return updated;
}
