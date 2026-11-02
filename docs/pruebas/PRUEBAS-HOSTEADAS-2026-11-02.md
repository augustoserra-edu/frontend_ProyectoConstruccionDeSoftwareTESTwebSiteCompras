# Registro de pruebas del frontend alojado: Proveedores y Compras

Fecha: 02/11/2026. Aplicación: https://elcorralon.ordema.app/.
API configurada en el código local: https://corralon.ordema.app/api.
Navegador integrado, sesión iniciada manualmente por el usuario.
No se copiaron credenciales ni tokens al registro.

El usuario autorizó crear proveedores y órdenes QA, editarlos y probar cambios
de estado. El alcance se restringió a Proveedores y Compras: no se navegó a
Finanzas, Sistemas Administrativos ni Ventas.

**Resultado:** 28 controles con resultado esperado observado (10 iniciales y
18 adicionales). No se detectaron fallos funcionales en estos recorridos.
Los controles son verificaciones manuales asistidas en navegador, no nuevas
pruebas unitarias ni una certificación completa de la aplicación.

## Método y alcance

Se recorrió la interfaz publicada mediante interacción real en navegador y se
observaron sus estados accesibles. No se utilizaron mocks ni se ejecutó el
frontend local para estas verificaciones. No se verificó qué revisión Git está
desplegada. El viewport observado mostró la presentación de tarjetas y menú
colapsable; no acredita todos los tamaños de pantalla.

## Resultados observados

| ID local | Comprobación | Resultado observado | Estado |
| --- | --- | --- | --- |
| HOST-01 | Sesión autenticada | Navegación del sistema y botón Cerrar sesión disponibles | Aprobado |
| HOST-02 | Carga del listado de proveedores | Se muestran siete proveedores con IDs 1 a 7 y productos asociados | Aprobado visual |
| HOST-03 | Búsqueda por nombre | Buscar QA Proveedor deja visible el proveedor ID 5 | Aprobado |
| HOST-04 | Alta vacía | Crear Proveedor con campos vacíos mantiene el formulario y muestra errores de nombre, apellido, CUIT y selección de productos | Aprobado visual |
| HOST-05 | Filtro de CUIT | Al ingresar xx20-44215209-9 el campo muestra 20-44215209-9 | Aprobado |
| HOST-06 | Catálogo y selección | El alta muestra cinco productos; seleccionar Arena cambia el contador a 1 y muestra Precio de compra ($) | Aprobado |
| HOST-07 | Cancelar el formulario | Cancelar cierra el alta y regresa al listado | Aprobado visual |
| HOST-08 | Búsqueda sin resultados | QA-SIN-COINCIDENCIAS-20261102 muestra No se encontraron proveedores que coincidan con la búsqueda | Aprobado |
| HOST-09 | Orden ascendente | Al limpiar la búsqueda y elegir Ascendente, aparecen IDs 1 a 7 en orden | Aprobado |
| HOST-10 | Persistencia de sesión | Recargar lleva al panel principal autenticado; volver a Proveedores recarga los siete registros sin pedir credenciales | Aprobado |

## Pruebas con datos QA autorizados

| ID local | Entrada y acción | Resultado esperado y observado | Estado |
| --- | --- | --- | --- |
| HOST-11 | Alta QA con email sin-arroba.com, Arena y precio 10; intentar guardar | Formulario abierto y mensaje de email válido con un solo @ y dominio | Aprobado |
| HOST-12 | Corregir email a qa+web20261102@example.com y crear proveedor | Mensaje Proveedor creado correctamente; ID 8, Arena asociada | Aprobado |
| HOST-13 | Editar denominación del ID 8 a Pruebas Editado y guardar | Mensaje de actualización y listado con la denominación editada; al abrir edición precio conservado en 10 | Aprobado |
| HOST-14 | Intentar otra alta QA con el mismo CUIT sintético del ID 8 | Mensaje Ya existe un proveedor con ese CUIT; alta no cerrada | Aprobado |
| HOST-15 | Recargar la página y consultar el proveedor por nombre | ID 8 y denominación Pruebas Editado conservados | Aprobado |
| HOST-16 | Nueva orden del proveedor 8, Arena, cantidad 0; guardar | Cantidad bloqueada con rango permitido de 1 a 2147483647 | Aprobado |
| HOST-17 | Cambiar cantidad a 2 y guardar | Total calculado 20 y orden #32 creada en Pendiente por 20 | Aprobado |
| HOST-18 | Editar #32 a cantidad 3 y guardar | Precio unitario 10 conservado, total 30 y mensaje de actualización | Aprobado |
| HOST-19 | En #32 elegir Aprobar y cancelar confirmación | Sigue Pendiente, con Aprobar y Rechazar disponibles | Aprobado |
| HOST-20 | Aprobar #32 y confirmar | Pasa a Aprobado y ofrece Recibir y Devolver; no ofrece Editar | Aprobado |
| HOST-21 | Recibir #32 y confirmar el aviso de ingreso al stock | Pasa a Recibido, estado final no editable y sin factura | Aprobado en interfaz |
| HOST-22 | Recargar página y consultar otra vez #32 | Conserva Recibido, cantidad 3 y total 30; no se contabiliza sin factura | Aprobado |
| HOST-23 | Crear #33 con una unidad por 10, elegir Rechazar y confirmar | Pasa de Pendiente a Rechazado y no ofrece acciones posteriores | Aprobado |
| HOST-24 | Crear #34 con una unidad por 10, aprobar y luego devolver con confirmación | Pasa Pendiente → Aprobado → Devuelto; el aviso indica que no ingresan productos al stock | Aprobado en interfaz |
| HOST-25 | Consultar el detalle de #32, #33 y #34 en su estado final | Recibido, Rechazado y Devuelto sin edición ni transiciones disponibles | Aprobado |
| HOST-26 | Buscar QA Web 20261102 y filtrar Recibido | Solo aparece #32 entre las tres órdenes QA | Aprobado |
| HOST-27 | Quitar búsqueda y elegir Cargar más | Mostrando 20 de 34 pasa a Mostrando 34 de 34 | Aprobado |
| HOST-28 | Salir a Gestión de Proveedores y volver a cargar Compras | #32 Recibido por 30, #33 Rechazado por 10, #34 Devuelto por 10 | Aprobado |

Los 28 controles no se suman a las 78 pruebas automatizadas de la corrida local
y no representan 28 casos Qase completados. No se modificaron resultados en Qase
ni el PDF histórico de la corrida unitaria.

## Datos creados y conservados

| Recurso | Identificador | Datos finales |
| --- | --- | --- |
| Proveedor | 8 | QA Web 20261102 / Pruebas Editado; CUIT sintético 30-99999999-5; email QA de example.com; Arena ID 3, precio de compra 10 |
| Orden | 32 | Proveedor 8; Arena × 3; precio unitario 10; total 30; Recibido; sin factura |
| Orden | 33 | Proveedor 8; Arena × 1; precio unitario 10; total 10; Rechazado |
| Orden | 34 | Proveedor 8; Arena × 1; precio unitario 10; total 10; Devuelto |

No se eliminaron los registros de evidencia. Se confirmó la recepción de tres
unidades de Arena en la orden #32; el sistema advierte que esta operación suma
stock. No se midió el stock inicial y final porque se mantuvo el recorrido dentro
de Proveedores y Compras, por lo que el incremento numérico no queda acreditado
por esta prueba.

## Límites y pendientes

- La carga de datos visibles acredita funcionamiento del recorrido de lectura
  observado. No se capturaron estados HTTP autenticados ni se comparó cada campo
  del JSON con la pantalla; INT-01 sigue parcialmente verificado.
- El primer intento de enviar datos inválidos fue bloqueado por revisión
  automática. Después de la autorización del usuario se completó HOST-11:
  validación de email comprobada. El filtro completo de teléfono sigue pendiente.
- La sincronización de una orden que ya tenga factura (INT-02) sigue pendiente.
  No se facturó ni se ingresó a Finanzas por instrucción del usuario.
- HOST-22 verifica el comportamiento visible del caso sin factura (INT-03),
  incluida persistencia tras recargar. No se dispone de tráfico que permita
  afirmar que no se envió ningún PATCH.
- Sin una captura de tráfico no se afirma ausencia de requests de escritura
  durante la validación del formulario vacío; lo verificado fue el bloqueo y los
  errores visibles en la interfaz.
- La operación offline y recuperación (INT-04), expiración de token, validación
  de errores de red y rechazo de escritura por el servidor siguen pendientes.
- El recorrido E2E de proveedor fue ejecutado con alta, consulta, edición y
  persistencia. El recorrido de compra se ejecutó hasta recepción, sin facturación.
  No se declara completo el recorrido E2E de recepción y contabilización.
- Los filtros probados no acreditan todas las combinaciones; no se probaron
  todos los límites de cantidades e importes ni todos los tamaños de pantalla.

## Evidencias

- [Proveedor QA persistido](../../output/pruebas-hosteadas-2026-11-02/proveedor-qa.png).
- [Tres órdenes QA con sus estados finales](../../output/pruebas-hosteadas-2026-11-02/ordenes-qa-final.png).
- [Consulta final en texto](../../output/pruebas-hosteadas-2026-11-02/ordenes-qa-final.txt).

También se conservan las observaciones de interfaz en este chat. No se generó
archivo HAR ni captura de cuerpos o cabeceras de autenticación. Las capturas
finales prueban el estado visible al cierre, no cada paso intermedio.
