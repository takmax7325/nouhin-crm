// ────────────────────────────────────────────────
//  Core Data Models (Supabase row types)
// ────────────────────────────────────────────────

export interface Delivery {
  id: string
  name: string
  prefecture: string
  product: string
  address: string
  lat: number
  lng: number
  website: string
  updated_at: string
}

export interface DeliveryInput {
  name: string
  prefecture: string
  product: string
  address: string
  lat: number
  lng: number
  website: string
}

export interface ImageModel {
  id: string
  delivery_id: string
  url: string
  type: string // 'main' | 'sub'
}

export interface Note {
  id: string
  delivery_id: string
  note: string
  created_at: string
}

export interface History {
  id: string
  delivery_id: string
  date: string
  quantity: number
  memo: string
}

export interface Contact {
  id: string
  delivery_id: string
  person_name: string
  phone: string
  email: string
}

// ────────────────────────────────────────────────
//  UI / State types
// ────────────────────────────────────────────────

export interface FilterState {
  search: string
  prefecture: string | null
  product: string | null
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// Sample data for initial load / offline preview
export const SAMPLE_DELIVERIES: Delivery[] = [
  { id: '1', name: '山田商店', prefecture: '東京都', product: 'プレミアム米 5kg', address: '東京都渋谷区道玄坂1-1-1', lat: 35.6595, lng: 139.6989, website: 'https://example.com', updated_at: new Date().toISOString() },
  { id: '2', name: '田中青果', prefecture: '大阪府', product: '旬の野菜セット', address: '大阪府大阪市北区梅田1-1-1', lat: 34.7024, lng: 135.4959, website: '', updated_at: new Date().toISOString() },
  { id: '3', name: '鈴木精肉店', prefecture: '愛知県', product: '和牛ロース 1kg', address: '愛知県名古屋市中区栄3-1-1', lat: 35.1706, lng: 136.9078, website: '', updated_at: new Date().toISOString() },
  { id: '4', name: '佐藤水産', prefecture: '北海道', product: '新鮮魚介セット', address: '北海道札幌市中央区大通西1丁目', lat: 43.0621, lng: 141.3544, website: '', updated_at: new Date().toISOString() },
  { id: '5', name: '高橋農園', prefecture: '福岡県', product: '有機野菜BOX', address: '福岡県福岡市中央区天神1-1-1', lat: 33.5904, lng: 130.4017, website: 'https://example.com', updated_at: new Date().toISOString() },
]
