/** Clave de búsqueda sin acentos, diferencias de mayúsculas ni separadores. */
export function normalizarBusqueda(valor: string): string {
  return valor
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '')
}
