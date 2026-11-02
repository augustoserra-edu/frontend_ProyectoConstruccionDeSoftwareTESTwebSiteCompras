import axios from 'axios'
import { API_BASE_URL, manejarSesionExpirada } from '../lib/api'

const clienteAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  timeout: 10000
})

clienteAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

clienteAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      manejarSesionExpirada()
    }
    return Promise.reject(error)
  }
)

export default clienteAxios
