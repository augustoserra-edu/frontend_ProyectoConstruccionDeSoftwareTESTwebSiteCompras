// Contrato de datos para Producto alineado con el Backend SCM
export interface Producto {
  id?: number
  producto_id: number
  codigo?: string
  nombre: string
  descripcion: string
  precio?: number | string
  preciounitario?: number
  rubro?: number
  rubro_id: number
  rubro_nombre?: string
  stock_actual?: number
  stockactual: number
  stock_minimo?: number
  stockminreposicion: number
  necesita_reposicion?: boolean
  activo?: boolean
}

// Payload para crear un producto en el backend
export interface ProductoBackendInput {
  codigo: string
  nombre: string
  descripcion: string
  rubro: number
  stock_minimo: number
}

// Tipo para creación de producto en frontend
export type NuevoProducto = Omit<
  Producto,
  'producto_id' | 'id' | 'stockactual' | 'stock_actual' | 'activo' | 'precio' | 'preciounitario'
>

// Tipos de movimiento aceptados
export type TipoMovimientoInventario = 
  | 'Ingreso' 
  | 'Egreso' 
  | 'Ajuste' 
  | 'ENTRADA' 
  | 'SALIDA' 
  | 'AJUSTE' 
  | 'DEVOLUCION'

// Contrato para Movimiento de Inventario
export interface MovimientoInventario {
  movimientoinventario_id: number
  id?: number
  producto_id: number
  producto?: number
  usuario_id: number
  tipo: TipoMovimientoInventario | string
  cantidad: number
  fecha: string
  observacion: string
}

export type NuevoMovimientoInventario = Omit<MovimientoInventario, 'movimientoinventario_id' | 'id'>
