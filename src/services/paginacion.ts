export {} // Sin peticiones durante la simulación.

// API COMENTADA TEMPORALMENTE: conservar hasta que se restablezca la conexión con la API.
// Para restaurar: quitar la implementación simulada de este archivo y descomentar el bloque original.
// import api from '../lib/api'
// 
// interface Pagina<T> { results: T[]; next: string | null }
// 
// export async function obtenerTodasLasPaginas<T>(ruta: string): Promise<T[]> {
//   const registros: T[] = []
//   let pagina = 1
//   while (true) {
//     // Conservamos el host configurado: next puede contener URLs internas del proxy.
//     const { data } = await api.get<Pagina<T> | T[]>(ruta, { params: { page: pagina } })
//     if (Array.isArray(data)) return [...registros, ...data]
//     if (!Array.isArray(data.results)) throw new Error('Respuesta de listado inválida.')
//     registros.push(...data.results)
//     if (!data.next) return registros
//     pagina++
//   }
// }
// 
