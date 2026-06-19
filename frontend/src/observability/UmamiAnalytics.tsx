import { useEffect } from 'react'

const SCRIPT_ID = 'comutitres-umami'

export function UmamiAnalytics() {
  useEffect(() => {
    const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim()
    const scriptUrl = import.meta.env.VITE_UMAMI_SCRIPT_URL?.trim()

    if (!websiteId || !scriptUrl || document.getElementById(SCRIPT_ID)) return

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.async = true
    script.defer = true
    script.src = scriptUrl
    script.dataset.websiteId = websiteId
    document.head.appendChild(script)

    return () => {
      script.remove()
    }
  }, [])

  return null
}
