import { useEffect, useCallback } from 'react'
import { createPerson }    from '../api/personas_api'
import { createPet }       from '../api/mascotas_api'
import { createCensus }    from '../api/censos_api'
import {
  getUnsyncedPersons,  markPersonSynced,
  getUnsyncedPets,     markPetSynced,
  getUnsyncedCensuses, markCensusSynced
} from '../db/localDB'
import useSyncStore from '../store/syncStore'

const useSync = () => {
  const { setSyncing, setLastSynced, refreshPendingCount } = useSyncStore()

  const syncAll = useCallback(async () => {
    if (!navigator.onLine) return

    setSyncing(true)

    try {
      // Sync persons
      const unsynced_persons = await getUnsyncedPersons()
      for (const person of unsynced_persons) {
        try {
          await createPerson(person)
          await markPersonSynced(person.localId)
        } catch (err) {
          console.warn('Failed to sync person:', person.localId, err)
        }
      }

      // Sync pets
      const unsynced_pets = await getUnsyncedPets()
      for (const pet of unsynced_pets) {
        try {
          await createPet(pet)
          await markPetSynced(pet.localId)
        } catch (err) {
          console.warn('Failed to sync pet:', pet.localId, err)
        }
      }

      // Sync censuses
      const unsynced_censuses = await getUnsyncedCensuses()
      for (const census of unsynced_censuses) {
        try {
          await createCensus(census)
          await markCensusSynced(census.localId)
        } catch (err) {
          console.warn('Failed to sync census:', census.localId, err)
        }
      }

      setLastSynced()
      await refreshPendingCount()
    } finally {
      setSyncing(false)
    }
  }, [setSyncing, setLastSynced, refreshPendingCount])

  // Auto-sync when connection is restored
  useEffect(() => {
    const handleOnline = () => {
      console.log('Back online — starting sync...')
      syncAll()
    }

    window.addEventListener('online', handleOnline)
    refreshPendingCount()

    return () => window.removeEventListener('online', handleOnline)
  }, [syncAll, refreshPendingCount])

  return { syncAll }
}

export default useSync