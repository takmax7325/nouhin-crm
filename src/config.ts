// ⚠️ 本番環境では環境変数を使用してください
// .env ファイルに記述 → Vercel の Environment Variables に設定

export const config = {
  supabaseURL: import.meta.env.VITE_SUPABASE_URL as string || 'https://xxxx.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string || 'xxxx',
  imageBucket: 'delivery-images',
} as const
