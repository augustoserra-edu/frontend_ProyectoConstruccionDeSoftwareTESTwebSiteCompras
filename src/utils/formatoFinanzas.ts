export const NOMBRES_MESES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
}

export function etiquetaPeriodo(anio: number, mes: number): string {
  return `${NOMBRES_MESES[mes] ?? mes} ${anio}`
}

// El backend manda los decimales como string ("271.00").
export function aNumero(valor: string | number | null | undefined): number {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : 0
}

export function formatoMoneda(valor: number): string {
  return `$${valor.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Acepta fechas ISO con hora y offset (2026-09-18T07:00:00-03:00).
export function formatoFecha(fecha: string | null | undefined): string {
  if (!fecha) return '-'
  const parseada = new Date(fecha)
  return Number.isNaN(parseada.getTime()) ? fecha : parseada.toLocaleDateString('es-AR')
}
