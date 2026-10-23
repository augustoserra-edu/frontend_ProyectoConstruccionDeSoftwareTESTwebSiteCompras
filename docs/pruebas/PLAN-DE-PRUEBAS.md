# Plan de pruebas del frontend - Compras y Proveedores

## Objetivo y alcance

Aplicar la planificación de pruebas de Clase 8 al frontend Vue de Compras y
Proveedores: detectar errores de validación, estado, presentación y contratos de
servicios antes de publicar cambios. No se modifica ni ejecuta el backend local.
La API desplegada se reserva para integración y E2E con datos de prueba.

La meta de la clase es 80% de líneas de FE y BE. Esta entrega acredita **solo el
alcance frontend de Compras y Proveedores**. No demuestra 80% del frontend completo
ni del backend. El equipo debe integrar las coberturas de los demás módulos si
la entrega académica exige el sistema entero.

Inventario medido en `vitest.config.ts`: los tres modales de proveedor/nueva orden/
consulta de órdenes, las dos vistas, `comprasService`, `proveedoresService`,
`paginacion`, `validacionesCompras` y `textoLimpio`. Se incluyen aunque no se
ejecuten en una prueba. Los tipos sin lógica no forman parte del denominador.

## Correspondencia con la clase

| Requisito | Entregable | Estado |
| --- | --- | --- |
| Plan de pruebas (p. 2) | Este documento | Preparado |
| Pirámide y capas FE (pp. 4-6) | Unitarias aisladas; integración/E2E separados | Unitarias ejecutadas; integración/E2E pendientes |
| Vitest + Vue Test Utils (p. 7) | Suites de servicios, funciones, formularios y vistas | Implementado |
| Coverage HTML y 80% (pp. 8-9) | `npm test`, `coverage/index.html`, umbral de líneas 80 | Alcanzado en el alcance declarado |
| Casos: entrada, acción, esperado (pp. 10-12) | `CASOS-DE-PRUEBA.md` | Preparado |
| Qase: proyecto y suites por módulo (pp. 13-14) | Casos E2E y guía de carga | Diez casos cargados en dos suites; ejecución pendiente; ver QASE.md |
| Defectos y ciclo de vida (pp. 15-16) | `REGISTRO-DE-DEFECTOS.md` | Preparado con evidencias y límites |
| Análisis estático (pp. 17-18, la clase propone SonarCloud) | ESLint + plugin Vue + TypeScript, alternativa elegida por el equipo | Implementado; ver log del análisis |
| Automatización (p. 2) | Workflow de GitHub Actions y logs | Configurado localmente; pendiente de push y ejecución CI |

## Estrategia y ambientes

- **Unitarias/componentes aislados:** Vitest, Vue Test Utils y jsdom. Se montan
  formularios reales; las vistas se prueban con hijos y servicios simulados. Los
  servicios se prueban con un adaptador Axios simulado. No son integración real.
- **Integración FE/API:** ejecutar los casos INT contra el entorno desplegado,
  inspeccionando el request y su respuesta. No atribuir al cliente restricciones
  que solo el servidor puede garantizar.
- **E2E:** un usuario recorre alta de proveedor, orden, recepción y facturación.
  Requiere cuenta de prueba, proveedor/productos controlados y registro en Qase.
  Está diseñado pero no fue ejecutado ni automatizado en navegador en esta entrega.

Ambiente local verificado: Windows, Node 24.15.0, dependencias fijadas en
`package-lock.json`. CI: Ubuntu y Node 24. No se usa `.env` de producción en las
unitarias: setup sustituye la URL y rechaza solicitudes HTTP no simuladas.

## Técnicas y prioridad

1. Clases de equivalencia: CUIT con/sin guiones, email válido/inválido, orden con/
   sin factura, API actual/legada, productos asociados/ajenos.
2. Límites: CUIT de 10/11/12 dígitos; teléfono 13/14/15 caracteres incluyendo `+`;
   cantidades 0/1/2147483647/2147483648; importes negativos/cero/máximo/excedido.
3. Camino feliz: alta y edición válidas, precios de compra, cambios confirmados.
4. Camino de error: duplicados, datos incompletos, fallas de lectura/escritura,
   rechazo del PATCH de contabilización y reintento.

Prioridad alta: contabilización sin factura, importes, duplicados y envío de datos
inválidos. Media: carga, filtros, edición y reintento. Baja: detalles visuales.

## Ejecución y criterios

```sh
npm ci
npm run check
```

Entrada: dependencias instaladas; datos controlados; alcance y resultados
esperados revisados. Salida de unitarias: cero fallos, cobertura de líneas >=80%
del alcance, ESLint sin errores/advertencias, compilación correcta y evidencia conservada. La ejecución completa
falla si alguna prueba falla **o si la cobertura queda por debajo de 80%**.

Antes de una entrega integral: ejecutar INT/E2E, revisar el reporte de ESLint y resolver o
aceptar explícitamente los defectos abiertos. Cobertura alta no implica ausencia
de errores, seguridad garantizada ni comportamiento visual correcto.

## Evidencia y responsables

El desarrollador mantiene las pruebas y corrige defectos. El responsable de QA
del equipo ejecuta INT/E2E, carga casos en Qase y verifica/cierra los defectos.
El responsable del repositorio revisa los reportes de ESLint y el resultado CI.
Asignar nombres reales en las plataformas; no se inventan responsables aquí.

Cada corrida produce log fechado, JUnit, HTML, JSON y LCOV. Adjuntar el log y los
reportes a la ejecución en Qase; para defectos agregar pasos, captura y resultado
obtenido. Los archivos generados están excluidos de Git y se conservan como
artefactos de CI durante 30 días. La documentación y las pruebas sí se versionan.

## Riesgos y limitaciones

- La sincronización contable se dispara al entrar/actualizar Compras. No es una
  transacción atómica con Finanzas y no puede impedir duplicados entre clientes
  si el servidor no los controla.
- Los mocks no verifican que Render acepte el contrato. INT-02 es obligatorio
  antes de afirmar que la sincronización funciona en el ambiente desplegado.
- jsdom no valida diseño responsive, teclado móvil ni apariencia real. Se prueban
  manualmente en E2E y no se deducen de la cobertura.
- El equipo eligió ESLint + plugin Vue como alternativa a SonarCloud. No son
  herramientas equivalentes: ESLint no aporta su panel ni un análisis de seguridad
  completo. La aceptación académica de esta sustitución sigue a cargo de la docente.
- El análisis ESLint abarca los diez archivos del módulo y sus herramientas de
  pruebas. No se presenta como una revisión de todo el frontend.
