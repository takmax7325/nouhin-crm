// ── Shimmer Skeleton ──────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`
        rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200
        bg-[length:200%_100%] animate-shimmer
        ${className}
      `}
    />
  )
}

// ── Delivery Row Skeleton ─────────────────────────
export function DeliveryRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 bg-white/70 rounded-2xl border border-white/40">
      <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  )
}

// ── List Skeleton ─────────────────────────────────
export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <DeliveryRowSkeleton key={i} />
      ))}
    </div>
  )
}

// ── Detail Skeleton ───────────────────────────────
export function DetailSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
    </div>
  )
}
