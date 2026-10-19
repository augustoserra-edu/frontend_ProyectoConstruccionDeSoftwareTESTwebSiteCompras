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
test('editing sends product changes without changing the order date or state and propagates rejection', async () => {
  const datos = { cabecera: { proveedor_id: 12, fecha: '2026-10-01', total: 31.5 }, detalles: [{ producto_id: 5, cantidad: 3, preciounitario: 10.5 }] }
  handler = config => {
    assert.equal(config.method, 'patch')
    assert.equal(config.url, '/compras/ordenes-compra/41/')
    assert.deepEqual(JSON.parse(config.data), { proveedor: 12, detalles: [{ producto_id: 5, cantidad: 3, precio_unitario: '10.50' }] })
    return response(config, { ...orden, total: '31.50' })
  }
  assert.equal((await compras.editarOrdenCompra(41, datos)).total, '31.50')
  handler = config => { throw new axios.AxiosError('Solo se puede modificar una orden pendiente.', 'ERR_BAD_REQUEST', config, null, { status: 400 }) }
  await assert.rejects(compras.editarOrdenCompra(41, datos), error => error.response.status === 400)
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
  assert.equal(compras.transicionPermitida('aprobada', 'rechazada'), false)
  assert.equal(compras.transicionPermitida('recibida', 'rechazada'), false)
})
test('invoices are filtered by order and translated from the accounting API', async () => {
  handler = config => response(config, { results: [
    { id: 2, orden_compra_id: null },
    { id: 3, orden_compra_id: 41, tipo: 'COMPRA', numero: '0003', fecha: '2026-10-01', subtotal: '21.00', impuestos: '4.41', total: '25.41' }
  ], next: null })
  assert.deepEqual(await compras.obtenerFacturasCompra(), [{ facturacabecera_id: 3, ordencompra_id: 41, tipo: 'COMPRA', numero: '0003', fecha: '2026-10-01', subtotal: 21, impuesto: 4.41, total: 25.41 }])
})


test('purchase workflow follows fixes-CompraProveedores, including terminal states', () => {
  const states = ['pendiente', 'aprobada', 'rechazada', 'recibida', 'devuelto', 'contabilizado']
  const allowed = new Set(['pendiente:aprobada', 'pendiente:rechazada', 'aprobada:recibida', 'aprobada:devuelto'])
  for (const current of states) {
    assert.equal(compras.estadoCompraReconocido(current), true)
    for (const next of states) {
      assert.equal(compras.transicionPermitida(current, next), allowed.has(current + ':' + next), current + ' -> ' + next)
    }
  }
  assert.equal(compras.transicionPermitida('desconocido', 'aprobada'), false)
  assert.equal(compras.transicionPermitida('constructor', 'aprobada'), false)
  assert.equal(compras.estadoCompraReconocido('desconocido'), false)
  assert.equal(compras.etiquetaEstadoCompra('aprobada'), 'Aprobado')
  assert.equal(compras.etiquetaEstadoCompra('recibida'), 'Recibido')
  assert.equal(compras.etiquetaEstadoCompra('rechazada'), 'Rechazado')
})

test('catalog retains server names and IDs while sorting the six states', async () => {
  const names = ['Contabilizado', 'Devuelto', 'Recibida', 'Rechazada', 'Aprobada', 'Pendiente']
  handler = config => response(config, { results: names.map((nombre, i) => ({ estadoordencompra_id: 20 + i, nombre })), next: null })
  const catalog = await compras.obtenerEstadosCompra()
  assert.deepEqual(catalog.map(item => item.nombre), [...names].reverse())
  assert.deepEqual(catalog.map(item => item.estadoordencompra_id), [25, 24, 23, 22, 21, 20])
  assert.equal(compras.presentarOrden({ ...orden, estado: 24 }, catalog).estado, 'aprobada')
})

test('purchase providers use supplier purchase prices, including missing and zero prices', async () => {
  handler = config => response(config, { results: [{ proveedor_id: 12, productos: [
    { producto_id: 5, precio_compra: '10.50' }, { producto_id: 6, precio_compra: null }, { producto_id: 7, precio_compra: '0.00' }
  ] }], next: null })
  assert.deepEqual(await compras.obtenerProveedores(), [{ proveedor_id: 12, productos: [5, 6, 7], preciosCompra: { 5: 10.5, 6: null, 7: 0 } }])
})



test('rejection resolves catalog variants to their real ID without inventing missing states', () => {
  for (const nombre of ['Rechazada', 'Rechazado', 'Rechazar', ' RECHAZADA ']) {
    const catalog = [{ estadoordencompra_id: 73, nombre }]
    assert.equal(compras.buscarEstadoCompra(catalog, 'rechazada').estadoordencompra_id, 73)
    assert.equal(compras.presentarOrden({ ...orden, estado: 73 }, catalog).estado, 'rechazada')
    assert.equal(compras.transicionPermitida(' Pendiente ', nombre), true)
  }
  assert.equal(compras.buscarEstadoCompra([{ estadoordencompra_id: 7, nombre: 'Pendiente' }], 'rechazada'), undefined)
  assert.equal(compras.buscarEstadoCompra([
    { estadoordencompra_id: 73, nombre: 'Rechazar' },
    { estadoordencompra_id: 81, nombre: 'Rechazada' }
  ], 'rechazar').estadoordencompra_id, 81)
})


test('legacy supplier product IDs remain selectable with catalog prices', async () => {
  handler = config => response(config, { results: [
    { proveedor_id: 12, productos: [5, 6] },
    { proveedor_id: 13, producto_id: 7 },
    { proveedor_id: 14, productos: [] }
  ], next: null })
  const proveedores = await compras.obtenerProveedores()
  assert.deepEqual(proveedores.map(p => p.productos), [[5, 6], [7], []])
  const catalogo = [{ id: 5, precio: 100 }, { id: 6, precio: 200 }, { id: 7, precio: 300 }]
  const disponibles = catalogo.filter(p => proveedores[0].productos.includes(p.id))
  assert.deepEqual(disponibles.map(p => compras.precioCompraProveedor(proveedores[0], p)), [100, 200])
  assert.equal(compras.precioCompraProveedor({ productos: [5], preciosCompra: { 5: 10.5 } }, catalogo[0]), 10.5)
  assert.equal(compras.precioCompraProveedor({ productos: [5], preciosCompra: { 5: 0 } }, catalogo[0]), 0)
  assert.ok(Number.isNaN(compras.precioCompraProveedor({ productos: [5], preciosCompra: { 5: null } }, catalogo[0])))
})


test('supplier validation normalizes whitespace and checks fields and catalog membership', async () => {
  const v = await import(moduleURL('../src/utils/validacionesCompras.ts'))
  const base = { nombre: '  Materiales    Sur  ', apellido: ' SA ', cuit: '20-44215209-9', email: ' contacto@example.com ', telefono: ' +541112345678 ', direccion: ' Calle   12 ', productos: [5] }
  const valid = v.normalizarProveedor(base)
  assert.equal(valid.nombre, 'Materiales Sur')
  assert.equal(valid.email, 'contacto@example.com')
  assert.equal(valid.direccion, 'Calle 12')
  assert.equal(valid.cuit, '20442152099')
  assert.equal(v.validarProveedor(valid, [5]), '')
  for (const cambios of [{ nombre: ' '.repeat(100) }, { apellido: '\u200B' }, { cuit: '123' }, { cuit: 'abcdefghijk' }, { email: 'x@' }, { telefono: '---' }, { telefono: 'abc' }, { direccion: 'x'.repeat(201) }, { nombre: 'x'.repeat(151) }, { productos: [] }, { productos: [99] }, { productos: [5, 5] }]) {
    assert.notEqual(v.validarProveedor(v.normalizarProveedor({ ...valid, ...cambios }), [5]), '')
  }
  assert.equal(v.validarProveedor({ ...valid, email: '', telefono: '', direccion: '' }, [5]), '')
})

test('invoice dates and money reject invalid or oversized values without rejecting zero', async () => {
  const v = await import(moduleURL('../src/utils/validacionesCompras.ts'))
  for (const importe of [0, 1.23, 0.1 + 0.2, 9999999999.99]) assert.equal(v.importeValido(importe), true)
  for (const importe of [-1, NaN, Infinity, 1.001, 10000000000]) assert.equal(v.importeValido(importe), false)
  assert.equal(v.fechaValida('2028-02-29'), true)
  for (const fecha of ['', '2026-02-29', '2026-04-31', '2026-13-01', '0000-01-01']) assert.equal(v.fechaValida(fecha), false)
})

test('text inputs collapse whitespace before model updates and trim on blur', async () => {
  const { vTextoLimpio } = await import(moduleURL('../src/directives/textoLimpio.ts'))
  class Campo extends EventTarget {
    value = ''; maxLength = 150; selectionStart = 0;
    setSelectionRange(inicio) { this.selectionStart = inicio }
  }
  const campo = new Campo()
  vTextoLimpio.mounted(campo)
  campo.value = ' '.repeat(1000)
  campo.dispatchEvent(new Event('input'))
  assert.equal(campo.value, '')
  campo.value = '  Loma     Negra  '
  campo.selectionStart = campo.value.length
  campo.dispatchEvent(new Event('input'))
  assert.equal(campo.value, 'Loma Negra ')
  campo.dispatchEvent(new Event('blur'))
  assert.equal(campo.value, 'Loma Negra')
  campo.value = 'x'.repeat(200)
  campo.dispatchEvent(new Event('input'))
  assert.equal(campo.value.length, 150)
  vTextoLimpio.beforeUnmount(campo)
})


test('only received purchases with a purchase invoice are synchronized, once', async () => {
  const states = [{ estadoordencompra_id: 7, nombre: 'Recibida' }, { estadoordencompra_id: 9, nombre: 'Contabilizado' }, { estadoordencompra_id: 2, nombre: 'Pendiente' }]
  const orders = [orden, { ...orden, ordencompra_id: 42 }, { ...orden, ordencompra_id: 43, estado: 2 }, { ...orden, ordencompra_id: 44, estado: 9 }]
  let patches = 0
  handler = config => {
    if (config.method === 'patch') {
      assert.equal(config.url, '/compras/ordenes-compra/41/')
      assert.deepEqual(JSON.parse(config.data), { estado: 9 })
      patches++
      orders[0] = { ...orden, estado: 9 }
      return response(config, orders[0])
    }
    if (config.url === '/compras/ordenes-compra/') return response(config, orders.map(o => ({ ...o })))
    if (config.url === '/compras/estados-orden-compra/') return response(config, states)
    assert.equal(config.url, '/contabilidad/facturas/')
    return response(config, [
      { id: 1, tipo: 'COMPRA', orden_compra_id: 41 },
      { id: 2, tipo: 'COMPRA', orden_compra_id: 41 },
      { id: 3, tipo: 'VENTA', orden_compra_id: 42 },
      { id: 4, tipo: 'COMPRA', orden_compra_id: 43 },
      { id: 5, tipo: 'COMPRA', orden_compra_id: 44 }
    ])
  }
  const pending = compras.sincronizarComprasFacturadas()
  assert.equal(compras.sincronizarComprasFacturadas(), pending)
  const result = await pending
  assert.equal(result.ordenes[0].estado, 9)
  assert.deepEqual(result.errores, [])
  await compras.sincronizarComprasFacturadas()
  assert.equal(patches, 1)
})

test('failed invoice lookup never changes purchase states', async () => {
  handler = config => {
    assert.equal(config.method, 'get')
    if (config.url === '/contabilidad/facturas/') throw new Error('No disponible')
    return response(config, [])
  }
  await assert.rejects(compras.sincronizarComprasFacturadas(), /No disponible/)
})

test('API rejection preserves real order state and allows retry', async () => {
  let reject = true
  handler = config => {
    if (config.method === 'patch') {
      if (reject) throw new Error('Cambio rechazado')
      return response(config, { ...orden, estado: 9 })
    }
    if (config.url === '/compras/ordenes-compra/') return response(config, [{ ...orden }])
    if (config.url === '/compras/estados-orden-compra/') return response(config, [
      { estadoordencompra_id: 7, nombre: 'Recibida' }, { estadoordencompra_id: 9, nombre: 'Contabilizado' }
    ])
    return response(config, [{ tipo: 'COMPRA', orden_compra_id: 41 }])
  }
  const failed = await compras.sincronizarComprasFacturadas()
  assert.equal(failed.ordenes[0].estado, 7)
  assert.equal(failed.errores[0].ordenId, 41)
  reject = false
  const retried = await compras.sincronizarComprasFacturadas()
  assert.equal(retried.ordenes[0].estado, 9)
  assert.deepEqual(retried.errores, [])
})


test('supplier contact filters reject disallowed characters and validate email structure', async () => {
  const v = await import(moduleURL('../src/utils/validacionesCompras.ts'))
  assert.equal(v.filtrarContactoProveedor('ab20-44215209-9 /😀', 'cuit'), '20-44215209-9')
  assert.equal(v.filtrarContactoProveedor('+54 (11) 1234-5678.abc', 'telefono'), '+541112345678')
  assert.equal(v.filtrarContactoProveedor('nombre+ventas @empresa.com <>😀', 'email'), 'nombre+ventas@empresa.com')
  assert.equal(v.filtrarContactoProveedor('++54+11', 'telefono'), '+5411')
  assert.equal(v.filtrarContactoProveedor('54+11', 'telefono'), '5411')
  assert.equal(v.filtrarContactoProveedor('+123456789012345', 'telefono'), '+1234567890123')
  const base = { nombre: 'Proveedor', apellido: 'SA', cuit: '20442152099', email: '', telefono: '', direccion: '', productos: [5] }
  for (const email of ['nombre+ventas@empresa.com', 'a.b@sub.empresa.com', "o'connor@empresa.com"]) {
    assert.equal(v.validarProveedor({ ...base, email }, [5]), '')
  }
  for (const email of ['sin-arroba.com', 'a@@empresa.com', '@empresa.com', 'a@', 'a..b@empresa.com', '.a@empresa.com', 'a@-empresa.com', 'a@empresa..com', 'a@empresa_com.com', 'a<b@empresa.com']) {
    assert.notEqual(v.validarProveedor({ ...base, email }, [5]), '', email)
  }
  for (const telefono of ['+541112345678', '01112345678', '+1234567890123', '12345678901234']) assert.equal(v.validarProveedor({ ...base, telefono }, [5]), '')
  for (const telefono of ['123456789012345', '+12345678901234', '+', '++54', '54+11', '11.5', '-11', '11 22', '(11)', '11a']) {
    assert.notEqual(v.validarProveedor({ ...base, telefono }, [5]), '', telefono)
  }
})
