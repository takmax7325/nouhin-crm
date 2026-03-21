import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { authService } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    authService.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((_event, sess) => {
      setSession(sess)
      setUser(sess?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await authService.signIn(email, password)
    if (error) return error.message
    return null
  }

  const signOut = async () => {
    await authService.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isLoading,
      isAuthenticated: !!user,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
