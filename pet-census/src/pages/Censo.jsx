import { useState, useEffect } from 'react'
import { getAllPersons } from '../api/personas_api'
import { getAllPets }    from '../api/mascotas_api'
import { createCensus } from '../api/censos_api'
import useGeolocation        from '../hooks/useGeolocation'
import PhotoCapture          from '../components/PhotoCapture'
import FormField             from '../components/FormField'
import SelectField           from '../components/SelectField'
import { saveCensusLocally } from '../db/localDB'
import useSyncStore          from '../store/syncStore'

const initial_form = {
  petId:   '',
  ownerId: '',
  photo:   null,
  lat:     null,
  lon:     null
}

export default function Censo() {
  const [form_data, setFormData]     = useState(initial_form)
  const [persons, setPersons]        = useState([])
  const [pets, setPets]              = useState([])
  const [is_loading, setIsLoading]   = useState(false)
  const [success_msg, setSuccessMsg] = useState('')
  const [error_msg, setErrorMsg]     = useState('')

  const { location, geo_error, geo_loading, getLocation } = useGeolocation()

  useEffect(() => { loadSelectData() }, [])

  useEffect(() => {
    if (location.lat) {
      setFormData(prev => ({ ...prev, lat: location.lat, lon: location.lon }))
    }
  }, [location])

  const loadSelectData = async () => {
    try {
      const [persons_data, pets_data] = await Promise.all([
        getAllPersons(),
        getAllPets()
      ])
      setPersons(persons_data)
      setPets(pets_data)
    } catch (err) {
      console.error('Error loading form data:', err)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrorMsg('')
  }

  const handlePhotoChange = (base64) => {
    setFormData(prev => ({ ...prev, photo: base64 }))
    setErrorMsg('')
  }

  const validateForm = () => {
    if (!form_data.petId)   return 'Please select a pet.'
    if (!form_data.ownerId) return 'Please select an owner.'
    if (!form_data.lat)     return 'Please capture your GPS location.'
    if (!form_data.photo)   return 'Please attach a photo.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validation_error = validateForm()
    if (validation_error) { setErrorMsg(validation_error); return }

    setIsLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const selected_pet   = pets.find(p => p.id === form_data.petId)
      const selected_owner = persons.find(p => p.id === form_data.ownerId)

      // Swap createCensusMock → createCensus when API is ready
      await createCensus({
        ...form_data,
        petSnapshot:   selected_pet,
        ownerSnapshot: selected_owner
      })

      setSuccessMsg('Census saved successfully! 🎉')
      setFormData(initial_form)
    } catch (err) {
      setErrorMsg('Error saving census. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const person_options = persons.map(p => ({
    value: p.id,
    label: `${p.nombres} ${p.apellidos} — ${p.documento}`
  }))

  const pet_options = pets.map(p => ({
    value: p.id,
    label: `${p.nombre} (${p.tipo})`
  }))

  const steps_done = [
    !!form_data.petId && !!form_data.ownerId,
    !!form_data.lat,
    !!form_data.photo
  ]

  return (
    <div className="flex flex-col gap-6">

      <div>
        <h1 className="text-2xl font-semibold text-gray-800">New Census</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Register a pet at its current location
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex gap-2">
        {['Pet & owner', 'Location', 'Photo'].map((step, i) => (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center
                            text-xs font-bold flex-shrink-0 transition-colors
                            ${steps_done[i]
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-500'
                            }`}>
              {steps_done[i] ? '✓' : i + 1}
            </div>
            <span className="text-xs text-gray-500 hidden sm:block">{step}</span>
            {i < 2 && <div className="flex-1 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {success_msg && (
        <div className="bg-green-50 border border-green-200 text-green-700
                        text-sm rounded-lg px-4 py-3">
          {success_msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* Step 1: Pet + Owner */}
        <div className={`bg-white rounded-xl shadow p-6 border-l-4 transition-colors
                        ${steps_done[0] ? 'border-green-400' : 'border-gray-200'}`}>
          <h2 className="text-base font-medium text-gray-800 mb-4">
            1. Select pet and owner
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pet_options.length === 0 ? (
              <div className="md:col-span-2 bg-amber-50 border border-amber-200
                              text-amber-700 text-sm rounded-lg px-4 py-3">
                ⚠️ No pets registered.{' '}
                <a href="/pets" className="underline font-medium">Register a pet first</a>
              </div>
            ) : (
              <SelectField
                label="Pet"
                name="petId"
                value={form_data.petId}
                onChange={handleChange}
                options={[{ value: '', label: 'Select a pet...' }, ...pet_options]}
              />
            )}
            {person_options.length === 0 ? (
              <div className="md:col-span-2 bg-amber-50 border border-amber-200
                              text-amber-700 text-sm rounded-lg px-4 py-3">
                ⚠️ No people registered.{' '}
                <a href="/people" className="underline font-medium">Register a person first</a>
              </div>
            ) : (
              <SelectField
                label="Owner"
                name="ownerId"
                value={form_data.ownerId}
                onChange={handleChange}
                options={[{ value: '', label: 'Select an owner...' }, ...person_options]}
              />
            )}
          </div>
        </div>

        {/* Step 2: GPS */}
        <div className={`bg-white rounded-xl shadow p-6 border-l-4 transition-colors
                        ${steps_done[1] ? 'border-green-400' : 'border-gray-200'}`}>
          <h2 className="text-base font-medium text-gray-800 mb-4">
            2. Capture location
          </h2>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={getLocation}
              disabled={geo_loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700
                         disabled:bg-blue-300 text-white text-sm font-medium
                         px-4 py-2.5 rounded-lg transition-colors w-fit"
            >
              {geo_loading ? '⏳ Getting location...' : '📍 Capture GPS location'}
            </button>
            {geo_error && <p className="text-red-500 text-sm">{geo_error}</p>}
            {form_data.lat && (
              <div className="bg-green-50 border border-green-200 rounded-lg
                              px-4 py-3 text-sm text-green-700">
                ✅ Location captured —{' '}
                <span className="font-mono text-xs">
                  {form_data.lat.toFixed(6)}, {form_data.lon.toFixed(6)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Photo */}
        <div className={`bg-white rounded-xl shadow p-6 border-l-4 transition-colors
                        ${steps_done[2] ? 'border-green-400' : 'border-gray-200'}`}>
          <h2 className="text-base font-medium text-gray-800 mb-4">
            3. Attach photo
          </h2>
          <PhotoCapture onPhotoChange={handlePhotoChange} />
        </div>

        {error_msg && (
          <p className="text-red-500 text-sm font-medium">{error_msg}</p>
        )}

        <button
          type="submit"
          disabled={is_loading || steps_done.includes(false)}
          className="bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300
                     text-white font-medium py-3 rounded-xl text-sm
                     transition-colors"
        >
          {is_loading ? 'Saving census...' : 'Save census ✓'}
        </button>

      </form>
    </div>
  )
}

const handleSubmit = async (e) => {
  e.preventDefault()

  const validation_error = validateForm()
  if (validation_error) { setErrorMsg(validation_error); return }

  setIsLoading(true)
  setErrorMsg('')
  setSuccessMsg('')

  try {
    const selected_pet   = pets.find(p => p.id === form_data.petId)
    const selected_owner = persons.find(p => p.id === form_data.ownerId)

    const census_payload = {
      ...form_data,
      petSnapshot:   selected_pet,
      ownerSnapshot: selected_owner
    }

    if (navigator.onLine) {
      // Swap createCensusMock → createCensus when API is ready
      await createCensus(census_payload)
      setSuccessMsg('Census saved successfully! 🎉')
    } else {
      // Save locally when offline
      await saveCensusLocally({
        id:       crypto.randomUUID(),
        ...census_payload
      })
      await useSyncStore.getState().refreshPendingCount()
      setSuccessMsg('Saved locally — will sync when back online 📶')
    }

    setFormData(initial_form)
  } catch (err) {
    setErrorMsg('Error saving census. Please try again.')
  } finally {
    setIsLoading(false)
  }
}