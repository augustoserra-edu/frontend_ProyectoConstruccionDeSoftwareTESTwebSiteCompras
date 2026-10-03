import axios from 'axios'
/*
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[api]', error.response?.status, error.message)
    return Promise.reject(error)
  },
)
*/

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://corralon.ordema.app:8080/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  timeout: 10000 // Tiempo límite de espera de 10 segundos
})
export default api