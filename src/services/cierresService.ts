import finanzasApi, { obtenerTodos } from './finanzasApi'
import type { CierreMensualApi } from '../types/finanzasApi'

const RUTA_CIERRES = '/contabilidad/cierres-mensuales/'

/**
 * GET: Obtener todos los cierres mensuales
 */
export function obtenerCierres(): Promise<CierreMensualApi[]> {
  return obtenerTodos<CierreMensualApi>(RUTA_CIERRES)
}

/**
 * PUT: Cerrar un cierre mensual. Un cierre CERRADO no se puede volver a modificar.
 */
export async function cerrarCierre(id: number): Promise<CierreMensualApi> {
  const respuesta = await finanzasApi.put<CierreMensualApi>(`${RUTA_CIERRES}${id}/`, {
    estado: 'CERRADO'
  })
  return respuesta.data
}
