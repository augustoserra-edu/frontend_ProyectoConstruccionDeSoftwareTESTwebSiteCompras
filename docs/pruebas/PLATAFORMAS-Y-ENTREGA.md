# Análisis estático, plataformas y entrega

## ESLint + plugin Vue

El equipo eligió ESLint y el plugin Vue como alternativa de análisis estático.
El soporte TypeScript se configura con typescript-eslint. No requiere cuenta,
token ni servidor externo. Los comandos corren en CMD, PowerShell y CI:

```sh
npm ci
npm run lint
```

Se usan las reglas recomendadas de JavaScript/TypeScript y las reglas Essential
de Vue 3, que buscan errores y comportamientos inesperados en los componentes.
El formato visual existente no es un criterio de rechazo.

El alcance figura en `scripts/alcance-calidad.mjs`: diez archivos de aplicación
de Compras/Proveedores, sus pruebas y las herramientas de análisis. No se analiza
el resto del frontend como parte de esta entrega.

El análisis termina con código distinto de cero si encuentra errores o
advertencias. Para cada hallazgo se informa archivo, línea, columna y regla.
No se ejecutan correcciones automáticas ni se agregan supresiones para ocultarlo.

Evidencia de cada ejecución:

- `logs/lint/<fecha>-<pid>.log`: fecha UTC, versión, revisión, hallazgos y resultado.
- `reports/eslint.json`: resultados por archivo para inspección o herramientas.
- `reports/eslint-summary.json`: cantidades de archivos, errores y advertencias.

El reporte JSON se regenera; los logs conservan un archivo por corrida.
Los artefactos se generan localmente y en GitHub Actions, excluidos del código
versionado. Registrar los defectos reales en `REGISTRO-DE-DEFECTOS.md` con pasos,
esperado/obtenido, severidad, estado y evidencia. Un hallazgo del linter debe
revisarse antes de clasificarlo como defecto funcional.

ESLint complementa las pruebas, pero no calcula cobertura; eso lo hace Vitest.
Tampoco sustituye todas las funciones de SonarCloud, su panel ni un análisis de
seguridad completo. Como la clase menciona SonarCloud explícitamente, la docente
debe aceptar la sustitución para acreditarla como equivalente en la entrega.

Referencias oficiales: [plugin Vue](https://eslint.vuejs.org/user-guide/),
[ESLint](https://eslint.org/docs/latest/use/core-concepts/) y
[typescript-eslint](https://typescript-eslint.io/getting-started/).

## GitHub Actions

El workflow `frontend-tests.yml` ejecuta lint, pruebas con cobertura y compilación
en push, pull request o ejecución manual. Para validar todo localmente:

```sh
npm run check
```

Guarda los logs de lint y pruebas, reportes ESLint/JUnit y coverage incluso si
falla una etapa. Hace falta commitear y pushear los archivos para ejecutarlo en
GitHub; haberlo preparado localmente no implica que CI haya pasado.

Se retiró el paso de SonarCloud. No se necesitan secretos ni variables Sonar.

## Qase

Crear proyecto frontend y suites Compras/Proveedores. Los cuatro E2E están listos
para cargar desde `CASOS-DE-PRUEBA.md`. Agregar pasos y datos, iniciar una corrida
con ambiente y commit, y completar resultado obtenido/evidencia después de la
prueba manual. La existencia del documento local no sustituye la carga en Qase.

El usuario creó el proyecto ELCORRALON y sus dos suites. Se completaron diez
casos manuales en Qase; ver [IDs y evidencia de carga](QASE.md).
La ejecución en Qase, integración y E2E se mantienen como **No ejecutados**.

## Lista de entrega

- Plan de pruebas, casos y registro de defectos versionados.
- Log y resumen JSON de ESLint, con revisión de los hallazgos.
- Captura del resumen de Vitest y log de la corrida elegida.
- Reporte HTML de coverage y JSON de resumen: meta 80% del alcance declarado.
- Enlace a corrida GitHub Actions y artefactos descargables.
- Proyecto/suites/corrida Qase con resultados reales y defectos vinculados.
- Confirmación docente de la alternativa ESLint frente a SonarCloud.
- Declaración de alcance: frontend de Compras y Proveedores; no backend ni
  certificación de cobertura de otros módulos.
