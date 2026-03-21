import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeliveries, filterDeliveries } from '../hooks/useDeliveries'
import { SearchBar, FilterBar } from '../components/SearchBar'
import { ListSkeleton } from '../components/Skeleton'
import { EmptyState } from '../components/OfflineBanner'
import { GlassCard } from '../components/GlassCard'
import type { FilterState, Delivery } from '../types'

export function ListPage() {
  const { deliveries, isLoading, error, refetch, deleteDelivery } = useDeliveries()
  const [filter, setFilter] = useState<FilterState>({ search: '', prefecture: null, product: null })
  const [deleteConfirm, setDeleteConfirm] = useState<Delivery | null>(null)
  const navigate = useNavigate()

  const filtered = filterDeliveries(deliveries, filter)

  const prefectures = [...new Set(deliveries.map(d => d.prefecture))].sort()
  const products = [...new Set(deliveries.map(d => d.product))].sort()

  const handleDelete = async (d: Delivery) => {
    await deleteDelivery(d.id)
    setDeleteConfirm(null)
  }

  const isFiltering = filter.search || filter.prefecture || filter.product

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search & Filter */}
      <div className="px-4 pt-2 pb-3 space-y-2 bg-white/60 backdrop-blur-sm border-b border-gray-100">
        <SearchBar
          value={filter.search}
          onChange={v => setFilter(f => ({ ...f, search: v }))}
        />
        <FilterBar
          prefectures={prefectures}
          products={products}
          selectedPrefecture={filter.prefecture}
          selectedProduct={filter.product}
          onPrefecture={v => setFilter(f => ({ ...f, prefecture: v }))}
          onProduct={v => setFilter(f => ({ ...f, product: v }))}
        />
        {isFiltering && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{filtered.length}件</span>
            <button
              onClick={() => setFilter({ search: '', prefecture: null, product: null })}
              className="text-xs text-brand-600 font-semibold"
            >
              クリア
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-orange-50 border-b border-orange-200 flex items-center justify-between">
          <span className="text-xs text-orange-600">⚠️ データの取得に失敗しました（キャッシュ表示中）</span>
          <button onClick={refetch} className="text-xs text-brand-600 font-semibold ml-2">再試行</button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {isLoading && deliveries.length === 0 ? (
          <div className="pt-4">
            <ListSkeleton />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={isFiltering ? '見つかりませんでした' : '納品先がありません'}
            subtitle={isFiltering ? '検索条件を変えてみてください' : '右下の＋から登録しましょう'}
            emoji={isFiltering ? '🔍' : '📦'}
            action={!isFiltering ? { label: '＋ 新規登録', onClick: () => navigate('/create') } : undefined}
          />
        ) : (
          <div className="p-4 space-y-3 pb-36">
            {/* Pull to refresh hint */}
            <div className="text-center">
              <button onClick={refetch} className="text-xs text-gray-400 active:text-brand-500">
                ↓ 引っ張って更新
              </button>
            </div>

            {filtered.map(delivery => (
              <DeliveryRow
                key={delivery.id}
                delivery={delivery}
                onTap={() => navigate(`/delivery/${delivery.id}`)}
                onDelete={() => setDeleteConfirm(delivery)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setDeleteConfirm(null)}>
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">🗑️</div>
              <h3 className="font-bold text-lg mb-1">削除確認</h3>
              <p className="text-sm text-gray-500 mb-6">「{deleteConfirm.name}」を削除しますか？<br />この操作は取り消せません。</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 bg-gray-100 rounded-xl font-semibold text-gray-700">
                キャンセル
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold">
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Status config ─────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: '未配達', color: '#f59e0b', bg: '#fef3c7' },
  delivered:   { label: '配達済', color: '#10b981', bg: '#d1fae5' },
  failed:      { label: '失敗',   color: '#ef4444', bg: '#fee2e2' },
  rescheduled: { label: '再調整', color: '#8b5cf6', bg: '#ede9fe' },
}

// ── Delivery Row ─────────────────────────────────
interface DeliveryRowProps {
  delivery: Delivery
  onTap: () => void
  onDelete: () => void
}

function DeliveryRow({ delivery, onTap, onDelete }: DeliveryRowProps) {
  const [showActions, setShowActions] = useState(false)
  const st = STATUS_CONFIG[delivery.status] ?? STATUS_CONFIG.pending

  return (
    <div
      className="
        relative bg-white rounded-2xl overflow-hidden
        shadow-[0_2px_12px_rgba(0,0,0,0.06)]
        border border-black/[0.04]
        active:scale-[0.985] transition-all duration-150
        animate-fade-in
      "
      onClick={onTap}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: st.color }}
      />

      <div className="pl-4 pr-4 py-3.5 flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
          style={{ background: `linear-gradient(135deg, ${st.bg}, ${st.bg}cc)` }}
        >
          📦
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h3 className="font-bold text-gray-900 truncate text-[15px] tracking-tight">{delivery.name}</h3>
            <button
              onClick={e => { e.stopPropagation(); setShowActions(v => !v) }}
              className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-gray-500 flex-shrink-0 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 flex items-center gap-0.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-gray-300">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              </svg>
              {delivery.prefecture}
            </span>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ color: st.color, background: st.bg }}
            >
              {delivery.product}
            </span>
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-auto"
              style={{ color: st.color, background: st.bg }}
            >
              {st.label}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-300 flex-shrink-0">
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Actions */}
      {showActions && (
        <div
          className="flex gap-2 px-4 pb-3 border-t border-gray-50 pt-2.5"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => { setShowActions(false); onTap() }}
            className="flex-1 py-2 bg-brand-50 text-brand-600 rounded-xl text-xs font-bold"
          >
            詳細を見る →
          </button>
          <button
            onClick={() => { setShowActions(false); onDelete() }}
            className="flex-1 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold"
          >
            削除
          </button>
        </div>
      )}
    </div>
  )
}
