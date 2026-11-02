# Registro de ejecución de pruebas del frontend

**Identificador:** FE-REG-2026-11-02

Registro de la ejecución local del 02/11/2026, aproximadamente a las 12:18 h (Argentina, UTC-3). Frontend Vue y TypeScript, Windows, Node 24.15.0. Comando: npm run check. Revisión base: e134b89ef8efd025827b87c7790c61ca71eff20f, con cambios locales. Este documento consolida la corrida existente; no representa una nueva ejecución.

## Resultado de la ejecución

| Verificación | Resultado |
| --- | --- |
| Pruebas ejecutadas | 78 |
| Aprobadas / fallidas / omitidas | 78 / 0 / 0 |
| Compras y Proveedores (Vitest) | 49 aprobadas, 6 archivos |
| Servicios de Finanzas (Node) | 29 aprobadas, 1 archivo |
| ESLint | 23 archivos; 0 errores y 0 advertencias |
| Tipos y compilación | Aprobados |
| Cobertura de líneas | 92,92% (762/820); mínimo 80% |
| Cobertura de ramas | 83,19% (827/994) |

Se ejecutaron pruebas unitarias de servicios y funciones, pruebas de componentes con Vue Test Utils y jsdom, análisis estático y validación de tipos y compilación. Las solicitudes HTTP de las pruebas están simuladas. Las comprobaciones de contratos describen lo que envía y procesa el cliente.

## Casos incorporados y ajuste de ejecución

- CP-C08: verifica comprobantes y búsqueda de la orden seleccionada, excluyendo comprobantes de otras órdenes.
- CP-C09: verifica bloqueo de acciones y cierre con Escape durante actualización y recuperación al finalizar.
- CP-C10: verifica que una orden sin renglones no se apruebe y que estados desconocidos no ofrezcan transiciones.
- Las 29 pruebas de Finanzas ahora se incluyen en npm test y npm run check. Antes requerían ejecución separada.

## Cobertura por archivo

| Archivo dentro de src | Líneas | Cobertura |
| --- | --- | --- |
| components/ModalNuevaOrdenCompra.vue | 123/129 | 95,34% |
| components/ModalProveedor.vue | 72/73 | 98,63% |
| components/ModalVerOrdenesCompra.vue | 92/108 | 85,18% |
| directives/textoLimpio.ts | 26/26 | 100% |
| services/comprasService.ts | 77/77 | 100% |
| services/paginacion.ts | 9/9 | 100% |
| services/proveedoresService.ts | 31/33 | 93,93% |
| utils/validacionesCompras.ts | 35/35 | 100% |
| views/OrdenesDeCompras.vue | 181/204 | 88,72% |
| views/ProveedoresView.vue | 116/126 | 92,06% |

## Alcance pendiente

- INT-01: listado con API real; INT-02: sincronización contable; INT-03: orden sin factura; INT-04: desconexión y recuperación.
- E2E-P01: alta y consulta de proveedor; E2E-P02: validaciones; E2E-C01: orden, recepción y facturación; E2E-C02: cancelar confirmación.
- Los ocho recorridos anteriores están diseñados y pendientes de ejecución. No se acredita ejecución en navegador real ni Qase.
- La cobertura se limita a diez archivos de Compras/Proveedores. No mide todo el frontend. Finanzas acredita pruebas de servicios, no cobertura de sus vistas.

## Evidencias y reproducción

Comando completo: `npm run check`.

Para reproducir con dependencias recién instaladas: `npm ci` y luego `npm run check`.

Los archivos generados se reemplazan al ejecutar nuevamente. Conservar una copia junto a la entrega.

- `logs/revision-completa.log`: Salida completa de lint, las dos suites y compilación.
- `reports/junit.xml`: Detalle de las 49 pruebas Vitest; no incluye las 29 de Node.
- `reports/eslint-summary.json`: Resumen verificable del análisis estático.
- `coverage/coverage-summary.json`: Métricas por archivo de Compras/Proveedores.
- `coverage/index.html`: Reporte de cobertura navegable.
- `docs/pruebas/CASOS-DE-PRUEBA.md`: Entradas, pasos y resultados esperados de los casos diseñados.

## Registro individual de pruebas

Los identificadores REG-FE son propios de este registro. Se conservan los nombres originales para rastrear cada resultado en los reportes.

### tests/compras-proveedores.paginacion.test.ts

**Resultado: 5 aprobadas.**

| ID de registro | Prueba ejecutada | Resultado |
| --- | --- | --- |
| REG-FE-001 | Paginación compartida de Compras y Proveedores > devuelve un catálogo vacío sin pedir otra página (arreglo) | Aprobado |
| REG-FE-002 | Paginación compartida de Compras y Proveedores > devuelve un catálogo vacío sin pedir otra página (página) | Aprobado |
| REG-FE-003 | Paginación compartida de Compras y Proveedores > rechaza un listado mal formado en vez de mostrarlo como vacío | Aprobado |
| REG-FE-004 | Paginación compartida de Compras y Proveedores > propaga el error de la segunda página sin devolver un catálogo incompleto | Aprobado |
| REG-FE-005 | Paginación compartida de Compras y Proveedores > conserva los registros si la última página usa el formato de arreglo | Aprobado |

### tests/compras-proveedores.vistas.test.ts

**Resultado: 5 aprobadas.**

| ID de registro | Prueba ejecutada | Resultado |
| --- | --- | --- |
| REG-FE-006 | CP-P06: vista lista, ordena, filtra y permite crear/editar proveedor | Aprobado |
| REG-FE-007 | CP-P07: CUIT duplicado bloquea la API; errores se muestran y permiten reintentar | Aprobado |
| REG-FE-008 | CP-C05: listado de compras ordena, filtra, pagina y abre detalle | Aprobado |
| REG-FE-009 | CP-C06: crear/editar orden y confirmar o cancelar cambio de estado | Aprobado |
| REG-FE-010 | CP-C07: fallos de carga, sincronización y guardado son visibles | Aprobado |

### tests/compras.componentes.test.ts

**Resultado: 7 aprobadas.**

| ID de registro | Prueba ejecutada | Resultado |
| --- | --- | --- |
| REG-FE-011 | CP-C08: comprobantes se muestran y buscan solo en su orden asociada | Aprobado |
| REG-FE-012 | CP-C09: actualizar bloquea cierre por Escape y acciones hasta terminar | Aprobado |
| REG-FE-013 | CP-C10: orden sin renglones no se aprueba y estado desconocido no ofrece transiciones | Aprobado |
| REG-FE-014 | CP-C01: nueva orden usa precio de compra, calcula total y emite una sola orden | Aprobado |
| REG-FE-015 | CP-C02: cantidades inválidas, búsqueda y renglones duplicados | Aprobado |
| REG-FE-016 | CP-C03: edición conserva precio histórico y rechaza productos repetidos | Aprobado |
| REG-FE-017 | CP-C04: detalle muestra acciones según estado, factura y filtros | Aprobado |

### tests/compras.test.mjs

**Resultado: 22 aprobadas.**

| ID de registro | Prueba ejecutada | Resultado |
| --- | --- | --- |
| REG-FE-018 | Los estados y totales decimales del servidor se muestran sin inventar registros | Aprobado |
| REG-FE-019 | Las órdenes nuevas se envían en una sola solicitud con sus detalles y sin campos simulados | Aprobado |
| REG-FE-020 | Las compras nuevas guardan la hora de envío y no una hora fija al mediodía | Aprobado |
| REG-FE-021 | El detalle muestra la fecha y hora argentina sin segundos ni UTC | Aprobado |
| REG-FE-022 | La edición actualiza productos, conserva fecha y estado e informa los rechazos | Aprobado |
| REG-FE-023 | El cambio de estado envía el identificador del catálogo e informa los errores | Aprobado |
| REG-FE-024 | Las facturas se filtran por orden y se adaptan desde la API contable | Aprobado |
| REG-FE-025 | El flujo de compras respeta las transiciones permitidas y los estados finales | Aprobado |
| REG-FE-026 | El catálogo ordena los seis estados conservando sus nombres e identificadores | Aprobado |
| REG-FE-027 | Los proveedores conservan sus precios de compra, incluidos los faltantes y los valores cero | Aprobado |
| REG-FE-028 | El rechazo reconoce variantes del catálogo sin inventar estados faltantes | Aprobado |
| REG-FE-029 | Los productos del formato anterior siguen disponibles con sus precios de catálogo | Aprobado |
| REG-FE-030 | La validación del proveedor normaliza espacios y verifica campos y productos del catálogo | Aprobado |
| REG-FE-031 | Las fechas e importes rechazan valores inválidos o fuera de rango y permiten importe cero | Aprobado |
| REG-FE-032 | Los campos normalizan espacios antes de actualizar los datos y recortan al perder el foco | Aprobado |
| REG-FE-033 | Solo se sincronizan una vez las compras recibidas que tienen factura de compra | Aprobado |
| REG-FE-034 | Una consulta fallida de facturas no cambia los estados de compra | Aprobado |
| REG-FE-035 | El rechazo de la API conserva el estado real de la orden y permite reintentar | Aprobado |
| REG-FE-036 | Los filtros de contacto excluyen caracteres no permitidos y validan el email | Aprobado |
| REG-FE-037 | Los límites de contacto exigen 11 dígitos de CUIT y hasta 14 caracteres de teléfono | Aprobado |
| REG-FE-038 | supplier validation returns every invalid field in a single submit | Aprobado |
| REG-FE-039 | API field errors retain nested row paths and separate general failures | Aprobado |

### tests/proveedores.componentes.test.ts

**Resultado: 5 aprobadas.**

| ID de registro | Prueba ejecutada | Resultado |
| --- | --- | --- |
| REG-FE-040 | Proveedor: formulario aislado > CP-P01: alta válida emite datos normalizados y precios, sin llamar a la API | Aprobado |
| REG-FE-041 | Proveedor: formulario aislado > CP-P02: filtra CUIT y teléfono al escribir o pegar, incluido límite 14 | Aprobado |
| REG-FE-042 | Proveedor: formulario aislado > CP-P03: email sin @ bloquea el envío y muestra error | Aprobado |
| REG-FE-043 | Proveedor: formulario aislado > CP-P04: precio vacío o negativo bloquea; cero es válido | Aprobado |
| REG-FE-044 | Proveedor: formulario aislado > CP-P05: catálogo, búsqueda, cierre y estado guardando | Aprobado |

### tests/proveedores.test.mjs

**Resultado: 5 aprobadas.**

| ID de registro | Prueba ejecutada | Resultado |
| --- | --- | --- |
| REG-FE-045 | Los catálogos consultan todas las páginas sin seguir direcciones externas | Aprobado |
| REG-FE-046 | Los registros del formato anterior conservan sus asociaciones y bloquean escrituras incompatibles | Aprobado |
| REG-FE-047 | El primer proveedor envía precios de compra aunque el listado esté vacío | Aprobado |
| REG-FE-048 | El catálogo conserva identificadores y códigos, normaliza valores y no inventa productos | Aprobado |
| REG-FE-049 | La edición normaliza identificadores de productos y conserva precios en el formato de la API | Aprobado |

### tests/finanzas.test.mjs

**Resultado: 29 aprobadas.**

| ID de registro | Prueba ejecutada | Resultado |
| --- | --- | --- |
| REG-FE-050 | aNumero converts API decimals and falls back to zero for anything that is not a number | Aprobado |
| REG-FE-051 | period labels use the Spanish month names and keep unknown months visible | Aprobado |
| REG-FE-052 | money is formatted in es-AR with thousands separators and always two decimals | Aprobado |
| REG-FE-053 | dates accept ISO with offset, show a dash when empty and keep unparsable text | Aprobado |
| REG-FE-054 | requests carry the JWT from localStorage and omit the header when there is no token | Aprobado |
| REG-FE-055 | a 401 closes the session once, redirects to login and still rejects the call | Aprobado |
| REG-FE-056 | other errors do not close the session | Aprobado |
| REG-FE-057 | obtenerTodos walks every page in order and concatenates the results | Aprobado |
| REG-FE-058 | obtenerTodos handles empty lists and stops after 100 pages if the server never ends | Aprobado |
| REG-FE-059 | obtenerTodos rejects responses that are not a paginated list | Aprobado |
| REG-FE-060 | errors without a response explain the connection problem | Aprobado |
| REG-FE-061 | HTTP status codes map to fixed user messages | Aprobado |
| REG-FE-062 | 400 validation errors are flattened and prefixed with the field name | Aprobado |
| REG-FE-063 | 400 without usable details, plain Errors and unknown values still produce a message | Aprobado |
| REG-FE-064 | periods: list, get by id, create and update use the contabilidad endpoints | Aprobado |
| REG-FE-065 | creating a duplicated period surfaces the backend message to the screen | Aprobado |
| REG-FE-066 | monthly closures: list and close sends only the CERRADO state | Aprobado |
| REG-FE-067 | closing an already closed month propagates the backend rejection | Aprobado |
| REG-FE-068 | journal entries are read across all pages and are read-only | Aprobado |
| REG-FE-069 | invoices turn every decimal string into a number, including nested items | Aprobado |
| REG-FE-070 | invoices tolerate missing items and legacy invoices without a journal entry | Aprobado |
| REG-FE-071 | creating a purchase invoice posts the exact body and converts the answer | Aprobado |
| REG-FE-072 | invoice creation errors reach the screen with the backend wording | Aprobado |
| REG-FE-073 | purchase orders resolve supplier and state names and compute line subtotals | Aprobado |
| REG-FE-074 | purchase orders fall back to readable placeholders when a lookup is missing | Aprobado |
| REG-FE-075 | sales orders read items, discounts and voucher number, and resolve the client | Aprobado |
| REG-FE-076 | sales orders fall back to placeholders and keep a missing voucher number as null | Aprobado |
| REG-FE-077 | cancelled or voided orders are detected regardless of case and wording | Aprobado |
| REG-FE-078 | a failing lookup rejects the whole order list instead of showing partial data | Aprobado |

