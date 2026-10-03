// Contrato de datos para Producto basado en el DER
export interface Producto {
  producto_id: number
  nombre: string
  descripcion: string
  preciounitario: number
  rubro_id: number
  rubro_nombre?: string
  stockactual: number
  stockminreposicion: number
  activo?: boolean // Baja lógica
}

// Tipo para creación de producto (omite ID y stock manual, se gestiona por movimientos)
export type NuevoProducto = Omit<Producto, 'producto_id' | 'stockactual' | 'activo'>

// Contrato para Movimiento de Inventario basado en el DER
export interface MovimientoInventario {
  movimientoinventario_id: number
  producto_id: number
  usuario_id: number
  tipo: 'Ingreso' | 'Egreso' | 'Ajuste'
  cantidad: number
  fecha: string
  observacion: string
}

// Tipo para registrar un nuevo movimiento de reposición/carga de stock
export type NuevoMovimientoInventario = Omit<MovimientoInventario, 'movimientoinventario_id'>

// Datos simulados (Mock) para productos del corralón
export const PRODUCTOS_MOCK: Producto[] = [
  {
    producto_id: 1,
    nombre: 'Cemento Portland Normal 50kg',
    descripcion: 'Bolsa de cemento Loma Negra de uso general para albañilería y hormigón.',
    preciounitario: 9800,
    rubro_id: 101,
    rubro_nombre: 'Áridos y Cementos',
    stockactual: 150,
    stockminreposicion: 30,
    activo: true
  },
  {
    producto_id: 2,
    nombre: 'Hierro Conformado 12mm x 12m',
    descripcion: 'Barra de acero corrugado de alta resistencia para estructuras.',
    preciounitario: 14500,
    rubro_id: 102,
    rubro_nombre: 'Hierros y Mallas',
    stockactual: 45,
    stockminreposicion: 15,
    activo: true
  },
  {
    producto_id: 3,
    nombre: 'Ladrillo Hueco 12x18x33 (6 tubos)',
    descripcion: 'Ladrillo cerámico hueco para tabiques y muros no portantes.',
    preciounitario: 650,
    rubro_id: 103,
    rubro_nombre: 'Ladrillos y Bloques',
    stockactual: 1200,
    stockminreposicion: 300,
    activo: true
  },
  {
    producto_id: 4,
    nombre: 'Pintura Látex Exterior 20L',
    descripcion: 'Impermeabilizante y antihongo color blanco mate para frentes.',
    preciounitario: 58000,
    rubro_id: 104,
    rubro_nombre: 'Pinturas y Acabados',
    stockactual: 12,
    stockminreposicion: 5,
    activo: true
  }
]

// Historial inicial de movimientos de stock
export const MOVIMIENTOS_INVENTARIO_MOCK: MovimientoInventario[] = [
  {
    movimientoinventario_id: 1,
    producto_id: 1,
    usuario_id: 1,
    tipo: 'Ingreso',
    cantidad: 50,
    fecha: '2026-09-10 10:30',
    observacion: 'Carga inicial de stock'
  },
  {
    movimientoinventario_id: 2,
    producto_id: 1,
    usuario_id: 1,
    tipo: 'Egreso',
    cantidad: 10,
    fecha: '2026-09-15 14:20',
    observacion: 'Entrega por remito #1040'
  },
  {
    movimientoinventario_id: 3,
    producto_id: 1,
    usuario_id: 1,
    tipo: 'Ingreso',
    cantidad: 120,
    fecha: '2026-09-20 09:15',
    observacion: 'Recepción orden de compra #304'
  },
  {
    movimientoinventario_id: 4,
    producto_id: 1,
    usuario_id: 1,
    tipo: 'Ajuste',
    cantidad: -2,
    fecha: '2026-09-25 18:00',
    observacion: 'Bolsas rotas por estiba defectuosa'
  },
  {
    movimientoinventario_id: 5,
    producto_id: 1,
    usuario_id: 1,
    tipo: 'Egreso',
    cantidad: 8,
    fecha: '2026-09-28 11:45',
    observacion: 'Venta mostrador ticket #8841'
  },
  {
    movimientoinventario_id: 6,
    producto_id: 3,
    usuario_id: 1,
    tipo: 'Ingreso',
    cantidad: 400,
    fecha: '2026-09-12 08:30',
    observacion: 'Ingreso de mercadería por recepción'
  }
]