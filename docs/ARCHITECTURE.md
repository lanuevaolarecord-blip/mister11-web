# Míster11 — Arquitectura Integral del Sistema (Production-Ready)

Este documento describe la arquitectura técnica, modelo de seguridad, motor clínico y protocolo de internacionalización de **Míster11**, optimizado para el ecosistema Android First y entornos de producción.

---

## 1. Visión General de Arquitectura

- **Frontend Core**: React 18 SPA compilada con Vite y Rolldown.
- **Distribución**: Progressive Web App (PWA) instalable + integración móvil Capacitor para Android.
- **Backend & Almacenamiento**: Google Firebase (Firestore, Storage, Cloud Functions, Firebase Authentication).
- **Persistencia Offline**: `persistentLocalCache` con `persistentMultipleTabManager` de Firestore (almacenamiento en IndexedDB), garantizando operatividad en vestuarios y campos de entrenamiento sin conectividad.
- **Code-Splitting (B7)**: División estratégica de chunks en Vite (`vendor-react`, `vendor-firebase`, `vendor-fabric`, `vendor-pdf`), optimizando el tiempo de carga en dispositivos móviles.

---

## 2. Modelo de Seguridad y Privacidad de Menores (B2-FIX & Reglas de Acceso)

1. **Age-Gate Server-Side Inmune a Spoofing**:
   - `firestore.rules` deriva la edad del atleta exclusivamente desde el documento del servidor (`/players/{playerId}`) mediante `get()`.
   - Ignora cualquier campo de edad enviado en el payload del cliente (`request.resource.data.playerAge`).
   - Evaluación **fail-closed**: si la fecha de nacimiento no está presente o el documento no existe, la edad se evalúa en 0 años, bloqueando cualquier ejercicio con restricción de edad mínima (`edadMin >= 12`).
2. **Autoridad y Tenencia del Entrenador**:
   - La autoridad técnica sobre el equipo se valida contra el documento del equipo (`teamRel`), exigiendo coincidencia con `ownerId` o membresía en `staffMembers`.
   - `team_codes` es inmutable y protegido contra auto-apropiación.
   - Eliminados todos los escape-hatches huérfanos en `sharedPlans` y `sharedSessions`.
3. **Privacidad de Planes Individuales (`playerPlans`)**:
   - Acceso de lectura estrictamente restringido en `firestore.rules`:
     ```javascript
     allow read: if isAuth() && (isStaff() || resource.data.get('playerId', '') == request.auth.uid);
     ```
   - Selector canónico obligatorio `buildPlayerPlansFilter(teamId, playerId)` en frontend: prohíbe consultas indiscriminadas sin scope de atleta.

---

## 3. Motor de Validación Clínica y Seguridad de Ejercicios (B3-FIX & B5-A)

1. **Mapa Canónico Derivado (`exerciseSafetyMap.js`)**:
   - Una única fuente de verdad: proyección directa desde `homeExercisesCatalog.js` y `systemCoreExercises.js` (118 ejercicios).
   - Cero re-declaraciones de objetos o discrepancias de datos.
   - Supervisión presencial requerida (`requiere_supervision_presencial`) dicta el tier de riesgo:
     - `requiere_supervision_presencial === true` → `alto` (con cita de fuente citable).
     - Ejercicios en revisión de fisioterapia → `PENDIENTE-FISIO` (postura conservadora fail-closed).
     - Resto → `bajo`.
   - Aserción semántica G2 (Jaccard similarity) que previene ejercicios duplicados no declarados.
2. **Piloto B5-A de Ilustraciones Vectoriales (Bajo Riesgo, Sin Fisio)**:
   - 4 ejercicios de bajo riesgo (`sys-1`, `sys-2`, `sys-3`, `sys-8`), edad mínima 10 años, sin supervisión presencial requerida.
   - 100% vectorial SVG (sin fotos ni modelos generativos de IA alucinados).
   - Visor de revisión en panel de administración (`PilotIllustrationsReview.jsx`) para certificación por el dueño.
   - **Fail-closed**: bloqueo automático en prescripción casera hasta aprobación explícita humana (`reviewed_by_human: true`).

---

## 4. Protocolo Estricto de Internacionalización (i18n & Cierre por Wordlist)

1. **Paridad Simétrica de Claves**:
   - 6 lenguas activas soportadas: Español (`es`), Español LatAm (`es-419`), Inglés (`en`), Portugués (`pt`), Francés (`fr`), Indonesio (`id`).
   - Exactamente 2.890 claves por idioma (17.340 celdas en total).
2. **Cierre Finito por Wordlist (`test-i18n-wordlist-closure.mjs`)**:
   - Sustituye las heurísticas incompletas de expresiones regulares por validación determinista de vocabulario.
   - Cazadores de fugas foráneas (detección de inglés no autorizado en PT/FR/ID/ES o español en otras columnas).
   - Allowlist universal cerrada para marcas (`Míster11`, `FIFA 11+`), acrónimos técnicos (`GPS`, `RPE`, `DNI`) y términos de interfaz universal (`Dashboard`, `Feedback`).
3. **Gobernanza de Marca del Dueño**:
   - `player.nav.chat` en ES y ES-419 se mantiene estrictamente preservado como `"Mister"` bajo la etiqueta `[PENDIENTE-DUEÑO: NAV-CHAT-ES]`, sin auto-firmas arbitrarias del agente.

---

## 5. Calidad, Observabilidad y Sanitización de PII (B6 & B8)

1. **Logger Seguro y Sanitización de PII (`src/utils/logger.js`)**:
   - Scrubbing automático de datos personales sensibles (correos electrónicos, teléfonos, DNI/NIE, tokens Bearer, contraseñas) antes de cualquier emisión de log.
   - `sentryBeforeSendScrubber`: hook listo para telemetría libre de PII.
2. **Definiciones TypeScript Incrementales (`src/types/`)**:
   - `clinical.d.ts`: tipos formales para `RiskTier`, `CanonicalExercise`, `ExerciseSafetyEntry`, `PrescriptionValidationResult`.
   - `i18n.d.ts`: tipos formales para `SupportedLocale`, `TranslationDictionary`, `I18nContextValue`.
3. **Batería de Pruebas de CI**:
   - `ci-i18n-gate.mjs` (7/7 tests multi-lengua y detector de literales estáticos).
   - `test-safety-map-integrity.mjs` (integridad de derivación y G2 semántica).
   - `test-age-gate-rules.mjs` (simulación de evaluación server-side de Firestore).
   - `test-player-plans-privacy.mjs` (aislamiento estricto de planes de menores).
   - `test-pilot-illustrations.mjs` (validación del piloto vectorial B5-A).
   - `test-p14-animation-determinism.mjs` (reproducción 10x determinista sin líneas teal residuales ni balón fantasma).
   - `check-chart-palette.mjs` (linter estricto de paleta canónica Tierra y Campo).
