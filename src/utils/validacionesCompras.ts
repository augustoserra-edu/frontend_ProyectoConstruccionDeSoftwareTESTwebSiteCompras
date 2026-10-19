import type { NuevoProveedor } from '../types/proveedor'

export const IMPORTE_MAXIMO = 9999999999.99
export const CANTIDAD_MAXIMA = 2147483647

export type CampoContactoProveedor = 'cuit' | 'telefono' | 'email'

export function filtrarContactoProveedor(valor: string, campo: CampoContactoProveedor) {
  if (campo === 'cuit') return valor.replace(/[^0-9-]/g, '')
  if (campo === 'telefono') return valor.replace(/[^0-9+]/g, '').replace(/(?!^)\+/g, '').slice(0, 14)
  return valor.replace(/[^a-zA-Z0-9.!#$%&'*+/=?^_`{|}~@-]/g, '')
}

function emailValido(email: string) {
  const partes = email.split('@')
  if (partes.length !== 2) return false
  const [usuario, dominio] = partes as [string, string]
  return usuario.length <= 64
    && /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*$/.test(usuario)
    && dominio.includes('.')
    && dominio.split('.').every(etiqueta => etiqueta.length <= 63 && /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(etiqueta))
}

export function limpiarTexto(valor: string, recortarFinal = true) {
  const limpio = valor.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trimStart()
  return recortarFinal ? limpio.trimEnd() : limpio
}

export function importeValido(valor: number) {
  return Number.isFinite(valor) && valor >= 0 && valor <= IMPORTE_MAXIMO
    && Math.abs(valor * 100 - Math.round(valor * 100)) < 0.0002
}

export function fechaValida(valor: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || valor.startsWith('0000')) return false
  const fecha = new Date(valor + 'T12:00:00Z')
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor
}

export function normalizarProveedor(datos: NuevoProveedor): NuevoProveedor {
  return { ...datos, nombre: limpiarTexto(datos.nombre), apellido: limpiarTexto(datos.apellido),
    email: limpiarTexto(datos.email), telefono: limpiarTexto(datos.telefono), direccion: limpiarTexto(datos.direccion),
    cuit: limpiarTexto(datos.cuit).replace(/[- ]/g, '') }
}

export function validarProveedor(datos: NuevoProveedor, productosDisponibles: number[]) {
  if (!datos.nombre || !datos.apellido) return 'Completá nombre y apellido o denominación.'
  if (datos.nombre.length > 150 || datos.apellido.length > 150) return 'Nombre y apellido admiten hasta 150 caracteres.'
  if (!/^\d{11}$/.test(datos.cuit)) return 'El CUIT debe contener 11 dígitos; podés escribirlo con guiones.'
  if (datos.email.length > 150 || (datos.email && !emailValido(datos.email))) return 'Ingresá un email válido de hasta 150 caracteres, con un solo @ y un dominio válido.'
  if (datos.telefono.length > 14 || (datos.telefono && !/^\+?[0-9]+$/.test(datos.telefono))) return 'Ingresá un teléfono de hasta 14 caracteres: solo números y un signo + opcional al inicio.'
  if (datos.direccion.length > 200) return 'La dirección admite hasta 200 caracteres.'
  if (!datos.productos.length) return 'Seleccioná al menos un producto.'
  if (new Set(datos.productos).size !== datos.productos.length) return 'Hay productos repetidos en la selección.'
  const faltantes = datos.productos.filter(id => !productosDisponibles.includes(id))
  if (faltantes.length) return `Los productos #${faltantes.join(', #')} no están disponibles en el catálogo. Revisá la selección.`
  return ''
}
