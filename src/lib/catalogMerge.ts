import type { Product } from '../types';

/** Remote list merged with persisted local store; local wins by id (admin edits, offline adds). */
export function mergeCatalogLists(remote: Product[] | undefined, local: Product[]): Product[] {
  const map = new Map<string, Product>();
  if (remote?.length) {
    for (const p of remote) {
      map.set(p.id, p);
    }
  }
  for (const p of local) {
    map.set(p.id, p);
  }
  return Array.from(map.values());
}
