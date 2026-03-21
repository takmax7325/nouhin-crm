import { createClient } from '@supabase/supabase-js'
import { config } from '../config'
import type { Delivery, DeliveryInput, Note, History, Contact, ImageModel } from '../types'

// ── Supabase client ─────────────────────────────
export const supabase = createClient(config.supabaseURL, config.supabaseAnonKey)

// ── Auth ─────────────────────────────────────────
export const authService = {
  signIn: (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password }),

  signOut: () => supabase.auth.signOut(),

  getSession: () => supabase.auth.getSession(),

  onAuthStateChange: (cb: Parameters<typeof supabase.auth.onAuthStateChange>[0]) =>
    supabase.auth.onAuthStateChange(cb),
}

// ── Deliveries ────────────────────────────────────
export const deliveryService = {
  fetchAll: async (): Promise<Delivery[]> => {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  fetchOne: async (id: string): Promise<Delivery> => {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  create: async (input: DeliveryInput): Promise<Delivery> => {
    const { data, error } = await supabase
      .from('deliveries')
      .insert({ ...input, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (error) throw error
    return data
  },

  update: async (id: string, input: Partial<DeliveryInput>): Promise<Delivery> => {
    const { data, error } = await supabase
      .from('deliveries')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('deliveries').delete().eq('id', id)
    if (error) throw error
  },

  subscribeChanges: (callback: () => void) => {
    const channel = supabase
      .channel('deliveries-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, callback)
      .subscribe()
    return () => supabase.removeChannel(channel)
  },
}

// ── Images ────────────────────────────────────────
export const imageService = {
  fetchByDelivery: async (deliveryId: string): Promise<ImageModel[]> => {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('delivery_id', deliveryId)
    if (error) throw error
    return data ?? []
  },

  upload: async (deliveryId: string, file: File, type = 'sub'): Promise<ImageModel> => {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${deliveryId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(config.imageBucket)
      .upload(path, file, { contentType: file.type })
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage
      .from(config.imageBucket)
      .getPublicUrl(path)

    const { data, error } = await supabase
      .from('images')
      .insert({ delivery_id: deliveryId, url: urlData.publicUrl, type })
      .select()
      .single()
    if (error) throw error
    return data
  },

  delete: async (id: string, storagePath: string) => {
    await supabase.storage.from(config.imageBucket).remove([storagePath])
    const { error } = await supabase.from('images').delete().eq('id', id)
    if (error) throw error
  },
}

// ── Notes ─────────────────────────────────────────
export const noteService = {
  fetchByDelivery: async (deliveryId: string): Promise<Note[]> => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('delivery_id', deliveryId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  create: async (deliveryId: string, note: string): Promise<Note> => {
    const { data, error } = await supabase
      .from('notes')
      .insert({ delivery_id: deliveryId, note })
      .select()
      .single()
    if (error) throw error
    return data
  },

  update: async (id: string, note: string): Promise<Note> => {
    const { data, error } = await supabase
      .from('notes')
      .update({ note })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (error) throw error
  },
}

// ── Histories ─────────────────────────────────────
export const historyService = {
  fetchByDelivery: async (deliveryId: string): Promise<History[]> => {
    const { data, error } = await supabase
      .from('histories')
      .select('*')
      .eq('delivery_id', deliveryId)
      .order('date', { ascending: false })
    if (error) throw error
    return data ?? []
  },

  create: async (input: Omit<History, 'id'>): Promise<History> => {
    const { data, error } = await supabase
      .from('histories')
      .insert(input)
      .select()
      .single()
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('histories').delete().eq('id', id)
    if (error) throw error
  },
}

// ── Contacts ──────────────────────────────────────
export const contactService = {
  fetchByDelivery: async (deliveryId: string): Promise<Contact | null> => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('delivery_id', deliveryId)
      .maybeSingle()
    if (error) throw error
    return data
  },

  upsert: async (input: Omit<Contact, 'id'>): Promise<Contact> => {
    const { data, error } = await supabase
      .from('contacts')
      .upsert(input)
      .select()
      .single()
    if (error) throw error
    return data
  },
}

// ── Geocoding (Nominatim / OpenStreetMap) ──────────
export const geocode = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&accept-language=ja`
    const res = await fetch(url, { headers: { 'User-Agent': 'NouhinCRM/1.0' } })
    const data = await res.json()
    if (data[0]) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
    return null
  } catch {
    return null
  }
}
