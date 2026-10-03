import axios from 'axios'

export function mensajeErrorApi(error: unknown): string {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : 'No se pudo completar la operación. Intentá nuevamente.'
  if (!error.response) return 'No se pudo conectar con el servidor. Intentá nuevamente.'
  if (error.response.status === 401) return 'Tu sesión venció o no es válida. Volvé a iniciar sesión.'
  if (error.response.status >= 500) return 'El servidor no pudo completar la operación. Intentá nuevamente.'
  const datos = error.response.data
  if (datos && typeof datos === 'object') {
    return Object.entries(datos).map(([campo, mensajes]) =>
      `${campo === 'detail' || campo === 'non_field_errors' ? '' : `${campo}: `}${Array.isArray(mensajes) ? mensajes.join(' ') : String(mensajes)}`
    ).join(' ')
  }
  return 'No se pudo completar la operación. Revisá los datos e intentá nuevamente.'
}
