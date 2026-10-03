import api from '../lib/api'
import { RUBROS_MOCK, type Rubro } from '../types/rubro'

const RUTA_RUBROS = '/inventario/rubros/'

export async function obtenerRubros(): Promise<Rubro[]> {
  try {
    const respuesta = await api.get<Rubro[]>(RUTA_RUBROS)
    return Array.isArray(respuesta.data) ? respuesta.data : RUBROS_MOCK
  } catch (error) {
    console.warn('Backend de rubros no disponible. Usando mocks.', error)
    return RUBROS_MOCK
  }
}