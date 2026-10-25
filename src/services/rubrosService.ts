import api from '../lib/api'
import type { Rubro } from '../types/rubro'

const RUTA_RUBROS = '/scm/rubros/'

interface RespuestaRubrosAPI {
  count?: number
  next?: string | null
  previous?: string | null
  results?: Array<{ id: number; nombre: string; descripcion?: string }>
}

export async function obtenerRubros(): Promise<Rubro[]> {
  const respuesta = await api.get<RespuestaRubrosAPI | Rubro[]>(RUTA_RUBROS)

  const items = Array.isArray(respuesta.data)
    ? respuesta.data
    : (respuesta.data?.results || [])

  return items.map((r: any) => ({
    rubro_id: r.id ?? r.rubro_id,
    id: r.id ?? r.rubro_id,
    nombre: r.nombre,
    descripcion: r.descripcion
  }))
}
