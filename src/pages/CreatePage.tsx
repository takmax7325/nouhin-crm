import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { deliveryService, imageService, geocode } from '../lib/supabase'
import { deliveryCache } from '../lib/cache'
import { GlassCard } from '../components/GlassCard'
import { useRegisterHeaderAction } from '../contexts/HeaderContext'
import type { DeliveryInput } from '../types'

// ── 郵便番号から住所を取得（zipcloud API）──────────────
async function fetchAddressByZip(zip: string): Promise<{ prefecture: string; city: string; town: string } | null> {
  try {
    const clean = zip.replace(/[^0-9]/g, '')
    if (clean.length !== 7) return null
    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${clean}`)
    const data = await res.json()
    if (data.results?.[0]) {
      const r = data.results[0]
      return { prefecture: r.address1, city: r.address2, town: r.address3 }
    }
    return null
  } catch {
    return null
  }
}

export function CreatePage() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<DeliveryInput>({
    name: '', prefecture: '', product: '', address: '', lat: 35.6762, lng: 139.6503, website: '',
  })
  const [zipcode, setZipcode]               = useState('')
  const [zipStatus, setZipStatus]           = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews]   = useState<string[]>([])
  const [isGeocoding, setIsGeocoding]       = useState(false)
  const [geocoded, setGeocoded]             = useState(false)
  const [isSaving, setIsSaving]             = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [websiteAutoFilled, setWebsiteAutoFilled] = useState(false)

  const update = (key: keyof DeliveryInput, value: string | number) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const isValid = form.name && form.prefecture && form.product && form.address

  // ヘッダー右上に保存ボタンを挿し込む
  useRegisterHeaderAction(
    <button
      type="submit"
      form="create-form"
      disabled={!isValid || isSaving}
      className="px-4 py-2 rounded-xl font-bold text-white text-sm bg-[#1e3a8a] shadow-sm active:scale-95 transition-all disabled:opacity-40 flex items-center gap-1.5"
    >
      {isSaving ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          保存中
        </>
      ) : '保存'}
    </button>
  )

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

  // 郵便番号入力ハンドラ（7桁になったら自動検索）
  const handleZipcodeChange = async (raw: string) => {
    // 数字とハイフンのみ許可、最大8文字（XXX-XXXX）
    const filtered = raw.replace(/[^0-9-]/g, '').slice(0, 8)
    setZipcode(filtered)

    const digits = filtered.replace(/[^0-9]/g, '')
    if (digits.length === 7) {
      setZipStatus('loading')
      const result = await fetchAddressByZip(digits)
      if (result) {
        const fullAddress = result.prefecture + result.city + result.town
        setForm(prev => ({
          ...prev,
          prefecture: result.prefecture,
          address: fullAddress,
        }))
        setZipStatus('ok')
        setGeocoded(false)
        setWebsiteAutoFilled(false)
      } else {
        setZipStatus('error')
      }
    } else {
      setZipStatus('idle')
    }
  }

  const handleGeocode = async () => {
    if (!form.address) return
    setIsGeocoding(true)
    const result = await geocode(form.address)
    if (result) {
      setForm(prev => {
        const autoFill = !!result.website && !prev.website
        if (autoFill) setWebsiteAutoFilled(true)
        return {
          ...prev, lat: result.lat, lng: result.lng,
          website: result.website && !prev.website ? result.website : prev.website,
        }
      })
      setGeocoded(true)
    }
    setIsGeocoding(false)
  }

  // 住所欄からフォーカスが外れたとき、ウェブサイト未入力なら自動取得
  const handleAddressBlur = async () => {
    if (!form.address || geocoded) return
    setIsGeocoding(true)
    const result = await geocode(form.address)
    if (result) {
      setForm(prev => {
        const autoFill = !!result.website && !prev.website
        if (autoFill) setWebsiteAutoFilled(true)
        return {
          ...prev, lat: result.lat, lng: result.lng,
          website: result.website && !prev.website ? result.website : prev.website,
        }
      })
      setGeocoded(true)
    }
    setIsGeocoding(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) { setError('必須項目を入力してください'); return }
    setIsSaving(true); setError(null)
    if (!geocoded) {
      const result = await geocode(form.address)
      if (result) {
        setForm(prev => ({
          ...prev, lat: result.lat, lng: result.lng,
          website: result.website && !prev.website ? result.website : prev.website,
        }))
      }
    }
    try {
      const delivery = await deliveryService.create(form)
      deliveryCache.upsertOne(delivery)
      for (let i = 0; i < selectedImages.length; i++) {
        try { await imageService.upload(delivery.id, selectedImages[i], i === 0 ? 'main' : 'sub') } catch {}
      }
      navigate(`/delivery/${delivery.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    }
    setIsSaving(false)
  }

  return (
    <div className="absolute inset-0">

      {/* Scrollable content */}
      <div
        className="h-full overflow-y-auto overscroll-contain"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
      >
        <form id="create-form" onSubmit={handleSubmit} className="p-4 space-y-4">

          {/* Image */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">画像 ({selectedImages.length}/5)</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {selectedImages.length < 5 && (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-sky-300 rounded-xl flex flex-col items-center justify-center text-sky-500 bg-sky-50 active:scale-95 transition-transform">
                  <span className="text-2xl">＋</span>
                  <span className="text-xs mt-1">追加</span>
                </button>
              )}
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative flex-shrink-0">
                  <img src={src} alt="" className="w-24 h-24 object-cover rounded-xl" />
                  {i === 0 && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#1e3a8a] text-white text-[9px] font-bold rounded-md">メイン</span>}
                  <button type="button"
                    onClick={() => { setSelectedImages(p => p.filter((_, j) => j !== i)); setImagePreviews(p => p.filter((_, j) => j !== i)) }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center">✕</button>
                </div>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleImages(e.target.files)} />
          </div>

          {/* Fields */}
          <GlassCard className="p-4 space-y-4">
            <FormField label="納品先名" value={form.name} onChange={v => update('name', v)} placeholder="例: 山田商店" required />

            {/* 郵便番号 + 商品名 */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase flex items-center gap-1">
                  郵便番号 <span className="text-red-400">*</span>
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={zipcode}
                    onChange={e => handleZipcodeChange(e.target.value)}
                    placeholder="1234567"
                    className="w-full h-[50px] px-3 text-base text-gray-900 bg-[#f5f5f7] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white transition-all placeholder-gray-300"
                  />
                  {zipStatus === 'loading' && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">🔄</span>
                  )}
                  {zipStatus === 'ok' && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-sky-500">✅</span>
                  )}
                  {zipStatus === 'error' && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-400">✗</span>
                  )}
                </div>
                {zipStatus === 'ok' && (
                  <p className="text-[10px] text-sky-500 mt-0.5">住所を自動入力しました</p>
                )}
                {zipStatus === 'error' && (
                  <p className="text-[10px] text-red-400 mt-0.5">該当なし</p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase">商品名 <span className="text-red-400">*</span></label>
                <select value={form.product} onChange={e => update('product', e.target.value)} required
                  className="w-full mt-1.5 h-[50px] px-3 text-base bg-[#f5f5f7] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white transition-all appearance-none text-gray-900">
                  <option value="">選択</option>
                  <option value="SS">SS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="スクエア">スクエア</option>
                </select>
              </div>
            </div>

            {/* 住所 */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase flex items-center gap-1">
                住所 <span className="text-red-400">*</span>
                {zipStatus === 'ok' && <span className="text-[10px] text-sky-500 font-normal">（郵便番号から自動入力）</span>}
              </label>
              <div className="flex gap-2 mt-1">
                <input type="text" value={form.address}
                  onChange={e => { update('address', e.target.value); setGeocoded(false); setWebsiteAutoFilled(false) }}
                  onBlur={handleAddressBlur}
                  placeholder="東京都渋谷区道玄坂1-1-1" required
                  className="flex-1 px-3.5 py-3 text-base text-gray-900 bg-[#f5f5f7] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white transition-all placeholder-gray-300" />
                <button type="button" onClick={handleGeocode} disabled={isGeocoding || !form.address}
                  className="px-3 py-3 bg-[#1e3a8a] text-white rounded-xl text-xs font-bold disabled:opacity-40 flex-shrink-0 shadow-sm">
                  {isGeocoding ? '🔄' : '📍取得'}
                </button>
              </div>
              {geocoded && <p className="text-xs text-sky-600 mt-1">✅ 位置情報を取得しました</p>}
            </div>

            {/* ウェブサイト */}
            <div>
              <label className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase flex items-center gap-1">
                ウェブサイト
                {websiteAutoFilled && <span className="text-[10px] text-sky-500 font-normal">✨ 住所から自動取得</span>}
              </label>
              <input type="url" value={form.website} onChange={e => update('website', e.target.value)}
                placeholder="https://example.com"
                className="w-full mt-1.5 px-3.5 py-3 text-base text-gray-900 bg-[#f5f5f7] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white transition-all placeholder-gray-300" />
            </div>
          </GlassCard>

        </form>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="fixed left-4 right-4 z-30 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}>
          ⚠️ {error}
        </div>
      )}

    </div>
  )
}

function FormField({ label, value, onChange, placeholder, required, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; type?: string
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-400 tracking-wide uppercase">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full mt-1.5 px-3.5 py-3 text-base text-gray-900 bg-[#f5f5f7] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-white focus:border-transparent transition-all placeholder-gray-300" />
    </div>
  )
}
