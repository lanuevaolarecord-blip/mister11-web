# Especificación Biomecánica Orientativa de Rediseño SVG — `sys-9` (Plancha Lateral)

- **ID:** `sys-9`
- **Nombre ES / EN:** Plancha Lateral / Side Plank
- **Estado:** Draft documental para revisión del DUEÑO (`reviewed_by_human: false`, `status: rejected_by_owner` en producto)
- **Ubicación del SVG candidato:** `docs/svg-drafts/sys-9/sys-9-guide-draft.svg`
- **Ubicación del preview HTML:** `docs/svg-drafts/sys-9/sys-9-guide-draft.html`

> **Advertencia obligatoria:**
> Guía visual orientativa en rediseño. No validada clínicamente. No sustituye supervisión ni valoración profesional.

---

## 1. Datos Literales de Fuente (`src/data/systemCoreExercises.js` y `CANONICAL_EXERCISE_SAFETY_MAP`)

- **Descripción ES:** `"Apoyo sobre un antebrazo y lateral del pie. Elevar cadera alineando el cuerpo."`
- **Descripción EN:** `"Support on one forearm and side of foot. Raise hips to align body in straight line."`
- **Nota de seguridad ES:** `"Codo justo debajo del hombro para proteger articulación."`
- **Nota de seguridad EN:** `"Elbow directly under shoulder to protect joint."`
- **Fuente declarada:** `guia_fifa: FIFA 11+ Programme Manual, Part 2`
- **`canonicalTargetZones` en `CANONICAL_EXERCISE_SAFETY_MAP['sys-9']`:** `['core', 'oblicuos']`
- **Motivo del rechazo previo del DUEÑO (Oleada 9.3):** `"silueta demasiado plana, no se visualiza el cuerpo completo y no se muestran los músculos a trabajar. Requiere rediseño biomecánico."`

---

## 2. Elementos Visuales y Biomecánicos Representados (Orientativos)

1. **Silueta corporal completa con volumen segmentario (`#body-silhouette`):**
   - Representa cabeza, cuello, tórax, pelvis, ambos muslos, ambas piernas, pies apoyados por el borde lateral externo, hombro/brazo/antebrazo de soporte y brazo superior descansando sobre el flanco.
   - Sustituye los trazos lineales planos (*stick-figure*) del piloto rechazado por contornos anatómicos cerrados con diferenciación de plano cercano (`#1B3A2D`) y plano lejano (`#2E4A3E`) más líneas divisorias claras para impresión B/N.
2. **Puntos de apoyo (`#support-points`):**
   - **Apoyo 1 (`cx=132, cy=286`):** Borde lateral externo del pie sobre esterilla.
   - **Apoyo 2 (`cx=484, cy=286`):** Antebrazo apoyado en suelo con indicador explícito de ángulo de `90°` del codo exactamente debajo del hombro (`x=462`).
3. **Eje de alineación axial (`#axis-line`):**
   - Línea punteada en Oro (`#D4A843`) desde el borde lateral del pie (`118, 272`) hasta la cabeza (`532, 106`), pasando por tobillo (`136, 266`), rodilla (`228, 228`), cadera/pelvis (`324, 188`) y hombro (`462, 134`).
4. **Zonas de trabajo orientativas desde `canonicalTargetZones` (`#muscle-zones`):**
   - `data-canonical-zones="core,oblicuos"`:
     - `#zone-core` (`data-zone="core"`): banda abdominal profunda/anterior en Verde Campo (`#4CAF7D`, borde `#2E7D52`).
     - `#zone-oblicuos` (`data-zone="oblicuos"`): flanco lateral inferior (oblicuos) en Verde Fuerte (`#2E7D52`, borde `#4CAF7D`).
   - No se inventan músculos fuera de `canonicalTargetZones`.
5. **Error común y marcador primario `X` (`#error-marker`):**
   - Curva punteada en Terracota (`#C85A32`) mostrando el descenso de la pelvis hacia el suelo (`cadera caída / pelvis desalineada`).
   - Marcador `X` en forma geométrica primaria dentro de disco `#F7F5F0` con borde `#C85A32` sobre la coordenada de la cadera caída (`324, 252`), distinguible en impresión monocroma sin depender del color.
6. **Variantes informativas opcionales (`#regression-layer` y `#progression-layer`):**
   - **Regresión opcional (`#regression-layer`):** línea punteada ocre (`#9C6A3B`) indicando apoyo de rodilla inferior en el suelo (`236, 284`).
   - **Progresión informativa (`#progression-layer`):** línea punteada verde oscuro (`#2E7D52`) indicando elevación de la pierna superior como referencia visual informativa, sin habilitar prescripción automática.

---

## 3. Paleta Tierra y Campo Utilizada

| Rol visual | Hex utilizado | Restricción verificada |
|---|---|---|
| Silueta corporal principal | `#1B3A2D` | Verde Selva canónico |
| Silueta segmento lejano | `#2E4A3E` | Derivado oscuro accesible de Verde Selva |
| Músculo activo (`core`) | `#4CAF7D` | Verde Campo canónico |
| Músculo activo (`oblicuos`) | `#2E7D52` | Halo/fuerte muscular canónico |
| Articulaciones y eje axial | `#4CAF7D` / `#D4A843` | Verde Campo + Oro canónico |
| Marcador `X` de error | `#C85A32` | Terracota canónico |
| Acentos de soporte/regresión | `#9C6A3B` | Ocre canónico |
| Fondo preview / cajas | `#F7F5F0` / `#FAF8F5` | Crema print-friendly |
| Esterilla / retícula neutra | `#E2E8F0` / `#CBD5E1` | Neutros técnicos permitidos |
