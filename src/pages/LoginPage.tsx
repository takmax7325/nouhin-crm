import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const PIN_LENGTH = 4
const PIN_KEY    = 'o2_pin_hash'
const CRED_KEY   = 'o2_credentials'

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function faceIDAvailable(): Promise<boolean> {
  try {
    return !!(window.PublicKeyCredential &&
      await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
  } catch { return false }
}

async function registerFaceID(userId: string): Promise<boolean> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'O2Room', id: window.location.hostname },
        user: { id: new TextEncoder().encode(userId), name: userId, displayName: 'O2Room User' },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
        timeout: 60000,
      },
    })
    localStorage.setItem('o2_faceid_registered', '1')
    return true
  } catch { return false }
}

async function verifyFaceID(): Promise<boolean> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: window.location.hostname,
        userVerification: 'required',
        timeout: 60000,
      },
    })
    return true
  } catch { return false }
}

export function LoginPage() {
  const { signIn, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const hasPIN    = !!localStorage.getItem(PIN_KEY)
  const hasFaceID = !!localStorage.getItem('o2_faceid_registered')

  const [mode, setMode]               = useState<'pin' | 'setup' | 'email'>(hasPIN ? 'pin' : 'email')
  const [pin, setPin]                 = useState('')
  const [setupPin, setSetupPin]       = useState('')
  const [setupConfirm, setSetupConfirm] = useState('')
  const [setupStep, setSetupStep]     = useState<1 | 2>(1)
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPw, setShowPw]           = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [isLoading, setIsLoading]     = useState(false)
  const [faceAvail, setFaceAvail]     = useState(false)
  const [shake, setShake]             = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/list', { replace: true })
    faceIDAvailable().then(setFaceAvail)
  }, [isAuthenticated, navigate])

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handlePinDigit = useCallback(async (digit: string) => {
    setError(null)
    if (mode === 'pin') {
      const next = pin + digit
      setPin(next)
      if (next.length === PIN_LENGTH) {
        const hash = await sha256(next)
        if (hash === localStorage.getItem(PIN_KEY)) {
          const raw = localStorage.getItem(CRED_KEY)
          if (raw) {
            setIsLoading(true)
            const { email: e, password: p } = JSON.parse(atob(raw))
            const err = await signIn(e, p)
            if (err) { setError('再ログインが必要です'); setMode('email') }
            setIsLoading(false)
          }
        } else {
          triggerShake()
          setTimeout(() => setPin(''), 500)
          setError('PINが違います')
        }
      }
    } else if (mode === 'setup') {
      if (setupStep === 1) {
        const next = setupPin + digit
        setSetupPin(next)
        if (next.length === PIN_LENGTH) setTimeout(() => setSetupStep(2), 200)
      } else {
        const next = setupConfirm + digit
        setSetupConfirm(next)
        if (next.length === PIN_LENGTH) {
          if (next === setupPin) {
            const hash = await sha256(next)
            localStorage.setItem(PIN_KEY, hash)
            if (faceAvail) await registerFaceID(email)
            navigate('/list', { replace: true })
          } else {
            triggerShake()
            setTimeout(() => { setSetupPin(''); setSetupConfirm(''); setSetupStep(1) }, 500)
            setError('PINが一致しません')
          }
        }
      }
    }
  }, [mode, pin, setupPin, setupConfirm, setupStep, signIn, navigate, email, faceAvail])

  const handleBackspace = () => {
    setError(null)
    if (mode === 'pin')       setPin(p => p.slice(0, -1))
    else if (setupStep === 1) setSetupPin(p => p.slice(0, -1))
    else                      setSetupConfirm(p => p.slice(0, -1))
  }

  const currentLen = mode === 'pin' ? pin.length
    : setupStep === 1 ? setupPin.length : setupConfirm.length

  const handleFaceID = async () => {
    const ok = await verifyFaceID()
    if (ok) {
      const raw = localStorage.getItem(CRED_KEY)
      if (raw) {
        setIsLoading(true)
        const { email: e, password: p } = JSON.parse(atob(raw))
        await signIn(e, p)
        setIsLoading(false)
      }
    } else {
      setError('Face ID認証に失敗しました')
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('入力してください'); return }
    setIsLoading(true); setError(null)
    const err = await signIn(email, password)
    if (err) {
      setError('メールアドレスまたはパスワードが違います')
      setIsLoading(false)
    } else {
      localStorage.setItem(CRED_KEY, btoa(JSON.stringify({ email, password })))
      setMode('setup')
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#e8f4fd] relative overflow-y-auto overflow-x-hidden"
         style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-blue-50 to-white" />
      <div className="absolute top-[-80px] right-[-80px] w-72 h-72 bg-sky-300/25 rounded-full blur-3xl" />
      <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 bg-blue-400/15 rounded-full blur-3xl" />

      {/* ── ロゴエリア（上半分中央） ── */}
      <div className="relative flex-1 flex flex-col items-center justify-center pb-4">
        <div className="w-24 h-24 rounded-[28px] overflow-hidden shadow-2xl mb-5 border-2 border-white/80 ring-4 ring-sky-100">
          <img src="/apple-touch-icon.png" alt="O2Room"
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display='none' }}
          />
        </div>
        <h1 className="text-[34px] font-bold text-[#1e3a8a] tracking-tight">O2Room</h1>
        <p className="text-sky-400 text-[13px] mt-1 font-medium tracking-wide">
          {mode === 'email' ? 'サインイン' :
           mode === 'setup' ? 'PINコードを設定' : 'PINコードを入力'}
        </p>
      </div>

      {/* ── ボタン・フォームエリア（下部固定） ── */}
      <div className="relative w-full max-w-sm px-8 flex flex-col items-center self-center">

        {mode === 'email' && (
          <div className="w-full space-y-3">
            {error && <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-500 text-center">{error}</div>}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="メールアドレス" autoComplete="email"
              className="w-full px-4 py-4 rounded-2xl bg-white border border-sky-100 text-base text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-300 shadow-sm transition-all" />
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="パスワード" autoComplete="current-password"
                className="w-full px-4 py-4 pr-12 rounded-2xl bg-white border border-sky-100 text-base text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-300 shadow-sm transition-all" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>}
              </button>
            </div>
            <button onClick={handleEmailLogin as any} disabled={isLoading}
              className="w-full py-4 mt-1 rounded-2xl font-bold text-white text-base bg-[#1e3a8a] shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-50">
              {isLoading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>ログイン中...</span> : 'サインイン'}
            </button>
            {hasPIN && <button onClick={() => { setMode('pin'); setError(null) }}
              className="w-full py-3 text-sm text-sky-500 font-semibold text-center">PINでサインイン</button>}
          </div>
        )}

        {(mode === 'pin' || mode === 'setup') && (
          <div className="w-full flex flex-col items-center">
            {mode === 'setup' && (
              <div className="flex gap-2 mb-4">
                {[1, 2].map(s => (
                  <div key={s} className={`h-1 w-16 rounded-full transition-all ${setupStep >= s ? 'bg-[#1e3a8a]' : 'bg-sky-200'}`} />
                ))}
              </div>
            )}
            {mode === 'setup' && (
              <p className="text-xs text-sky-400 mb-4 font-medium">
                {setupStep === 1 ? '新しい4桁のPINを入力' : '同じPINをもう一度入力'}
              </p>
            )}

            <div className={`flex gap-5 mb-8 ${shake ? 'animate-bounce' : ''}`}>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <div key={i} className={`w-[18px] h-[18px] rounded-full border-2 transition-all duration-150
                  ${i < currentLen ? 'bg-[#1e3a8a] border-[#1e3a8a] scale-110' : 'border-[#1e3a8a]/30 bg-transparent'}`} />
              ))}
            </div>

            {error && <p className="text-red-400 text-sm mb-4 font-medium">{error}</p>}

            <div className="grid grid-cols-3 gap-3 w-full max-w-[288px]">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} onClick={() => handlePinDigit(String(n))}
                  disabled={currentLen >= PIN_LENGTH}
                  className="h-[72px] rounded-2xl bg-white shadow-sm border border-sky-100/80 text-[26px] font-semibold text-[#1e3a8a] active:bg-sky-100 active:scale-95 transition-all disabled:opacity-40 select-none">
                  {n}
                </button>
              ))}
              <button onClick={mode === 'pin' && (hasFaceID || faceAvail) ? handleFaceID : undefined}
                className={`h-[72px] rounded-2xl flex items-center justify-center transition-all select-none
                  ${mode === 'pin' && (hasFaceID || faceAvail) ? 'bg-white shadow-sm border border-sky-100/80 active:bg-sky-100 active:scale-95' : 'opacity-0 pointer-events-none'}`}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                  <path d="M9 3H5a2 2 0 00-2 2v4m0 6v4a2 2 0 002 2h4m6-18h4a2 2 0 012 2v4m0 6v4a2 2 0 01-2 2h-4" stroke="#1e3a8a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3" stroke="#1e3a8a" strokeWidth="1.8" strokeLinecap="round"/>
                  <path d="M12 7v1m0 8v1m-5-5h1m8 0h1" stroke="#1e3a8a" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>
              <button onClick={() => handlePinDigit('0')} disabled={currentLen >= PIN_LENGTH}
                className="h-[72px] rounded-2xl bg-white shadow-sm border border-sky-100/80 text-[26px] font-semibold text-[#1e3a8a] active:bg-sky-100 active:scale-95 transition-all disabled:opacity-40 select-none">
                0
              </button>
              <button onClick={handleBackspace} disabled={currentLen === 0}
                className="h-[72px] rounded-2xl bg-white shadow-sm border border-sky-100/80 flex items-center justify-center active:bg-sky-100 active:scale-95 transition-all disabled:opacity-30 select-none">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M20 12H9m0 0l4.5-4.5M9 12l4.5 4.5" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <button onClick={() => { setMode('email'); setPin(''); setError(null) }}
              className="mt-6 text-sm text-sky-400 font-medium">
              {mode === 'pin' ? 'メールアドレスでサインイン' : 'キャンセル'}
            </button>
          </div>
        )}

        {isLoading && (
          <div className="mt-6 w-6 h-6 border-2 border-[#1e3a8a]/30 border-t-[#1e3a8a] rounded-full animate-spin" />
        )}

      </div>
    </div>
  )
}
