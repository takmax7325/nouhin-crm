import { NavLink, useLocation } from 'react-router-dom'

// ── Icons ──────────────────────────────────────────
const ListIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5"     width="18" height="2.5" rx="1.25" fill={active ? '#1e3a8a' : '#9ca3af'}/>
    <rect x="3" y="10.75" width="18" height="2.5" rx="1.25" fill={active ? '#1e3a8a' : '#9ca3af'}/>
    <rect x="3" y="16.5"  width="18" height="2.5" rx="1.25" fill={active ? '#1e3a8a' : '#9ca3af'}/>
  </svg>
)

const PlusIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="6" fill={active ? '#1e3a8a' : '#d1d5db'}/>
    <path d="M12 7v10M7 12h10" stroke={active ? 'white' : '#6b7280'} strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
)

const MapIcon = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    {active ? (
      <>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#1e3a8a"/>
        <circle cx="12" cy="9" r="2.5" fill="white"/>
      </>
    ) : (
      <>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#9ca3af" strokeWidth="1.8" fill="none"/>
        <circle cx="12" cy="9" r="2.5" stroke="#9ca3af" strokeWidth="1.8" fill="none"/>
      </>
    )}
  </svg>
)

// ── Bottom Nav ────────────────────────────────────
export function BottomNav() {
  const location = useLocation()
  const isList   = location.pathname === '/list'
  const isCreate = location.pathname === '/create'
  const isMap    = location.pathname === '/map'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white">
      {/* Top border */}
      <div className="h-px bg-gray-200" />

      {/* Tab buttons — fixed 64px height */}
      <div className="flex items-stretch h-[64px]">
        <TabItem to="/list"   label="一覧" active={isList}>
          <ListIcon active={isList} />
        </TabItem>
        <TabItem to="/create" label="新規" active={isCreate}>
          <PlusIcon active={isCreate} />
        </TabItem>
        <TabItem to="/map"    label="地図" active={isMap}>
          <MapIcon active={isMap} />
        </TabItem>
      </div>

      {/* iPhone home indicator safe area — background only, no buttons */}
      <div style={{ height: 'env(safe-area-inset-bottom)', background: 'white' }} />
    </nav>
  )
}

// ── Tab Item ──────────────────────────────────────
function TabItem({
  to, label, active, children,
}: {
  to: string; label: string; active: boolean; children: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      className="relative flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-150"
    >
      {/* Active: top indicator bar */}
      <span
        className="absolute top-0 left-4 right-4 h-[3px] rounded-b-full transition-all duration-200"
        style={{ background: active ? '#1e3a8a' : 'transparent' }}
      />

      {/* Active: background highlight pill */}
      {active && (
        <span className="absolute inset-x-3 inset-y-2 rounded-2xl bg-sky-50" />
      )}

      {/* Icon */}
      <span className="relative transition-transform duration-150"
        style={{ transform: active ? 'scale(1.1)' : 'scale(1)' }}>
        {children}
      </span>

      {/* Label */}
      <span
        className="relative text-[12px] font-bold tracking-tight transition-colors duration-150"
        style={{ color: active ? '#1e3a8a' : '#9ca3af' }}
      >
        {label}
      </span>
    </NavLink>
  )
}
