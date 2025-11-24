import type { ReactNode } from "react"

type ThemeProviderProps = {
  children: ReactNode
}

// Simplified placeholder theme provider (no next-themes dependency)
export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>
}
