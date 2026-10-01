import axios, { isAxiosError } from 'axios'
import api from '../lib/api'

// Cliente HTTP propio de Finanzas: reutiliza la URL base de `lib/api.ts` (sin
// modificarlo, porque lo comparte Proveedores) y agrega el token JWT guardado
// en localStorage bajo la clave `access_token`.
const finanzasApi = axios.create({
  baseURL: api.defaults.baseURL,
  timeout: api.defaults.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
})

finanzasApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default finanzasApi

interface Pagina<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

const MAX_PAGINAS = 100

// El backend pagina de a 20: recorre todas las páginas y devuelve el arreglo completo.
export async function obtenerTodos<T>(ruta: string): Promise<T[]> {
  const resultados: T[] = []
  for (let pagina = 1; pagina <= MAX_PAGINAS; pagina++) {
    const { data } = await finanzasApi.get<Pagina<T>>(ruta, { params: { page: pagina } })
    if (!data || !Array.isArray(data.results)) {
      throw new Error('La respuesta del servidor no tiene el formato esperado. Revisá la URL de la API.')
    }
    resultados.push(...data.results)
    if (!data.next) break
  }
  return resultados
}

function aplanarErrores(dato: unknown, campo = ''): string[] {
  if (typeof dato === 'string') {
    const generico = campo === '' || campo === 'non_field_errors' || campo === 'detail'
    return [generico ? dato : `${campo}: ${dato}`]
  }
  if (Array.isArray(dato)) {
    return dato.flatMap((item) => aplanarErrores(item, campo))
  }
  if (dato && typeof dato === 'object') {
    return Object.entries(dato).flatMap(([clave, valor]) => aplanarErrores(valor, clave))
  }
  return []
}

// Convierte cualquier error en un texto para mostrar en pantalla.
export function mensajeDeError(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Revisá la URL de la API (VITE_API_BASE_URL) y que el servidor permita este origen (CORS).'
    }
    const { status, data } = error.response
    if (status === 401) {
      return 'No hay sesión iniciada o el token venció. Guardá un token válido en localStorage con la clave "access_token".'
    }
    if (status === 403) {
      return 'No tenés permisos para realizar esta acción.'
    }
    if (status === 404) {
      return 'No se encontró el recurso solicitado.'
    }
    if (status === 400) {
      const detalle = aplanarErrores(data)
      return detalle.length > 0 ? detalle.join(' ') : 'Los datos enviados no son válidos.'
    }
    if (status >= 500) {
      return 'Error interno del servidor. Intentá de nuevo más tarde.'
    }
    return `El servidor respondió con el error ${status}.`
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Ocurrió un error inesperado.'
}
