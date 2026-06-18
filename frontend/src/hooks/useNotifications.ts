import { useContext } from 'react'
import { NotificationsContext } from './notifications-context'

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error('useNotifications doit être utilisé dans NotificationsProvider.')
  return context
}
