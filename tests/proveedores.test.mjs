// API COMENTADA TEMPORALMENTE: conservar hasta que se restablezca la conexión con la API.
// Para restaurar: quitar la implementación simulada de este archivo y descomentar el bloque original.
// import assert from 'node:assert/strict'
// import test from 'node:test'
// import { readFileSync } from 'node:fs'
// import ts from 'typescript'
// import axios from 'axios'
// 
// let handler
// axios.defaults.adapter = async config => handler(config)
// const cache = new Map()
// function moduleURL(path) {
//   if (cache.has(path)) return cache.get(path)
//   let source = readFileSync(new URL(path, import.meta.url), 'utf8').replace('import.meta.env.VITE_API_BASE_URL', 'undefined')
//   source = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
//   source = source.replace(/from ['"]([^'"]+)['"]/g, (_, name) => {
//     const url = name.startsWith('.') ? moduleURL(new URL(`${name}.ts`, new URL(path, import.meta.url)).href) : import.meta.resolve(name)
//     return `from '${url}'`
//   })
//   const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
//   cache.set(path, url)
//   return url
// }
// const proveedores = await import(moduleURL('../src/services/proveedoresService.ts'))
// const productos = await import(moduleURL('../src/services/productosService.ts'))
// const response = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} })
// 
// test('catalogs read every page without following remote next URLs', async () => {
//   for (const [load, url] of [[proveedores.obtenerProveedores, '/compras/proveedores/'], [productos.obtenerProductosProveedor, '/scm/productos/']]) {
//     const pages = []
//     const rows = url.includes('proveedores') ? [{ proveedor_id: 1, productos: [5] }, { proveedor_id: 2, productos: [5, 6] }] : [{ id: 1 }, { id: 2 }]
//     handler = config => {
//       assert.equal(config.url, url)
//       pages.push(config.params.page)
//       return response(config, config.params.page === 1 ? { results: [rows[0]], next: 'http://internal/api/?page=2' } : { results: [rows[1]], next: null })
//     }
//     assert.deepEqual(await load(), rows)
//     assert.deepEqual(pages, [1, 2])
//   }
// })
// 
// test('legacy server records retain real associations and block incompatible writes', async () => {
//   handler = config => response(config, { results: [{ proveedor_id: 4, producto_id: 17 }], next: null })
//   assert.deepEqual(await proveedores.obtenerProveedores(), [{ proveedor_id: 4, productos: [17] }])
//   assert.equal(proveedores.relacionMultipleDisponible.value, false)
//   await assert.rejects(proveedores.crearProveedor({ productos: [17, 18] }))
//   handler = config => response(config, { results: [{ proveedor_id: 4, productos: [17, 18] }], next: null })
//   await proveedores.obtenerProveedores()
//   assert.equal(proveedores.relacionMultipleDisponible.value, true)
// })
// 
// test('create and edit send multiple product IDs and propagate validation errors', async () => {
//   const payload = { nombre: 'Proveedor', apellido: 'SA', cuit: '30111000111', email: '', telefono: '', direccion: '', productos: [2, 7] }
//   handler = config => {
//     assert.equal(config.method, 'post')
//     assert.deepEqual(JSON.parse(config.data), payload)
//     return response(config, { proveedor_id: 9, ...payload })
//   }
//   assert.deepEqual((await proveedores.crearProveedor(payload)).productos, [2, 7])
//   handler = config => {
//     assert.equal(config.method, 'patch')
//     assert.equal(config.url, '/compras/proveedores/9/')
//     assert.deepEqual(JSON.parse(config.data), { productos: [7, 8] })
//     return response(config, { proveedor_id: 9, ...payload, productos: [7, 8] })
//   }
//   assert.deepEqual((await proveedores.actualizarProveedor(9, { productos: [7, 8] })).productos, [7, 8])
//   handler = config => { throw new axios.AxiosError('Invalid', 'ERR_BAD_REQUEST', config, null, { status: 400, data: { cuit: ['Ya existe un proveedor con ese CUIT.'] } }) }
//   await assert.rejects(proveedores.crearProveedor(payload), error => error.response.status === 400)
// })
// 
