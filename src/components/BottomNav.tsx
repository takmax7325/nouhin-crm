import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/map',  icon: '🗺️',  label: '地図' },
  { to: '/list', icon: '📋',  label: '一覧' },
  { to: '/create', icon: '➕', label: '新規' },
]

export function BottomNav() {
  return (
    <nav className="
      fixed bottom-0 left-0 right-0 z-40
      bg-white/80 backdrop-blur-md
      border-t border-gray-200/60
      flex items-center
      pb-[env(safe-area-inset-bottom)]
    ">
      {NAV_ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `
            flex-1 flex flex-col items-center justify-center py-3 gap-0.5
            transition-all duration-150 active:scale-90
            ${isActive ? 'text-brand-600' : 'text-gray-400'}
          `}
        >
          {({ isActive }) => (
            <>
              <span className={`text-xl transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-semibold ${isActive ? 'text-brand-600' : 'text-gray-400'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-[env(safe-area-inset-bottom)] h-0.5 w-6 bg-brand-500 rounded-full" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
