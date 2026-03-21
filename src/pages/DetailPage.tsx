import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { deliveryService, imageService, noteService, historyService, contactService } from '../lib/supabase'
import { deliveryCache, notesCache, historiesCache } from '../lib/cache'
import { useOnline } from '../hooks/useOnline'
import { ImageCarousel } from '../components/ImageCarousel'
import { GlassCard } from '../components/GlassCard'
import { DetailSkeleton } from '../components/Skeleton'
import { Toast } from '../components/OfflineBanner'
import type { Delivery, Note, History, Contact, ImageModel } from '../types'

// ── Toast hook ────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const show = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }
  return { toast, show }
}

// ── Detail Page ───────────────────────────────────
export function DetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isOnline = useOnline()
  const { toast, show } = useToast()

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [images, setImages] = useState<ImageModel[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [histories, setHistories] = useState<History[]>([])
  const [contact, setContact] = useState<Contact | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'info' | 'notes' | 'history' | 'contact'>('info')

  useEffect(() => {
    if (!id) return
    loadData()
  }, [id])

  async function loadData() {
    if (!id) return
    setIsLoading(true)

    // Try cache first
    const cached = deliveryCache.get().find(d => d.id === id)
    if (cached) setDelivery(cached)
    setNotes(notesCache.get(id))
    setHistories(historiesCache.get(id))

    if (isOnline) {
      const [d, imgs, n, h, c] = await Promise.allSettled([
        deliveryService.fetchOne(id),
        imageService.fetchByDelivery(id),
        noteService.fetchByDelivery(id),
        historyService.fetchByDelivery(id),
        contactService.fetchByDelivery(id),
      ])
      if (d.status === 'fulfilled') { setDelivery(d.value); deliveryCache.upsertOne(d.value) }
      if (imgs.status === 'fulfilled') setImages(imgs.value)
      if (n.status === 'fulfilled') { setNotes(n.value); notesCache.set(id, n.value) }
      if (h.status === 'fulfilled') { setHistories(h.value); historiesCache.set(id, h.value) }
      if (c.status === 'fulfilled') setContact(c.value)
    }

    setIsLoading(false)
  }

  if (isLoading) return <div className="pt-16"><DetailSkeleton /></div>
  if (!delivery) return (
    <div className="flex flex-col items-center justify-center h-64">
      <p className="text-gray-500">データが見つかりません</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-brand-600 font-semibold">← 戻る</button>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto overscroll-contain pb-28">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Header Image */}
      <ImageCarousel images={images} height="h-64" />

      {/* Upload Image Button */}
      {isOnline && (
        <div className="px-4 -mt-5 mb-2 flex justify-end">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  const img = await imageService.upload(delivery.id, file)
                  setImages(prev => [...prev, img])
                  show('画像をアップロードしました')
                } catch {
                  show('アップロードに失敗しました', 'error')
                }
              }}
            />
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-xl shadow-md text-xs font-semibold text-gray-700 border border-gray-200">
              📷 画像追加
            </span>
          </label>
        </div>
      )}

      {/* Basic Info */}
      <div className="px-4 mb-4">
        <GlassCard className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{delivery.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">📍 {delivery.prefecture}</p>
            </div>
            <span className="flex-shrink-0 px-3 py-1.5 bg-brand-100 text-brand-700 rounded-full text-xs font-bold">
              {delivery.product}
            </span>
          </div>

          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            <InfoRow icon="🏠" label="住所" value={delivery.address} />
            {delivery.website && <InfoRow icon="🌐" label="ウェブサイト" value={delivery.website} isLink />}
            <InfoRow icon="🕐" label="更新日" value={new Date(delivery.updated_at).toLocaleDateString('ja-JP')} />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(delivery.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold"
            >
              🗺️ Googleマップ
            </a>
            {delivery.website ? (
              <a
                href={delivery.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 bg-orange-50 text-orange-700 rounded-xl text-sm font-semibold"
              >
                🌐 ウェブサイト
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-sm">
                🌐 サイト未登録
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Section Tabs */}
      <div className="px-4 mb-3">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {([
            { key: 'notes', label: `メモ (${notes.length})` },
            { key: 'history', label: `履歴 (${histories.length})` },
            { key: 'contact', label: '担当者' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`
                flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200
                ${activeSection === tab.key
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-gray-500'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="px-4">
        {activeSection === 'notes' && (
          <NotesSection
            deliveryId={delivery.id}
            notes={notes}
            setNotes={setNotes}
            isOnline={isOnline}
            showToast={show}
          />
        )}
        {activeSection === 'history' && (
          <HistorySection
            deliveryId={delivery.id}
            histories={histories}
            setHistories={setHistories}
            isOnline={isOnline}
            showToast={show}
          />
        )}
        {activeSection === 'contact' && (
          <ContactSection
            deliveryId={delivery.id}
            contact={contact}
            setContact={setContact}
            isOnline={isOnline}
            showToast={show}
          />
        )}
      </div>
    </div>
  )
}

// ── Info Row ──────────────────────────────────────
function InfoRow({ icon, label, value, isLink }: { icon: string; label: string; value: string; isLink?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-base mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-medium">{label}</p>
        {isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer"
            className="text-sm text-blue-600 underline truncate block">{value}</a>
        ) : (
          <p className="text-sm text-gray-700">{value}</p>
        )}
      </div>
    </div>
  )
}

// ── Notes Section ─────────────────────────────────
function NotesSection({ deliveryId, notes, setNotes, isOnline, showToast }: {
  deliveryId: string
  notes: Note[]
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>
  isOnline: boolean
  showToast: (msg: string, type?: 'success' | 'error') => void
}) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const addNote = async () => {
    if (!text.trim() || !isOnline) return
    setSaving(true)
    try {
      const note = await noteService.create(deliveryId, text.trim())
      setNotes(prev => [note, ...prev])
      setText('')
      showToast('メモを追加しました')
    } catch { showToast('追加に失敗しました', 'error') }
    setSaving(false)
  }

  const updateNote = async (id: string) => {
    try {
      const updated = await noteService.update(id, editText)
      setNotes(prev => prev.map(n => n.id === id ? updated : n))
      setEditingId(null)
      showToast('更新しました')
    } catch { showToast('更新に失敗しました', 'error') }
  }

  const deleteNote = async (id: string) => {
    try {
      await noteService.delete(id)
      setNotes(prev => prev.filter(n => n.id !== id))
    } catch { showToast('削除に失敗しました', 'error') }
  }

  return (
    <div className="space-y-3">
      {isOnline && (
        <GlassCard className="p-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="メモを入力..."
            rows={3}
            className="w-full text-sm bg-transparent resize-none focus:outline-none text-gray-700 placeholder-gray-400"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={addNote}
              disabled={!text.trim() || saving}
              className="px-4 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-semibold disabled:opacity-40"
            >
              {saving ? '追加中...' : '追加'}
            </button>
          </div>
        </GlassCard>
      )}

      {notes.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">メモなし</p>
      )}

      {notes.map(note => (
        <GlassCard key={note.id} className="p-3">
          {editingId === note.id ? (
            <div>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                rows={3}
                className="w-full text-sm bg-transparent resize-none focus:outline-none text-gray-700"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600">キャンセル</button>
                <button onClick={() => updateNote(note.id)} className="flex-1 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-semibold">保存</button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-gray-400">
                  {new Date(note.created_at).toLocaleDateString('ja-JP')}
                </span>
                {isOnline && (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingId(note.id); setEditText(note.note) }}
                      className="text-xs text-gray-400">✏️</button>
                    <button onClick={() => deleteNote(note.id)}
                      className="text-xs text-red-400">🗑️</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  )
}

// ── History Section ────────────────────────────────
function HistorySection({ deliveryId, histories, setHistories, isOnline, showToast }: {
  deliveryId: string
  histories: History[]
  setHistories: React.Dispatch<React.SetStateAction<History[]>>
  isOnline: boolean
  showToast: (msg: string, type?: 'success' | 'error') => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [quantity, setQuantity] = useState(1)
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)

  const add = async () => {
    if (!isOnline) return
    setSaving(true)
    try {
      const h = await historyService.create({ delivery_id: deliveryId, date, quantity, memo })
      setHistories(prev => [h, ...prev])
      setShowForm(false)
      setMemo('')
      setQuantity(1)
      showToast('履歴を追加しました')
    } catch { showToast('追加に失敗しました', 'error') }
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      {isOnline && (
        <button
          onClick={() => setShowForm(v => !v)}
          className="w-full py-2.5 border-2 border-dashed border-brand-300 text-brand-600 rounded-xl text-sm font-semibold"
        >
          {showForm ? '✕ 閉じる' : '＋ 履歴を追加'}
        </button>
      )}

      {showForm && (
        <GlassCard className="p-4 space-y-3 animate-scale-in">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500">日付</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500">数量</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setQuantity(v => Math.max(1, v - 1))}
                className="w-7 h-7 bg-gray-100 rounded-lg font-bold text-gray-600">−</button>
              <span className="w-10 text-center font-bold text-brand-700">{quantity}</span>
              <button onClick={() => setQuantity(v => v + 1)}
                className="w-7 h-7 bg-gray-100 rounded-lg font-bold text-gray-600">＋</button>
            </div>
          </div>
          <input type="text" value={memo} onChange={e => setMemo(e.target.value)}
            placeholder="メモ（任意）"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400" />
          <button onClick={add} disabled={saving}
            className="w-full py-2.5 bg-brand-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50">
            {saving ? '追加中...' : '追加する'}
          </button>
        </GlassCard>
      )}

      {histories.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 text-center py-4">履歴なし</p>
      )}

      {histories.map(h => (
        <GlassCard key={h.id} className="p-3 flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-50 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-[10px] text-brand-500 font-medium">
              {new Date(h.date).toLocaleDateString('ja-JP', { month: 'short' })}
            </span>
            <span className="text-lg font-bold text-brand-700 leading-none">
              {new Date(h.date).getDate()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-brand-800">{h.quantity}個</p>
            {h.memo && <p className="text-xs text-gray-500 truncate">{h.memo}</p>}
          </div>
          {isOnline && (
            <button onClick={async () => {
              await historyService.delete(h.id)
              setHistories(prev => prev.filter(x => x.id !== h.id))
            }} className="text-xs text-red-400 p-1">🗑️</button>
          )}
        </GlassCard>
      ))}
    </div>
  )
}

// ── Contact Section ────────────────────────────────
function ContactSection({ deliveryId, contact, setContact, isOnline, showToast }: {
  deliveryId: string
  contact: Contact | null
  setContact: React.Dispatch<React.SetStateAction<Contact | null>>
  isOnline: boolean
  showToast: (msg: string, type?: 'success' | 'error') => void
}) {
  const [editing, setEditing] = useState(!contact)
  const [name, setName] = useState(contact?.person_name ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!isOnline) return
    setSaving(true)
    try {
      const c = await contactService.upsert({
        delivery_id: deliveryId,
        person_name: name,
        phone,
        email,
      })
      setContact(c)
      setEditing(false)
      showToast('担当者を保存しました')
    } catch { showToast('保存に失敗しました', 'error') }
    setSaving(false)
  }

  if (editing) {
    return (
      <GlassCard className="p-4 space-y-3 animate-scale-in">
        <h3 className="font-semibold text-gray-700">担当者情報</h3>
        {[
          { label: '👤 名前', value: name, setter: setName, type: 'text' },
          { label: '📞 電話番号', value: phone, setter: setPhone, type: 'tel' },
          { label: '📧 メール', value: email, setter: setEmail, type: 'email' },
        ].map(field => (
          <div key={field.label}>
            <label className="text-xs font-semibold text-gray-500">{field.label}</label>
            <input
              type={field.type}
              value={field.value}
              onChange={e => field.setter(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          {contact && <button onClick={() => setEditing(false)}
            className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-600 font-semibold">キャンセル</button>}
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </GlassCard>
    )
  }

  if (!contact) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-400 mb-3">担当者未登録</p>
        {isOnline && (
          <button onClick={() => setEditing(true)}
            className="px-4 py-2 border border-brand-300 text-brand-600 rounded-xl text-sm font-semibold">
            ＋ 担当者を追加
          </button>
        )}
      </div>
    )
  }

  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-gray-700">担当者</h3>
        {isOnline && (
          <button onClick={() => { setName(contact.person_name); setPhone(contact.phone); setEmail(contact.email); setEditing(true) }}
            className="text-xs text-brand-600 font-semibold">編集</button>
        )}
      </div>
      <div className="space-y-2 mt-3">
        <div className="flex items-center gap-2">
          <span>👤</span>
          <p className="text-sm font-medium text-gray-800">{contact.person_name}</p>
        </div>
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="flex items-center gap-2">
            <span>📞</span>
            <p className="text-sm text-blue-600 underline">{contact.phone}</p>
          </a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-2">
            <span>📧</span>
            <p className="text-sm text-blue-600 underline">{contact.email}</p>
          </a>
        )}
      </div>
    </GlassCard>
  )
}
