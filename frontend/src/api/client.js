import axios from 'axios'

const API_BASE = '/api'

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const auth = {
  login: (email, password) => client.post('/auth/login', { email, password }),
  register: (data) => client.post('/auth/register', data)
}

export const productos = {
  list: () => client.get('/productos'),
  create: (data) => client.post('/productos', data),
  update: (id, data) => client.put(`/productos/${id}`, data),
  delete: (id) => client.delete(`/productos/${id}`)
}

export const ventas = {
  create: (data) => client.post('/ventas', data),
  export: (id, format) => client.get(`/ventas/${id}/export?format=${format}`, { responseType: 'blob' })
}

export const combos = {
  list: () => client.get('/combos'),
  create: (data) => client.post('/combos', data),
  update: (id, data) => client.put(`/combos/${id}`, data),
  delete: (id) => client.delete(`/combos/${id}`)
}

export const garantias = {
  list: (params) => client.get('/garantias', { params }),
  create: (data) => client.post('/garantias', data)
}

export const reportes = {
  ventas: (params) => client.get('/reportes/ventas', { params }),
  perdidas: (params) => client.get('/reportes/perdidas', { params }),
  balance: (params) => client.get('/reportes/balance', { params })
}

export const usuarios = {
  list: () => client.get('/usuarios'),
  create: (data) => client.post('/usuarios', data),
  update: (id, data) => client.put(`/usuarios/${id}`, data),
  delete: (id) => client.delete(`/usuarios/${id}`)
}

export const bulk = {
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return client.post('/productos/bulk/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export default client
