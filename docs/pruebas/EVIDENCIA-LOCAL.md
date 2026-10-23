# Evidencia de ejecución local

Fecha: 19/10/2026. Ambiente: Windows, Node 24.15.0.
Revisión base: d480e0f79ee0113ee839ddc3127f9330a3500735, con cambios locales de esta entrega.

Comando: npm test (dentro de npm run check). Resultado: 39 pruebas aprobadas, 0 fallidas.
Compilación: npm run build aprobada.

Cobertura de líneas: **93.85%** (703/749); umbral exigido: 80%.
Alcance: diez archivos de Compras/Proveedores, no todo el frontend.

| Archivo | Líneas cubiertas/total | Cobertura |
| --- | --- | --- |
| components/ModalNuevaOrdenCompra.vue | 98/101 | 97.02% |
| components/ModalProveedor.vue | 64/65 | 98.46% |
| components/ModalVerOrdenesCompra.vue | 89/107 | 83.17% |
| directives/textoLimpio.ts | 26/26 | 100% |
| services/comprasService.ts | 76/77 | 98.7% |
| services/paginacion.ts | 9/9 | 100% |
| services/proveedoresService.ts | 31/33 | 93.93% |
| utils/validacionesCompras.ts | 28/28 | 100% |
| views/OrdenesDeCompras.vue | 172/189 | 91% |
| views/ProveedoresView.vue | 110/114 | 96.49% |

Log: [corrida local](../../logs/tests/2026-10-19T17-34-36-322Z-25824.log).
Esta corrida incluye las regresiones de fecha: guardar la hora real de creación
y mostrar fecha/hora en Argentina sin segundos ni indicador de zona horaria.
[Reporte HTML](../../coverage/index.html). [JUnit](../../reports/junit.xml).
Estos archivos generados son locales/artefactos CI, no están versionados; para regenerar ejecutar npm test.

Esta evidencia no acredita ejecución de integración/E2E en Render ni Qase.
Se eligió ESLint + plugin Vue como alternativa al paso de SonarCloud.
El workflow también se ejecutó en GitHub: ver la actualización del 23/10/2026.

## Análisis estático ESLint + Vue

ESLint 10.13.0: **21 archivos analizados, 0 errores y 0 advertencias**.
Resultado: APROBADO. Comando: npm run lint.

[Log ESLint](../../logs/lint/2026-10-19T17-34-33-020Z-2440.log).
[Hallazgos JSON](../../reports/eslint.json). [Resumen JSON](../../reports/eslint-summary.json).

La primera ejecución detectó una inicialización redundante en el ordenamiento de
Compras. Se corrigió y la siguiente ejecución no reportó hallazgos. Esto no
certifica ausencia de vulnerabilidades ni reemplaza la verificación manual.

## Actualización del 23/10/2026

Se confirmó una ejecución aprobada de GitHub Actions en main, revisión
`ca0645bf4aa79b1a5ad79043c46b0813965aca62`:
[ejecución 39974137237](https://github.com/augustoserra-edu/frontend_ProyectoConstruccionDeSoftwareTESTwebSiteCompras/actions/runs/39974137237).

Sobre esa base se agregaron cinco casos aislados de paginación: dos formatos
de catálogo vacío, respuesta inválida, fallo en segunda página y última página
en formato de arreglo. La verificación local `npm run check` aprobó 44 pruebas,
ESLint sin errores ni advertencias y compilación. Cobertura de líneas: 93.85%
(703/749), limitada a los diez archivos de Compras/Proveedores.

El workflow incorpora resumen, límite de tiempo, cancelación de ejecuciones
anteriores y verificación de pruebas/build aunque falle lint. Los resultados
de estas mejoras se consultan en Actions para la rama `codex/unitarias-actions`.
