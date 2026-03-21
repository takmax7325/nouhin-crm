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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-sky-400 via-blue-500 to-[#1e3a8a]">
        <div className="flex flex-col items-center gap-5">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-2xl border border-white/30">
            <span className="text-4xl">📦</span>
          </div>
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

const PAGE_META: Record<string, { title: string; emoji: string }> = {
  '/map':    { title: '地図',     emoji: '🗺️' },
  '/list':   { title: '一覧',     emoji: '📋' },
  '/create': { title: '新規登録', emoji: '✦'  },
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isDetail = location.pathname.startsWith('/delivery/')
  const meta = PAGE_META[location.pathname]

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f0f8ff]">
      <OfflineBanner />

      {/* ── Header ── */}
      <header
        className="flex-shrink-0 px-5 bg-white border-b border-sky-100"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: '12px' }}
      >
        <div className="flex items-center justify-between">
          {/* Left: back or logo */}
          <div className="flex items-center gap-3 min-w-0">
            {isDetail ? (
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-1.5 text-[#1e3a8a] font-semibold text-sm active:opacity-60 transition-opacity"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                戻る
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-[10px] flex items-center justify-center shadow-sm">
                  <span className="text-base leading-none">📦</span>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-sky-400 leading-none mb-0.5">納品管理</p>
                  <h1 className="text-[17px] font-bold text-[#1e3a8a] leading-none tracking-tight">
                    {meta?.title ?? 'CRM'}
                  </h1>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>

      {!isDetail && <BottomNav />}
    </div>
  )
}


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
