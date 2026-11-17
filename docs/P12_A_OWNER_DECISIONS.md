# MÍSTER11 — P12-A: REGISTRO CANÓNICO DE DECISIONES DEL DUEÑO (Q1–Q4)

- **Build:** `95` (Closed Testing)
- **Rama:** `main`
- **HEAD base:** `bc498a6` (`docs(inventory): P11 inventario completo verificable de 118 ejercicios...`)
- **Estado del registro:** `[CERRADO]`

---

## Decisiones Firmadas por el DUEÑO para P12-A

```text
Q1=A: hex-001 es alias de sys-3; no se prescribe como ficha independiente.
Q2=B: ejercicios con edadMin=8 requieren supervisión presencial.
Q3=C: los 5 SVG rechazados por el DUEÑO quedan bloqueados hasta rediseño aprobado; no se habilita guía orientativa visible todavía.
Q4=B: normalizar targetZones durante P12.
```

> **Nota vinculante de gobernanza:**
> "La decisión Q3=C prevalece sobre cualquier intento de mostrar guía orientativa o video referencial antes del rediseño. El objetivo es mejorar los SVG y subirlos después, tras aprobación del DUEÑO."

---

## Alcance Técnico de Aplicación en P12-A

1. **Q1=A (`hex-001` -> `sys-3`):**
   - `hex-001` (*Movilidad de Tobillo Dinámica*) declara `duplicateOf: "sys-3"` (*Movilidad de Tobillo*).
   - `canPrescribeAtHome` y `filterHomeExercises` tratan todo ejercicio con `duplicateOf` como alias no prescribible de forma independiente y heredan el bloqueo de su ejercicio padre (`sys-3` está en `status: "rejected_by_owner"`).
   - No se modifica `sys-3` para auto-aprobarlo.

2. **Q2=B (`edadMin = 8` requiere supervisión presencial):**
   - Los 14 ejercicios con `edad_minima_segura < 10` (`edadMin = 8`: `hex-093`, `hex-094`, `hex-095`, `hex-097`, `hex-098`, `hex-099`, `hex-100`, `hex-101`, `hex-102`, `hex-103`, `hex-104`, `hex-105`, `hex-106`, `hex-107`) exigen supervisión presencial efectiva (`effectiveSupervision = true`) derivada en `exerciseSafetyMap.js` y `exerciseSafety.js`.
   - Mantienen `edadMin = 8` y `tier_riesgo = 'bajo'` (no se promocionan artificialmente a `'alto'`).
   - Quedan bloqueados cuando `hasSupervision === false` y permitidos cuando `hasSupervision === true` y `playerAge >= 8`.

3. **Q3=C (Bloqueo total de los 5 SVG rechazados hasta rediseño aprobado):**
   - `sys-1`, `sys-2`, `sys-3`, `sys-8`, `sys-9` mantienen `illustration.status = "rejected_by_owner"`, `illustration.reviewed_by_human = false` y `prescribable = false`.
   - No se muestra el SVG viejo rechazado como ilustración aprobada ni se habilita guía orientativa ni video referencial.
   - Se actualiza la deuda finita `D2-R` y se documenta el pipeline técnico en `docs/SVG_REDESIGN_PIPELINE_OLEADA10.md` sin subir nuevos SVG oficiales a `src/assets/`.

4. **Q4=B (Normalización de `targetZones` en P12-A):**
   - Se crea `src/data/targetZoneCanonicalMap.js` con el conjunto cerrado de 26 zonas canónicas y el normalizador `normalizeTargetZone` / `normalizeExerciseTargetZones`.
   - Se eliminan ambigüedades léxicas (`isquiosural` -> `isquiosurales`, `gemelo` -> `gemelos`, `tobillos` -> `tobillo`, `caderas` -> `cadera`, `gluteo` -> `gluteo_mayor` / `gluteo_medio` según biomecánica del ejercicio).
