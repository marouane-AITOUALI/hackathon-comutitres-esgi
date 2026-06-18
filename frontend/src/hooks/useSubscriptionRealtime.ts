import { useEffect, useRef } from 'react'
import type { SubscriptionStatus } from '../types'

export const subscriptionUpdatedEvent = 'comutitres:subscription-status-updated'

export interface SubscriptionUpdatedDetail {
  subscriptionId: string
  previousStatus?: SubscriptionStatus
  status?: SubscriptionStatus
}

export function useSubscriptionRealtime(callback: (detail: SubscriptionUpdatedDetail) => void) {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    const listener = (event: Event) => {
      callbackRef.current((event as CustomEvent<SubscriptionUpdatedDetail>).detail)
    }
    window.addEventListener(subscriptionUpdatedEvent, listener)
    return () => window.removeEventListener(subscriptionUpdatedEvent, listener)
  }, [])
}
