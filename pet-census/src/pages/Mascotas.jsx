import { useState, useEffect } from 'react'
import {
  createPet, getAllPets,
  updatePet, deletePet,
  pet_types, pet_genders
} from '../api/mascotas_api'
import FormField    from '../components/FormField'
import InputField   from '../components/InputField'
import SelectField  from '../components/SelectField'
import PhotoCapture from '../components/PhotoCapture'

const empty_form = {
  nombre:     '',
  tipo:       'DOG',
  genero:     'MALE',
  edad:       '',
  fotografia: null
}

const type_options   = pet_types.map(t => ({ value: t, label: t }))
const gender_options = pet_genders.map(g => ({ value: g, label: g }))

const type_emoji = {
  DOG: '🐶', CAT: '🐱', BIRD: '🐦', RABBIT: '🐰', OTHER: '🐾'
}

export default function Mascotas() {
  const [form_data, setFormData]           = useState(empty_form)
  const [pets, setPets]                    = useState([])
  const [is_loading, setIsLoading]         = useState(false)
  const [success_msg, setSuccessMsg]       = useState('')
  const [error_msg, setErrorMsg]           = useState('')
  const [show_form, setShowForm]           = useState(false)
  const [editing_id, setEditingId]         = useState(null)
  const [filter, setFilter]               = useState('ALL')
  const [delete_confirm, setDeleteConfirm] = useState(null)

  useEffect(() => { loadPets() }, [])

  const loadPets = async () => {
    try {
      const data = await getAllPets()
      setPets(data)
    } catch (err) {
      console.error('Error loading pets:', err)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrorMsg('')
  }

  const handlePhotoChange = (val) => {
    setFormData(prev => ({ ...prev, fotografia: val }))
  }

  const handleEdit = (pet) => {
    setFormData({
      nombre:     pet.nombre,
      tipo:       pet.tipo,
      genero:     pet.genero,
      edad:       pet.edad,
      fotografia: pet.fotografia
    })
    setEditingId(pet.id)
    setShowForm(true)
    setSuccessMsg('')
    setErrorMsg('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelForm = () => {
    setFormData(empty_form)
    setEditingId(null)
    setShowForm(false)
    setErrorMsg('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      if (editing_id) {
        await updatePet(editing_id, form_data)
        setSuccessMsg(`${form_data.nombre} updated successfully`)
      } else {
        await createPet(form_data)
        setSuccessMsg(`${form_data.nombre} registered successfully`)
      }
      setFormData(empty_form)
      setEditingId(null)
      setShowForm(false)
      await loadPets()
    } catch (err) {
      setErrorMsg('Error saving pet. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deletePet(id)
      setDeleteConfirm(null)
      await loadPets()
    } catch (err) {
      console.error('Error deleting pet:', err)
    }
  }

  const filtered_pets = filter === 'ALL'
    ? pets
    : pets.filter(p => p.tipo === filter)

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Pets</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Register and manage animals for the census
          </p>
        </div>
        {!show_form && (
          <button
            onClick={() => {
              setShowForm(true)
              setEditingId(null)
              setFormData(empty_form)
            }}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm
                       font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New pet
          </button>
        )}
      </div>

      {success_msg && (
        <div className="bg-green-50 border border-green-200 text-green-700
                        text-sm rounded-lg px-4 py-3">
          ✅ {success_msg}
        </div>
      )}

      {/* Form */}
      {show_form && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-5">
            {editing_id ? '✏️ Edit pet' : 'New pet'}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Pet name">
                <InputField
                  name="nombre"
                  value={form_data.nombre}
                  onChange={handleChange}
                  placeholder="Firulais"
                  required
                />
              </FormField>

              <SelectField
                label="Species"
                name="tipo"
                value={form_data.tipo}
                onChange={handleChange}
                options={type_options}
              />

              <SelectField
                label="Gender"
                name="genero"
                value={form_data.genero}
                onChange={handleChange}
                options={gender_options}
              />

              <FormField label="Age (years)">
                <InputField
                  type="number"
                  name="edad"
                  value={form_data.edad}
                  onChange={handleChange}
                  placeholder="3"
                  min="0"
                  max="30"
                  step="0.5"
                  required
                />
              </FormField>
            </div>

            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Pet photo
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </p>
              <PhotoCapture onPhotoChange={handlePhotoChange} />
            </div>

            {error_msg && (
              <p className="text-red-500 text-sm">{error_msg}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelForm}
                className="border border-gray-300 hover:border-gray-400 text-gray-600
                           text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={is_loading}
                className="bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300
                           text-white font-medium px-6 py-2.5 rounded-lg text-sm
                           transition-colors"
              >
                {is_loading ? 'Saving...' : editing_id ? 'Update pet' : 'Save pet'}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Filter tabs */}
      {pets.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {['ALL', ...pet_types].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filter === type
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'
                }`}
            >
              {type}
              {type !== 'ALL' && (
                <span className="ml-1 opacity-70">
                  ({pets.filter(p => p.tipo === type).length})
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Pets list */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-800">
            Registered pets
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({filtered_pets.length})
            </span>
          </h2>
        </div>

        {filtered_pets.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            {pets.length === 0
              ? 'No pets registered yet. Click "+ New pet" to start.'
              : `No pets of type ${filter}.`
            }
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered_pets.map(pet => (
              <div key={pet.id} className="px-6 py-4 flex items-center gap-4">

                <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center
                                justify-center text-2xl flex-shrink-0 overflow-hidden">
                  {pet.fotografia ? (
                    <img
                      src={pet.fotografia}
                      alt={pet.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    type_emoji[pet.tipo] || '🐾'
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{pet.nombre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {pet.tipo} · {pet.genero} · {pet.edad}{' '}
                    {pet.edad === 1 ? 'year' : 'years'}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(pet)}
                    className="text-xs text-violet-600 hover:text-violet-800
                               bg-violet-50 hover:bg-violet-100 px-3 py-1.5
                               rounded-lg transition-colors font-medium"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(pet.id)}
                    className="text-xs text-red-500 hover:text-red-700
                               bg-red-50 hover:bg-red-100 px-3 py-1.5
                               rounded-lg transition-colors font-medium"
                  >
                    🗑️ Delete
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {delete_confirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center
                        justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete pet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="border border-gray-300 text-gray-600 text-sm font-medium
                           px-4 py-2 rounded-lg hover:border-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(delete_confirm)}
                className="bg-red-500 hover:bg-red-600 text-white text-sm
                           font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}