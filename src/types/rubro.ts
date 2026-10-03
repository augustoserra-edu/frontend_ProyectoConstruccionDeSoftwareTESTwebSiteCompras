export interface Rubro {
  rubro_id: number
  nombre: string
}

export const RUBROS_MOCK: Rubro[] = [
  { rubro_id: 101, nombre: 'Áridos y Cementos' },
  { rubro_id: 102, nombre: 'Hierros y Mallas' },
  { rubro_id: 103, nombre: 'Ladrillos y Bloques' },
  { rubro_id: 104, nombre: 'Pinturas y Acabados' }
]