# Casos de prueba - frontend

Cada caso automatizado se ejecuta con datos nuevos y API simulada. Los prefijos
CP-P y CP-C aparecen en los nombres de las pruebas de componentes/vistas.
Los casos de servicios conservan sus nombres descriptivos en el log.

## Unitarias y componentes

| ID / caso | Entrada / precondición | Acción | Resultado esperado | Técnica |
| --- | --- | --- | --- | --- |
| CP-P01 Alta válida | Materiales Sur, SA, CUIT `20-44215209-9`, email `ventas@empresa.com`, producto 5, precio 12.50 | 1. Completar campos. 2. Seleccionar producto. 3. Enviar formulario. | Un evento guardar con CUIT sin guiones, producto 5 y precio 12.50. | Camino feliz |
| CP-P02 Filtro de caracteres | CUIT `xx20-44215209-9`; teléfono `++54 (11) 123456789012`; email `a <>@empresa.com` | 1. Ingresar cada cadena. 2. Leer valor del campo. | CUIT solo dígitos/guiones; teléfono `+5411123456789`; email `a@empresa.com`. Máximo 14 en teléfono. | Equivalencia / límite |
| CP-P03 Email sin arroba | Proveedor completo, email `sin-arroba.com` | 1. Reemplazar email. 2. Enviar. | Sin evento guardar; mensaje sobre `@`. | Camino de error |
| CP-P04 Precio de compra | Proveedor completo; precio vacío, -1 y 0 | 1. Probar cada precio. 2. Enviar tras cada cambio. | Vacío y -1 bloqueados; 0 permitido. | Límite |
| CP-P05 Catálogo y bloqueo | Producto 99 no disponible; búsqueda inexistente; guardando=true | 1. Quitar producto no disponible. 2. Buscar. 3. Intentar guardar. 4. Desbloquear y cerrar. | Se quita 99; lista vacía informada; sin doble envío; cierre emitido. | Camino de error |
| CP-P06 Vista de proveedores | Dos proveedores y producto Cemento | 1. Cargar. 2. Ordenar/filtrar. 3. Crear con CUIT nuevo. 4. Editar nombre. | Listado correcto; creación y actualización reflejadas; modal cierra al éxito. | Camino feliz |
| CP-P07 Duplicados y red | CUIT existente; luego CUIT nuevo y error API | 1. Reintentar una carga fallida. 2. Guardar duplicado. 3. Guardar nuevo con rechazo. | Duplicado no llama API; error visible; formulario permanece abierto. | Equivalencia / error |
| CP-C01 Nueva orden | Proveedor 1, producto 5, compra 10, venta 100, cantidad 3 | 1. Seleccionar proveedor/producto. 2. Ingresar cantidad. 3. Guardar. | Total 30 y precio unitario 10; mientras guarda no se emite otra orden. | Camino feliz |
| CP-C02 Cantidades y búsqueda | `1.5`, `-1`, `2147483648`, `abc`, `0`; dos renglones | 1. Ingresar inválidos. 2. Intentar guardar con cero. 3. Agregar fila. 4. Filtrar. | Inválidos no reemplazan cantidad válida; cero bloquea envío; producto ya usado no disponible en otra fila. | Equivalencia / límites |
| CP-C03 Edición histórica | Orden con precio original 8 y cantidad 2; después detalle duplicado | 1. Abrir edición y guardar. 2. Reabrir con duplicado y enviar. | Total histórico 16; duplicado bloqueado. | Camino feliz/error |
| CP-C04 Consulta y estados | Orden pendiente y recibida | 1. Consultar pendiente. 2. Aprobar/editar. 3. Consultar recibida. 4. Filtrar y reintentar facturas. | Eventos correctos; no existe botón Contabilizar; estado recibido informa facturación desde Finanzas. | Transiciones |
| CP-C05 Lista y paginación | 21 órdenes y dos proveedores | 1. Cargar más. 2. Ordenar columnas. 3. Filtrar. 4. Abrir detalle y recuperar foco. | 20 iniciales, 21 al ampliar; filtros y detalle correctos; recarga al volver. | Límite / camino feliz |
| CP-C06 Crear, editar y confirmar | Orden pendiente y respuestas válidas de API | 1. Crear. 2. Editar. 3. Cancelar aprobación. 4. Confirmarla. | Cancelar no llama PATCH; confirmar llama PATCH con ID de estado real. | Camino feliz/error |
| CP-C07 Fallos de compras | Fallo de carga, de facturas, PATCH rechazado y alta rechazada | 1. Ejecutar cada acción. 2. Reintentar. | Mensajes visibles; no se simula éxito ni se cierra el alta fallida. | Camino de error |

## Servicios y funciones (automatizados)

| ID | Entrada | Acción | Resultado esperado / prueba trazable |
| --- | --- | --- | --- |
| CP-S01 Sincronización válida | Órdenes recibida/pendiente/contabilizada; facturas COMPRA/VENTA; duplicadas | Invocar sincronización dos veces en paralelo y volver a ejecutar | Solo una actualización para la recibida con factura COMPRA; ningún POST de factura. `only received purchases...` |
| CP-S02 Fallo de facturas | GET de facturas falla | Sincronizar | Rechazo sin cambios de estado. `failed invoice lookup...` |
| CP-S03 Fallo de PATCH | Factura existente, PATCH falla y luego funciona | Sincronizar y reintentar | Estado real conservado ante error; éxito solo con respuesta válida. `API rejection preserves...` |
| CP-S04 Transiciones | Todas las combinaciones entre seis estados | Evaluar transición manual | Solo pendiente a aprobada/rechazada y aprobada a recibida/devuelto; nunca contabilización manual. `purchase workflow follows...` |
| CP-S05 Paginación | Dos páginas con next en host interno | Consultar catálogo | Usa ruta configurada y páginas 1/2, sin seguir URL ajena. `catalogs read every page...` |
| CP-S06 Contratos | Alta/edición, decimales, IDs numéricos/cadenas, precios 0/nulos | Enviar a adaptador simulado y presentar respuesta | Formatos correctos; precios inválidos no salen a API; sin inventar registros. Suites de servicios |
| CP-V01 CUIT | 10, 11 y 12 dígitos | Normalizar y validar proveedor completo | Solo 11 dígitos válidos. `contact boundary classes...` |
| CP-V02 Teléfono | 13, 14 y 15 caracteres; + inicial/intermedio/doble/solo | Validar y filtrar | 13/14 válidos; 15 rechazado; un + opcional al inicio, no solo +. `supplier contact filters...` y `contact boundary classes...` |
| CP-V03 Email | Sin @, dos @, puntos consecutivos, dominio inválido, alias `+ventas` | Validar | Rechaza inválidos; acepta alias y subdominios. `supplier contact filters...` |
| CP-V04 Dinero/fechas | -1, 0, 9999999999.99, 10000000000; fechas bisiestas/no válidas | Validar importe/fecha | Límites y fechas válidas aceptados; resto rechazado. `invoice dates and money...` |

## Integración con API real (diseñada, NO ejecutada)

Precondiciones: cuenta de prueba autorizada; frontend con URL del backend
desplegado; DevTools/Network abierto; proveedor y productos de prueba. No usar
registros operativos para pruebas de alta, recepción o facturación.

| ID | Entrada | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| INT-01 Listar proveedores | Usuario autenticado y catálogo conocido | 1. Abrir Proveedores. 2. Revisar GET y response. 3. Comparar IDs, nombres y precios con pantalla. | HTTP 200; datos reales reflejados; sin valores inventados. |
| INT-02 Sincronizar contabilización | Orden de prueba recibida con factura COMPRA existente | 1. Entrar a Compras. 2. Observar GET de facturas y PATCH. 3. Recargar. | PATCH cambia a Contabilizado; nuevo GET confirma persistencia; segunda carga no repite PATCH. Si API rechaza, mensaje y estado real. |
| INT-03 Sin factura | Orden recibida sin factura | 1. Entrar a Compras. 2. Actualizar. 3. Inspeccionar Network. | Permanece Recibida y no hay PATCH a Contabilizado. |
| INT-04 Error de conexión | Sesión válida | 1. Activar Offline en DevTools. 2. Actualizar. 3. Volver Online. 4. Reintentar. | Error visible, sin falso éxito; recuperación al reintentar. |

## E2E para cargar en Qase (diseñados, NO ejecutados)

**E2E-P01 - Crear y consultar proveedor.** Suite: Proveedores. Severidad si falla:
media. Precondición: sesión de prueba, producto activo y CUIT de prueba libre,
válido para el ambiente. Datos: nombre `QA Proveedor`, apellido `Pruebas`, email
`qa+proveedor@example.com`, teléfono `+541112345678`, precio 10.

1. Abrir Proveedores y elegir Nuevo Proveedor.
2. Completar datos, seleccionar producto y precio; crear.
3. Buscar por CUIT; abrir el registro y recargar la página.

Esperado: alta única, datos normalizados persistentes y producto/precio correctos.
Obtenido/evidencia: **pendientes de ejecución**.

**E2E-P02 - Validaciones y límites.** Suite: Proveedores. Severidad: media.
Datos: teléfono de 14/15 caracteres, `++54`, email `sin-arroba.com`, CUIT con letras.

1. Abrir alta y escribir/pegar cada entrada.
2. Intentar guardar con email inválido y luego con datos válidos.
3. Verificar en Network que el intento inválido no crea un proveedor.

Esperado: filtros aplicados, un solo + al inicio, límite 14, email inválido bloquea.
Obtenido/evidencia: **pendientes de ejecución**.

**E2E-C01 - Orden, recepción y facturación.** Suite: Compras. Severidad: alta.
Datos: proveedor/producto de prueba, cantidad 2, precio compra 10, orden nueva.

1. Crear orden por total 20. Verificar Pendiente.
2. Aprobar y recibir confirmando las acciones. Verificar Recibido.
3. Actualizar Compras antes de facturar: debe seguir Recibido.
4. En la interfaz existente de Finanzas, facturar esa orden una sola vez.
5. Volver a Compras: debe aparecer Contabilizado con su comprobante.
6. Actualizar otra vez y verificar que no se crea otra factura ni se repite PATCH.

Esperado: transición contable solo después de la factura; persistencia al recargar.
No se modifica el código de Finanzas para esta prueba.
Obtenido/evidencia: **pendientes de ejecución**.

**E2E-C02 - Cancelar confirmación.** Suite: Compras. Severidad: media.
Precondición: orden pendiente de prueba.

1. Abrir detalle. 2. Elegir Aprobar. 3. Cancelar. 4. Recargar.

Esperado: orden sigue Pendiente; no hubo PATCH de aprobación.
Obtenido/evidencia: **pendientes de ejecución**.

## Cómo registrar la ejecución

Crear proyecto de frontend en Qase y suites Compras/Proveedores. Copiar título,
precondiciones, datos, pasos y resultado esperado de cada E2E. Crear una ejecución
con versión/commit y ambiente; marcar aprobado/fallido solo después de ejecutarlo.
Adjuntar capturas y log, ocultando tokens y datos sensibles. Vincular los defectos
con su ID y caso. No importar los casos como aprobados por tener unitarias verdes.
