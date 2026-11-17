# MÍSTER11 — P12-A: DELTA DE INVENTARIO Y PRESCRIPCIÓN (P11 BASELINE -> POST P12-A)

- **Build:** `95` (Closed Testing)
- **Rama:** `main`
- **HEAD baseline P11:** `bc498a6`
- **Estado:** `[CERRADO]`
- **Archivos comparados:**
  - Baseline P11 intacto: `docs/EXERCISE_INVENTORY_OLEADA10.json` y `docs/EXERCISE_INVENTORY_OLEADA10.md`
  - Estado Post P12-A: `docs/EXERCISE_INVENTORY_OLEADA10_POST_P12A.json`

---

## 1. Tabla Comparativa Literal: P11 Baseline vs. Post P12-A

| Métrica | P11 baseline | Post P12-A | Delta | Causa |
|---|---:|---:|---:|---|
| **Total ejercicios catalogados** | `118` | `118` | `0` | `10 SYSTEM_CORE_EXERCISES + 108 HOME_EXERCISES_108` sin alteración de IDs. |
| **Total prescribibles 8 años sin supervisión** (`DEFAULT_USER_INVENTORY`) | `14` | `0` | `-14` | **Q2=B**: los 14 ejercicios con `edadMin=8` (`hex-093..hex-095, hex-097..hex-107`) exigen supervisión presencial efectiva. |
| **Total prescribibles 8 años con supervisión** (`DEFAULT_USER_INVENTORY`) | `14` | `14` | `0` | **Q2=B**: con supervisión presencial sí son prescribibles a partir de 8 años. |
| **Total prescribibles 10 años sin supervisión** (`DEFAULT_USER_INVENTORY`) | `81` | `66` | `-15` | `-1` por **Q1=A** (`hex-001` bloqueado como alias de `sys-3`) y `-14` por **Q2=B** (`hex-093..hex-095, hex-097..hex-107` exigen supervisión). |
| **Total prescribibles 10 años con supervisión** (`DEFAULT_USER_INVENTORY`) | `81` | `80` | `-1` | `-1` por **Q1=A** (`hex-001` bloqueado como alias de `sys-3`); los 14 de `edadMin=8` pasan con supervisión. |
| **Total prescribibles 13 años sin supervisión** (`DEFAULT_USER_INVENTORY`) | `92` | `77` | `-15` | `-1` por **Q1=A** (`hex-001`) y `-14` por **Q2=B** (`hex-093..hex-095, hex-097..hex-107`). |
| **Total prescribibles 16 años sin supervisión** (`DEFAULT_USER_INVENTORY`) | `92` | `77` | `-15` | `-1` por **Q1=A** (`hex-001`) y `-14` por **Q2=B** (`hex-093..hex-095, hex-097..hex-107`). |
| **Total prescribibles 18 años sin supervisión** (`DEFAULT_USER_INVENTORY`) | `92` | `77` | `-15` | `-1` por **Q1=A** (`hex-001`) y `-14` por **Q2=B** (`hex-093..hex-095, hex-097..hex-107`). |
| **Total prescribibles 16 años con supervisión** (`DEFAULT_USER_INVENTORY`) | `100` | `99` | `-1` | `-1` por **Q1=A** (`hex-001` bloqueado como alias de `sys-3`); `0` delta por Q2 cuando hay supervisión. (Con inventario de material extendido: `103 -> 102`, Delta `-1`). |
| **Total prescribibles 18 años con supervisión** (`DEFAULT_USER_INVENTORY`) | `100` | `99` | `-1` | `-1` por **Q1=A** (`hex-001` bloqueado como alias de `sys-3`); `0` delta por Q2 cuando hay supervisión. (Con inventario de material extendido: `103 -> 102`, Delta `-1`). |
| **Total `rejected_by_owner` directos** | `5` | `5` | `0` | **Q3=C**: `sys-1`, `sys-2`, `sys-3`, `sys-8`, `sys-9` permanecen en `rejected_by_owner` con `reviewed_by_human=false`. |
| **Total alias bloqueados (`duplicateOf`)** | `0` | `1` | `+1` | **Q1=A**: `hex-001` (`duplicateOf: "sys-3"`) queda bloqueado como ficha independiente y hereda el bloqueo de `sys-3` (`reason: 'alias_of_blocked_exercise'`, `inheritedReason: 'illustration_rejected_by_owner'`). |
| **Total `edadMin=8` con supervisión requerida (`effectiveSupervision=true`)** | `0` | `14` | `+14` | **Q2=B**: `hex-093`, `hex-094`, `hex-095`, `hex-097`, `hex-098`, `hex-099`, `hex-100`, `hex-101`, `hex-102`, `hex-103`, `hex-104`, `hex-105`, `hex-106`, `hex-107` (manteniendo `tier_riesgo: 'bajo'`). |
| **`targetZones` no canónicas restantes** | `180` etiquetas libres | `0` | `-180` -> `26` canónicas | **Q4=B**: el 100% de las zonas de los 118 ejercicios resuelve a las `26` `CANONICAL_TARGET_ZONES` en `src/data/targetZoneCanonicalMap.js` (`nonCanonicalCount = 0`). |

---

## 2. Trazabilidad Exacta de IDs que Cambiaron de Estado Prescribible

### 2.1. Atribuible a `Q1=A` (`-1` ejercicio en todos los escenarios con y sin supervisión)

- **`hex-001`** (*Movilidad de Tobillo Dinámica*, `duplicateOf: "sys-3"`):
  - **Antes (P11):** `prescribable_hoy = true` (se evaluaba aisladamente sin heredar el estado `rejected_by_owner` de `sys-3`).
  - **Después (Post P12-A):** `prescribable = false`, `reason = 'alias_of_blocked_exercise'`, `inheritedReason = 'illustration_rejected_by_owner'`, excluido de `filterHomeExercises` y con `getIllustrationRenderState('hex-001').renderable = false`.

### 2.2. Atribuible a `Q2=B` (`-14` ejercicios en escenarios sin supervisión; `0` cambio con supervisión)

Los siguientes `14` ejercicios de la categoría `vuelta_calma` (`edad_minima_segura = 8`, `tier_riesgo = 'bajo'`) pasaron de `prescribable = true` sin supervisión en P11 a `prescribable = false` (`reason: 'supervision_required'`, `subReason: 'q2_age_min_under_10'`) cuando `hasSupervision === false`, permaneciendo `prescribable = true` cuando `hasSupervision === true`:

1. `hex-093` — *Estiramiento Pasivo de Isquiosurales con Toalla*
2. `hex-094` — *Estiramiento de Psoas y Flexores de Cadera en Rodilla*
3. `hex-095` — *Estiramiento de Glúteo y Piramidal en Figura 4 Supino*
4. `hex-097` — *Postura de la Paloma Modificada para Cadera (Pigeon Stretch)*
5. `hex-098` — *Estiramiento de Gemelo y Sóleo contra Pared*
6. `hex-099` — *Postura del Niño con Alcance Lateral (Child's Pose)*
7. `hex-100` — *Torsión Espinal Tumbado (Supine Spinal Twist)*
8. `hex-101` — *Enhebrar la Aguja para Espalda Alta (Thread the Needle)*
9. `hex-102` — *Apertura Pectoral en Marco de Puerta*
10. `hex-103` — *Estiramiento de la Cobra Suave para Cadena Anterior*
11. `hex-104` — *Perro Boca Abajo con Pedaleo de Talones (Downward Dog)*
12. `hex-105` — *Descompresión Lumbar en Pelota o Rodillas al Pecho*
13. `hex-106` — *Piernas en la Pared para Retorno Venoso (Legs-Up-The-Wall)*
14. `hex-107` — *Respiración Diafragmática Box Breathing (4-4-4-4)*

*(Nota: `hex-096` declara `edad_minima_segura = 12`, por lo que no pertenece al grupo de `edadMin = 8`).*
