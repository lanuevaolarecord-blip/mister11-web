# MÍSTER11 — PIPELINE DE REDISEÑO SVG BIOMECÁNICO (OLEADA 10 — D2-R)

- **Build:** `95` (Closed Testing)
- **Rama:** `main`
- **Estado del documento de preparación:** `[CERRADO]`
- **Estado del rediseño real:** `[DEUDA FINITA CON DUEÑO: D2-R]`
- **Decisión rectora:** `Q3=C` (*"los 5 SVG rechazados por el DUEÑO quedan bloqueados hasta rediseño aprobado; no se habilita guía orientativa visible todavía"*).

---

## 1. Registro de Deuda Humana Actualizada (`D2-R`)

| Campo | Valor literal |
|---|---|
| **ID Deuda** | `D2-R` |
| **Ejercicios afectados** | `sys-1` (*Plancha Frontal*), `sys-2` (*Puente de Glúteos*), `sys-3` (*Movilidad de Tobillo*), `sys-8` (*Estiramiento Isquiosural*), `sys-9` (*Plancha Lateral*) + alias heredado `hex-001` (*Movilidad de Tobillo Dinámica*, `duplicateOf: "sys-3"`) |
| **DUEÑO** | DUEÑO / FISIO / Diseñador técnico |
| **ACCIÓN** | Rediseñar 5 SVG con silueta corporal visible, activación muscular resaltada desde `targetZones` normalizadas, ángulos correctos, marcador `X` en articulación válida, paleta Tierra y Campo, offline/lightweight, sin IA alucinando anatomía, sin fotos |
| **PLAZO** | Oleada 10, antes de subir SVG oficiales |
| **Estado actual** | `status: "rejected_by_owner"`, `reviewed_by_human: false`, `prescribable: false`, `renderable: false` |

---

## 2. Brief Técnico Obligatorio para los 5 SVG (`sys-1`, `sys-2`, `sys-3`, `sys-8`, `sys-9`)

1. **Silueta corporal completa y visible:**
   - Prohibido usar trazos lineales planos (*stick-figure*) donde se pierda el volumen corporal o se recorten segmentos anatómicos.
   - Debe distinguirse claramente cabeza, tronco, pelvis, muslo, pierna, pie, brazo y antebrazo en proporción anatómica limpia.
2. **Activación muscular resaltada desde `targetZones` normalizadas (`Q4=B`):**
   - Cada SVG debe iluminar únicamente las zonas musculares canónicas devueltas por `REDESIGN_SVG_CANONICAL_ZONES` (`src/data/targetZoneCanonicalMap.js`):
     - `sys-1` (*Plancha Frontal*): `['core', 'estabilizadores_lumbopelvicos']`
     - `sys-2` (*Puente de Glúteos*): `['cadera', 'gluteo_mayor', 'core']`
     - `sys-3` (*Movilidad de Tobillo*) y alias `hex-001`: `['tobillo', 'dorsiflexion', 'soleo', 'gemelos']`
     - `sys-8` (*Estiramiento Isquiosural*): `['isquiosurales', 'recuperacion']`
     - `sys-9` (*Plancha Lateral*): `['core', 'oblicuos', 'estabilizadores_lumbopelvicos']`
3. **Ángulos articulares biomecánicamente correctos:**
   - `sys-1`: codo a `90°` bajo glenohumeral; eje `coronilla–hombro–cadera–maléolo` a `180°` neutro.
   - `sys-2`: rodilla a `90°` en máxima extensión de cadera; eje `hombro–cadera–rodilla` colineal (`180°`) sin hiperextensión lumbar.
   - `sys-3`: semiarrodillado frente a pared; dorsiflexión tibial positiva (`> 35°`) con calcáneo `100%` en contacto con el suelo.
   - `sys-8`: bisagra coxofemoral con columna neutra; rodilla de pierna elevada en extensión suave sin cifosis lumbar.
   - `sys-9`: codo de apoyo a `90°` bajo hombro; alineación frontal `hombro–pelvis–tobillo` recta sin caída pélvica.
4. **Marcador `X` del error biomecánico en articulación válida (WCAG 1.4.1):**
   - Icono vectorial `X` en Terracota (`#C85A32`) sobre fondo crema (`#F7F5F0`) ubicado en la coordenada anatómica exacta del error a evitar (nunca flotando en el vacío):
     - `sys-1`: pelvis/lumbar en hiperextensión (`hiperextension_lumbar`).
     - `sys-2`: columna lumbar arqueada por empuje toracolumbar (`hiperextension_lumbar_sin_gluteo`).
     - `sys-3`: talón despegado del suelo (`despegue_calcaneo`).
     - `sys-8`: flexión dorsal/lumbar redondeada (`cifosis_lumbar_compensatoria`).
     - `sys-9`: caída de cadera inferior en plano frontal (`colapso_pelvico_lateral`).
5. **Paleta institucional estricta Tierra y Campo:**
   - Silueta estructural y contornos: Verde Selva (`#1B3A2D`) y neutros técnicos (`#E2E8F0`, `#CBD5E1`, `#94A3B8`).
   - Músculo activo: Verde Campo (`#4CAF7D` / `#2E7D52`).
   - Nodos articulares y eje de alineación axial: Oro (`#D4A843`).
   - Error biomecánico (`X`) y advertencia: Terracota (`#C85A32`) y Ocre (`#9C6A3B`).
   - Cero colores fuera de paleta, cero `#0D9488` (teal prohibido).
6. **Fondo transparente o crema print-friendly (`#FAF8F5`):**
   - Compatible tanto con el Portal del Jugador (Android First) como con la exportación PDF en tema claro sin pérdida de contraste (`>= 4.5:1` texto, `>= 3.0:1` elementos gráficos).
7. **100% Offline y Lightweight:**
   - Cero dependencias externas, cero fuentes CDN, peso objetivo `20–50 KB` por archivo SVG.
8. **Cero fotografías y cero IA generativa alucinando anatomía:**
   - Prohibido incrustar `<image>`, `data:image/*` o mallas autogeneradas con artefactos anatómicos.
9. **Poses clave o micro-loop determinista:**
   - Poses clave (inicio / fase isométrica o concéntrica máxima) claramente legibles en estático (para PDF) y con capas nombradas.
10. **Revisión final del DUEÑO antes de `reviewed_by_human = true`:**
    - Ningún agente puede auto-firmar `reviewed_by_human: true`.

---

## 3. Pipeline de Producción en 8 Etapas

1. **Etapa 1 — Frame clave / referencia biomecánica:**
   - Selección de pose canónica lateral (`90°` sagital para `sys-1, sys-2, sys-3, sys-8`) u oblicua/frontal (`sys-9`) verificada contra manual FIFA 11+ / ACSM.
2. **Etapa 2 — Calca anatómica simplificada (*écorché* técnico vectorial):**
   - Trazado de volúmenes corporales completos (cabeza, caja torácica, pelvis, segmentos proximales y distales) sobre retícula `viewBox="0 0 320 200"`.
3. **Etapa 3 — Construcción SVG estructurada en 7 capas (`<g id="...">`):**
   - `body-silhouette`: silueta anatómica completa y segmentos óseos/corporales.
   - `support-points`: superficie de suelo/pared y vectores de contacto.
   - `joints`: nodos articulares con anillo `#D4A843` y centro `#4CAF7D`.
   - `muscle-zones`: polígonos anatómicos de las `canonicalTargetZones` activas.
   - `axis-line`: línea de alineación biomecánica punteada (`#D4A843`).
   - `error-marker`: grupo `<g>` con trayectoria incorrecta fantasma y símbolo `X` (`#C85A32`).
   - `warning-layer`: etiquetas técnicas concisas con contraste certificado WCAG AA.
4. **Etapa 4 — Optimización SVGO y validación estructural:**
   - Limpieza de metadatos de editor, verificación de cierre de tags, 0 `<image>`, peso `< 50 KB`.
5. **Etapa 5 — Gate de paleta y contraste:**
   - Ejecución de `scripts/test-pilot-illustrations.mjs` y `scripts/closure-gate.mjs` verificando 0 casi-colores y contraste WCAG 1.4.3 / 1.4.11.
6. **Etapa 6 — Gate de renderizado en PDF claro:**
   - Verificación visual y de extracción en ficha PDF (`pdftotext` + inspección de contraste sobre `#FAF8F5` / `#FFFFFF`).
7. **Etapa 7 — Revisión y firma explícita del DUEÑO:**
   - Presentación de los 5 SVG renderizados al DUEÑO para inspección humana.
8. **Etapa 8 — Promoción controlada (post-firma):**
   - Solo tras aprobación explícita del DUEÑO se actualiza `status` y `reviewed_by_human: true` en los ejercicios aprobados.

---

## 4. Reglas Duras de Gobernanza

- **Regla 1:** Ningún SVG nuevo se sube a `src/assets/` oficial hasta aprobación explícita del DUEÑO.
- **Regla 2:** Ningún rediseño desbloquea prescripción si el ejercicio es `tier_riesgo === 'alto'` o `'PENDIENTE-FISIO'` sin validación de fisioterapeuta colegiado (`rigVerifiedBy`).
- **Regla 3:** Para ejercicios de `tier_riesgo === 'bajo'`, la aprobación del DUEÑO puede habilitar `reviewed_by_human: true`, pero nunca sustituye `rigVerifiedBy` clínico cuando este no existe.
- **Regla 4:** Mientras `sys-3` permanezca en `rejected_by_owner`, su alias `hex-001` hereda el bloqueo total; incluso tras un futuro rediseño de `sys-3`, `hex-001` no volverá a ser ficha independiente salvo orden explícita del DUEÑO (`Q1=A`).
