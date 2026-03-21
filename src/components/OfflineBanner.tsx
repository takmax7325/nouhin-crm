import { useOnline } from '../hooks/useOnline'

export function OfflineBanner() {
  const isOnline = useOnline()

  if (isOnline) return null

  return (
    <div className="
      flex items-center gap-2 px-4 py-2.5
      bg-gradient-to-r from-orange-500 to-red-500
      text-white text-sm font-semibold
      animate-fade-in
    ">
      <span>📴</span>
      <span>オフラインモード — キャッシュデータを表示しています</span>
    </div>
  )
}

// ── Toast ─────────────────────────────────────────
interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onDismiss?: () => void
}

export function Toast({ message, type = 'info', onDismiss }: ToastProps) {
  const colors = {
    success: 'bg-brand-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-gray-800 text-white',
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️' }

  return (
    <div className={`
      fixed top-20 left-1/2 -translate-x-1/2 z-50
      flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl
      text-sm font-medium max-w-xs
      animate-slide-up
      ${colors[type]}
    `}>
      <span>{icons[type]}</span>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100">✕</button>
      )}
    </div>
  )
}

// ── Empty State ────────────────────────────────────
interface EmptyStateProps {
  title: string
  subtitle?: string
  emoji?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-fade-in">
      <h3 className="text-lg font-bold text-gray-700 mb-2">{title}</h3>
      {subtitle && <p className="text-sm text-gray-400 mb-6">{subtitle}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-2.5 bg-[#1e3a8a] text-white rounded-full font-semibold text-sm shadow-md active:scale-95 transition-transform"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
