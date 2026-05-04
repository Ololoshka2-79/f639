# Architecture Audit — 2026-05-04

## Root Cause: Two Sources of Truth (Zustand + React Query)

### Broken Architecture Point

```
                    ┌─────────────────────────┐
                    │    Zustand Store         │
                    │  (persist → localStorage)│
                    │  addProduct / remove     │
                    │  updateProduct           │
                    └──────────┬──────────────┘
                               │ Optimistic mutations
                               │ (NO server confirmation)
                               ▼
                    ┌─────────────────────────┐
                    │   useMergedCatalogProducts│
                    │   (compares lengths)     │
                    │   "whoever is bigger"    │
                    └──────────┬──────────────┘
                               │ returns "merged" data
                               ▼
                    ┌─────────────────────────┐
                    │ Admin / Catalog / Product│
                    │   PAGES                  │
                    └─────────────────────────┘

                    ┌─────────────────────────┐
                    │   React Query Cache       │
                    │   (in-memory only)       │
                    │   GET /products          │
                    └──────────┬──────────────┘
                               │ fetch on mount
                               │ refetch on invalidate
                               ▼
                    ┌─────────────────────────┐
                    │   API (server/products   │
                    │   .json)                 │
                    └─────────────────────────┘
```

### Specific failure scenarios:

1. **Admin creates product** → Zustand.addProduct (optimistic) → persist to localStorage → POST fails (CORS/network) → product in localStorage, NOT on server. Reload page: Zustand restores from localStorage, API returns old list. `useMergedCatalogProducts` compares: `storeLen > remoteLen` → returns **Zustand data** with fake products. Other users see old API data.

2. **Admin updates product** → Zustand.updateProduct → persist → POST succeeds → invalidateQueries → API refetch returns updated list → `storeLen === remoteLen` → **no sync** → Zustand still has old data for some fields. Race condition between Zustand and API.

3. **Admin deletes product** → Zustand.removeProduct → persist → DELETE succeeds → invalidateQueries → API returns list WITHOUT deleted product → `remoteLen < storeLen` → **falls to else** → **no sync** → deleted product re-appears in Zustand. Admin sees "ghost" products.

4. **Cross-client sync**: Admin creates product on machine A → persists to localStorage[A]. User on machine B loads page → React Query fetches from API → gets updated list → shows correctly. BUT Admin on machine A, after N creates, has stale data in Zustand → `useMergedCatalogProducts` returns Zustand (which is larger) → Admin sees WRONG data.

### Impact:
- Admin CRUD appears to work locally, but changes are NOT propagated to other users
- On page refresh, admin may see phantom products or stale data
- User sees SERVER data (correct, but incomplete if admin thinks changes went through)
- No single source of truth — two competing caches

## Fix Plan (P0-P2)

### P0 — Data Integrity (CRITICAL)

1. **Zustand persist for products → REMOVE**
   - Products are API-only. Zustand should NOT persist products to localStorage.
   - Categories stay in Zustand (static data from mocks).

2. **useMergedCatalogProducts → DELETE, replace with direct React Query**
   - No length comparison. No "whoever is bigger" logic.
   - Pages use `useQuery` directly with `queryKeys.products`.

3. **AdminProductsPage → Server-first mutations**
   - Remove optimistic add/remove from Zustand.
   - Use React Query `useMutation` with `onMutate` (optimistic) + `onError` (rollback via `queryClient.setQueryData`).
   - This gives instant UI + safe rollback.

4. **productStore.ts → strip to only categories + remove persist**
   - Remove: `addProduct`, `removeProduct`, `updateProduct`, `duplicateProduct`, `reorderProducts`, `setProducts`.
   - Keep: `categories`, `setCategories`, `addCategory`, `updateCategory`, `removeCategory`.
   - Remove `persist` middleware entirely (categories are static, no need for localStorage).

### P1 — Consistency

5. **Normalize data model between client and server types**
   - Ensure Product type matches exactly what server returns.
   - Remove redundant fields (gallery, gallery_public_ids are derived from images).

6. **Single product retrieval for ProductPage**
   - ProductPage calls `api.products.getById(id)` via React Query.
   - No fallback to Zustand.

### P2 — UI (no redesign)

7. **Remove visual artifacts** — check overflow, shadow issues from previous fixes.