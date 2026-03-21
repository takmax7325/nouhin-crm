import { NavLink, useLocation } from 'react-router-dom'

// ── SVG Icons ─────────────────────────────────────
const MapIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {active ? (
      <>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor"/>
        <circle cx="12" cy="9" r="2.5" fill="white"/>
      </>
    ) : (
      <>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8" fill="none"/>
      </>
    )}
  </svg>
)

const ListIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    {active ? (
      <>
        <rect x="3" y="5" width="18" height="2.5" rx="1.25" fill="currentColor"/>
        <rect x="3" y="10.75" width="18" height="2.5" rx="1.25" fill="currentColor"/>
        <rect x="3" y="16.5" width="18" height="2.5" rx="1.25" fill="currentColor"/>
      </>
    ) : (
      <>
        <rect x="3" y="5" width="18" height="2.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="3" y="10.75" width="18" height="2.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="3" y="16.5" width="18" height="2.5" rx="1.25" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </>
    )}
  </svg>
)

const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
)

// ── Bottom Nav ─────────────────────────────────────
export function BottomNav() {
  const location = useLocation()
  const isMap    = location.pathname === '/map'
  const isList   = location.pathname === '/list'
  const isCreate = location.pathname === '/create'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-sky-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center h-[60px]">

        {/* 地図 */}
        <NavLink
          to="/map"
          className={`
            flex-1 flex flex-col items-center justify-center gap-0.5
            h-full transition-all duration-200 active:scale-95
            ${isMap ? 'text-[#1e3a8a]' : 'text-gray-400'}
          `}
        >
          <MapIcon active={isMap} />
          <span className={`text-[10px] font-semibold tracking-tight ${isMap ? 'text-[#1e3a8a]' : 'text-gray-400'}`}>
            地図
          </span>
          {isMap && (
            <span className="absolute bottom-2 w-1 h-1 rounded-full bg-[#1e3a8a]" />
          )}
        </NavLink>

        {/* 新規 — center */}
        <NavLink
          to="/create"
          className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all duration-200 active:scale-95"
        >
          <div
            className={`
              w-12 h-12 rounded-2xl flex items-center justify-center
              shadow-[0_4px_14px_rgba(30,58,138,0.35)]
              transition-all duration-200
              ${isCreate ? 'bg-[#172554] scale-95' : 'bg-[#1e3a8a]'}
            `}
          >
            <PlusIcon />
          </div>
          <span className={`text-[10px] font-semibold tracking-tight -mt-0.5 ${isCreate ? 'text-[#1e3a8a]' : 'text-gray-400'}`}>
            新規
          </span>
        </NavLink>

        {/* 一覧 */}
        <NavLink
          to="/list"
          className={`
            flex-1 flex flex-col items-center justify-center gap-0.5
            h-full transition-all duration-200 active:scale-95
            ${isList ? 'text-[#1e3a8a]' : 'text-gray-400'}
          `}
        >
          <ListIcon active={isList} />
          <span className={`text-[10px] font-semibold tracking-tight ${isList ? 'text-[#1e3a8a]' : 'text-gray-400'}`}>
            一覧
          </span>
          {isList && (
            <span className="absolute bottom-2 w-1 h-1 rounded-full bg-[#1e3a8a]" />
          )}
        </NavLink>

      </div>
    </nav>
  )
}
