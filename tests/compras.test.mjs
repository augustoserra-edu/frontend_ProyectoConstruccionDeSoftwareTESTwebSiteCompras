import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import axios from 'axios'

Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => 'token-prueba' }, configurable: true })
let handler
axios.defaults.adapter = async config => { assert.equal(config.headers.Authorization, 'Bearer token-prueba'); return handler(config) }
const cache = new Map()
function moduleURL(path) {
  if (cache.has(path)) return cache.get(path)
  let source = readFileSync(new URL(path, import.meta.url), 'utf8').replaceAll('import.meta.env.VITE_API_BASE_URL', 'undefined')
  source = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, removeComments: true } }).outputText
  source = source.replace(/from ['"]([^'"]+)['"]/g, (_, name) => {
    const url = name.startsWith('.') ? moduleURL(new URL(`${name}.ts`, new URL(path, import.meta.url)).href) : import.meta.resolve(name)
    return `from '${url}'`
  })
  const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  cache.set(path, url)
  return url
}
const compras = await import(moduleURL('../src/services/comprasService.ts'))
const response = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} })
const orden = { ordencompra_id: 41, proveedor: 12, estado: 7, fecha: '2026-10-01T15:00:00Z', total: '21.00', detalles: [{ ordencompradetalle_id: 81, producto_id: 5, cantidad: 2, precio_unitario: '10.50' }] }

test('server states and decimal totals are presented without invented records', () => {
  assert.deepEqual(compras.presentarOrden(orden, [{ estadoordencompra_id: 7, nombre: 'Pendiente' }]), { ordencompra_id: 41, proveedor_id: 12, estado: 'pendiente', fecha: orden.fecha, total: 21 })
  assert.deepEqual(compras.presentarDetalles(orden), [{ ordencompradetalle_id: 81, ordencompra_id: 41, producto_id: 5, cantidad: 2, preciounitario: 10.5, subtotal: 21 }])
})
test('new orders are posted in one request with nested details and no mock fields', async () => {
  handler = config => {
    assert.equal(config.method, 'post')
    assert.equal(config.url, '/compras/ordenes-compra/')
    const body = JSON.parse(config.data)
    assert.deepEqual(Object.keys(body).sort(), ['detalles', 'fecha', 'proveedor'])
    assert.equal(body.proveedor, 12)
    assert.ok(!Number.isNaN(Date.parse(body.fecha)))
    assert.deepEqual(body.detalles, [{ producto_id: 5, cantidad: 2, precio_unitario: '10.50' }])
    return response(config, orden)
  }
  assert.deepEqual(await compras.crearOrdenCompra({ cabecera: { proveedor_id: 12, fecha: '2026-10-01', total: 21 }, detalles: [{ producto_id: 5, cantidad: 2, preciounitario: 10.5 }] }), orden)
})
test('state update sends the server catalog ID and preserves failures', async () => {
  handler = config => {
    assert.equal(config.method, 'patch')
    assert.equal(config.url, '/compras/ordenes-compra/41/')
    assert.deepEqual(JSON.parse(config.data), { estado: 19 })
    return response(config, { ...orden, estado: 19 })
  }
  assert.equal((await compras.actualizarEstadoCompra(41, 19)).estado, 19)
  handler = config => { throw new axios.AxiosError('Invalid transition', 'ERR_BAD_REQUEST', config, null, { status: 400 }) }
  await assert.rejects(compras.actualizarEstadoCompra(41, 19))
  assert.equal(compras.transicionPermitida('pendiente', 'recibida'), false)
  assert.equal(compras.transicionPermitida('aprobada', 'recibida'), true)
  assert.equal(compras.transicionPermitida('aprobada', 'rechazada'), true)
  assert.equal(compras.transicionPermitida('recibida', 'rechazada'), false)
})
test('invoices are filtered by order and translated from the accounting API', async () => {
  handler = config => response(config, { results: [
    { id: 2, orden_compra_id: null },
    { id: 3, orden_compra_id: 41, tipo: 'COMPRA', numero: '0003', fecha: '2026-10-01', subtotal: '21.00', impuestos: '4.41', total: '25.41' }
  ], next: null })
  assert.deepEqual(await compras.obtenerFacturasCompra(), [{ facturacabecera_id: 3, ordencompra_id: 41, tipo: 'COMPRA', numero: '0003', fecha: '2026-10-01', subtotal: 21, impuesto: 4.41, total: 25.41 }])
})
