# Registro de defectos

Estados según Clase 8: **Abierto -> En progreso -> Resuelto -> Verificado -> Cerrado**.
Si la verificación falla, reabrir con evidencia. El equipo cierra tras validar el
ambiente objetivo. Severidad alta: contabilidad/datos críticos; media: función
principal afectada con alternativa; baja: problema menor de presentación.

## DEF-FE-01 - Compras contabilizaba al enviar a Finanzas

- **Origen:** revisión previa del código en esta conversación; no hallazgo nuevo
  de la ejecución actual. El antiguo botón emitía factura desde Compras.
- **Severidad:** alta.
- **Pasos históricos:** 1. Abrir orden recibida sin factura. 2. Completar el antiguo
  formulario Enviar a Finanzas. 3. Enviar desde Compras.
- **Esperado:** permanecer recibida hasta facturar desde Finanzas.
- **Obtenido histórico:** el flujo de Compras creaba el comprobante y cambiaba a
  Contabilizado en el mismo envío.
- **Corrección frontend existente:** retirar facturación/manual de Compras;
  sincronizar solo órdenes recibidas con factura COMPRA consultada en la API.
- **Evidencia local:** CP-C04 y CP-S01/02/03 aprobados. La API se simula.
- **Estado:** Resuelto en frontend; pendiente de verificación INT-02/E2E-C01 en
  el ambiente desplegado. No se declara cerrado ni corregido el backend.

## DEF-FE-02 - Entrada de contacto permitía caracteres fuera de la regla

- **Origen:** solicitud y revisión previas del formulario, antes de este plan.
- **Severidad:** media.
- **Pasos históricos:** 1. Abrir Nuevo Proveedor. 2. Introducir letras en CUIT o
  paréntesis/guiones en teléfono. 3. Observar los valores aceptados por el campo.
- **Esperado:** CUIT numérico con guiones opcionales; teléfono numérico con un +
  inicial y máximo 14 caracteres; email con estructura válida.
- **Obtenido histórico:** el filtro solo quitaba espacios y el teléfono permitía
  separadores y hasta 50 caracteres.
- **Corrección frontend existente:** filtros y validaciones de contacto actuales.
- **Evidencia local:** CP-P02/03 y CP-V01/02/03. Ver log de ejecución.
- **Estado:** Verificado en pruebas automatizadas locales; E2E-P02 y cierre del
  equipo pendientes. No se afirma validación visual en navegador móvil real.

## Hallazgo ESLint - inicialización redundante al ordenar compras

- **Regla:** `no-useless-assignment`, severidad del linter: error.
- **Clasificación:** mantenibilidad; no se observó un fallo funcional.
- **Ubicación:** `OrdenesDeCompras.vue`, variable `comparacion`.
- **Reproducción:** ejecutar `npm run lint` sobre la versión anterior a la corrección.
- **Esperado:** análisis sin asignaciones que se reemplazan antes de utilizarse.
- **Obtenido:** una asignación inicial a 0 nunca usada, reemplazada en todas las ramas.
- **Corrección:** declarar `comparacion: number` y mantener las asignaciones por rama.
- **Evidencia:** el primer log de ESLint registra el hallazgo y código de salida 1;
  la ejecución posterior y la suite de ordenamiento verifican la corrección.

## Incidencias del entorno de pruebas (no defectos del producto)

- Migración a Vitest: el adaptador se asignaba a Axios global después de crear
  la instancia del servicio. Resultado: `Network Error`. Resuelto asignando el
  adaptador simulado a esa instancia y bloqueando solicitudes sin simular desde
  setup. No se modificó la aplicación para hacer pasar la prueba.
- Fixture compartido: una vista agregaba un proveedor al array usado por otra
  prueba, produciendo un falso duplicado. Resuelto creando datos independientes
  para cada carga simulada. Las ejecuciones fallidas permanecen en logs locales.

No se encontraron nuevos defectos del producto en la última corrida unitaria.
Esto no equivale a ausencia de defectos ni sustituye integración/E2E ni una revisión de seguridad.

## Plantilla para nuevos defectos

```text
ID:
Título:
Caso relacionado:
Versión/commit y ambiente:
Fecha y responsable:
Precondiciones y datos:
Pasos para reproducir:
1.
2.
Resultado esperado:
Resultado obtenido:
Severidad: alta / media / baja
Estado: Abierto
Evidencia (captura, log, request sin credenciales):
Corrección/commit:
Reprueba: fecha, responsable, resultado y evidencia
```
