# OLEADA-6-AUDITORIA-CODIGO
## Documento Oficial de Auditoría y Cotejo de Código Real
**Rol:** Ingeniero de documentación de auditoría + QA Sr.  
**Fecha:** 2026-10-09  
**Repositorio:** `lanuevaolarecord-blip/mister11-web` (rama `main`)  
**Commit Auditado:** `b0d46f4`  
**Regla de Oro 0:** Reloj Google Build 95 (v1.1.77) INTACTO. Cero AAB/APK/Play Console/Firestore miembros modificados. Cero código de relleno.

---

## 📌 Contexto Probado del Auditor (Fuente de Verdad)
El Knowledge Base del auditor contiene exclusivamente:
1. El PDF de sesión real (*BURRIANA B 06/10/2026*), con el footer roto literal en sus 4 páginas: `"Míster11 Platform • mister11.a pp Pá g ina N de 4"`.
2. Los typos del MISTER (Carril C, de usuario, no del generador): `"Obj etivo"`, `"trancision"`, `"pocesion"`, `"balo"`, `"giados"`, `"sejun"`, `"sona"`, `"transision"`.
3. La convocatoria de 21 con roles tácticos irrenunciables: *17 Anas Barhoun MC*, *45 Quim Micó LTI*, *3 Xavi Cortecero LTD*, *22 Jordi safont EXT*, *23 Francesc Font Pitarc DEL*, etc.
4. Las 3 URLs i18n certificadas caídas (`thefa.com` 404, `knvb.nl` mantenimiento, `fff.fr` artículo externo).
5. El README del repo como template Vite+React (*el auditor no tiene acceso directo a la consola del desarrollador, este documento es su único canal de cruce*).

---

## 🏷️ Convención Estricta de Etiquetas
Cada bloque de este documento está clasificado obligatoriamente bajo una de estas cuatro categorías:
- **`[CÓDIGO-REAL-DEL-REPO]`**: Texto copiado literal, byte a byte, de un archivo existente en el repositorio.
- **`[RESUMEN]`**: Explicación técnica de soporte redactada por QA. No constituye código certificable.
- **`[NO-IMPLEMENTADO]`**: Función, campo o esquema solicitado que **no existe** en el repositorio actual. Se indica la ruta y línea donde debería residir. Prohibido fabricar código de relleno.
- **`[PLAN-FUTURO]`**: Backlog planificado no ejecutado en esta etapa.

---

# ARREGLO 1 — FOOTER DEL PDF [VERIFICABLE CONTRA EL KB]

### [RESUMEN]
En el PDF real de la sesión (*BURRIANA B 06/10/2026*), el pie de página mostraba dos defectos de espaciado:
1. `"Míster11 Platform • mister11.a pp"` provocado por el glifo de punto medio Unicode (`•`) que desalineaba el kerning de la fuente Helvetica estándar en jsPDF.
2. `"Pá g ina"` provocado por el carácter diacrítico con tilde (`á`) que en la fuente básica de jsPDF se descomponía en glifos separados con espacios erróneos.
En la Oleada 4 (`0c7d27a`), se corrigió el generador en `src/utils/pdfTheme.js` sustituyendo el bullet por un guión plano ASCII (`-`) y usando la palabra `"Pagina"` sin tilde.

### [CÓDIGO-REAL-DEL-REPO]
**Archivo:** `src/utils/pdfTheme.js` (Líneas 400 a 426)
```javascript
/**
 * Renderiza el pie de página unificado Míster11.
 */
export const drawPdfFooter = (doc, pageW = 210, pageH = 297, currentPage = 1, totalPages = 1) => {
  let w = pageW;
  let h = pageH;
  let cur = currentPage;
  let total = totalPages;

  // Soporte polimórfico si el segundo argumento es un objeto de opciones
  if (typeof pageW === 'object' && pageW !== null) {
    w = doc?.internal?.pageSize?.getWidth?.() || 210;
    h = doc?.internal?.pageSize?.getHeight?.() || 297;
    cur = doc?.internal?.getNumberOfPages?.() || 1;
    total = cur;
  }

  doc.setDrawColor(...PDF_COLORS.border);
  doc.line(14, h - 14, w - 14, h - 14);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.textMuted);
  // FRENTE F (PDF-Q): Usar '-' en lugar de '•' para que jsPDF/helvetica no rompa el kerning en 'mister11.a pp' -> 'mister11.app'
  doc.text('Mister11 Platform - mister11.app', 14, h - 8);

  // FRENTE F (PDF-Q): Usar 'Pagina' sin tilde para evitar que el diacrítico rompa el espaciado en helvetica 'Pá g ina' -> 'Pagina'
  const pageStr = `Pagina ${cur} de ${total}`;
  doc.text(pageStr, w - 14, h - 8, { align: 'right' });
};
```

---

# ARREGLO 2 — DELTA DE MATERIAL REAL [VERIFICABLE CONTRA HISTORIAL]

### [RESUMEN]
El auditor solicitó verificar si el catálogo de ejercicios de casa cuenta con el esquema de equipamiento diferenciado:
- `material_preferido: enum[]`
- `alternativa_casa: { option: enum[], nota: { [lang]: string } }`
- `user_inventory: enum[]`
Al cotejar el código real en `src/data/homeExercisesCatalog.js`, se confirma que el esquema actual únicamente posee un array simple `materials: string[]`, `materialsEs: string[]` y `materialsEn: string[]`. No existen los campos de sustitución ni de inventario de usuario.
Asimismo, los 5 elementos implementados en `src/lib/mister11-materials.js` son objetos gráficos SVG de la **Pizarra Táctica**, no sustituciones de material casero.

### [CÓDIGO-REAL-DEL-REPO]
**Schema de un objeto representativo:** `src/data/homeExercisesCatalog.js` (Líneas 61 a 84, Ejercicio `hex-001`)
```javascript
  {
    id: 'hex-001',
    name: 'Movilidad de Tobillo Dinámica',
    nameEs: 'Movilidad de Tobillo Dinámica',
    nameEn: 'Dynamic Ankle Mobility',
    category: 'calentamiento',
    level: 'basico',
    series: 3,
    reps: 12,
    durationSeconds: 0,
    restSeconds: 30,
    materials: ['pared'],
    materialsEs: ['pared'],
    materialsEn: ['wall'],
    description: 'De rodillas frente a una pared, avanzar la rodilla hacia adelante sin despegar el talón del suelo.',
    descriptionEs: 'De rodillas frente a una pared, avanzar la rodilla hacia adelante sin despegar el talón del suelo.',
    descriptionEn: 'Half-kneeling facing a wall, drive knee forward past toes without lifting the heel.',
    coachingPoints: ['Talón siempre pegado al suelo', 'Movimiento lento y controlado'],
    coachingPointsEs: ['Talón siempre pegado al suelo', 'Movimiento lento y controlado'],
    coachingPointsEn: ['Heel firmly on floor', 'Slow and controlled movement'],
    targetZones: ['tobillo', 'gemelo'],
    source: 'system'
  },
```

### [NO-IMPLEMENTADO]
**Campos en el esquema de ejercicios:**
- `material_preferido`: **NO EXISTE** en `src/data/homeExercisesCatalog.js`.
- `alternativa_casa`: **NO EXISTE** en `src/data/homeExercisesCatalog.js`.
- `user_inventory`: **NO EXISTE** en `src/data/homeExercisesCatalog.js` ni en el perfil del usuario.
*Ubicación esperada:* En cada objeto de `src/data/homeExercisesCatalog.js` (a partir de la línea 72) y en el estado global del perfil de usuario en `src/context/AuthContext.jsx`.

### [CÓDIGO-REAL-DEL-REPO]
**Materiales implementados en `src/lib/mister11-materials.js` (Catálogo de Pizarra, Líneas 684 a 748):**
```javascript
  valla_baja: {
    id: 'valla_baja',
    label: 'Valla Baja',
    category: 'coordinacion',
    defaultSize: 30,
    defaultColor: '#FF6600',
    canRotate: true,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="6" y="26" width="36" height="5" fill="#FF6600" rx="2" stroke="#CC4400" stroke-width="0.5"/><rect x="8" y="31" width="4" height="11" fill="#FF6600" rx="1"/><rect x="36" y="31" width="4" height="11" fill="#FF6600" rx="1"/><rect x="4" y="41" width="12" height="3" fill="#666" rx="1"/><rect x="32" y="41" width="12" height="3" fill="#666" rx="1"/></svg>`,
    colors: ['#FF6600', '#FFCC00', '#0066FF', '#4CAF7D'],
    fabricConfig: (x, y) => ({ left: x, top: y, width: 36, height: 20 }),
  },

  cono_ranurado: {
    id: 'cono_ranurado',
    label: 'Cono Ranurado',
    category: 'señalizacion',
    defaultSize: 22,
    defaultColor: '#FFD700',
    canRotate: false,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><polygon points="24,6 8,42 40,42" fill="#FFD700" stroke="#CCA800" stroke-width="1"/><rect x="22" y="6" width="4" height="8" fill="#1B3A2D"/><ellipse cx="24" cy="42" rx="16" ry="4" fill="#CCA800" opacity="0.3"/></svg>`,
    colors: ['#FFD700', '#FF6600', '#EF4444', '#0066FF'],
    fabricConfig: (x, y, color = '#FFD700') => ({ type: 'triangle', left: x, top: y, width: 22, height: 24, fill: color, stroke: '#CCA800', strokeWidth: 1, originX: 'center', originY: 'center' }),
  },

  pica_suelo: {
    id: 'pica_suelo',
    label: 'Pica de Suelo',
    category: 'señalizacion',
    defaultSize: 45,
    defaultColor: '#EAB308',
    canRotate: true,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="4" y="21" width="40" height="6" fill="#EAB308" rx="2" stroke="#CA8A04" stroke-width="0.8"/><circle cx="8" cy="24" r="2.5" fill="#111"/><circle cx="40" cy="24" r="2.5" fill="#111"/></svg>`,
    colors: ['#EAB308', '#EF4444', '#3B82F6', '#10B981'],
    fabricConfig: (x, y, color = '#EAB308') => ({ type: 'rect', left: x, top: y, width: 45, height: 6, fill: color, stroke: '#CA8A04', strokeWidth: 1, rx: 2, ry: 2, originX: 'center', originY: 'center' }),
  },

  mini_balon: {
    id: 'mini_balon',
    label: 'Mini Balón Talla 1-2',
    category: 'balon',
    defaultSize: 20,
    defaultColor: '#FFFFFF',
    canRotate: false,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="14" fill="#FFFFFF" stroke="#333333" stroke-width="1.8"/><polygon points="24,14 27,20 24,23 21,20" fill="#222"/><text x="24" y="34" font-size="7" font-weight="bold" fill="#3B82F6" text-anchor="middle">MINI</text></svg>`,
    colors: ['#FFFFFF', '#FFCC00', '#FF6600'],
    fabricConfig: (x, y) => ({ type: 'circle', left: x, top: y, radius: 10, fill: '#FFFFFF', stroke: '#333333', strokeWidth: 1.5, originX: 'center', originY: 'center' }),
  },

  goma_elastica: {
    id: 'goma_elastica',
    label: 'Banda Elástica',
    category: 'material',
    defaultSize: 32,
    defaultColor: '#3B82F6',
    canRotate: true,
    canResize: true,
    svgPanel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect x="8" y="16" width="32" height="16" rx="8" fill="none" stroke="#3B82F6" stroke-width="4"/><rect x="10" y="18" width="28" height="12" rx="6" fill="none" stroke="#60A5FA" stroke-width="1.5" opacity="0.7"/></svg>`,
    colors: ['#3B82F6', '#EF4444', '#10B981', '#111827'],
    fabricConfig: (x, y, color = '#3B82F6') => ({ type: 'rect', left: x, top: y, width: 32, height: 16, rx: 8, ry: 8, fill: 'transparent', stroke: color, strokeWidth: 3.5, originX: 'center', originY: 'center' }),
  },
```

---

# ARREGLO 3 — UMBRALES DE EDAD vs GAMIFICACIÓN [VERIFICABLE CONTRA LTAD/ACSM]

### [RESUMEN]
El auditor solicita comprobar si los ejercicios de alto impacto o riesgo mecánico (Nordic, Copenhagen, Drop Jumps, cuello) tienen codificados umbrales duros de edad (`age_min`, `edad_minima_segura`, `requiere_supervision_presencial`) y una función de bloqueo que impida prescribirlos a futbolistas jóvenes sin desarrollo suficiente.
**Hallazgo del código real:** Los ejercicios en `src/data/homeExercisesCatalog.js` **SOLO** contienen la etiqueta de gamificación `level: 'basico' | 'intermedio' | 'avanzado'`. No contienen campos de edad mínima ni de supervisión presencial. En `src/hooks/useExercises.js` no existe ninguna función de bloqueo duro por edad.

### [NO-IMPLEMENTADO]
- **Campos en el catálogo:**
  - `age_min`: **NO EXISTE**.
  - `age_max`: **NO EXISTE**.
  - `edad_minima_segura`: **NO EXISTE**.
  - `requiere_supervision_presencial`: **NO EXISTE**.
  - `progression_of` / `regression_to`: **NO EXISTE**.
- **Función en el recomendador / hook:**
  - Función de bloqueo duro por edad: **NO EXISTE** en `src/hooks/useExercises.js`. El hook solo suscribe y concatena `PREDEFINED_EXERCISES` con los ejercicios de Firestore.
*Ubicación esperada de la función de bloqueo:* `src/hooks/useExercises.js` (alrededor de la línea 140, dentro de un selector o validador de prescripción).

---

# ARREGLO 4 — RETIRAR TÉCNICA DE CAMPO DEL SEED DE CASA

### [RESUMEN]
El auditor requiere contrastar el eje del catálogo: ¿está ordenado por objetivo/grupo muscular o por fases de sesión de campo? Y verificar si ejercicios de técnica de campo (fintas, bicicletas, elásticos, paredes de pase) fueron indebidamente incluidos en el catálogo de casa sin el flag `[campo_only]`.
**Hallazgo del código real:**
1. El eje de categorías en `HOME_EXERCISES_CATEGORIES` está estructurado por **fases de sesión de campo** (`calentamiento`, `tecnica`, `coordinacion_agilidad`, `fuerza_preventiva`, `vuelta_calma`).
2. La categoría `tecnica` contiene 25 ejercicios (ej. *Elástico de Ronaldinho*, *Bicicleta Simple*, *Pared al primer toque*, *Slalom en conos*) que requieren espacio o balón de campo, y **NO** están marcados con `campo_only` ni han sido retirados del seed de casa.
3. Esto confirma la sospecha del auditor: el catálogo mezcló ejercicios de campo en el seed de casa sin aislamiento.

### [CÓDIGO-REAL-DEL-REPO]
**Categorías en `src/data/homeExercisesCatalog.js` (Líneas 18 a 55):**
```javascript
export const HOME_EXERCISES_CATEGORIES = {
  calentamiento: {
    id: 'calentamiento',
    nameEs: 'Calentamiento y Activación Dinámica',
    nameEn: 'Warm-up & Dynamic Activation',
    icon: '🔥',
    color: '#F97316'
  },
  tecnica: {
    id: 'tecnica',
    nameEs: 'Técnica Individual y Control',
    nameEn: 'Individual Technique & Control',
    icon: '⚽',
    color: '#0284C7'
  },
  coordinacion_agilidad: {
    id: 'coordinacion_agilidad',
    nameEs: 'Coordinación y Agilidad',
    nameEn: 'Coordination & Agility',
    icon: '⚡',
    color: '#8B5CF6'
  },
  fuerza_preventiva: {
    id: 'fuerza_preventiva',
    nameEs: 'Fuerza Preventiva y Core',
    nameEn: 'Preventive Strength & Core',
    icon: '🛡️',
    color: '#10B981'
  },
  vuelta_calma: {
    id: 'vuelta_calma',
    nameEs: 'Vuelta a la Calma y Movilidad',
    nameEn: 'Cool-down & Mobility',
    icon: '🧘',
    color: '#059669'
  }
};
```

---

# LOS 6 REPRESENTATIVOS (CÓDIGO REAL DEL REPO)

A continuación se transcriben literalmente los 6 objetos solicitados para el cotejo del auditor:

### 1. Nordic Hamstring (`hex-078`)
**Archivo:** `src/data/homeExercisesCatalog.js` (Líneas 1845 a 1866)
```javascript
  {
    id: 'hex-078',
    name: 'Nordic Hamstring Curl Casero Asistido con Puerta o Sofá',
    nameEs: 'Nordic Hamstring Curl Casero Asistido con Puerta o Sofá',
    nameEn: 'Assisted Home Nordic Hamstring Curl',
    category: 'fuerza_preventiva',
    level: 'avanzado',
    series: 3,
    reps: 6,
    durationSeconds: 0,
    restSeconds: 40,
    materials: ['sofa_pesado_o_tope_puerta'],
    materialsEs: ['sofá pesado o tope de puerta'],
    materialsEn: ['heavy sofa or door strap'],
    description: 'De rodillas con tobillos anclados bajo el sofá, dejarse caer lentamente hacia adelante frenando con los isquiosurales.',
    descriptionEs: 'De rodillas con tobillos anclados bajo el sofá, dejarse caer lentamente hacia adelante frenando con los isquiosurales.',
    descriptionEn: 'Kneeling with heels anchored under heavy couch, lean forward lowering slowly resisting with hamstrings.',
    coachingPoints: ['Caderas extendidas sin doblar cintura', 'Frenar la caída hasta el último instante'],
    coachingPointsEs: ['Caderas extendidas sin doblar cintura', 'Frenar la caída hasta el último instante'],
    coachingPointsEn: ['Hips fully extended without bending waist', 'Brake descent as far as possible'],
    targetZones: ['isquiosurales_excentrico', 'prevencion_roturas'],
    source: 'system'
  },
```
*Hallazgo:* Tiene `level: 'avanzado'`. **Carece** de `age_min`, `edad_minima_segura`, `requiere_supervision_presencial` y `alternativa_casa`.

---

### 2. Copenhagen Dinámico (`hex-076`)
**Archivo:** `src/data/homeExercisesCatalog.js` (Líneas 1799 a 1820)
```javascript
  {
    id: 'hex-076',
    name: 'Ejercicio de Aductores de Copenhague (Nivel Banco/Sofá)',
    nameEs: 'Ejercicio de Aductores de Copenhague (Nivel Banco/Sofá)',
    nameEn: 'Copenhagen Adductor Plank (Bench Support)',
    category: 'fuerza_preventiva',
    level: 'avanzado',
    series: 3,
    durationSeconds: 20,
    reps: 0,
    restSeconds: 35,
    materials: ['sofa_o_silla'],
    materialsEs: ['sofá o silla baja'],
    materialsEn: ['sofa or low bench'],
    description: 'Plancha lateral con la pierna superior apoyada en el sofá o silla, elevando pelvis y suspendiendo pierna inferior.',
    descriptionEs: 'Plancha lateral con la pierna superior apoyada en el sofá o silla, elevando pelvis y suspendiendo pierna inferior.',
    descriptionEn: 'Side plank with top foot resting on couch/bench, raising hips and holding bottom leg hovering.',
    coachingPoints: ['Cuerpo recto como una tabla', 'Fundamental para prevenir pubalgias'],
    coachingPointsEs: ['Cuerpo recto como una tabla', 'Fundamental para prevenir pubalgias'],
    coachingPointsEn: ['Body straight as an arrow', 'Crucial groin/pubalgia prevention'],
    targetZones: ['aductores', 'pubalgia_prevencion', 'core_lateral'],
    source: 'system'
  },
```
*Hallazgo:* Tiene `level: 'avanzado'`. **Carece** de `age_min`, `edad_minima_segura` y `alternativa_casa`.

---

### 3. Pliometría de Alto Impacto / Drop Jump (`hex-064`)
**Archivo:** `src/data/homeExercisesCatalog.js` (Líneas 1519 a 1540)
```javascript
  {
    id: 'hex-064',
    name: 'Caída desde Salto y Clavado (Drop Jump Stick)',
    nameEs: 'Caída desde Salto y Clavado (Drop Jump Stick)',
    nameEn: 'Drop Jump & Two-Foot Stick',
    category: 'coordinacion_agilidad',
    level: 'intermedio',
    series: 3,
    reps: 8,
    durationSeconds: 0,
    restSeconds: 35,
    materials: ['escalon_bajo'],
    materialsEs: ['escalón bajo o bordillo'],
    materialsEn: ['low step or curb'],
    description: 'Dejarse caer desde un escalón bajo de 15-20 cm y clavar la caída en dos pies simultáneos absorbiendo en sentadilla parcial.',
    descriptionEs: 'Dejarse caer desde un escalón bajo de 15-20 cm y clavar la caída en dos pies simultáneos absorbiendo en sentadilla parcial.',
    descriptionEn: 'Step off low 15-20cm step and stick landing on both feet simultaneously absorbing into partial squat.',
    coachingPoints: ['Caída silenciosa como un gato', 'Rodillas jamás colapsan hacia adentro (valgo)'],
    coachingPointsEs: ['Caída silenciosa como un gato', 'Rodillas jamás colapsan hacia adentro (valgo)'],
    coachingPointsEn: ['Silent landing like a cat', 'No inward knee valgus collapse'],
    targetZones: ['prevencion_lca', 'absorcion_impactos'],
    source: 'system'
  },
```
*Hallazgo:* Tiene `level: 'intermedio'`. **Carece** de `age_min`, `edad_minima_segura` y `requiere_supervision_presencial`.

---

### 4. Isométrico Cervical de Portero
### [NO-IMPLEMENTADO]
- **Estado:** Este ejercicio **NO EXISTE** actualmente en `src/data/homeExercisesCatalog.js`.
- *ID y Nombre planificado sugerido:* `hex-gk-cervical` / `"Isométrico Cervical Multidireccional de Portero"`.
- *Ubicación donde debería ir:* Dentro de `fuerza_preventiva`, requiriendo toalla como alternativa de resistencia isométrica manual.

---

### 5. Estiramiento Estático de Cadena Posterior (`hex-093`)
**Archivo:** `src/data/homeExercisesCatalog.js` (Líneas 2194 a 2215)
```javascript
  {
    id: 'hex-093',
    name: 'Estiramiento Pasivo de Isquiosurales con Toalla',
    nameEs: 'Estiramiento Pasivo de Isquiosurales con Toalla',
    nameEn: 'Towel Hamstring Supine Stretch',
    category: 'vuelta_calma',
    level: 'basico',
    series: 2,
    durationSeconds: 40,
    reps: 0,
    restSeconds: 20,
    materials: ['toalla', 'esterilla'],
    materialsEs: ['toalla', 'esterilla'],
    materialsEn: ['towel', 'mat'],
    description: 'Tumbado boca arriba, pasar una toalla por la planta del pie y elevar la pierna recta hacia el techo con tracción suave.',
    descriptionEs: 'Tumbado boca arriba, pasar una toalla por la planta del pie y elevar la pierna recta hacia el techo con tracción suave.',
    descriptionEn: 'Lie supine, loop towel around foot sole, and gently pull straight leg toward ceiling until mild stretch.',
    coachingPoints: ['Pierna contraria apoyada y relajada', 'Respiración diafragmática profunda'],
    coachingPointsEs: ['Pierna contraria apoyada y relajada', 'Respiración diafragmática profunda'],
    coachingPointsEn: ['Opposite leg flat and relaxed', 'Deep diaphragmatic breathing'],
    targetZones: ['isquiosurales', 'hueco_popliteo'],
    source: 'system'
  },
```
*Hallazgo:* Ejercicio estático presente en la fase de `vuelta_calma`. Usa toalla como elemento de tracción pasiva, pero **carece** del objeto estructurado `alternativa_casa: { option: [], nota: {} }`.

---

### 6. Ejercicio con Banda Elástica (`hex-087`)
**Archivo:** `src/data/homeExercisesCatalog.js` (Líneas 2052 a 2073)
```javascript
  {
    id: 'hex-087',
    name: 'Paseo de Monstruo con Banda o Isométrico (Monster Walk)',
    nameEs: 'Paseo de Monstruo con Banda o Isométrico (Monster Walk)',
    nameEn: 'Athletic Stance Lateral Monster Walk',
    category: 'fuerza_preventiva',
    level: 'intermedio',
    series: 3,
    reps: 16,
    durationSeconds: 0,
    restSeconds: 30,
    materials: ['banda_elastica_o_sin_material'],
    materialsEs: ['banda elástica o peso corporal'],
    materialsEn: ['resistance band or bodyweight'],
    description: 'En media sentadilla con pies al ancho de hombros, dar pasos diagonales hacia adelante manteniendo tensión constante.',
    descriptionEs: 'En media sentadilla con pies al ancho de hombros, dar pasos diagonales hacia adelante manteniendo tensión constante.',
    descriptionEn: 'In quarter squat with feet shoulder-width, take diagonal steps forward maintaining constant hip tension.',
    coachingPoints: ['Pies siempre separados', 'Rodillas empujan hacia afuera'],
    coachingPointsEs: ['Pies siempre separados', 'Rodillas empujan hacia afuera'],
    coachingPointsEn: ['Feet stay wide', 'Knees tracking outwards'],
    targetZones: ['abductores', 'gluteo_medio'],
    source: 'system'
  },
```
*Hallazgo:* Indica `"banda_elastica_o_sin_material"`, pero **carece** de la nota técnica explicativa obligatoria: *"la toalla o peso corporal no replica la resistencia elástica progresiva de abducción; requiere patrón sustituto en marco de puerta"*.

---

# VERIFICADOR CI: EXTRACTO G5, G6 Y G7

### [CÓDIGO-REAL-DEL-REPO]
**Archivo:** `scripts/ci-exercise-catalog.mjs` (Líneas 115 a 210)
```javascript
// ── G5. DOSIFICACIÓN DEPORTIVA ──────────────────────────────────────────────
console.log('\n▶ [G5] Verificando dosificación deportiva (series, reps, durationSeconds)...');
let dosageOk = true;

HOME_EXERCISES_107.forEach(ex => {
  if (typeof ex.series !== 'number' || ex.series < 1) {
    console.error(`   ❌ Series inválidas en ${ex.id}: ${ex.series}`);
    dosageOk = false;
    failed = true;
  }
  const hasReps = typeof ex.reps === 'number' && ex.reps > 0;
  const hasDuration = typeof ex.durationSeconds === 'number' && ex.durationSeconds > 0;
  if (!hasReps && !hasDuration) {
    console.error(`   ❌ Ejercicio ${ex.id} sin repeticiones ni duración positiva.`);
    dosageOk = false;
    failed = true;
  }
  if (typeof ex.restSeconds !== 'number' || ex.restSeconds < 0) {
    console.error(`   ❌ Descanso inválido en ${ex.id}: ${ex.restSeconds}`);
    dosageOk = false;
    failed = true;
  }
});

if (dosageOk) {
  console.log('   ✅ 100% de los ejercicios tienen dosificación atlética válida.');
}

// ── G6. BILINGÜISMO Y AUSENCIA DE CONTAMINACIÓN TEXTUAL ──────────────────────
console.log('\n▶ [G6] Verificando bilingüismo (ES/EN) y ausencia de tokens corruptos...');
let textOk = true;

HOME_EXERCISES_107.forEach(ex => {
  const fields = ['nameEs', 'nameEn', 'descriptionEs', 'descriptionEn'];
  for (const f of fields) {
    const val = ex[f];
    if (typeof val !== 'string' || val.trim().length === 0) {
      console.error(`   ❌ Campo vacío '${f}' en ejercicio ${ex.id}`);
      textOk = false;
      failed = true;
    } else if (val.includes('<think>') || val.includes('</think>')) {
      console.error(`   ❌ Contaminación <think> en campo '${f}' del ejercicio ${ex.id}`);
      textOk = false;
      failed = true;
    }
  }

  if (!Array.isArray(ex.coachingPoints) || ex.coachingPoints.length === 0) {
    console.error(`   ❌ Ejercicio ${ex.id} sin coachingPoints.`);
    textOk = false;
    failed = true;
  }
  if (!Array.isArray(ex.materials) || ex.materials.length === 0) {
    console.error(`   ❌ Ejercicio ${ex.id} sin materials.`);
    textOk = false;
    failed = true;
  }
});

if (textOk) {
  console.log('   ✅ Cero campos vacíos, bilingüismo garantizado y cero tokens corruptos.');
}

// ── G7. DELTA DE MATERIALES DEPORTIVOS ──────────────────────────────────────
console.log('\n▶ [G7] Verificando delta de materiales deportivos en Pizarra Táctica...');
const deltaMaterials = ['valla_baja', 'cono_ranurado', 'pica_suelo', 'mini_balon', 'goma_elastica'];
let deltaOk = true;

deltaMaterials.forEach(matId => {
  if (!MATERIALS_LIBRARY[matId]) {
    console.error(`   ❌ Material delta no encontrado en MATERIALS_LIBRARY: ${matId}`);
    deltaOk = false;
    failed = true;
  } else {
    const mat = MATERIALS_LIBRARY[matId];
    if (!mat.label || !mat.category || !mat.svgPanel) {
      console.error(`   ❌ Material delta incompleto: ${matId}`);
      deltaOk = false;
      failed = true;
    }
  }

  // Verificar presencia en MATERIALS_BY_CATEGORY
  let inCategory = false;
  for (const cat of Object.values(MATERIALS_BY_CATEGORY)) {
    if (cat.items && cat.items.includes(matId)) {
      inCategory = true;
      break;
    }
  }
  if (!inCategory) {
    console.error(`   ❌ Material delta ${matId} no asignado en MATERIALS_BY_CATEGORY.`);
    deltaOk = false;
    failed = true;
  }
});
```

---

# LÓGICA DEL RECOMENDADOR Y FILTRADO

### [NO-IMPLEMENTADO]
**Función de cruce material $\cap$ inventory y bloqueo por edad:**
- En `src/hooks/useExercises.js`, la función `useExercises` únicamente realiza lo siguiente:
  1. Si no hay usuario ni `teamId`, carga `PREDEFINED_EXERCISES`.
  2. Si hay sesión activa, suscribe a `${path}/exercises` en Firestore.
  3. Purga ejercicios con tags `<think>`.
  4. Concatena `[...PREDEFINED_EXERCISES, ...validCustom]`.
- **Carencia:** No existe ninguna función `filterByMaterial(userInventory)` ni `assertAgeSafe(playerAge, exercise)`.

### [CÓDIGO-REAL-DEL-REPO]
**Archivo:** `src/hooks/useExercises.js` (Líneas 144 a 184)
```javascript
export const useExercises = (teamId) => {
  const { user, getTeamPath } = useAuth();
  const [exercises, setExercises] = useState(PREDEFINED_EXERCISES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !teamId) {
      setExercises(PREDEFINED_EXERCISES);
      setLoading(false);
      return;
    }

    setLoading(true);
    const path = getTeamPath(teamId);
    const unsubscribe = subscribeToCollection(`${path}/exercises`, (data) => {
      const validCustom = [];
      (data || []).forEach(ex => {
        const rawName = (ex.name || ex.titulo || ex.title || ex.nombre || '').trim();
        const isCorrupt = !rawName || rawName === '<think>' || rawName === '</think>' || rawName.startsWith('<think');

        if (isCorrupt) {
          // Auto-limpieza en segundo plano de documentos huérfanos o con tags <think> en Firestore
          if (ex.id) {
            deleteDocument(`${path}/exercises`, ex.id).catch(err => {
              console.warn('[useExercises] Error purgando ejercicio corrupto:', err);
            });
          }
        } else {
          const cleanName = rawName.replace(/<\/?think>/gi, '').trim();
          validCustom.push({
            ...ex,
            name: cleanName || 'Ejercicio',
            titulo: cleanName || 'Ejercicio'
          });
        }
      });

      // Combinar los predefinidos con los ejercicios válidos
      setExercises([...PREDEFINED_EXERCISES, ...validCustom]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, teamId, getTeamPath]);
```

---

# LO QUE ESTE DOCUMENTO NO RESUELVE (VERIFICACIÓN EN PANTALLA)

Este documento certifica con código estricto los datos, esquemas y lógica de backend/hooks. **NO** puede verificar render visual en navegador o dispositivo móvil.
Los siguientes puntos deben ser comprobados exclusivamente en el dispositivo por el dueño del producto:
1. **Punto C:** Factor de escala móvil (+25% táctil / $\times 1.0$ desktop).
2. **Punto D:** Visibilidad permanente de roles tácticos (MC, LTI, LTD, EXT, DEL) en la convocatoria móvil, con el panel de edición plegado.
3. **Carril A:** Interfaz en PT y FR 100% limpia sin términos en inglés en pantalla.

---

# TABLA DE ESTADO POR ARREGLO (PARA CRUCE DEL AUDITOR)

| Arreglo | Estado Real en Repo | Evidencia en Archivo (Línea) | Veredicto Esperado del Auditor |
|---|---|---|---|
| **Arreglo 1 — Footer del PDF** | `[IMPLEMENTADO-CORREGIDO]` | `src/utils/pdfTheme.js` (Líneas 420-425)<br>`scripts/assert-pdf-quality.mjs` (Líneas 46-55) | **APROBADO** (Código usa `Mister11 Platform - mister11.app` y `Pagina N de M`, eliminando el espaciado roto del KB). |
| **Arreglo 2 — Delta de Material Real** | `[NO-IMPLEMENTADO]` (en ejercicios de casa)<br>`[CÓDIGO-REAL]` (en Pizarra Táctica) | `src/data/homeExercisesCatalog.js` (Líneas 61-80)<br>`src/lib/mister11-materials.js` (Líneas 684-748) | **RECHAZADO / PENDIENTE** (Los 5 SVG fueron añadidos a la Pizarra Táctica; el schema de ejercicios en casa carece de `material_preferido`, `alternativa_casa` y `user_inventory`). |
| **Arreglo 3 — Umbrales de Edad vs Gamificación** | `[NO-IMPLEMENTADO]` | `src/data/homeExercisesCatalog.js` (Líneas 1845-1866)<br>`src/hooks/useExercises.js` (Líneas 144-184) | **RECHAZADO / PENDIENTE** (Solo existe la etiqueta cosmética `level: 'avanzado'`; carece de `age_min`, `edad_minima_segura`, `supervisión` y función de bloqueo duro en el recomendador). |
| **Arreglo 4 — Retirar Técnica de Campo del Seed de Casa** | `[NO-IMPLEMENTADO]` / `[CAÍDO]` | `src/data/homeExercisesCatalog.js` (Líneas 18-55, 600-1400) | **RECHAZADO / PENDIENTE** (Eje de categorías estructurado por fases de sesión de campo; 25 ejercicios de técnica con balón en espacio amplio siguen presentes en el seed de casa sin marcar `campo_only`). |

---
*Fin del documento oficial de auditoría OLEADA-6-AUDITORIA-CODIGO. Reloj Google Build 95 intacto.*
