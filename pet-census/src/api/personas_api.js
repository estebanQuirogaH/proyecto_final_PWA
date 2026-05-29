import api from './axios_instance'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

export const createPerson = async (person_data) => {
  const hashed_password = await bcrypt.hash(person_data.contrasena, 10)
  const payload = {
    id:            uuidv4(),
    nombres:       person_data.nombres,
    apellidos:     person_data.apellidos,
    tipoDocumento: person_data.tipoDocumento,
    documento:     person_data.documento,
    direccion:     person_data.direccion,
    telefono:      person_data.telefono,
    ciudad:        person_data.ciudad,
    usuario:       person_data.usuario,
    contrasena:    hashed_password
  }
  const response = await api.post('/personas', payload)
  return response.data
}

export const getAllPersons = async () => {
  const response = await api.get('/personas')
  return response.data
}

export const updatePerson = async (id, person_data) => {
  const response = await api.put(`/personas/${id}`, person_data)
  return response.data
}

export const deletePerson = async (id) => {
  const response = await api.delete(`/personas/${id}`)
  return response.data
}

export const createPersonMockz = async (person_data) => {
  await new Promise(resolve => setTimeout(resolve, 600))
  const saved = {
    id:            uuidv4(),
    nombres:       person_data.nombres,
    apellidos:     person_data.apellidos,
    tipoDocumento: person_data.tipoDocumento,
    documento:     person_data.documento,
    direccion:     person_data.direccion,
    telefono:      person_data.telefono,
    ciudad:        person_data.ciudad,
    usuario:       person_data.usuario
  }
  const existing = JSON.parse(localStorage.getItem('mock_persons') || '[]')
  localStorage.setItem('mock_persons', JSON.stringify([...existing, saved]))
  return saved
}

export const getAllPersonsMock = async () => {
  await new Promise(resolve => setTimeout(resolve, 400))
  return JSON.parse(localStorage.getItem('mock_persons') || '[]')
}

export const updatePersonMock = async (id, person_data) => {
  await new Promise(resolve => setTimeout(resolve, 400))
  const existing = JSON.parse(localStorage.getItem('mock_persons') || '[]')
  const updated  = existing.map(p => p.id === id ? { ...p, ...person_data } : p)
  localStorage.setItem('mock_persons', JSON.stringify(updated))
  return updated.find(p => p.id === id)
}

export const deletePersonMock = async (id) => {
  await new Promise(resolve => setTimeout(resolve, 400))
  const existing = JSON.parse(localStorage.getItem('mock_persons') || '[]')
  localStorage.setItem('mock_persons', JSON.stringify(existing.filter(p => p.id !== id)))
}