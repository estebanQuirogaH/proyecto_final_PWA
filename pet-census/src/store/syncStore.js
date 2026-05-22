import { create } from 'zustand'
import { getPendingCount } from '../db/localDB'

const useSyncStore = create((set, get) => ({
  pending_count: 0,
  is_syncing:    false,
  last_synced:   null,

  refreshPendingCount: async () => {
    const count = await getPendingCount()
    set({ pending_count: count })
  },

  setSyncing: (val) => set({ is_syncing: val }),

  setLastSynced: () => set({ last_synced: new Date().toISOString() })
}))

export default useSyncStore