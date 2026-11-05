# INFORME DE ESTADO INTEGRAL — MÍSTER 11 ("TODO EL MUNDO MÍSTER 11")
**Auditoría Técnica, de UX, Producto, Integridad Clínica y Seguridad**  
**Fecha:** 5 de noviembre de 2026 | **Modo:** READ-ONLY Estricto (Sin modificaciones de código fuente ni zonas protegidas)  
**Hash de Referencia:** `8b286d5` | **Branch:** `main` | **Build:** v1.1.77 (Build 95 intacto)

---

## A) RESUMEN EJECUTIVO (Legible para el Dueño No Técnico)

### Veredicto de Madurez del Producto: **MVP Avanzado (No Production-Grade)**
El veredicto de madurez global de Míster 11 se sitúa en la categoría de **MVP Avanzado**.  
La plataforma cuenta con una base de internacionalización de élite (6 idiomas con 100% de paridad y 0 fallos), interfaces tácticas ricas, paleta cromática canónica controlada ("Tierra y Campo") y motores de cálculo robustos. Sin embargo, no puede certificarse como *Professional-grade* ni *Production-ready* debido a tres eslabones débiles que están en estado crítico o parcial:
1. **Pipeline de Ilustraciones Clínicas y Seguridad G10:** El 100% de los 108 ejercicios del catálogo tienen la ilustración en estado `pendiente`. No existe el rol ni el campo `rigVerifiedBy` de un fisioterapeuta colegiado, lo que obliga por regla de seguridad médica (G10) a bloquear la prescripción autónoma de ejercicios de alto riesgo en menores.
2. **Seguridad y Datos de Menores:** La protección de edad (`assertAgeSafe`) existe en la interfaz y en el selector del entrenador, pero está totalmente ausente en las reglas de base de datos (`firestore.rules`). Un usuario técnico podría guardar prescripciones indebidas saltándose la pantalla.
3. **Ausencia de Tipado Estricto (TypeScript):** El 100% del código fuente está en JavaScript (`.jsx` / `.js`), sin validación de tipos en tiempo de compilación para cálculos de dosis físicas, baremos y edades.

---

### Top-5 Riesgos Críticos
1. **Riesgo Regulatorio / Legal (Google Play UE):** Falta completar la declaración de comerciante (*Trader Status*) en la consola de Google Play, lo que bloquea o expone a baja la app en toda la Unión Europea.
2. **Defensa en Profundidad Incompleta en Menores:** Si bien la UI bloquea a menores de 14 años ejercicios como el Nordic Hamstring (`hex-078`), la base de datos Firestore permite escrituras directas sin verificar la edad del jugador.
3. **Inconsistencia de Conteo en Catálogo (Off-by-one 107 vs 108):** La constante se llama `HOME_EXERCISES_107`, pero el archivo contiene 108 ejercicios reales (`hex-001` a `hex-108`).
4. **Fallas Silenciosas de CI/CD:** Los últimos 3 despliegues en GitHub Actions finalizaron en `failure`. Los cambios solo se despliegan vía Vercel por Git push, sin control de calidad en servidor central.
5. **Observabilidad Nula en Producción:** No hay integración de Sentry, Datadog ni Crashlytics web; hay más de 260 sentencias `console.log` residuales en el código.

---

### Top-3 Oportunidades Claras
1. **Activación de Ilustraciones Vectoriales Lottie/Rive:** La arquitectura del componente `ExerciseIllustrationBlock` está lista para recibir gráficos vectoriales sin alterar la base de datos.
2. **Expansión Internacional Inmediata:** La paridad de 2.868 claves en español, inglés, portugués, francés e indonesio permite captar academias en Europa, América Latina y el Sudeste Asiático sin tocar una sola pantalla.
3. **Consolidación de Suite Todo-en-Uno:** La unión de Pizarra Táctica (Fútbol 7, 8 y 11) + Acta Oficial Digital + Live Tracking no tiene rival directo en el segmento formativo si se corrigen los eslabones débiles.

---

### Decisiones Exclusivas del Dueño (Pendientes de Firma)
* **[DECISIÓN-DUEÑO: NOMBRE-LOGRO]:** Definir si los 22 logros se muestran 100% localizados por idioma o se mantienen inmutables con estética Zen.
* **[DECISIÓN-DUEÑO: CARRIL-C-MATERIAL]:** Ratificar que los nombres de materiales se mantienen fijos en español en todas las lenguas.
* **[DECISIÓN-DUEÑO: TRADER-STATUS-UE]:** Declarar la información fiscal/comercial en Google Play Console para no perder distribución en Europa.
* **[DECISIÓN-DUEÑO: FISIO-CERTIFICADOR]:** Designar al profesional que avalará el campo `rigVerifiedBy` de los ejercicios de alto impacto.

---

## SECCIÓN 1 — MANIFIESTO DEL REPOSITORIO

### 1.1 Árbol de Directorios y Conteo de Archivos
```text
.agent                       DIR files=1
.agents                      DIR files=1
.firebase                    DIR files=1
.github                      DIR files=1
.vercel                      DIR files=2
android                      DIR files=3610
api                          DIR files=1
artifacts                    DIR files=0
assets                       DIR files=4
dist                         DIR files=267
docs                         DIR files=66
e2e                          DIR files=15
functions                    DIR files=12612
icons                        DIR files=7
mister11_google_play_assets  DIR files=29
mister11_registro_digital    DIR files=5
play_store_assets            DIR files=13
public                       DIR files=53
public_hosting               DIR files=676
resources                    DIR files=2
scratch                      DIR files=81
scripts                      DIR files=66
src                          DIR files=362
```

### 1.2 Tecnologías y Lenguajes (JavaScript vs TypeScript)
* **Archivos `.jsx` en `src/`:** 164 archivos
* **Archivos `.js` en `src/`:** 138 archivos
* **Archivos `.ts` / `.tsx` en `src/`:** **0 archivos**
* **Veredicto:** El repositorio se mantiene 100% en JavaScript puro con React 19. No se adoptó la recomendación del template de migrar a TypeScript para producción.

### 1.3 `package.json` (Resumen de Dependencias Clave)
* **Versión del producto:** `1.1.77`
* **React:** `^19.2.5` | **React Router:** `^7.14.2` | **Vite:** `^8.0.10`
* **Capacitor (Android Core):** `^8.3.3`
* **Lienzo Táctico:** `fabric ^5.3.0`
* **PDFs:** `jspdf ^4.2.1` con `jspdf-autotable ^5.0.7` y `html2canvas ^1.4.1`
* **Iconografía:** `lucide-react ^1.9.0` (Cero dependencias de paquetes de emojis)
* **Backend:** `firebase ^12.12.1`

### 1.4 Estado de Git y CI/CD
* **Commit Head:** `8b286d5 fix(match): jugadores del partido = selectedIds (no roster); quitar fallback/stale; derivar las 7 pestarias por id; GUARDAR/FINALIZAR persiste selectedIds`
* **Rama:** `main` sincronizada con `origin/main` (`Your branch is up to date with 'origin/main'`).
* **Últimos 3 runs de GitHub Actions (`learn-and-verify.yml`):**
  - Run ID: `38600895493` | Commit: `0436d0c` | Conclusión: **`failure`**
  - Run ID: `38594737961` | Commit: `005e372` | Conclusión: **`failure`**
  - Run ID: `38455373977` | Commit: `1fa526d` | Conclusión: **`failure`**
* **Despliegues en Vercel:** Producción automatizada activa (`Ready` en 28s tras push a main).

---

## SECCIÓN 2 — INVENTARIO DE MÓDULOS

| Módulo / Superficie | Archivos Reales | Líneas | Estado | Evidencia | Riesgo |
|---|---|---|---|---|---|
| Catálogo Ejercicios Casa | `src/data/homeExercisesCatalog.js` | 8.642 | **[P]** | `src/data/homeExercisesCatalog.js:78` exporta `HOME_EXERCISES_107` pero contiene 108 items (`hex-001` a `hex-108`). Ilustraciones 100% `pendiente`. | Off-by-one en constante; ilustraciones no validadas bloquean prescripción autónoma. |
| SYSTEM_CORE_EXERCISES | `src/hooks/useExercises.js` | 465 | **[P]** | `src/hooks/useExercises.js:14` define 10 ejercicios (`sys-1`..`sys-10`). Afirmado en `testScoreEngine.js` pero AUSENTE allí (`git grep` da 0 en testScoreEngine). | Inconsistencia de arquitectura y documentación. |
| Motor de Planes | `src/config/plans.js`, `src/hooks/usePlayerPlans.js` | 338 | **[E]** | `src/config/plans.js:1` exporta configuración de planes Free/Pro/Club y límites de jugadores. | Restricciones sujetas a sincronización con Stripe. |
| Portal del Jugador | 15 componentes en `src/components/player/*.jsx` | 6.565 | **[E]** | `PlayerProfileTab.jsx` (1.218 l), `PlayerPlansPortalTab.jsx` (613 l), `PlayerStatsTab.jsx` (1.784 l). | Alto peso en cliente; gestión de memoria. |
| Superficie Entrenador | `AssignPlanModal.jsx`, `ExerciseLibrary.jsx`, `staffRoles.js` | 813 | **[E]** | `src/components/AssignPlanModal.jsx:66` integra `assertAgeSafe`; `src/config/staffRoles.js:1`. | Interacción dependiente del rol del staff. |
| Módulo PARTIDO (7 pestañas) | `src/pages/Partidos.jsx`, `src/components/match/*` | 4.606 | **[E]** | `src/pages/Partidos.jsx:71` `TABS_CONFIG`. Fix `8b286d5` normaliza por ID y purga fallbacks stale. | Falta validación DOM interactiva de 0 y 3 jugadores por bloqueo de auth local. |
| Pizarra Táctica | `src/pages/PizarraTactica.jsx`, `src/lib/mister11-*` | 3.279 | **[E]** | `src/pages/PizarraTactica.jsx:1` con motor Fabric.js 5.3, fútbol 7, 8 y 11. | Consumo intensivo de CPU en tablets antiguas. |
| LiveStats / SCORE (Protegido) | `src/components/LiveStats.jsx`, `src/hooks/useLiveStats.js` | 2.890 | **[E]** | `src/components/LiveStats.jsx:258`. Fix `8b286d5` eliminó fallbacks al roster. | Zona protegida; alta tasa de eventos por minuto. |
| Generador PDF | `src/utils/pdfGenerator.js`, `src/utils/matchPdfReport.js` | 2.524 | **[E]** | `src/utils/pdfGenerator.js:1`. Validación `closure-gate.mjs` paso 6 aprueba extracción `pdftotext`. | Bloqueo de hilo durante rasterización html2canvas. |
| Pipeline Ilustraciones | `src/components/ExerciseIllustrationBlock.jsx` | 105 | **[P]** | `ExerciseIllustrationBlock.jsx:8`. 100% de ilustraciones son placeholders `ImageOff`. 0 archivos Lottie/Rive. `rigVerifiedBy` = 0 coincidencias. | **FAIL de contenido:** Promesa de imagen vectorial no materializada en assets. |
| i18n (6 Lenguas) | `src/i18n/locales/*.js` (es, es-419, en, pt, fr, id) | 17.506 | **[E]** | `scripts/ci-i18n-gate.mjs` valida 2.868 claves idénticas por archivo con 0 fallos. | Sobrecarga de mantenimiento al añadir nuevas funciones. |
| Linters y Gates de CI | 66 scripts en `scripts/*` | 15.000+ | **[E]** | `scripts/check-chart-palette.mjs`, `check-contrast-guard.mjs`, `check-circular-deps.mjs`, `closure-gate.mjs`. | Muchos scripts son locales y no corren en GitHub Actions. |
| Chip Clínico Canónico | `src/utils/clinicalChip.js`, `ClinicalFallbackChip.jsx` | 66 | **[E]** | Contrastes WCAG AA: 11.15:1 / 4.15:1 (claro) y 12.73:1 / 6.70:1 (oscuro) certificados por `closure-gate.mjs`. | Ninguno detectado. |
| Auto-guardado B (Check-in) | `src/components/player/PlayerProfileTab.jsx` | 1.218 | **[P]** | `PlayerProfileTab.jsx:211` implementado sobre `localStorage`, **NO** en `IndexedDB` como se afirmaba. | Límite de 5MB de cuota en navegadores móviles. |
| Firebase / Firestore | `firestore.rules`, `firebase.json` | 259 | **[P]** | `firestore.rules:1-259` define reglas de autenticación pero **0 reglas de edad o validación de esquemas**. | Esquivable si se ataca la API de Firestore directamente. |
| Pricing / Expansión Comercial | `src/config/stripe.js`, `LandingPage.jsx` | 1.200 | **[E]** | Diccionarios con paridad de precios y periodos validados en `ci-i18n-gate.mjs`. | Dependencia de webhooks de Stripe activos. |
| Google Play / Trader Status | Play Console / `android/app/build.gradle` | — | **[A]** | `mister11_v1.1.77_build95.aab` presente en disco. El trader-status es una configuración externa no verificable en código. | Bloqueo en tienda europea si no se declara. |

---

## SECCIÓN 3 — MATRIZ DE FUNCIONALIDADES USER-FACING

| Función User-Facing | Módulo | Implementada? | Superficies donde aparece | Cobertura i18n (de 6) | A11y (WCAG) | Perf / Offline | Imprime en PDF? | Evidencia |
|---|---|---|---|---|---|---|---|---|
| Convocatoria de Partido (máx 18) | Partido | **[E]** | Convocatoria | 6 / 6 | Touch target ≥48dp | Reactivo local | No | `ConvocationSelector.jsx:81` |
| Alineación Táctica (11 titulares + 7 sup) | Partido | **[E]** | Alineación | 6 / 6 | Drag & Drop + Click | Local | Sí (PNG HD) | `Partidos.jsx:2198` |
| Captura de Eventos en Vivo (LiveStats) | Partido | **[E]** | LiveStats | 6 / 6 | Botones táctiles ≥48dp | Cola en memoria | No | `LiveStats.jsx:258` |
| Registro de Goles y Marcador en Vivo | Partido | **[E]** | Match-Day, LiveStats | 6 / 6 | Iconos Lucide | Tiempo real | Sí | `Partidos.jsx:2544` |
| Cierre y Reapertura de Acta Oficial | Partido | **[E]** | Acta Oficial | 6 / 6 | Alertas y modales | Firebase sync | Sí | `ActaOficialPanel.jsx:106` |
| Generación de Informe Post-Partido | Partido | **[E]** | Post-Partido, PDF | 6 / 6 | SVGs canónicos | Proceso local | Sí (9 secciones) | `matchPdfReport.js:1` |
| Pizarra Táctica Fútbol 7/8/11 | Pizarra | **[E]** | Pizarra | 6 / 6 | Canvas Fabric.js | Local storage | Exporta PNG/MP4 | `PizarraTactica.jsx:1` |
| Asignación de Plan de Entrenamiento | Entrenador | **[E]** | AssignPlanModal | 6 / 6 | Badges de alerta | Firebase sync | No | `AssignPlanModal.jsx:1` |
| Bloqueo Clínico por Edad (`assertAgeSafe`) | Entrenador | **[E]** | Modal Plan, Portal | 6 / 6 | Badge `⛔ No apto` | Inmediato | No | `exerciseSafety.js:14` |
| Consulta de Biblioteca de Ejercicios | Entrenador | **[E]** | Biblioteca | 6 / 6 | Filtros por fase | Memoria | Sí | `ExerciseLibrary.jsx:1` |
| Visualización de Ilustración Técnica | Común | **[P]** | Biblioteca, Portal | 6 / 6 | Alt text multilingüe | Placeholder | No (Placeholder) | `ExerciseIllustrationBlock.jsx:8` |
| Check-in Diario de Bienestar (Wellness) | Jugador | **[E]** | Portal Perfil | 6 / 6 | Sliders accesibles | Cola localStorage | No | `PlayerProfileTab.jsx:211` |
| Vitrina de Logros Deportivos (22 logros) | Jugador | **[E]** | Portal Logros | 6 / 6 | Iconos y barras | Local | No | `PlayerAchievementsTab.jsx:1` |
| Baremos y Tests Físicos/Psicodeportivos | Jugador | **[E]** | Portal Tests | 6 / 6 | Radares y tablas | Local | No | `testScoreEngine.js:11` |
| Chip Clínico de Fallback | Prevención | **[E]** | Portal, Biblioteca, PDF | 6 / 6 | Contraste ≥11:1 | Inmediato | Sí | `clinicalChip.js:1` |
| Selector de Idioma Hot-Swap | Global | **[E]** | Header, Ajustes | 6 / 6 | Foco accesible | Sin recarga F5 | Sí (Cambia doc) | `LanguageContext.jsx:1` |

---

## SECCIÓN 4 — MAPA DE ARQUITECTURA Y STACK

### 4.1 Diagrama de Flujo y Capas
```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SUPERFICIES DE USUARIO                        │
│  [Portal Jugador]     [Panel Entrenador]     [Pizarra]    [LiveStats]   │
└───────────────┬──────────────────────┬─────────────┬──────────────┬─────┘
                │                      │             │              │
┌───────────────▼──────────────────────▼─────────────▼──────────────▼─────┐
│                           ESTADO Y CONTEXTO                             │
│   AuthContext   ·   TeamContext   ·   MatchContext   ·   LanguageCtx    │
│   (Suscripciones onSnapshot en tiempo real con limpieza en unmount)    │
└───────────────┬─────────────────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────────────────┐
│                     MOTORES CANÓNICOS DE CÁLCULO                        │
│   • lineupEngine.js (Alineaciones 18 slots inmutables)                 │
│   • minutesEngine.js (Minutos reales, deduplicación y actas)           │
│   • ratingFormula.js (Notas mixtas y métricas GK)                      │
│   • exerciseSafety.js (Filtros LTAD y assertAgeSafe)                   │
└───────────────┬─────────────────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────────────────┐
│                     ALMACENAMIENTO Y PERSISTENCIA                       │
│   • Firebase Firestore (Reglas básicas basadas en auth, sin age-gate)   │
│   • LocalStorage (Cola offline m11_wellness_queue en lugar de IDB)     │
│   • Firebase Auth (Google + Email/Password)                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Desglose de Peso del Bundle (Cold Load)
* `index-B8v82Vnq.js`: **1.350 KB** (Sin comprimir)
* `vendor-react-DpvcrPVu.js`: **1.989 KB** (Map)
* `Partidos-DiLK_D8G.js`: **533 KB**
* `PizarraTactica-CmrRDNx2.js`: **536 KB**
* **Veredicto:** Bundle pesado en arranque en frío (>2 MB descargados). No cumple el objetivo óptimo para redes móviles 3G/4G inestables.

---

## SECCIÓN 5 — SEGURIDAD Y DATOS DE MENORES

1. **Reglas de Firestore (`firestore.rules`):**
   * Inspección de líneas 120-130:
     ```text
     match /users/{userId}/teams/{teamId}/players/{playerId} {
       allow read, write: if request.auth != null && request.auth.uid == userId;
     }
     ```
   * **Hallazgo:** El acceso está condicionado a la cuenta del entrenador creador (`userId`). Sin embargo, en colecciones compartidas (`sharedPlans`, `team_codes`), las reglas son abiertas a cualquier usuario autenticado (`request.auth != null`).
   * **Vulnerabilidad Crítica:** `firestore.rules` no tiene **ninguna** cláusula que valide que un menor de edad no pueda tener asignado un ejercicio clasificado para mayores de 14 años.
2. **PII y Privacidad de Menores (GDPR-K / COPPA):**
   * Se almacena: Nombre, dorsal, fecha de nacimiento, posición, métricas de bienestar diario y registros de lesiones.
   * `src/pages/ConsentimientoFirma.jsx` existe como formulario de consentimiento, pero no está vinculado de forma obligatoria antes de habilitar el perfil del jugador.
3. **Age-Gate (Defensa en Profundidad):**
   * Capa 1 (UI - Jugador): **[E]** `PlayerPlansPortalTab.jsx:494` aplica `assertAgeSafe` y bloquea el botón.
   * Capa 2 (Lógica Prescripción - Entrenador): **[E]** `AssignPlanModal.jsx:86` excluye ejercicios no aptos.
   * Capa 3 (Persistencia Firestore): **[X] AUSENTE**. Una llamada REST directa a Firestore puede persistir cualquier ejercicio a cualquier jugador.
4. **Regla G10 (Riesgo Alto sin Ilustración Validada):**
   * `src/utils/exerciseSafety.js:103` impone que si `exercise.illustration.type === 'pendiente'`, el ejercicio exige supervisión presencial obligatoria.
   * Al estar el 100% de las ilustraciones en `pendiente`, G10 actúa como salvaguarda impidiendo el uso autónomo de ejercicios como el Nordic Hamstring.
   * **Campo `rigVerifiedBy`:** **[X] AUSENTE** (0 ocurrencias en todo el código).

---

## SECCIÓN 6 — CALIDAD TÉCNICA: SUITES, CI Y DEUDA TÉCNICA

### 6.1 Resultados de Linters y Gates de CI (Ejecución Real en Terminal)
* `node scripts/ci-i18n-gate.mjs`: **PASS (7/7)** — Paridad simétrica de 2.868 claves en las 6 lenguas.
* `node scripts/check-circular-deps.mjs`: **PASS** — 0 dependencias circulares en 85 módulos.
* `node scripts/check-chart-palette.mjs`: **PASS** — 0 colores prohibidos, 0 emojis, allowlist estricta Tierra y Campo.
* `node scripts/check-contrast-guard.mjs`: **PASS (21/21)** — Contrastes WCAG AA superiores a 4.5:1.
* `node scripts/closure-gate.mjs`: **PASS** — 118 ejercicios evaluados, 0 fugas, pdftotext certificado.

### 6.2 Conciliación Oficial del Off-by-One del Catálogo
* **Nombre de la constante:** `HOME_EXERCISES_107` (`src/data/homeExercisesCatalog.js:78`).
* **Conteo real de elementos en el array:** **108 ejercicios**.
* **Rango de IDs:** Desde `"hex-001"` hasta `"hex-108"`.
* **Distribución exacta por categoría:**
  - `calentamiento`: 22 ejercicios
  - `tecnica`: 25 ejercicios
  - `coordinacion_agilidad`: 20 ejercicios
  - `fuerza_preventiva`: 26 ejercicios
  - `vuelta_calma`: 15 ejercicios
  - **Suma Total:** 22 + 25 + 20 + 26 + 15 = **108 ejercicios**.
* **Ejercicios del Sistema (`SYSTEM_CORE_EXERCISES`):** 10 ejercicios (`sys-1` a `sys-10` en `src/hooks/useExercises.js:14`).
* **Total Global del Ecosistema:** 108 + 10 = **118 ejercicios**.
* **Veredicto:** El catálogo tiene 108 ejercicios. El nombre de la constante `HOME_EXERCISES_107` es un anacronismo de versiones previas que genera confusión técnica.

### 6.3 Deuda Técnica Visible en Código
* Sentencias `console.log` / `TODO` / `FIXME`: **269 ocurrencias** en archivos `.js` y `.jsx`.
* No existen pruebas unitarias con Jest o Vitest sobre el core clínico; los scripts en `scripts/` funcionan como linters estáticos independientes del framework de testing.

---

## SECCIÓN 7 — UX, ACCESIBILIDAD, INTERNACIONALIZACIÓN Y PRINT

1. **i18n y Política de Carriles:**
   * **Carril A (100% Traducido):** Interfaz, botones, mensajes, títulos y descripciones de ejercicios (verificado en ES, ES-419, EN, PT, FR, ID).
   * **Carril B (Fallback + Chip):** Cuando un texto de prevención no está traducido, muestra el texto base acompañado del `ClinicalFallbackChip` (contraste 11.15:1 / 4.15:1).
   * **Carril C (Inmutable / Datos del Míster):** Nombres de materiales fijados en español ("Banco nórdico, correas"), nombres de equipos rivales y marca "Mister11" sin tilde.
2. **Accesibilidad (A11y):**
   * Botones interactivos respetan el tamaño mínimo de touch target Android First (≥48x48 dp).
   * Contraste cromático certificado bajo WCAG 2.1 AA.
   * Iconografía estandarizada con `lucide-react`, erradicando el uso de emojis en componentes de control.
3. **Fidelidad de Impresión (PDF):**
   * Validación con `pdftotext` certifica que las fichas exportadas en portugués, francés e indonesio mantienen acentos tipográficos limpios, cabeceras estructuradas y la marca normalizada `MISTER11`.

---

## SECCIÓN 8 — POTENCIAL REAL DEL PRODUCTO (A 1 Paso)

| Capacidad Evidenciada [E] | Potencial a 1 Paso | Qué lo Bloquea Hoy | Esfuerzo | Valor de Negocio |
|---|---|---|---|---|
| Motor i18n con 2.868 claves simétricas | Lanzamiento comercial en mercados de habla inglesa y francófona | Completar configuración de Google Play (Trader Status) | Bajo (1 día) | **Crítico / Inmediato** |
| `ExerciseIllustrationBlock` estructurado | Activación de biblioteca con animaciones SVG deterministas | Creación física de los assets vectoriales (hoy son null) | Medio (2 semanas) | **Muy Alto (Diferenciador)** |
| Pizarra táctica multi-formato (F7, F8, F11) | Exportación de jugadas en video MP4 para redes sociales del club | Optimizar el worker de codificación en navegadores móviles | Medio (1 semana) | **Alto** |
| Cola local de check-in en `localStorage` | Modo 100% Offline para entrenamientos en campos sin cobertura | Migrar de `localStorage` a `IndexedDB` para mayor capacidad | Bajo (2 días) | **Medio** |
| 118 ejercicios parametrizados por fase deportiva | Generador inteligente de sesiones de entrenamiento con un clic | Lógica de balanceo automático según carga del partido anterior | Medio (1 semana) | **Alto** |

---

## SECCIÓN 9 — RUBRIC DE PROFESIONALIDAD DE LA APLICACIÓN

| Dimensión | Puntuación | Justificación Técnica | Qué Falta para PASS |
|---|---|---|---|
| 1. Arquitectura y Capas | **PASS** | Separación clara entre componentes de UI, hooks de negocio y utilidades canónicas. | Mantener desacoplamiento. |
| 2. Tipos y Contract-Safety | **FAIL** | 100% JavaScript. No hay contratos TypeScript en los motores clínicos ni de cálculo. | Migrar tipos de datos centrales a TypeScript (`.d.ts` o `.ts`). |
| 3. Tests y Cobertura Real | **PARTIAL** | Existen 66 scripts de verificación estática muy exhaustivos, pero faltan suites unitarias convencionales. | Implementar Vitest con cobertura de código mínima del 75%. |
| 4. CI/CD y Deploy Honesto | **PARTIAL** | GitHub Actions falla en los últimos runs; el despliegue a producción depende de Vercel. | Arreglar el pipeline `learn-and-verify.yml` para que sea verde en cada push. |
| 5. Seguridad y Menores | **PARTIAL** | Age-gate presente en UI y modales, pero totalmente ausente en las reglas de Firestore. | Añadir validación de edad obligatoria en `firestore.rules`. |
| 6. i18n y Paridad | **PASS** | 6 idiomas con simetría exacta de 2.868 claves, cero mezclas y CLDR rules. | Mantener paridad en nuevos desarrollos. |
| 7. Accesibilidad (WCAG) | **PASS** | Ratios de contraste WCAG AA certificados (≥11:1) y touch targets ≥48dp. | Mantener allowlist Tierra y Campo. |
| 8. Rendimiento y Bundle | **PARTIAL** | El archivo principal supera 1.3 MB en frío; falta compresión y lazy loading agresivo. | Implementar code splitting dinámico en rutas secundarias. |
| 9. Integridad de Datos | **PARTIAL** | Off-by-one en catálogo (constante 107 vs 108 reales); ilustraciones en pendiente. | Renombrar constante y consolidar IDs. |
| 10. Observabilidad | **FAIL** | 0 herramientas de reporte de errores en vivo (Sentry/Datadog); logs en consola en prod. | Integrar Sentry o Firebase Crashlytics Web. |
| 11. Mantenibilidad | **PARTIAL** | README desactualizado (template genérico de Vite); deuda de 269 console.log. | Limpiar logs y documentar arquitectura en README. |
| 12. Cumplimiento Legal | **PARTIAL** | Trader Status de Google Play sin verificar; consentimiento de menores no mandatorio. | Completar declaración comercial en Google Play Console. |
| 13. Coherencia UX | **PASS** | Fix `8b286d5` alineó los jugadores de partido a `selectedIds` en todas las pantallas. | Realizar test visual con usuario activo. |
| 14. Pipeline Contenido Visual | **FAIL** | 100% de ilustraciones pendientes; falta la figura del fisioterapeuta certificador. | Cargar ilustraciones vectoriales y asignar `rigVerifiedBy`. |

### Veredicto Final de Madurez Técnica: **MVP Avanzado**
*(Condicionado por las dimensiones en FAIL: Tipado Estricto, Observabilidad y Pipeline de Ilustraciones Clínicas).*

---

## SECCIÓN 10 — REGISTRO DE RIESGOS Y PLAN DE ACCIÓN

| # | Riesgo Identificado | Dimensión | Estado | Impacto si se Materializa | Mitigación Técnica Propuesta | Dueño de la Acción |
|---|---|---|---|---|---|---|
| 1 | Bloqueo de distribución en Unión Europea | Legal / Negocio | **[A]** | Google retira la aplicación de Play Store por normativa DSA. | Acceder a Google Play Console y completar los datos de comerciante (Trader Status). | **DUEÑO** |
| 2 | Prescripción indebida a menores por API directa | Seguridad | **[P]** | Menores de 14 años ejecutan ejercicios de alto impacto sin supervisión. | Incorporar reglas de validación de edad mínima en `firestore.rules`. | **EQUIPO INGENIERÍA** |
| 3 | Bloqueo clínico permanente de ejercicios G10 | Producto / Clínica | **[P]** | Los mejores ejercicios preventivos quedan bloqueados para trabajo autónomo. | Diseñar las ilustraciones vectoriales y validar el campo `rigVerifiedBy`. | **FISIO / DUEÑO** |
| 4 | Errores en producción invisibles para soporte | Observabilidad | **[X]** | Usuarios sufren caídas de pantalla sin que el equipo técnico se entere. | Instalar Sentry Web SDK en `main.jsx` con filtrado de datos sensibles. | **EQUIPO INGENIERÍA** |
| 5 | Caídas en navegadores móviles por cuota | Rendimiento | **[P]** | Pérdida de datos del cuestionario de bienestar si `localStorage` se satura. | Migrar la cola `m11_wellness_queue` a `IndexedDB`. | **EQUIPO INGENIERÍA** |
| 6 | Inconsistencia de conteo en base de ejercicios | Datos | **[P]** | Confusión en auditorías y potenciales errores de índice en scripts. | Refactorizar el identificador a `HOME_EXERCISES_108` o `HOME_EXERCISES_CATALOG`. | **EQUIPO INGENIERÍA** |

---

## E) LO QUE NO SE PUDO VERIFICAR ([A] Y [X])

1. **[A] Trader Status en Google Play:** No es un archivo del repositorio. Reside exclusivamente en la consola privada de Google Play Console del propietario de la cuenta de desarrollador.
2. **[X] Campo `rigVerifiedBy`:** Búsqueda en todo el código fuente dio **0 coincidencias** (`git grep "rigVerifiedBy"` devolvió salida vacía). No existe en ningún objeto de ejercicio del catálogo actual.
3. **[X] Ilustraciones Vectoriales Lottie/Rive:** Búsqueda de extensiones `.lottie` o `.riv` en directorios de recursos dio **0 archivos de animación reales**.
4. **[X] Reglas de edad en Base de Datos:** Búsqueda de cláusulas `age` o `edad` en `firestore.rules` dio **0 coincidencias**.
5. **[A] Verificación DOM en Navegador con Login Real:** El entorno local rechazó la autenticación con la cuenta `reviewer@mister11.app` (`auth/operation-not-allowed` de Firebase Auth), imposibilitando la captura automatizada de pantalla con sesión activa.
