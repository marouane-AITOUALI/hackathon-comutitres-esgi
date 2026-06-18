import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import {
  AccessibilityContext,
  type AccessibilityContextValue,
  type AccessibilitySettings,
  type Language,
  type TextSize,
} from './accessibility-context'

const STORAGE_KEY = 'comutitres_accessibility'

const defaultSettings: AccessibilitySettings = {
  language: 'fr',
  textSize: 'default',
  highContrast: false,
  reducedMotion: false,
  underlineLinks: false,
}

function loadSettings(): AccessibilitySettings {
  if (typeof window === 'undefined') return defaultSettings

  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<AccessibilitySettings>
    return { ...defaultSettings, ...saved }
  } catch {
    return defaultSettings
  }
}

export function AccessibilityProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<AccessibilitySettings>(loadSettings)
  const setLanguage = useCallback((language: Language) => setSettings((current) => ({ ...current, language })), [])
  const setTextSize = useCallback((textSize: TextSize) => setSettings((current) => (
    current.textSize === textSize ? current : { ...current, textSize }
  )), [])
  const setHighContrast = useCallback((highContrast: boolean) => setSettings((current) => (
    current.highContrast === highContrast ? current : { ...current, highContrast }
  )), [])
  const setReducedMotion = useCallback((reducedMotion: boolean) => setSettings((current) => (
    current.reducedMotion === reducedMotion ? current : { ...current, reducedMotion }
  )), [])
  const setUnderlineLinks = useCallback((underlineLinks: boolean) => setSettings((current) => (
    current.underlineLinks === underlineLinks ? current : { ...current, underlineLinks }
  )), [])
  const resetAccessibility = useCallback(() => setSettings((current) => ({ ...defaultSettings, language: current.language })), [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))

    const root = document.documentElement
    root.lang = settings.language
    root.dataset.textSize = settings.textSize
    root.dataset.highContrast = String(settings.highContrast)
    root.dataset.reducedMotion = String(settings.reducedMotion)
    root.dataset.underlineLinks = String(settings.underlineLinks)
  }, [settings])

  const value = useMemo<AccessibilityContextValue>(() => ({
    ...settings,
    setLanguage,
    setTextSize,
    setHighContrast,
    setReducedMotion,
    setUnderlineLinks,
    resetAccessibility,
  }), [resetAccessibility, setHighContrast, setLanguage, setReducedMotion, setTextSize, setUnderlineLinks, settings])

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}
