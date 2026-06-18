import { createContext } from 'react'

export type Language = 'fr' | 'en'
export type TextSize = 'default' | 'large'

export interface AccessibilitySettings {
  language: Language
  textSize: TextSize
  highContrast: boolean
  reducedMotion: boolean
  underlineLinks: boolean
}

export interface AccessibilityContextValue extends AccessibilitySettings {
  setLanguage: (language: Language) => void
  setTextSize: (textSize: TextSize) => void
  setHighContrast: (enabled: boolean) => void
  setReducedMotion: (enabled: boolean) => void
  setUnderlineLinks: (enabled: boolean) => void
  resetAccessibility: () => void
}

export const AccessibilityContext = createContext<AccessibilityContextValue | null>(null)
