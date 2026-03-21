// ── LocalStorage オフラインキャッシュ ─────────────
import type { Delivery, Note, History } from '../types'

const KEYS = {
  deliveries: 'crm_deliveries',
  notes: (id: string) => `crm_notes_${id}`,
  histories: (id: string) => `crm_histories_${id}`,
}

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ストレージ容量超過時は無視
  }
}

// ── Deliveries Cache ─────────────────────────────
export const deliveryCache = {
  get: (): Delivery[] => safeGet<Delivery[]>(KEYS.deliveries, []),

  set: (deliveries: Delivery[]) => {
    // updatedAt で競合解決
    const existing = deliveryCache.get()
    const map = new Map(existing.map(d => [d.id, d]))
    for (const d of deliveries) {
      const ex = map.get(d.id)
      if (!ex || new Date(d.updated_at) >= new Date(ex.updated_at)) {
        map.set(d.id, d)
      }
    }
    safeSet(KEYS.deliveries, Array.from(map.values()))
  },

  upsertOne: (delivery: Delivery) => {
    const list = deliveryCache.get()
    const idx = list.findIndex(d => d.id === delivery.id)
    if (idx >= 0) list[idx] = delivery
    else list.unshift(delivery)
    safeSet(KEYS.deliveries, list)
  },

  remove: (id: string) => {
    const list = deliveryCache.get().filter(d => d.id !== id)
    safeSet(KEYS.deliveries, list)
  },
}

// ── Notes Cache ───────────────────────────────────
export const notesCache = {
  get: (deliveryId: string): Note[] => safeGet<Note[]>(KEYS.notes(deliveryId), []),
  set: (deliveryId: string, notes: Note[]) => safeSet(KEYS.notes(deliveryId), notes),
}

// ── Histories Cache ───────────────────────────────
export const historiesCache = {
  get: (deliveryId: string): History[] => safeGet<History[]>(KEYS.histories(deliveryId), []),
  set: (deliveryId: string, histories: History[]) => safeSet(KEYS.histories(deliveryId), histories),
}
