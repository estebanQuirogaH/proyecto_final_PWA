import Dexie from 'dexie'

const db = new Dexie('PetCensusDB')

db.version(1).stores({
  persons:  '++id, &localId, synced',
  pets:     '++id, &localId, synced',
  censuses: '++id, &localId, synced'
})

// Save a person locally
export const savePersonLocally = async (person_data) => {
  return await db.persons.add({
    ...person_data,
    localId:    person_data.id,
    synced:     false,
    created_at: new Date().toISOString()
  })
}

// Save a pet locally
export const savePetLocally = async (pet_data) => {
  return await db.pets.add({
    ...pet_data,
    localId:    pet_data.id,
    synced:     false,
    created_at: new Date().toISOString()
  })
}

// Save a census locally
export const saveCensusLocally = async (census_data) => {
  return await db.censuses.add({
    ...census_data,
    localId:    census_data.id,
    synced:     false,
    created_at: new Date().toISOString()
  })
}

// Get all unsynced records
export const getUnsyncedPersons   = async () => await db.persons.where('synced').equals(0).toArray()
export const getUnsyncedPets      = async () => await db.pets.where('synced').equals(0).toArray()
export const getUnsyncedCensuses  = async () => await db.censuses.where('synced').equals(0).toArray()

// Mark a record as synced
export const markPersonSynced  = async (localId) => await db.persons.where('localId').equals(localId).modify({ synced: true })
export const markPetSynced     = async (localId) => await db.pets.where('localId').equals(localId).modify({ synced: true })
export const markCensusSynced  = async (localId) => await db.censuses.where('localId').equals(localId).modify({ synced: true })

// Count pending
export const getPendingCount = async () => {
  const [p, pt, c] = await Promise.all([
    db.persons.where('synced').equals(0).count(),
    db.pets.where('synced').equals(0).count(),
    db.censuses.where('synced').equals(0).count()
  ])
  return p + pt + c
}

export default db