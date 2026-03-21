import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { deliveryService, imageService, geocode } from '../lib/supabase'
import { deliveryCache } from '../lib/cache'
import { GlassCard } from '../components/GlassCard'
import type { DeliveryInput } from '../types'

export function CreatePage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<DeliveryInput>({
    name: '', prefecture: '', product: '', address: '', lat: 35.6762, lng: 139.6503, website: '',
  })
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocoded, setGeocoded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (key: keyof DeliveryInput, value: string | number) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const isValid = form.name && form.prefecture && form.product && form.address

  // Handle image selection
  const handleImages = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files).slice(0, 5 - selectedImages.length)
    setSelectedImages(prev => [...prev, ...newFiles])
    newFiles.forEach(f => {
      const reader = new FileReader()
      reader.onload = e => setImagePreviews(prev => [...prev, e.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  // Geocode address + auto-fill website if found
  const handleGeocode = async () => {
    if (!form.address) return
    setIsGeocoding(true)
    const result = await geocode(form.address)
    if (result) {
      setForm(prev => ({
        ...prev,
        lat: result.lat,
        lng: result.lng,
        // ウェブサイトが取得できた場合のみ上書き（すでに入力済みなら保持）
        website: result.website && !prev.website ? result.website : prev.website,
      }))
      setGeocoded(true)
    }
    setIsGeocoding(false)
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) { setError('必須項目を入力してください'); return }

    setIsSaving(true)
    setError(null)

    // Geocode if not done
    if (!geocoded) {
      const result = await geocode(form.address)
      if (result) {
        setForm(prev => ({
          ...prev,
          lat: result.lat,
          lng: result.lng,
          website: result.website && !prev.website ? result.website : prev.website,
        }))
      }
    }

    try {
      const delivery = await deliveryService.create(form)
      deliveryCache.upsertOne(delivery)

      // Upload images
      for (let i = 0; i < selectedImages.length; i++) {
        const type = i === 0 ? 'main' : 'sub'
        try { await imageService.upload(delivery.id, selectedImages[i], type) } catch { /* skip failed images */ }
      }

      navigate(`/delivery/${delivery.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    }

    setIsSaving(false)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto overscroll-contain scrollbar-hide">
      <form onSubmit={handleSubmit} className="p-4 space-y-4 pb-28">
        {/* Image Section */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">画像 ({selectedImages.length}/5)</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {/* Add button */}
            {selectedImages.length < 5 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="
                  flex-shrink-0 w-24 h-24 border-2 border-dashed border-sky-300
                  rounded-xl flex flex-col items-center justify-center
                  text-sky-500 bg-sky-50 active:scale-95 transition-transform
                "
              >
                <span className="text-2xl">＋</span>
                <span className="text-xs mt-1">追加</span>
              </button>
            )}

            {/* Previews */}
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative flex-shrink-0">
                <img src={src} alt="" className="w-24 h-24 object-cover rounded-xl" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#1e3a8a] text-white text-[9px] font-bold rounded-md">
                    メイン
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImages(prev => prev.filter((_, j) => j !== i))
                    setImagePreviews(prev => prev.filter((_, j) => j !== i))
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleImages(e.target.files)}
          />
        </div>

        {/* Form Fields */}
        <GlassCard className="p-4 space-y-4">
          <FormField
            label="納品先名"
            value={form.name}
            onChange={v => update('name', v)}
            placeholder="例: 山田商店"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="都道府県"
              value={form.prefecture}
              onChange={v => update('prefecture', v)}
              placeholder="例: 東京都"
              required
            />
            <div>
              <label className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase">
                商品名 <span className="text-red-400">*</span>
              </label>
              <select
                value={form.product}
                onChange={e => update('product', e.target.value)}
                required
                className="
                  w-full mt-1 px-3 py-2.5 text-sm
                  bg-[#f5f5f7] border border-transparent rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white
                  transition-all appearance-none text-gray-900 text-sm placeholder-gray-300
                "
              >
                <option value="">選択してください</option>
                <option value="SS">SS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="スクエア">スクエア</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase">住所 *</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={form.address}
                onChange={e => { update('address', e.target.value); setGeocoded(false) }}
                placeholder="東京都渋谷区道玄坂1-1-1"
                required
                className="flex-1 px-3.5 py-3 text-sm text-gray-900 bg-[#f5f5f7] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white transition-all placeholder-gray-300"
              />
              <button
                type="button"
                onClick={handleGeocode}
                disabled={isGeocoding || !form.address}
                className="px-3 py-3 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold disabled:opacity-40 flex-shrink-0 shadow-sm"
              >
                {isGeocoding ? '🔄' : '📍取得'}
              </button>
            </div>
            {geocoded && (
              <p className="text-xs text-sky-600 mt-1 flex items-center gap-1">
                ✅ 位置情報を取得しました
              </p>
            )}
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase flex items-center gap-1">
              ウェブサイト
              {form.website && geocoded && (
                <span className="text-[10px] text-sky-500 font-normal">（住所から自動取得）</span>
              )}
            </label>
            <input
              type="url"
              value={form.website}
              onChange={e => update('website', e.target.value)}
              placeholder="https://example.com"
              className="
                w-full mt-1.5 px-3.5 py-3 text-sm text-gray-900
                bg-[#f5f5f7] border border-transparent rounded-xl
                focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white
                transition-all placeholder-gray-300
              "
            />
          </div>
        </GlassCard>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!isValid || isSaving}
          className="
            w-full py-4 rounded-2xl font-bold text-white text-base
            bg-[#1e3a8a]
            shadow-lg shadow-blue-900/30
            active:scale-[0.98] transition-all duration-150
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              保存中...
            </span>
          ) : '保存する'}
        </button>
      </form>
    </div>
  )
}

// ── Form Field ────────────────────────────────────
function FormField({ label, value, onChange, placeholder, required, type = 'text' }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  type?: string
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="
          w-full mt-1.5 px-3.5 py-3 text-sm text-gray-900
          bg-[#f5f5f7] border border-transparent rounded-xl
          focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white focus:border-transparent
          transition-all placeholder-gray-300
        "
      />
    </div>
  )
}
