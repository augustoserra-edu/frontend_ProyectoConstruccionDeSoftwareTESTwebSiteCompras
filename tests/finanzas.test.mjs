import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import axios from 'axios'

process.env.TZ = 'America/Argentina/Buenos_Aires'

let token = 'token-prueba'
let sesionLimpiada = 0
let eventos = []
let destino = ''
Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => token, clear: () => { sesionLimpiada++ } }, configurable: true })
Object.defineProperty(globalThis, 'sessionStorage', { value: { clear: () => {} }, configurable: true })
Object.defineProperty(globalThis, 'window', {
  value: {
    dispatchEvent: evento => { eventos.push(evento.type) },
    location: { set href(valor) { destino = valor } }
  },
  configurable: true
})
let handler
let ultimo
axios.defaults.adapter = async config => { ultimo = config; return handler(config) }
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
const base = await import(moduleURL('../src/services/finanzasApi.ts'))
const periodos = await import(moduleURL('../src/services/periodosService.ts'))
const cierres = await import(moduleURL('../src/services/cierresService.ts'))
const diarios = await import(moduleURL('../src/services/diariosService.ts'))
const facturas = await import(moduleURL('../src/services/facturasService.ts'))
const ordenes = await import(moduleURL('../src/services/ordenesParaFacturarService.ts'))
const formato = await import(moduleURL('../src/utils/formatoFinanzas.ts'))
// SweetAlert2 consulta el DOM al cerrar la sesión; se define recién después de importarlo
// (si existiera al importar, intentaría inyectar sus estilos) y alcanza con un documento vacío.
Object.defineProperty(globalThis, 'document', { value: { querySelector: () => null, body: { querySelector: () => null } }, configurable: true })

const response = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} })
const pagina = (results, next = null) => ({ count: results.length, next, previous: null, results })
const errorHttp = (status, data) => handlerError => new axios.AxiosError('error', 'ERR_BAD_REQUEST', handlerError, null, { status, data, headers: {}, config: handlerError })

// ---------- formatoFinanzas ----------

test('aNumero converts API decimals and falls back to zero for anything that is not a number', () => {
  assert.equal(formato.aNumero('271.00'), 271)
  assert.equal(formato.aNumero('0.10'), 0.1)
  assert.equal(formato.aNumero(12.5), 12.5)
  assert.equal(formato.aNumero('9999999999.99'), 9999999999.99)
  for (const raro of [null, undefined, 'abc', NaN, Infinity]) assert.equal(formato.aNumero(raro), 0, String(raro))
})

test('period labels use the Spanish month names and keep unknown months visible', () => {
  assert.equal(Object.keys(formato.NOMBRES_MESES).length, 12)
  assert.equal(formato.etiquetaPeriodo(2026, 1), 'Enero 2026')
  assert.equal(formato.etiquetaPeriodo(2026, 9), 'Septiembre 2026')
  assert.equal(formato.etiquetaPeriodo(2026, 12), 'Diciembre 2026')
  assert.equal(formato.etiquetaPeriodo(2026, 13), '13 2026')
})

test('money is formatted in es-AR with thousands separators and always two decimals', () => {
  assert.equal(formato.formatoMoneda(0), '$0,00')
  assert.equal(formato.formatoMoneda(12.1), '$12,10')
  assert.equal(formato.formatoMoneda(1234.5), '$1.234,50')
  assert.equal(formato.formatoMoneda(9999999999.99), '$9.999.999.999,99')
})

test('dates accept ISO with offset, show a dash when empty and keep unparsable text', () => {
  assert.equal(formato.formatoFecha(null), '-')
  assert.equal(formato.formatoFecha(undefined), '-')
  assert.equal(formato.formatoFecha(''), '-')
  assert.equal(formato.formatoFecha('2026-09-18T12:00:00-03:00'), '18/9/2026')
  assert.equal(formato.formatoFecha('no es fecha'), 'no es fecha')
})

// ---------- finanzasApi: autenticación, 401 y paginación ----------

test('requests carry the JWT from localStorage and omit the header when there is no token', async () => {
  handler = config => response(config, pagina([]))
  await base.obtenerTodos('/contabilidad/periodos/')
  assert.equal(ultimo.headers.Authorization, 'Bearer token-prueba')
  token = null
  await base.obtenerTodos('/contabilidad/periodos/')
  assert.equal(ultimo.headers.Authorization, undefined)
  token = 'token-prueba'
})

test('a 401 closes the session once, redirects to login and still rejects the call', async () => {
  sesionLimpiada = 0; eventos = []; destino = ''
  handler = config => { throw errorHttp(401, { detail: 'Token inválido' })(config) }
  await assert.rejects(periodos.obtenerPeriodos(), error => error.response.status === 401)
  assert.equal(sesionLimpiada, 1)
  assert.deepEqual(eventos, ['auth:unauthorized'])
  assert.equal(destino, '/login')
})

test('other errors do not close the session', async () => {
  sesionLimpiada = 0; eventos = []
  for (const status of [400, 403, 404, 500]) {
    handler = config => { throw errorHttp(status, {})(config) }
    await assert.rejects(periodos.obtenerPeriodos())
  }
  assert.equal(sesionLimpiada, 0)
  assert.deepEqual(eventos, [])
})

test('obtenerTodos walks every page in order and concatenates the results', async () => {
  const pedidas = []
  handler = config => {
    assert.equal(config.method, 'get')
    assert.equal(config.url, '/contabilidad/diarios/')
    pedidas.push(config.params.page)
    const n = config.params.page
    return response(config, pagina([{ id: n }], n < 3 ? `http://interno/api/?page=${n + 1}` : null))
  }
  assert.deepEqual(await base.obtenerTodos('/contabilidad/diarios/'), [{ id: 1 }, { id: 2 }, { id: 3 }])
  assert.deepEqual(pedidas, [1, 2, 3])
})

test('obtenerTodos handles empty lists and stops after 100 pages if the server never ends', async () => {
  handler = config => response(config, pagina([]))
  assert.deepEqual(await base.obtenerTodos('/x/'), [])
  let llamadas = 0
  handler = config => { llamadas++; return response(config, pagina([{ id: llamadas }], 'siempre-hay-mas')) }
  const todo = await base.obtenerTodos('/x/')
  assert.equal(llamadas, 100)
  assert.equal(todo.length, 100)
})

test('obtenerTodos rejects responses that are not a paginated list', async () => {
  for (const cuerpo of [[{ id: 1 }], { results: 'x' }, {}, null, '<html>']) {
    handler = config => response(config, cuerpo)
    await assert.rejects(base.obtenerTodos('/x/'), /formato esperado/)
  }
})

// ---------- mensajeDeError ----------

test('errors without a response explain the connection problem', () => {
  const sinRespuesta = new axios.AxiosError('Network Error', 'ERR_NETWORK')
  assert.match(base.mensajeDeError(sinRespuesta), /No se pudo conectar con el servidor/)
})

test('HTTP status codes map to fixed user messages', () => {
  const con = status => base.mensajeDeError(errorHttp(status, {})({}))
  assert.equal(con(401), '')
  assert.equal(con(403), 'No tenés permisos para realizar esta acción.')
  assert.equal(con(404), 'No se encontró el recurso solicitado.')
  assert.equal(con(500), 'Error interno del servidor. Intentá de nuevo más tarde.')
  assert.equal(con(503), 'Error interno del servidor. Intentá de nuevo más tarde.')
  assert.equal(con(418), 'El servidor respondió con el error 418.')
})

test('400 validation errors are flattened and prefixed with the field name', () => {
  const con = data => base.mensajeDeError(errorHttp(400, data)({}))
  assert.equal(con({ non_field_errors: ['El período 09/2026 ya está cerrado y no admite cambios.'] }), 'El período 09/2026 ya está cerrado y no admite cambios.')
  assert.equal(con({ detail: 'Credenciales inválidas.' }), 'Credenciales inválidas.')
  assert.equal(con({ numero: ['Ya existe una factura con ese número.'] }), 'numero: Ya existe una factura con ese número.')
  assert.equal(con({ anio: ['Debe ser mayor o igual a 2000.'], mes: ['Debe estar entre 1 y 12.'] }), 'anio: Debe ser mayor o igual a 2000. mes: Debe estar entre 1 y 12.')
  assert.equal(con({ detalles: [{ cantidad: ['Debe ser mayor que cero.'] }, { precio_unitario: ['No puede ser negativo.'] }] }), 'cantidad: Debe ser mayor que cero. precio_unitario: No puede ser negativo.')
  assert.equal(con(['Ya existe un período para ese año y mes.']), 'Ya existe un período para ese año y mes.')
  assert.equal(con('Texto plano'), 'Texto plano')
})

test('400 without usable details, plain Errors and unknown values still produce a message', () => {
  for (const data of [{}, [], null, undefined]) assert.equal(base.mensajeDeError(errorHttp(400, data)({})), 'Los datos enviados no son válidos.')
  assert.equal(base.mensajeDeError(new Error('Fallo local')), 'Fallo local')
  assert.equal(base.mensajeDeError('texto'), 'Ocurrió un error inesperado.')
  assert.equal(base.mensajeDeError(undefined), 'Ocurrió un error inesperado.')
})

// ---------- Períodos ----------

test('periods: list, get by id, create and update use the contabilidad endpoints', async () => {
  const periodo = { id: 4, anio: 2026, mes: 9 }
  handler = config => response(config, pagina([periodo]))
  assert.deepEqual(await periodos.obtenerPeriodos(), [periodo])

  handler = config => {
    assert.equal(config.method, 'get')
    assert.equal(config.url, '/contabilidad/periodos/4/')
    return response(config, periodo)
  }
  assert.deepEqual(await periodos.obtenerPeriodoPorId(4), periodo)

  handler = config => {
    assert.equal(config.method, 'post')
    assert.equal(config.url, '/contabilidad/periodos/')
    assert.deepEqual(JSON.parse(config.data), { anio: 2026, mes: 10 })
    return response(config, { id: 5, anio: 2026, mes: 10 })
  }
  assert.deepEqual(await periodos.crearPeriodo({ anio: 2026, mes: 10 }), { id: 5, anio: 2026, mes: 10 })

  handler = config => {
    assert.equal(config.method, 'put')
    assert.equal(config.url, '/contabilidad/periodos/5/')
    assert.deepEqual(JSON.parse(config.data), { anio: 2027, mes: 1 })
    return response(config, { id: 5, anio: 2027, mes: 1 })
  }
  assert.equal((await periodos.actualizarPeriodo(5, { anio: 2027, mes: 1 })).anio, 2027)
})

test('creating a duplicated period surfaces the backend message to the screen', async () => {
  handler = config => { throw errorHttp(400, { non_field_errors: ['Ya existe un período para ese año y mes.'] })(config) }
  await assert.rejects(periodos.crearPeriodo({ anio: 2026, mes: 9 }), error => base.mensajeDeError(error) === 'Ya existe un período para ese año y mes.')
})

// ---------- Cierres ----------

test('monthly closures: list and close sends only the CERRADO state', async () => {
  const cierre = { id: 4, periodo: 4, fecha_cierre: null, estado: 'ABIERTO' }
  handler = config => response(config, pagina([cierre]))
  assert.deepEqual(await cierres.obtenerCierres(), [cierre])

  handler = config => {
    assert.equal(config.method, 'put')
    assert.equal(config.url, '/contabilidad/cierres-mensuales/4/')
    assert.deepEqual(JSON.parse(config.data), { estado: 'CERRADO' })
    return response(config, { ...cierre, estado: 'CERRADO', fecha_cierre: '2026-09-30T20:00:00-03:00' })
  }
  const cerrado = await cierres.cerrarCierre(4)
  assert.equal(cerrado.estado, 'CERRADO')
  assert.ok(cerrado.fecha_cierre)
})

test('closing an already closed month propagates the backend rejection', async () => {
  handler = config => { throw errorHttp(400, { non_field_errors: ['Un cierre CERRADO no se puede modificar.'] })(config) }
  await assert.rejects(cierres.cerrarCierre(4), error => /no se puede modificar/.test(base.mensajeDeError(error)))
})

// ---------- Libro diario ----------

test('journal entries are read across all pages and are read-only', async () => {
  const asientos = [{ id: 1, cierre_mensual: 4, fecha: '2026-09-18', descripcion: 'Factura de venta B-0000002 (orden de venta #2)' }, { id: 2, cierre_mensual: 4, fecha: '2026-09-19', descripcion: 'Factura de compra FC-000003 (orden de compra #3)' }]
  const metodos = []
  handler = config => {
    metodos.push(config.method)
    return response(config, config.params.page === 1 ? pagina([asientos[0]], 'sigue') : pagina([asientos[1]]))
  }
  assert.deepEqual(await diarios.obtenerDiarios(), asientos)
  assert.deepEqual(metodos, ['get', 'get'])
  assert.equal(Object.keys(diarios).join(), 'obtenerDiarios')
})

// ---------- Facturas ----------

const facturaCruda = {
  id: 7, orden_venta_id: 14, orden_compra_id: null, diario: 22, tipo: 'VENTA', numero: 'B-0000002', fecha: '2026-09-18',
  subtotal: '10.00', impuestos: '2.10', total: '12.10',
  detalles: [{ id: 1, producto_id: 2, cantidad: 1, precio_unitario: '10.00', subtotal: '10.00' }]
}

test('invoices turn every decimal string into a number, including nested items', async () => {
  handler = config => response(config, pagina([facturaCruda]))
  assert.deepEqual(await facturas.obtenerFacturas(), [{
    id: 7, orden_venta_id: 14, orden_compra_id: null, diario: 22, tipo: 'VENTA', numero: 'B-0000002', fecha: '2026-09-18',
    subtotal: 10, impuestos: 2.1, total: 12.1,
    detalles: [{ id: 1, producto_id: 2, cantidad: 1, precio_unitario: 10, subtotal: 10 }]
  }])
})

test('invoices tolerate missing items and legacy invoices without a journal entry', async () => {
  handler = config => response(config, pagina([{ ...facturaCruda, detalles: undefined, diario: null }, { ...facturaCruda, id: 8, detalles: null }]))
  const lista = await facturas.obtenerFacturas()
  assert.deepEqual(lista.map(f => f.detalles), [[], []])
  assert.equal(lista[0].diario, null)
})

test('creating a purchase invoice posts the exact body and converts the answer', async () => {
  const cuerpo = {
    tipo: 'COMPRA', numero: 'FC-000041', fecha: '2026-09-18', orden_compra_id: 41, impuestos: '4.41',
    detalles: [{ producto_id: 5, cantidad: 2, precio_unitario: '10.50' }]
  }
  handler = config => {
    assert.equal(config.method, 'post')
    assert.equal(config.url, '/contabilidad/facturas/')
    assert.deepEqual(JSON.parse(config.data), cuerpo)
    return response(config, { ...facturaCruda, id: 9, tipo: 'COMPRA', numero: 'FC-000041', orden_venta_id: null, orden_compra_id: 41, subtotal: '21.00', impuestos: '4.41', total: '25.41' })
  }
  const creada = await facturas.crearFactura(cuerpo)
  assert.equal(creada.id, 9)
  assert.equal(creada.orden_compra_id, 41)
  assert.equal(creada.orden_venta_id, null)
  assert.equal(creada.total, 25.41)
  assert.equal(typeof creada.subtotal, 'number')
})

test('invoice creation errors reach the screen with the backend wording', async () => {
  const cuerpo = { tipo: 'VENTA', numero: 'B-1', fecha: '2026-09-18', orden_venta_id: 1, impuestos: '0.00', detalles: [] }
  const casos = [
    [{ non_field_errors: ['El período 09/2026 ya está cerrado y no admite cambios.'] }, 'El período 09/2026 ya está cerrado y no admite cambios.'],
    [{ non_field_errors: ['Los campos tipo, numero deben formar un conjunto único.'] }, 'Los campos tipo, numero deben formar un conjunto único.'],
    [{ subtotal: ['El importe supera el máximo permitido.'] }, 'subtotal: El importe supera el máximo permitido.']
  ]
  for (const [data, esperado] of casos) {
    handler = config => { throw errorHttp(400, data)(config) }
    await assert.rejects(facturas.crearFactura(cuerpo), error => base.mensajeDeError(error) === esperado)
  }
})

// ---------- Órdenes para facturar ----------

function rutearOrdenes({ compras = [], proveedores = [], estados = [], ventas = [], clientes = [] }) {
  return config => {
    const tablas = {
      '/compras/ordenes-compra/': compras,
      '/compras/proveedores/': proveedores,
      '/compras/estados-orden-compra/': estados,
      '/ventas/ordenes-venta/': ventas,
      '/ventas/clientes/': clientes
    }
    assert.equal(config.method, 'get', 'Finanzas solo debe leer las órdenes de otros módulos')
    assert.ok(config.url in tablas, `ruta inesperada ${config.url}`)
    return response(config, pagina(tablas[config.url]))
  }
}

test('purchase orders resolve supplier and state names and compute line subtotals', async () => {
  handler = rutearOrdenes({
    compras: [{ ordencompra_id: 41, proveedor: 12, estado: 7, fecha: '2026-10-01T15:00:00Z', total: '21.00', detalles: [{ ordencompradetalle_id: 81, producto_id: 5, cantidad: 2, precio_unitario: '10.50' }] }],
    proveedores: [{ proveedor_id: 12, nombre: 'Materiales', apellido: 'Sur' }],
    estados: [{ estadoordencompra_id: 7, nombre: 'Recibida' }]
  })
  assert.deepEqual(await ordenes.obtenerOrdenesCompra(), [{
    orden_id: 41, tipo_orden: 'Compra', origen_id: 12, entidad_nombre: 'Materiales Sur', fecha: '2026-10-01T15:00:00Z', estado_nombre: 'Recibida', total: 21,
    detalles: [{ detalle_id: 81, producto_id: 5, producto_nombre: 'Producto #5', cantidad: 2, preciounitario: 10.5, subtotal: 21 }]
  }])
})

test('purchase orders fall back to readable placeholders when a lookup is missing', async () => {
  handler = rutearOrdenes({
    compras: [
      { ordencompra_id: 1, proveedor: 99, estado: 98, fecha: '2026-10-01', total: '0.00', detalles: undefined },
      { ordencompra_id: 2, proveedor: 12, estado: 7, fecha: '2026-10-01', total: '5.00', detalles: [] }
    ],
    proveedores: [{ proveedor_id: 12, nombre: 'Solo', apellido: null }],
    estados: [{ estadoordencompra_id: 7, nombre: 'Aprobada' }]
  })
  const [huerfana, completa] = await ordenes.obtenerOrdenesCompra()
  assert.equal(huerfana.entidad_nombre, 'Proveedor #99')
  assert.equal(huerfana.estado_nombre, 'Estado #98')
  assert.deepEqual(huerfana.detalles, [])
  assert.equal(completa.entidad_nombre, 'Solo')
})

test('sales orders read items, discounts and voucher number, and resolve the client', async () => {
  handler = rutearOrdenes({
    ventas: [{
      id: 14, cliente: 3, numero_comprobante: 'B-0000002', estado: 2, estado_nombre: 'En proceso', fecha: '2026-09-18T10:00:00-03:00', total: '18.00',
      items: [{ id: 1, producto: 2, producto_nombre: 'Cemento', cantidad: 2, precio_unitario: '10.00', descuento: '2.00', subtotal: '18.00' }]
    }],
    clientes: [{ id_cliente: 3, nombre: 'Ana' }]
  })
  assert.deepEqual(await ordenes.obtenerOrdenesVenta(), [{
    orden_id: 14, tipo_orden: 'Venta', origen_id: 3, entidad_nombre: 'Ana', fecha: '2026-09-18T10:00:00-03:00', estado_nombre: 'En proceso', total: 18, numero_comprobante: 'B-0000002',
    detalles: [{ detalle_id: 1, producto_id: 2, producto_nombre: 'Cemento', cantidad: 2, preciounitario: 10, descuento: 2, subtotal: 18 }]
  }])
})

test('sales orders fall back to placeholders and keep a missing voucher number as null', async () => {
  handler = rutearOrdenes({
    ventas: [{
      id: 15, cliente: 77, numero_comprobante: null, estado: 5, estado_nombre: '', fecha: '2026-09-18', total: '10.00',
      items: [{ id: 2, producto: 9, producto_nombre: '', cantidad: 1, precio_unitario: '10.00', descuento: '0.00', subtotal: '10.00' }]
    }, { id: 16, cliente: 77, numero_comprobante: null, estado: 5, estado_nombre: 'Anulada', fecha: '2026-09-18', total: '0.00', items: undefined }]
  })
  const [primera, segunda] = await ordenes.obtenerOrdenesVenta()
  assert.equal(primera.entidad_nombre, 'Cliente #77')
  assert.equal(primera.estado_nombre, 'Estado #5')
  assert.equal(primera.numero_comprobante, null)
  assert.equal(primera.detalles[0].producto_nombre, 'Producto #9')
  assert.deepEqual(segunda.detalles, [])
})

test('cancelled or voided orders are detected regardless of case and wording', () => {
  for (const estado of ['Cancelada', 'CANCELADO', 'Anulada', 'anulado', 'Orden Anulada']) {
    assert.equal(ordenes.esOrdenCancelada({ estado_nombre: estado }), true, estado)
  }
  for (const estado of ['Pendiente', 'En proceso', 'Recibida', 'Contabilizado', 'Confirmada', '']) {
    assert.equal(ordenes.esOrdenCancelada({ estado_nombre: estado }), false, estado)
  }
})

test('a failing lookup rejects the whole order list instead of showing partial data', async () => {
  handler = config => {
    if (config.url === '/compras/proveedores/') throw new Error('No disponible')
    return response(config, pagina([]))
  }
  await assert.rejects(ordenes.obtenerOrdenesCompra(), /No disponible/)
})
