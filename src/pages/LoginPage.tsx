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
      setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。')
      setIsLoading(false)
    } else {
      navigate('/list', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500 via-teal-500 to-blue-600" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-sm px-6 py-8 animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-4 shadow-xl border border-white/30">
            <span className="text-4xl">📦</span>
          </div>
          <h1 className="text-3xl font-bold text-white">納品管理CRM</h1>
          <p className="text-white/70 text-sm mt-1">マップ</p>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/60">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                📧 メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@mail.com"
                autoComplete="email"
                className="
                  w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200
                  text-sm text-gray-800 placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                  transition-all
                "
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                🔒 パスワード
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="パスワード"
                  autoComplete="current-password"
                  className="
                    w-full px-4 py-3 pr-10 rounded-xl bg-gray-50 border border-gray-200
                    text-sm text-gray-800 placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
                    transition-all
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full py-3.5 rounded-xl font-bold text-white text-base
                bg-gradient-to-r from-brand-500 to-teal-500
                shadow-lg shadow-brand-300/50
                active:scale-[0.98] transition-all duration-150
                disabled:opacity-60 disabled:cursor-not-allowed
                mt-2
              "
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ログイン中...
                </span>
              ) : (
                'ログイン →'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
