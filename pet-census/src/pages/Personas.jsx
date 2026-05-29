import { useState, useEffect } from 'react'
import {
  createPerson, getAllPersons,
  updatePerson, deletePerson
} from '../api/personas_api'
import FormField  from '../components/FormField'
import InputField from '../components/InputField'

const document_types = ['CC', 'CE', 'Passport', 'TI']

const empty_form = {
  nombres:       '',
  apellidos:     '',
  tipoDocumento: 'CC',
  documento:     '',
  direccion:     '',
  telefono:      '',
  ciudad:        '',
  usuario:       '',
  contrasena:    ''
}

export default function Personas() {
  const [form_data, setFormData]       = useState(empty_form)
  const [persons, setPersons]          = useState([])
  const [is_loading, setIsLoading]     = useState(false)
  const [success_msg, setSuccessMsg]   = useState('')
  const [error_msg, setErrorMsg]       = useState('')
  const [show_form, setShowForm]       = useState(false)
  const [editing_id, setEditingId]     = useState(null)
  const [delete_confirm, setDeleteConfirm] = useState(null)

  useEffect(() => { loadPersons() }, [])

  const loadPersons = async () => {
    try {
      const data = await getAllPersons()
      setPersons(data)
    } catch (err) {
      console.error('Error loading persons:', err)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrorMsg('')
  }

  const handleEdit = (person) => {
    setFormData({
      nombres:       person.nombres,
      apellidos:     person.apellidos,
      tipoDocumento: person.tipoDocumento,
      documento:     person.documento,
      direccion:     person.direccion,
      telefono:      person.telefono,
      ciudad:        person.ciudad,
      usuario:       person.usuario,
      contrasena:    ''
    })
    setEditingId(person.id)
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
        await updatePerson(editing_id, form_data)
        setSuccessMsg(`${form_data.nombres} updated successfully`)
      } else {
        await createPerson(form_data)
        setSuccessMsg(`${form_data.nombres} registered successfully`)
      }
      setFormData(empty_form)
      setEditingId(null)
      setShowForm(false)
      await loadPersons()
    } catch (err) {
      setErrorMsg('Error saving person. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deletePerson(id)
      setDeleteConfirm(null)
      await loadPersons()
    } catch (err) {
      console.error('Error deleting person:', err)
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">People</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Register and manage owners and surveyors
          </p>
        </div>
        {!show_form && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setFormData(empty_form) }}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm
                       font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New person
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
            {editing_id ? '✏️ Edit person' : 'New person'}
          </h2>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <FormField label="First name">
              <InputField
                name="nombres"
                value={form_data.nombres}
                onChange={handleChange}
                placeholder="Hugo Armando"
                required
              />
            </FormField>

            <FormField label="Last name">
              <InputField
                name="apellidos"
                value={form_data.apellidos}
                onChange={handleChange}
                placeholder="Cristancho Chinome"
                required
              />
            </FormField>

            <FormField label="Document type">
              <select
                name="tipoDocumento"
                value={form_data.tipoDocumento}
                onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-violet-400
                           focus:border-transparent transition bg-white"
              >
                {document_types.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Document number">
              <InputField
                name="documento"
                value={form_data.documento}
                onChange={handleChange}
                placeholder="1000200300"
                required
              />
            </FormField>

            <FormField label="Address">
              <InputField
                name="direccion"
                value={form_data.direccion}
                onChange={handleChange}
                placeholder="Calle Falsa 123"
                required
              />
            </FormField>

            <FormField label="Phone">
              <InputField
                name="telefono"
                value={form_data.telefono}
                onChange={handleChange}
                placeholder="3001234567"
                required
              />
            </FormField>

            <FormField label="City">
              <InputField
                name="ciudad"
                value={form_data.ciudad}
                onChange={handleChange}
                placeholder="Tunja"
                required
              />
            </FormField>

            <FormField label="Username">
              <InputField
                name="usuario"
                value={form_data.usuario}
                onChange={handleChange}
                placeholder="hcristancho"
                required
              />
            </FormField>

            <FormField label={editing_id ? 'New password (leave blank to keep)' : 'Password'}>
              <InputField
                type="password"
                name="contrasena"
                value={form_data.contrasena}
                onChange={handleChange}
                placeholder="••••••••"
                required={!editing_id}
              />
            </FormField>

            {error_msg && (
              <p className="text-red-500 text-sm md:col-span-2">{error_msg}</p>
            )}

            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
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
                {is_loading
                  ? 'Saving...'
                  : editing_id ? 'Update person' : 'Save person'
                }
              </button>
            </div>

          </form>
        </div>
      )}

      {/* People list */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-800">
            Registered people
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({persons.length})
            </span>
          </h2>
        </div>

        {persons.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No people registered yet. Click "+ New person" to start.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {persons.map(person => (
              <div key={person.id}
                   className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center
                                  justify-center text-violet-600 font-semibold text-sm
                                  flex-shrink-0">
                    {person.nombres?.charAt(0)}{person.apellidos?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {person.nombres} {person.apellidos}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {person.tipoDocumento} {person.documento} · {person.ciudad}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1
                                   rounded-md hidden sm:block">
                    @{person.usuario}
                  </span>
                  <button
                    onClick={() => handleEdit(person)}
                    className="text-xs text-violet-600 hover:text-violet-800 bg-violet-50
                               hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors
                               font-medium"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(person.id)}
                    className="text-xs text-red-500 hover:text-red-700 bg-red-50
                               hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors
                               font-medium"
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
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete person</h3>
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
                className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium
                           px-4 py-2 rounded-lg transition-colors"
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