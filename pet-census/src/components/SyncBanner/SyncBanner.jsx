import { useEffect, useState } from 'react'
import useSyncStore from '../../store/syncStore'
import useSync      from '../../hooks/useSync'

export default function SyncBanner() {
  const [is_online, setIsOnline]     = useState(navigator.onLine)
  const { pending_count, is_syncing } = useSyncStore()
  const { syncAll }                   = useSync()

  useEffect(() => {
    const handle_online  = () => setIsOnline(true)
    const handle_offline = () => setIsOnline(false)

    window.addEventListener('online',  handle_online)
    window.addEventListener('offline', handle_offline)

    return () => {
      window.removeEventListener('online',  handle_online)
      window.removeEventListener('offline', handle_offline)
    }
  }, [])

  // Offline banner
  if (!is_online) {
    return (
      <div className="bg-amber-400 text-amber-900 text-sm font-medium
                      text-center py-2 px-4 flex items-center justify-center gap-2">
        <span>⚠️ You are offline</span>
        {pending_count > 0 && (
          <span className="bg-amber-600 text-white text-xs px-2 py-0.5 rounded-full">
            {pending_count} pending
          </span>
        )}
        <span>— data will sync automatically when connection is restored</span>
      </div>
    )
  }

  // Syncing banner
  if (is_syncing) {
    return (
      <div className="bg-blue-50 text-blue-700 text-sm font-medium
                      text-center py-2 px-4 flex items-center justify-center gap-2">
        <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent
                        rounded-full animate-spin" />
        Syncing {pending_count} pending record{pending_count !== 1 ? 's' : ''}...
      </div>
    )
  }

  // Pending but online — show manual sync option
  if (pending_count > 0) {
    return (
      <div className="bg-green-50 text-green-700 text-sm font-medium
                      text-center py-2 px-4 flex items-center justify-center gap-3">
        <span>✅ Back online</span>
        <button
          onClick={syncAll}
          className="underline font-semibold hover:text-green-900 transition-colors"
        >
          Sync {pending_count} pending record{pending_count !== 1 ? 's' : ''} now
        </button>
      </div>
    )
  }

  return null
}