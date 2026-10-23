# Pruebas del frontend - Compras y Proveedores

Desde CMD o PowerShell, en la carpeta del frontend, con Node 24:

```sh
npm ci
npm run check
```

`npm run check` ejecuta ESLint, pruebas con cobertura y compilación.
Para ejecutar solo el análisis estático: `npm run lint`.

`npm ci` es necesario al instalar o cambiar dependencias. `npm test` ejecuta
Vitest con Vue Test Utils y jsdom, mide cobertura con V8 y falla si las líneas
cubiertas del alcance quedan por debajo del 80%. `npm run build` valida tipos y
compilación de la aplicación; no reemplaza las pruebas.

Para desarrollar un módulo por separado:

```sh
npm run test:compras
npm run test:proveedores
```

Estas ejecuciones parciales incluyen las pruebas compartidas de las vistas;
no generan cobertura. Para acreditar el porcentaje, usar siempre `npm test`.

La suite compartida de paginación también se ejecuta en ambos módulos. Verifica
catálogos vacíos, respuestas inválidas, fallos al cargar páginas posteriores y
compatibilidad con el formato de arreglo, con Axios simulado.

## GitHub Actions

El workflow `.github/workflows/frontend-tests.yml` se ejecuta en cada push,
pull request y ejecución manual. Usa Node 24 y `npm ci`, ejecuta ESLint,
pruebas con cobertura y compilación. Aunque falle el lint, ejecuta las pruebas
y la compilación si la instalación terminó correctamente; el job sigue fallando
si falla cualquiera de esas verificaciones.

En la pestaña **Actions**, abrir la ejecución para consultar el resumen y
descargar el artefacto `pruebas-frontend-<corrida>-<intento>`, conservado 30 días.
Incluye logs, JUnit y cobertura HTML. El límite por ejecución es de 15 minutos;
un nuevo commit cancela una ejecución anterior del mismo evento y rama.

## Reportes

| Archivo/carpeta | Uso |
| --- | --- |
| `logs/tests/<fecha>-<pid>.log` | Registro por ejecución: fecha UTC, revisión, versión Node, pruebas, errores y código de salida |
| `coverage/index.html` | Reporte navegable de líneas cubiertas/no cubiertas |
| `coverage/coverage-summary.json` | Porcentajes y cantidades por archivo |
| `coverage/lcov.info` | Reporte estándar de cobertura para herramientas compatibles |
| `logs/lint/<fecha>-<pid>.log` | Log fechado del análisis estático |
| `reports/eslint.json` | Hallazgos de ESLint por archivo, línea y regla |
| `reports/eslint-summary.json` | Resumen de errores y advertencias |
| `reports/junit.xml` | Resultado de pruebas para herramientas CI |

JUnit y cobertura se regeneran; guardar una copia como evidencia de la entrega.
Los logs llevan nombre único. Reportes y logs están excluidos de Git y se suben
como artefactos del workflow de pruebas. El resultado 0 significa éxito; un
código distinto de 0 indica fallo de pruebas, cobertura o ejecución.

## Alcance y aislamiento

Se miden diez archivos de Compras/Proveedores explícitos en `vitest.config.ts`,
incluyendo vistas, modales, servicios, validaciones y directiva. No es la
cobertura de todo el frontend ni del backend.

Las solicitudes HTTP unitarias se simulan y las no simuladas se rechazan. No se
necesita Render ni el backend local. Las vistas usan hijos/servicios simulados;
los formularios se montan con Vue Test Utils. Esto no demuestra interacción
visual en un navegador real ni aceptación del contrato por la API desplegada.

Los casos de integración/E2E están diseñados por separado y no se marcan como
ejecutados por el resultado de las unitarias.

## Documentación de Clase 8

- [Plan y matriz de cumplimiento](../docs/pruebas/PLAN-DE-PRUEBAS.md)
- [Casos, datos y resultados esperados](../docs/pruebas/CASOS-DE-PRUEBA.md)
- [Registro de defectos](../docs/pruebas/REGISTRO-DE-DEFECTOS.md)
- [ESLint, Qase y entrega](../docs/pruebas/PLATAFORMAS-Y-ENTREGA.md)

Al modificar una regla, agregar casos válidos, inválidos y límites en la suite
correspondiente. No cambiar resultados esperados solo para que una prueba pase.
