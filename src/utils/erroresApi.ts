import axios from 'axios'

export function esErrorNoAutorizado(error: unknown): boolean {
  return (
    (axios.isAxiosError(error) && error.response?.status === 401) ||
    (error as any)?.response?.status === 401 ||
    !localStorage.getItem('access_token')
  )
}

export function mensajeErrorApi(error: unknown): string {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : 'No se pudo completar la operación. Intentá nuevamente.'
  if (!error.response) return 'No se pudo conectar con el servidor. Intentá nuevamente.'
  if (error.response.status === 401) return ''
  if (error.response.status >= 500) return 'El servidor no pudo completar la operación. Intentá nuevamente.'
  const datos = error.response.data
  if (datos && typeof datos === 'object') {
    return Object.entries(datos).map(([campo, mensajes]) =>
      `${campo === 'detail' || campo === 'non_field_errors' ? '' : `${campo}: `}${Array.isArray(mensajes) ? mensajes.join(' ') : String(mensajes)}`
    ).join(' ')
  }
  return 'No se pudo completar la operación. Revisá los datos e intentá nuevamente.'
}

// Conserva las rutas de errores anidados para asociarlos a cada control.
export function erroresFormularioApi(error: unknown, resolverCampo: (ruta: string) => string | undefined) {
  const campos: Record<string, string> = {}
  const generales: string[] = []
  if (!axios.isAxiosError(error) || !error.response || error.response.status === 401 || error.response.status >= 500
    || !error.response.data || typeof error.response.data !== 'object') {
    return { campos, general: mensajeErrorApi(error) }
  }
  function recorrer(valor: unknown, ruta: string) {
    if (Array.isArray(valor) && valor.every(item => typeof item === 'string')) registrar(valor.join(' '), ruta)
    else if (valor && typeof valor === 'object') {
      Object.entries(valor).forEach(([clave, item]) => recorrer(item, ruta ? ruta + '.' + clave : clave))
    } else if (valor != null) registrar(String(valor), ruta)
  }
  function registrar(mensaje: string, ruta: string) {
    if (!mensaje) return
    const campo = resolverCampo(ruta)
    if (campo) campos[campo] = [campos[campo], mensaje].filter(Boolean).join(' ')
    else generales.push(mensaje)
  }
  recorrer(error.response.data, '')
  return { campos, general: generales.join(' ') }
}
