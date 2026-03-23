import { NavLink, useLocation } from 'react-router-dom'

const ListIcon = ({ active }: { active: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5"     width="18" height="2.5" rx="1.25" fill={active ? '#1e3a8a' : '#9ca3af'}/>
    <rect x="3" y="10.75" width="18" height="2.5" rx="1.25" fill={active ? '#1e3a8a' : '#9ca3af'}/>
    <rect x="3" y="16.5"  width="18" height="2.5" rx="1.25" fill={active ? '#1e3a8a' : '#9ca3af'}/>
  </svg>
)

const PlusIcon = ({ active }: { active: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="6" fill={active ? '#1e3a8a' : '#d1d5db'}/>
    <path d="M12 7v10M7 12h10" stroke={active ? 'white' : '#6b7280'} strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
)

const MapIcon = ({ active }: { active: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
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

export function BottomNav() {
  const location = useLocation()
  const isList   = location.pathname === '/list'
  const isCreate = location.pathname === '/create'
  const isMap    = location.pathname === '/map'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="h-px bg-gray-200" />
      <div className="flex h-16">
        <TabItem to="/list"   label="一覧" active={isList}>   <ListIcon active={isList} /></TabItem>
        <TabItem to="/create" label="新規" active={isCreate}> <PlusIcon active={isCreate} /></TabItem>
        <TabItem to="/map"    label="地図" active={isMap}>    <MapIcon  active={isMap} /></TabItem>
      </div>
    </nav>
  )
}

function TabItem({
  to, label, active, children,
}: { to: string; label: string; active: boolean; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className="relative flex-1 flex flex-col items-center justify-end pb-2 gap-[3px] transition-all duration-150"
    >
      <span
        className="absolute top-0 left-4 right-4 h-[3px] rounded-b-full transition-all duration-200"
        style={{ background: active ? '#1e3a8a' : 'transparent' }}
      />
      {active && <span className="absolute inset-x-3 inset-y-1 rounded-2xl bg-sky-50" />}
      <span className="relative" style={{ transform: active ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.15s' }}>
        {children}
      </span>
      <span className="relative text-[13px] font-bold tracking-tight" style={{ color: active ? '#1e3a8a' : '#9ca3af' }}>
        {label}
      </span>
    </NavLink>
  )
}
