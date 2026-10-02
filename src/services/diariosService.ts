import { obtenerTodos } from './finanzasApi'
import type { DiarioApi } from '../types/finanzasApi'

const RUTA_DIARIOS = '/contabilidad/diarios/'

/**
 * GET: Obtener todos los asientos del libro diario (el backend no tiene alta de diarios)
 */
export function obtenerDiarios(): Promise<DiarioApi[]> {
  return obtenerTodos<DiarioApi>(RUTA_DIARIOS)
}
