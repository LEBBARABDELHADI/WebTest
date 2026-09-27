import { createContext, useContext, useState, useEffect } from 'react'

const PALETTES = {
  sombre: {
    bg: '#141210',
    surface: '#1c1814',
    surface2: '#26201a',
    border: '#3a3125',
    text: '#f3ecdf',
    textMuted: '#a99a80',
    accent: '#f0a839',
    accentText: '#221806',
    accentSoft: 'rgba(240,168,57,0.14)',
    danger: '#e2574c',
    dangerSoft: 'rgba(226,87,76,0.12)',
  },
  clair: {
    bg: '#faf6ef',
    surface: '#ffffff',
    surface2: '#f4ecdf',
    border: '#e3d6c2',
    text: '#241f18',
    textMuted: '#7c7160',
    accent: '#c9740a',
    accentText: '#ffffff',
    accentSoft: 'rgba(201,116,10,0.12)',
    danger: '#c8362a',
    dangerSoft: 'rgba(200,54,42,0.10)',
  },
}

// Export statique conservé pour compatibilité (vaut le thème sombre par défaut).
export const T = PALETTES.sombre

export const grotesk = "'Space Grotesk', 'Segoe UI', sans-serif"
export const serif = "'Fraunces', Georgia, serif"

export const PALETTE = [T.accent, T.danger, '#4a9d94', '#5b8dc9', '#8b7ab8']

const MODE_KEY = 'react-blocs-mode'
const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem(MODE_KEY) || 'sombre' } catch { return 'sombre' }
  })

  useEffect(() => {
    try { localStorage.setItem(MODE_KEY, mode) } catch { /* ignore */ }
  }, [mode])

  const basculer = () => setMode(m => (m === 'sombre' ? 'clair' : 'sombre'))

  return (
    <ThemeContext.Provider value={{ T: PALETTES[mode], mode, basculer }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  return ctx ? ctx.T : PALETTES.sombre
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext)
  return ctx || { mode: 'sombre', basculer: () => {} }
}
