import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('メールアドレスとパスワードを入力してください'); return }
    setIsLoading(true)
    setError(null)
    const err = await signIn(email, password)
    if (err) {
      setError('ログインに失敗しました')
      setIsLoading(false)
    } else {
      navigate('/list', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">

      {/* ── Sky blue gradient background ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-300 via-blue-400 to-[#1e3a8a]" />
      <div className="absolute inset-0 opacity-30"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 20% 80%, #bae6fd55 0%, transparent 60%)' }} />
      <div className="absolute inset-0 opacity-20"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 80% 10%, #e0f2fe55 0%, transparent 60%)' }} />

      <div className="relative w-full max-w-sm px-6 py-10">

        {/* ── Logo ── */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-3xl bg-white/30 blur-xl scale-150" />
            <div className="relative w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/40 shadow-2xl">
              <span className="text-4xl">📦</span>
            </div>
          </div>
          <h1 className="text-[28px] font-bold text-white tracking-tight drop-shadow-sm">納品管理CRM</h1>
          <p className="text-white/60 text-sm mt-1 tracking-widest uppercase font-medium">Map Edition</p>
        </div>

        {/* ── Card ── */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-blue-900/20 overflow-hidden">
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 tracking-wide uppercase">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  autoComplete="email"
                  className="
                    w-full px-4 py-3.5 rounded-2xl
                    bg-sky-50 border border-sky-100
                    text-base text-gray-800 placeholder-gray-300
                    focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400
                    transition-all
                  "
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2 tracking-wide uppercase">
                  パスワード
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="
                      w-full px-4 py-3.5 pr-12 rounded-2xl
                      bg-sky-50 border border-sky-100
                      text-base text-gray-800 placeholder-gray-300
                      focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400
                      transition-all
                    "
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPw ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="
                  w-full py-4 rounded-2xl font-bold text-white text-[15px]
                  bg-[#1e3a8a]
                  shadow-lg shadow-blue-900/30
                  active:scale-[0.98] transition-all duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed
                  mt-2
                "
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ログイン中...
                  </span>
                ) : 'ログイン'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          © 2025 納品管理CRM
        </p>
      </div>
    </div>
  )
}
