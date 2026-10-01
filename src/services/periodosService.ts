import finanzasApi, { obtenerTodos } from './finanzasApi'
import type { PeriodoApi, NuevoPeriodoApi } from '../types/finanzasApi'

// baseURL ya incluye /api
const RUTA_PERIODOS = '/contabilidad/periodos/'

/**
 * GET: Obtener todos los períodos contables (recorre todas las páginas)
 */
export function obtenerPeriodos(): Promise<PeriodoApi[]> {
  return obtenerTodos<PeriodoApi>(RUTA_PERIODOS)
}

/**
 * GET por ID: Obtener un período puntual
 */
export async function obtenerPeriodoPorId(id: number): Promise<PeriodoApi> {
  const respuesta = await finanzasApi.get<PeriodoApi>(`${RUTA_PERIODOS}${id}/`)
  return respuesta.data
}

/**
 * POST: Crear un nuevo período contable (el backend crea además su cierre ABIERTO)
 */
export async function crearPeriodo(datos: NuevoPeriodoApi): Promise<PeriodoApi> {
  const respuesta = await finanzasApi.post<PeriodoApi>(RUTA_PERIODOS, datos)
  return respuesta.data
}

/**
 * PUT: Modificar un período contable (el backend exige anio y mes juntos)
 */
export async function actualizarPeriodo(id: number, datos: NuevoPeriodoApi): Promise<PeriodoApi> {
  const respuesta = await finanzasApi.put<PeriodoApi>(`${RUTA_PERIODOS}${id}/`, datos)
  return respuesta.data
}
