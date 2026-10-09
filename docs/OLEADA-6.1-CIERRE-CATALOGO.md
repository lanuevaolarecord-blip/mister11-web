# MÍSTER11 — INFORME DE CIERRE TÉCNICO OLEADA 6.1 (CATÁLOGO DE CASA Y SEGURIDAD CLÍNICA)

**Fecha:** 2026-10-09  
**Estado:** CERTIFICADO / VERDE (Build local exitoso, Google Build 95 intacto)

---

## 1. C1. Delta de Material Real en el Catálogo de Casa
- Migración completa de los 108 ejercicios en `src/data/homeExercisesCatalog.js` al nuevo esquema:
  - `material_preferido: enum[]`
  - `alternativa_casa: { option: enum[], nota: { es: string, en: string } }`
  - `contexto: 'casa' | 'gym' | 'campo_only'`
- Inventario canónico de usuario definido y exportado en `DEFAULT_USER_INVENTORY`:
  - `['peso_corporal', 'toalla', 'banda_elastica', 'botella', 'mochila_lastre', 'escalon', 'silla_estable', 'cojin', 'colchoneta', 'marco_puerta', 'pared', 'suelo', 'pelota']`
- Reglas no negociables de equivalencia física:
  - **Banda elástica vs toalla**: no 1:1. La toalla solo aplica para variantes isométricas. Si no hay banda, se marca nota de activación o ejercicio sustituto.
  - **Medicine ball vs botella/mochila**: la carga es diferente y se indica explícitamente en la nota.
  - **Wobble pad/Bosu vs cojín**: menor inestabilidad; requiere nota de alineación articular.
  - **Cajón pliométrico vs escalón**: menor altura; requiere nota de amortiguación de impacto y ruido/vecinos.
- Los 5 SVG de `mister11-materials.js` quedan en **backlog para Oleada 7 L1** y no se computan como delta de casa.

---

## 2. C2. Umbrales de Edad, Supervisión Presencial y Bloqueo Duro
- Se incorporaron a todos los ejercicios:
  - `age_min: number | null`
  - `age_max: number | null`
  - `edad_minima_segura: number`
  - `requiere_supervision_presencial: boolean`
  - `safety_notes: { es: string, en: string }`
  - `source: { type: enum, citation: string }`
- Umbrales acordados según **LTAD Lloyd 2016** y **ACSM 2022**:
  - **Nordic hamstring (`hex-078`)**: `edad_minima_segura: 14`, `requiere_supervision_presencial: true`.
  - **Copenhagen adductor (`hex-076`, `hex-077`)**: nivel 1 suelo (12), nivel 2 dinámico banco (14 con supervisión).
  - **Pliometría / Drop jump (`hex-064`)**: `edad_minima_segura: 16`, `requiere_supervision_presencial: true`.
  - **Isométrico cervical de portero (`hex-108`)**: ejercicio creado con `edad_minima_segura: 14`, `requiere_supervision_presencial: true` y prohibición de autoprescripción sin supervisión.
- Implementación de bloqueo duro en `src/utils/exerciseSafety.js` y exportado en `src/hooks/useExercises.js`:
  - `assertAgeSafe(playerAge, exercise)`: bloquea la prescripción si `playerAge < edad_minima_segura`.
  - `canPrescribeAtHome(exercise, options)`: bloquea ejercicios sin material ni alternativa, sin supervisión declarada, con contexto no casero o edad inferior a la recomendada.
  - `filterHomeExercises(exercises, options)`: selector puro para prescripción en casa.

---

## 3. C3. Aislamiento de Técnica de Campo
- Los ejercicios que demandan campo abierto, slalom extenso, picas clavadas en césped o rondos amplios (`hex-030`, `hex-032`, `hex-033`, `hex-043`, `hex-044`, `hex-046`, `hex-060`) fueron clasificados con `contexto: 'campo_only'`.
- El selector `canPrescribeAtHome` y `filterHomeExercises` bloquea categóricamente cualquier ejercicio `campo_only` de ser prescrito como tarea doméstica.
- Solo permanecen en contexto casero aquellos ejercicios con balón que se realizan contra pared, en espacios reducidos o con toalla/suelo.

---

## 4. C4. Erradicación de `source: 'system'` y Mapeo Clínico Acreditado
- Se eliminó totalmente `source: 'system'` de `homeExercisesCatalog.js` y de `SYSTEM_CORE_EXERCISES` en `useExercises.js`.
- Todo el catálogo está respaldado por fuentes clínicas en lista blanca:
  - `guia_fifa`: *FIFA 11+ Programme Manual, FIFA/F-MARC*
  - `estudio_peer_reviewed`: *Petersen et al. 2011 (Am J Sports Med)*, *Thorborg/Hölmich/Harøy et al. (Br J Sports Med)*, *Verhagen et al. 2004*
  - `consenso_fisio_colegiado`: *ACSM 2022 Guidelines*, *Lloyd 2016 LTAD*
  - `guia_federacion`: *Protocolo de fortalecimiento cervical para prevención de conmociones*

---

## 5. C5. Gobernanza Visual: Eliminación de Emojis y Adopción de Paleta Canónica
- En `HOME_EXERCISES_CATEGORIES`:
  - Se eliminaron todos los emojis (`🔥`, `⚽`, `⚡`, `🛡️`, `🍃`).
  - Sustituidos por claves de componentes Lucide: `Flame`, `Target`, `Zap`, `ShieldCheck`, `Wind`.
  - Se erradicaron colores no canónicos (`#F97316`, `#0284C7`, `#8B5CF6`, `#10B981`, `#059669`).
  - Se aplicaron los tokens 100% canónicos Tierra y Campo:
    - `calentamiento`: `#C85A32` (--terracota)
    - `tecnica`: `#D4A843` (--oro)
    - `coordinacion_agilidad`: `#9C6A3B` (--ocre)
    - `fuerza_preventiva`: `#1B3A2D` (--verde-selva)
    - `vuelta_calma`: `#4CAF7D` (--verde-campo)

---

## 6. C6. CI Gates en `scripts/ci-exercise-catalog.mjs`
Se implementaron y certificaron los gates:
- **G1**: Total de ejercicios (108 ejercicios con hex-108).
- **G2**: Unicidad de identificadores.
- **G3**: Desglose metodológico canónico (calentamiento 22, técnica 25, coordinación/agilidad 20, fuerza preventiva 26, vuelta a la calma 15).
- **G4**: Niveles gamificados (básico, intermedio, avanzado).
- **G5**: Dosificación atlética (series, reps/duración, descanso).
- **G5b**: Seguridad por edad y supervisión en zonas biomecánicas críticas.
- **G6**: Bilingüismo y ausencia de tokens `<think>`.
- **G6b**: Fuentes clínicas certificadas en lista blanca.
- **G7b**: Delta de material casero, alternativas y notas obligatorias.
- **G8**: Aislamiento estricto de `campo_only` y test funcional del motor recomendador.
- **G9**: Gobernanza visual (0 emojis, colores Tierra y Campo).

---

## 7. C7. Decisión de Branding y Acentos en Footer PDF
- **Resolución adoptada**: Mantener codificación ASCII estándar (`Mister11 Platform - mister11.app` y `Pagina X de Y`) en `drawPdfFooter` y generadores de reporte.
- **Fundamento técnico**: Los diacríticos (`í`, `á`) y caracteres especiales (`•`) en las fuentes base estándar de jsPDF (Helvetica) alteran las matrices de kerning nativas, generando colapsos visuales como `mister11.a pp` o `Pá g ina`. Mientras no se incruste una fuente TTF/WOFF Unicode completa en el bundle de exportación, se preserva ASCII limpio para máxima nitidez y compatibilidad.
- **Paginación corregida**: En `drawPdfFooter`, se resolvió el branch polimórfico para que `{ totalPages: N, currentPage: M }` respete `totalPages` y no colapse forzando `total = cur`. Certificado con prueba de 4 páginas en `scripts/assert-pdf-quality.mjs` (13/13 pasados).

---

## 8. C8. Esquema de Lenguas y Deuda Técnica Registrada
- Los campos de seguridad y alternativas se implementaron como **mapa abierto**:
  - `safety_notes: { [lang]: string }`
  - `alternativa_casa.nota: { [lang]: string }`
- **Registro en Backlog**: Los campos preexistentes `name`/`nameEs`/`nameEn`, `description`/`descriptionEs`/`descriptionEn` y `coachingPointsEs`/`coachingPointsEn` se mantienen temporalmente bilingües fijos como deuda técnica para no desestabilizar componentes en este sprint.
- **Condición de certificación**: No se certificará el escalado clínico multi-lengua (árabe, francés, etc.) hasta que se complete la migración unificada del catálogo a mapas abiertos indexados por clave ISO de idioma.
