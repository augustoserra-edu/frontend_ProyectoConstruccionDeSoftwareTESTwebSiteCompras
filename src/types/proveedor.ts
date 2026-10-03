// Contrato de datos para Proveedor basado en el DER
export interface Proveedor {
  proveedor_id: number
  nombre: string
  apellido: string
  email: string
  telefono: string
  cuit: string
  direccion: string
  productos: number[]
}

// Tipo para la creación (no requiere proveedor_id ya que lo genera la base de datos)
export type NuevoProveedor = Omit<Proveedor, 'proveedor_id'>
