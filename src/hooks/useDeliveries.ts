import { useCallback, useEffect, useState } from 'react'
import { deliveryService } from '../lib/supabase'
import { deliveryCache } from '../lib/cache'
import { SAMPLE_DELIVERIES, type Delivery, type FilterState } from '../types'
import { useOnline } from './useOnline'

export function useDeliveries() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isOnline = useOnline()

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    // Show cached data instantly
    const cached = deliveryCache.get()
    if (cached.length > 0) {
      setDeliveries(cached)
      setIsLoading(false)
    }

    if (!isOnline) {
      if (cached.length === 0) {
        // Show sample data when completely offline and no cache
        setDeliveries(SAMPLE_DELIVERIES)
      }
      setIsLoading(false)
      return
    }

    try {
      const data = await deliveryService.fetchAll()
      setDeliveries(data)
      deliveryCache.set(data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '取得に失敗しました'
      setError(msg)
      if (cached.length === 0) setDeliveries(SAMPLE_DELIVERIES)
    } finally {
      setIsLoading(false)
    }
  }, [isOnline])

  useEffect(() => { fetch() }, [fetch])

  // Realtime subscription
  useEffect(() => {
    if (!isOnline) return
    const unsubscribe = deliveryService.subscribeChanges(() => { fetch() })
    return unsubscribe
  }, [isOnline, fetch])

  const deleteDelivery = async (id: string) => {
    await deliveryService.delete(id)
    setDeliveries(prev => prev.filter(d => d.id !== id))
    deliveryCache.remove(id)
  }

  return { deliveries, isLoading, error, refetch: fetch, deleteDelivery }
}

// ── Filtering ──────────────────────────────────────
export function filterDeliveries(deliveries: Delivery[], filter: FilterState): Delivery[] {
  let result = deliveries

  if (filter.search) {
    const q = filter.search.toLowerCase()
    result = result.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.prefecture.toLowerCase().includes(q) ||
      d.product.toLowerCase().includes(q) ||
      d.address.toLowerCase().includes(q)
    )
  }

  if (filter.prefecture) {
    result = result.filter(d => d.prefecture === filter.prefecture)
  }

  if (filter.product) {
    result = result.filter(d => d.product === filter.product)
  }

  return result
}
