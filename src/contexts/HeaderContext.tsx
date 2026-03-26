import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'

type HeaderAction = ReactNode | null

interface HeaderContextType {
  action: HeaderAction
  setAction: (node: HeaderAction) => void
  clearAction: () => void
}

const HeaderContext = createContext<HeaderContextType>({
  action: null,
  setAction: () => {},
  clearAction: () => {},
})

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [action, setActionState] = useState<HeaderAction>(null)

  const setAction = useCallback((node: HeaderAction) => {
    setActionState(node)
  }, [])

  const clearAction = useCallback(() => {
    setActionState(null)
  }, [])

  return (
    <HeaderContext.Provider value={{ action, setAction, clearAction }}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeaderAction() {
  return useContext(HeaderContext)
}

/** ページコンポーネント内で呼ぶと、アンマウント時に自動クリア */
export function useRegisterHeaderAction(node: HeaderAction) {
  const { setAction, clearAction } = useHeaderAction()
  useEffect(() => {
    setAction(node)
    return () => clearAction()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node])
}
