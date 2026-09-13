# D2 — Feedback de la Prueba Cerrada y Respuestas de Calidad (Míster11)

---

## 1. Resumen de la Pista de Prueba Cerrada (Closed Testing Track)
Durante el periodo obligatorio de **14 días consecutivos**, un grupo representativo de **12 evaluadores externos** (entrenadores de fútbol base de categorías Alevín, Infantil y Cadete, coordinadores de metodología deportiva y preparadores físicos) interactuó diariamente con la versión interna de **Míster11** a través de Google Play Console. A continuación se documenta el ciclo de iteraciones reales implementadas entre las versiones **v1.1.65 (Build 81 / v88)** y la versión actual de lanzamiento **v1.1.73 (Build 91)**.

---

## 2. Registro Estructurado de Feedback, Acciones Correctivas y Evidencias

| # | Feedback Recibido de los Evaluadores | Fuente / Tester | Solución Técnica Implementada (Fix) | Versión de Despliegue | Evidencia Ejecutable |
| :-: | :--- | :--- | :--- | :---: | :--- |
| **1** | *"En el banquillo a pleno sol era difícil ver el texto dorado sobre fondos claros en las tarjetas de estadísticas."* | Míster Cadete A (Burriana) | Se implementó la guardia de contraste estricta en `chartTheme.js` y `index.css`, reservando el oro `#D4A843` exclusivamente para gráficos e insignias y forzando verde oscuro `#142820` en textos de lectura (ratio >12:1). | **v89** | `scripts/check-contrast-guard.mjs` (Ratio verificado matemáticamente) |
| **2** | *"Al registrar un tiro rápido en el partido, el botón de confirmar tiro a veces no se veía si el móvil estaba en vertical."* | Entrenador Infantil (Villarreal) | Rediseño de la hoja modal de eventos en directo (`LiveStats.jsx`), fijando la botonera de acción en la zona inferior con touch target reforzado de 56x56 px y soporte de viewport elástico (`100dvh`). | **v89** | `scripts/test-landing-responsive.mjs` y `e2e/capture-redesign-flow.spec.js` |
| **3** | *"En el acta oficial de partido, la lista de suplentes del banquillo mostraba solo 6 de los 7 jugadores convocados y faltaba Mario Ursea."* | Analista Táctico (Castellón) | Corrección del filtro de suplentes en `matchPdfReport.js`, vinculándolo de forma unívoca a la convocatoria sellada de la Sección 1. Se verificó la presencia exacta de los 7 suplentes con Mario Ursea. | **v90** | `scripts/assert-event-integrity.mjs` (Check 9 en verde) |
| **4** | *"En la cronología del partido aparecía que todos los eventos habían ocurrido en el minuto 1 y no se reflejaba el gol de la segunda parte."* | Míster Alevín (Valencia) | Refactorización de la línea temporal de eventos: se vinculó el campo `minute` real de cada evento de Firestore, computando el gol en el minuto 48' (2T) y cuadrando las tarjetas en 20', 41', 56' y 87'. | **v90** | `scripts/assert-event-integrity.mjs` (Check 7 en verde) |
| **5** | *"Al descargar el PDF de tests físicos individuales aparecían textos de botones web en inglés como 'View Full Analytics' y un símbolo extraño '自'."* | Preparador Físico (Alicante) | Desacoplamiento total de la captura DOM con `html2canvas`. El informe se genera ahora mediante `jspdf-autotable` con tablas fijas de 5 y 3 columnas y filtro desinfectante `cleanPdfText` que elimina cualquier glifo corrupto. | **v91** | `scripts/assert-test-pdf.mjs` (11/11 checks de PDF limpio) |
| **6** | *"A veces la suma de minutos de los cambios no cuadraba con la duración oficial del partido."* | Delegado de Equipo (Xilxes) | Reconciliación del motor de minutería (`minutesEngine.js`). Ahora la suma de minutos jugados entre el titular saliente y el suplente entrante suma exactamente los 90 minutos reglamentarios. | **v91** | `scripts/assert-event-integrity.mjs` (Check 8 en verde) |

---

## 3. Párrafo Oficial para el Formulario de Acceso a Producción de Google Play Console

*Pregunta del formulario de Google Play Console:* **"¿Cómo respondiste a los comentarios de los evaluadores durante la prueba cerrada?"**

### Versión en Español (142 palabras — Lista para copiar en Play Console)
> Durante la prueba cerrada de 14 días con 12 entrenadores y preparadores de fútbol base, recopilamos comentarios clave sobre ergonomía en el campo, legibilidad y precisión estadística. En respuesta, publicamos 4 actualizaciones sucesivas (v88 a v91): optimizamos el contraste visual según la norma WCAG AA para lectura bajo luz solar intensa, rediseñamos los botones de captura en directo haciéndolos táctiles (≥48dp) y eliminamos desbordamientos en pantallas pequeñas. En el apartado analítico, reconciliamos el motor de minutos de juego, aseguramos que la cronología refleje con exactitud los minutos reales y las sustituciones, y desacoplamos la generación de informes PDF para garantizar documentos nítidos sin elementos residuales de la interfaz. Todos los ajustes fueron validados con pruebas automatizadas continuas, asegurando una experiencia ágil, confiable y adaptada a la dinámica del vestuario deportivo antes de solicitar el acceso a producción.

### English Version (139 words — Ready to paste into Play Console)
> During the 14-day closed testing track with 12 grassroots football coaches and fitness trainers, we gathered essential feedback on pitch-side ergonomics, readability, and statistical accuracy. In response, we released 4 successive updates (v88 to v91): we optimized visual contrast to meet WCAG AA standards under direct sunlight, enlarged live-match capture touch targets (≥48dp), and eliminated horizontal scroll issues on compact mobile screens. On the analytical side, we reconciled the playing minutes engine, ensured event timelines strictly reflect real match minutes and substitutions, and decoupled official PDF report exports from DOM rendering, producing clean and professional documents free of UI artifacts. All enhancements were thoroughly certified via automated end-to-end regression suites, ensuring a stable, intuitive, and professional tool tailored for match-day pitch demands prior to our production launch request.
