export interface Rubro {
  id?: number
  rubro_id: number
  nombre: string
  descripcion?: string
}

// Tipo para creación de rubro (omite los IDs generados por DB)
export type NuevoRubro = Omit<Rubro, 'id' | 'rubro_id'> & { descripcion: string }

// Rubro tal como lo devuelve /api/scm/rubros/ (siempre trae id y descripcion)
export type RubroAPI = Rubro & { id: number; descripcion: string }
