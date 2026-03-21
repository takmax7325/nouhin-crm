import { NavLink, useLocation } from 'react-router-dom'

// ── SVG Icons ─────────────────────────────────────
const MapIcon = ({ filled }: { filled: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {filled ? (
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

const ListIcon = ({ filled }: { filled: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {filled ? (
      <>
        <rect x="3" y="4" width="18" height="3" rx="1.5" fill="currentColor"/>
        <rect x="3" y="10.5" width="18" height="3" rx="1.5" fill="currentColor"/>
        <rect x="3" y="17" width="18" height="3" rx="1.5" fill="currentColor"/>
      </>
    ) : (
      <>
        <rect x="3" y="4" width="18" height="3" rx="1.5" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <rect x="3" y="10.5" width="18" height="3" rx="1.5" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <rect x="3" y="17" width="18" height="3" rx="1.5" stroke="currentColor" strokeWidth="1.8" fill="none"/>
      </>
    )}
  </svg>
)

// ── Bottom Nav ─────────────────────────────────────
export function BottomNav() {
  const location = useLocation()
  const isMap = location.pathname === '/map'
  const isList = location.pathname === '/list'
  const isCreate = location.pathname === '/create'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Frosted glass bar */}
      <div
        className="
          mx-3 mb-3 rounded-[28px]
          bg-white/80 backdrop-blur-2xl
          shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]
          border border-white/60
          flex items-center
          px-2 py-1
        "
      >
        {/* 地図 */}
        <NavTabItem
          to="/map"
          label="地図"
          isActive={isMap}
          icon={<MapIcon filled={isMap} />}
        />

        {/* 中央: フローティング新規ボタン */}
        <div className="flex-1 flex justify-center items-center -mt-7">
          <NavLink to="/create">
            {() => (
              <div
                className={`
                  w-14 h-14 rounded-full
                  flex items-center justify-center
                  shadow-[0_4px_20px_rgba(34,197,94,0.5)]
                  active:scale-90 transition-all duration-200
                  ${isCreate
                    ? 'bg-gradient-to-br from-brand-400 to-teal-500 shadow-[0_4px_24px_rgba(34,197,94,0.6)]'
                    : 'bg-gradient-to-br from-brand-500 to-teal-600'
                  }
                `}
                style={{
                  transform: isCreate ? 'scale(0.93)' : 'scale(1)',
                }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
            )}
          </NavLink>
        </div>

        {/* 一覧 */}
        <NavTabItem
          to="/list"
          label="一覧"
          isActive={isList}
          icon={<ListIcon filled={isList} />}
        />
      </div>
    </nav>
  )
}

// ── Tab Item ───────────────────────────────────────
function NavTabItem({
  to,
  label,
  isActive,
  icon,
}: {
  to: string
  label: string
  isActive: boolean
  icon: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      className={`
        flex-1 flex flex-col items-center justify-center
        py-2 px-1 gap-0.5 rounded-2xl
        transition-all duration-200 active:scale-90
        ${isActive ? 'text-brand-600' : 'text-gray-400'}
      `}
    >
      {/* Active indicator pill */}
      <div
        className={`
          transition-all duration-200 mb-0.5
          ${isActive ? 'w-5 h-1 bg-brand-500 rounded-full' : 'w-0 h-1'}
        `}
      />
      <span
        className={`
          transition-all duration-200
          ${isActive ? 'scale-110' : 'scale-100'}
        `}
      >
        {icon}
      </span>
      <span
        className={`
          text-[10px] font-semibold tracking-tight
          transition-all duration-200
          ${isActive ? 'text-brand-600' : 'text-gray-400'}
        `}
      >
        {label}
      </span>
    </NavLink>
  )
}
