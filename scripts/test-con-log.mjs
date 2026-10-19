import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, createWriteStream } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const raiz = fileURLToPath(new URL('../', import.meta.url))
const suites = {
  compras: 'compras',
  proveedores: 'proveedores'
}
const seleccion = process.argv.slice(2)
if (seleccion.some(nombre => !Object.hasOwn(suites, nombre))) {
  console.error('Suite inválida. Usá compras, proveedores o ningún argumento para ejecutar ambas.')
  process.exit(1)
}
const nombres = seleccion.length ? [...new Set(seleccion)] : Object.keys(suites)
const inicio = new Date()
let revision = 'No disponible'
try {
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: raiz, encoding: 'utf8' }).trim()
  const cambios = execFileSync('git', ['status', '--porcelain'], { cwd: raiz, encoding: 'utf8' }).trim()
  revision = `${commit}${cambios ? ' (con cambios locales)' : ''}`
} catch { /* También se puede ejecutar fuera de un checkout Git. */ }
const carpeta = join(raiz, 'logs', 'tests')
mkdirSync(carpeta, { recursive: true })
const archivo = join(carpeta, `${inicio.toISOString().replace(/[:.]/g, '-')}-${process.pid}.log`)
const log = createWriteStream(archivo, { flags: 'wx' })
log.on('error', error => {
  console.error('No se pudo guardar el log:', error.message)
  process.exit(1)
})
function escribir(texto) {
  process.stdout.write(texto)
  log.write(texto)
}
escribir(`Inicio (UTC): ${inicio.toISOString()}\nNode: ${process.version}\nRevisión: ${revision}\nSuites: ${nombres.join(', ')}\nCobertura: ${seleccion.length ? 'No medida (ejecución parcial)' : 'Alcance Compras/Proveedores; mínimo 80% de líneas'}\nLog: ${archivo}\n\n`)
const argumentos = [join(raiz, 'node_modules/vitest/vitest.mjs'), 'run', '--reporter=verbose', '--reporter=junit', '--outputFile.junit=reports/junit.xml']
if (!seleccion.length) argumentos.push('--coverage')
else argumentos.push(...nombres.map(nombre => suites[nombre]))
const proceso = spawn(process.execPath, argumentos, {
  cwd: raiz,
  env: { ...process.env, NO_COLOR: '1' },
  stdio: ['ignore', 'pipe', 'pipe']
})
proceso.stdout.on('data', escribir)
proceso.stderr.on('data', escribir)
proceso.on('error', error => escribir(`Error al iniciar pruebas: ${error.message}\n`))
proceso.on('close', (codigo, signal) => {
  const salida = codigo ?? 1
  escribir(`\nFin (UTC): ${new Date().toISOString()}\nDuración: ${Date.now() - inicio.getTime()} ms\nResultado: ${salida === 0 ? 'APROBADO' : 'FALLIDO'}\nCódigo de salida: ${salida}${signal ? ` (${signal})` : ''}\n`)
  log.end(() => { process.exitCode = salida })
})
