import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { HeaderProvider, useHeaderAction } from './contexts/HeaderContext'
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
      <div className="flex items-center justify-center bg-gradient-to-br from-sky-400 via-blue-500 to-[#1e3a8a]"
           style={{ height: '100dvh' }}>
        <div className="flex flex-col items-center gap-5">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-2xl border border-white/30">
            <img src="/apple-touch-icon.png" alt="O2Room" className="w-14 h-14 rounded-2xl object-cover"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

const PAGE_META: Record<string, { title: string }> = {
  '/map':    { title: '地図' },
  '/list':   { title: '一覧' },
  '/create': { title: '新規登録' },
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isDetail = location.pathname.startsWith('/delivery/')
  const meta = PAGE_META[location.pathname]
  const { action } = useHeaderAction()

  return (
    <div className="flex flex-col overflow-hidden bg-[#f0f8ff]" style={{ height: '100dvh' }}>
      <OfflineBanner />
      <header
        className="flex-shrink-0 px-5 bg-white border-b border-sky-100"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 52px)', paddingBottom: '16px' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {isDetail ? (
              <button onClick={() => window.history.back()}
                className="flex items-center gap-1.5 text-[#1e3a8a] font-semibold text-sm active:opacity-60 transition-opacity">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                戻る
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[10px] overflow-hidden shadow-sm flex-shrink-0">
                  <img src="/apple-touch-icon.png" alt="O2Room" className="w-full h-full object-cover"
                    onError={e => {
                      const t = e.target as HTMLImageElement
                      t.style.display = 'none'
                      t.parentElement!.style.background = 'linear-gradient(135deg,#38bdf8,#2563eb)'
                    }} />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-sky-400 leading-none mb-0.5">O2Room</p>
                  <h1 className="text-[17px] font-bold text-[#1e3a8a] leading-none tracking-tight">
                    {meta?.title ?? 'CRM'}
                  </h1>
                </div>
              </div>
            )}
          </div>
          {/* ページから挿し込まれるヘッダー右側アクション */}
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </header>
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
      {!isDetail && <BottomNav />}
    </div>
  )
}

export function App() {
  return (
    <HeaderProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/"              element={<Navigate to="/list" replace />} />
                <Route path="/map"           element={<MapPage />} />
                <Route path="/list"          element={<ListPage />} />
                <Route path="/delivery/:id" element={<DetailPage />} />
                <Route path="/create"        element={<CreatePage />} />
                <Route path="*"              element={<Navigate to="/list" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </HeaderProvider>
  )
}
