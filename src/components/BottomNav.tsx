import { NavLink, useLocation } from 'react-router-dom'

// ── Icons ─────────────────────────────────────────────
const ListIcon = ({ active }: { active: boolean }) => {
  const c = active ? 'white' : '#9ca3af'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5"  width="18" height="2.2" rx="1.1" fill={c}/>
      <rect x="3" y="11" width="18" height="2.2" rx="1.1" fill={c}/>
      <rect x="3" y="17" width="18" height="2.2" rx="1.1" fill={c}/>
    </svg>
  )
}

const PlusIcon = ({ active }: { active: boolean }) => {
  const c = active ? 'white' : '#9ca3af'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={c} strokeWidth="2.6" strokeLinecap="round"/>
    </svg>
  )
}

const MapIcon = ({ active }: { active: boolean }) => {
  const body = active ? 'white' : '#9ca3af'
  const hole = active ? '#1e3a8a' : 'white'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={body}/>
      <circle cx="12" cy="9" r="2.5" fill={hole}/>
    </svg>
  )
}

// ── BottomNav ──────────────────────────────────────────
export function BottomNav() {
  const { pathname } = useLocation()
  const isList   = pathname === '/list'
  const isCreate = pathname === '/create'
  const isMap    = pathname === '/map'

  return (
    // 外側ラッパー：safe-area分だけ上に浮かせることで
    // iOSホームインジケーターの問題を完全回避
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
    >
      <nav
        className="flex pointer-events-auto rounded-[32px] border border-black/[0.05]"
        style={{
          background: 'white',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
          padding: '6px',
          gap: '4px',
        }}
      >
        <Tab to="/list"   label="一覧"  active={isList}>   <ListIcon active={isList} /></Tab>
        <Tab to="/create" label="新規"  active={isCreate}> <PlusIcon active={isCreate} /></Tab>
        <Tab to="/map"    label="地図"  active={isMap}>    <MapIcon  active={isMap} /></Tab>
      </nav>
    </div>
  )
}

// ── Tab Item ───────────────────────────────────────────
function Tab({
  to, label, active, children,
}: { to: string; label: string; active: boolean; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className="flex flex-col items-center justify-center rounded-[24px] transition-all duration-200 active:scale-95"
      style={{
        background: active ? '#1e3a8a' : 'transparent',
        width: 76,
        height: 52,
        gap: 3,
      }}
    >
      {children}
      <span
        className="text-[11px] font-bold tracking-tight leading-none"
        style={{ color: active ? 'white' : '#9ca3af' }}
      >
        {label}
      </span>
    </NavLink>
  )
}
