import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { OfflineBanner } from './components/OfflineBanner'
import { BottomNav } from './components/BottomNav'
import { LoginPage } from './pages/LoginPage'
import { MapPage } from './pages/MapPage'
import { ListPage } from './pages/ListPage'
import { DetailPage } from './pages/DetailPage'
import { CreatePage } from './pages/CreatePage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-brand-500 to-teal-500">
        <div className="flex flex-col items-center gap-4">
          <span className="text-5xl">📦</span>
          <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isDetail = location.pathname.startsWith('/delivery/')

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Top Header */}
      <header className="
        flex items-center justify-between px-4 py-3
        bg-white/80 backdrop-blur-md border-b border-gray-200/60
        pt-[env(safe-area-inset-top)]
        flex-shrink-0
      ">
        <div className="flex items-center gap-2">
          <span className="text-xl">📦</span>
          <div>
            <h1 className="text-sm font-bold text-gray-900 leading-none">納品管理CRM</h1>
            {isDetail && (
              <button
                onClick={() => window.history.back()}
                className="text-[10px] text-brand-600 font-medium"
              >
                ← 戻る
              </button>
            )}
          </div>
        </div>
        <UserMenu />
      </header>

      {/* Page Title */}
      <PageTitle />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>

      {/* Bottom Navigation */}
      {!isDetail && <BottomNav />}
    </div>
  )
}

function PageTitle() {
  const location = useLocation()
  const titles: Record<string, string> = {
    '/map': '🗺️ 地図',
    '/list': '📋 一覧',
    '/create': '➕ 新規登録',
  }
  const title = titles[location.pathname]
  if (!title) return null

  return (
    <div className="px-4 py-2 bg-white/60 backdrop-blur-sm border-b border-gray-100 flex-shrink-0">
      <h2 className="text-sm font-semibold text-gray-600">{title}</h2>
    </div>
  )
}

function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-sm font-bold"
      >
        {user?.email?.[0]?.toUpperCase() ?? '?'}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 w-56 animate-scale-in">
            <p className="text-xs text-gray-500 truncate mb-2 pb-2 border-b border-gray-100">
              {user?.email}
            </p>
            <button
              onClick={() => { setOpen(false); signOut() }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 rounded-xl hover:bg-red-50 font-medium"
            >
              🚪 ログアウト
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// useState import fix
import { useState } from 'react'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/list" replace />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/list" element={<ListPage />} />
              <Route path="/delivery/:id" element={<DetailPage />} />
              <Route path="/create" element={<CreatePage />} />
              <Route path="*" element={<Navigate to="/list" replace />} />
            </Routes>
          </AppLayout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}
