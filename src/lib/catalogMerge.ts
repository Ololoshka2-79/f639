import type { Product } from '../types';

/** Remote list is the source of truth when available. Local is fallback for offline. */
export function mergeCatalogLists(remote: Product[] | undefined, local: Product[]): Product[] {
  if (remote !== undefined) {
    return remote;
  }
  return local;
}
