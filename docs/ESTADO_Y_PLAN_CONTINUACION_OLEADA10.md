# MÍSTER11 — INFORME DE ESTADO Y PLAN DE CONTINUACIÓN (OLEADA 10 — READ-ONLY)

* **Fecha de corte del informe**: `2026-11-16T19:48:00+01:00`
* **Modo de ejecución**: `READ-ONLY` (0 modificaciones en código fuente, reglas Firestore, ilustraciones, diccionarios i18n, motores clínicos, PDF, Android ni despliegues).
* **Build de referencia**: `Build 95 (Closed Testing)`
* **Rama verificada**: `main`
* **HEAD real verificado**: `0dcc3e76e8579b44d63143c6004b401112f65818` (`0dcc3e7`) — existen **2 commits posteriores** a `040ff3c` (Oleada 9.3): `cde7d65` y `0dcc3e7` (ambos acotados a la sincronización de goles encajados del portero en `LiveStats.jsx`, `Partidos.jsx`, `ratingFormula.js`, `playerMatchStats.js` y `pure-engines.test.js`).

---

## 0. ÍNDICE

1. [Resumen Ejecutivo: las 5 Preguntas Clave](#01-resumen-ejecutivo-las-5-preguntas-clave)
2. [Sección 1 — Snapshot Literal del Repositorio](#sección-1--snapshot-del-repositorio)
3. [Sección 2 — Estado de Frentes, Residuos R1–R29, Guardas S1–S8 y Pendientes](#sección-2--estado-de-frentes-y-residuos)
4. [Sección 3 — Veredicto Global Actual (`closure-gate.mjs`)](#sección-3--veredicto-global-actual)
5. [Sección 4 — Decisiones del Dueño D1–D7](#sección-4--decisiones-del-dueño-d1-d7)
6. [Sección 5 — Deudas Activas y Pendientes](#sección-5--deudas-activas-y-pendientes)
7. [Sección 6 — Plan de Continuación Ordenado (Con Literales G1–G5 Verificados)](#sección-6--plan-de-continuación-ordenado)
8. [Sección 7 — Verificación Final del Informe](#sección-7--verificación-final-del-informe)

---

## 0.1. Resumen Ejecutivo: las 5 Preguntas Clave

1. **¿Dónde quedamos exactamente la última vez?**
   * El corte arquitectónico y de auditoría de **Oleada 9.3** quedó registrado en el commit `040ff3c` (`feat(owner-decisions): Oleada 9.3 aplica D1 Mister marca, D2 rechazo SVG con brief biomecánico, D3 deuda sin nativo, D4 Planes individuales/posición como está, D5 trayectorias doradas, D6 consentimiento server-side con inventario, D7 preparador físico; remata S1-S8`).
   * Posteriormente se aplicaron en `main` dos commits puntuales de corrección funcional solicitados por el usuario para el conteo de goles encajados del portero: `cde7d65` y `0dcc3e7` (actual `HEAD`).
   * Quedaron listos en scripts locales (`scratch/test_g1_d4.mjs`, `scratch/test_g2_d5_injection.mjs`, `scripts/audit-consents-inventory.mjs`, `scratch/vitest.injection.config.js`), pero **pendientes de consolidar en el documento de auditoría**, los 5 literales de **Oleada 9.4 (G1–G5)**.
   * Adicionalmente, en el turno inmediatamente anterior se generó el archivo no rastreado `docs/CATALOGO_PROMPTS_VIDEOS_MISTER11.md` con los 118 ejercicios del catálogo divididos en 24 bloques (nota de rigor: el archivo en disco `docs/CATALOGO_PROMPTS_VIDEOS_MISTER11.md` contiene los 118 IDs y nombres exactos de `SYSTEM_CORE_EXERCISES` + `HOME_EXERCISES_108`, mientras que la respuesta resumida en el chat anterior parafraseó algunos títulos de `hex-*`).

2. **¿Qué está cerrado con evidencia?**
   * **11 Frentes principales (Maestro Oleada 8 y P1 a P10)**: cerrados en código y verificados con gates automatizados.
   * **Decisiones del Dueño sin dependencia de terceros**: **D1** (`"Mister"` en ES/ES-419 como marca en `whitelist-brand`), **D4** (`player.plans.title = "Planes individuales"` y `player.profile.position = "Posición Principal"`), **D5** (trayectorias de pizarra en dorado `#D4A843` y rechazo fail-closed de `#0D9488`).
   * **Guardas de seguridad clínica y técnica (S1, S4, S5, S6, S7, S8)**: bloqueo fail-closed de los 5 SVG rechazados (`status: "rejected_by_owner"`, `reviewed_by_human: false`), bloqueo de ejercicios de alto riesgo sin `rigVerifiedBy` colegiado, gobernanza del generador de sesiones (`requiresPhysioApproval: true`), determinismo 10/10 en animación de pizarra y tipado estático en el núcleo clínico (`tsc --noEmit` con exit code 0).

3. **¿Qué quedó parcial, en deuda o pendiente del DUEÑO?**
   * **D2-R**: Rediseño biomecánico de las 5 ilustraciones SVG de bajo riesgo rechazadas por el dueño (`sys-1`, `sys-2`, `sys-3`, `sys-8`, `sys-9`). La guarda fail-closed está `[CERRADO]`, pero el arte sigue en `[DEUDA FINITA CON DUEÑO: D2-R]`.
   * **D3-R / R8**: Revisión por hablante nativo de PT e ID para las 5 claves `(b)` en `pending-native-5b` (`player.tab.physical` en PT; `player.tab.tactical`, `player.nav.schedule`, `player.tab.plans`, `player.tab.technical` en ID).
   * **D6-R**: Ejecución del inventario sobre Firestore de producción (actualmente bloqueado en entorno local por credenciales expiradas `firebase login --reauth` -> `[CONFLICTO-DE-SCOPE]`), backfill de consentimientos parentales de menores y despliegue de reglas `firestore.rules` en modo STRICT.
   * **D7-R**: Validación y firma de la matriz de dosificación y fatiga por un Preparador Físico antes de habilitar el generador de sesiones en Fase 6.
   * **Deudas técnicas acotadas**: `S2 / R18` (`markerCoords` calibradas por fisio), `S3 / R23` (cobertura de ramas de `minutesEngine.js` en `57.12%` frente a `75%`), `R11` (triaje léxico de 976 igualdades + 100 tokens), `R13` (harness canvas vivo en CI), `R21` (reducción adicional del chunk `index` gzip de `391.51 kB` a `< 300 kB`), `R24` (branch protection en GitHub), `R29` (12 `console.log` en 3 archivos de zonas protegidas) y ajuste del cálculo de veredicto en `scripts/closure-gate.mjs:1074` (que actualmente no suma `pending-native-5b` a `activeStats.unknowns`).

4. **¿Cómo continuamos según lo que estábamos trabajando?**
   * **Paso 1 (Inmediato)**: Cerrar formalmente **Oleada 9.4** incorporando los 5 literales verificados (G1–G5) y corrigiendo en `closure-gate.mjs` la suma de `pending-native-5b` en el veredicto tri-nivel.
   * **Paso 2**: Ejecutar **P11 (Inventario Completo de Ejercicios)** documentando los 118 ejercicios reales (`10 sys + 108 hex`), sus filtros de prescripción (`canPrescribeAtHome`) y sus estados de ilustración/riesgo.
   * **Paso 3**: Diseñar e implementar **P12 (Guía SVG Orientativa No Validada Clínicamente)** separando estrictamente `viewable` (consulta visual orientativa) de `prescribable` (`unlockPrescription = false` mientras no exista validación humana/fisioterapéutica).
   * **Paso 4**: Mantener **Fase 6** condicionada a las firmas humanas de D7-R, D2-R y D6-R.

5. **¿Qué no debe tocarse todavía?**
   * **Zonas protegidas sin autorización expresa**: `src/pages/Sesiones.jsx`, `src/pages/PizarraTactica.jsx` (lógica de formaciones y dibujo), `src/components/LiveStats.jsx`, `src/pages/Partidos.jsx`, `src/config/plans.js` (lógica de negocio/pricing), `src/firebase/stripePlanSyncFunction.js`, `android/`, `firestore.rules` (despliegue remoto).
   * **Prohibiciones de gobernanza**: No auto-firmar `reviewed_by_human: true` en ningún ejercicio (D2); no alterar ni blanquear las 5 claves `pending-native-5b` en `canonicalWordlist.js` ni ensanchar `legitimateCognates` / `nativePatterns` (D3); no activar el generador automático de sesiones sin firma del preparador físico (D7); no desbloquear prescripción domiciliaria mediante guías orientativas (P12).

---

## SECCIÓN 1 — SNAPSHOT DEL REPOSITORIO

### 1.1. Rama actual, HEAD y últimos 15 commits

```text
// Comando ejecutado:
// Set-Location "c:\Users\jhojan\Desktop\MISTER 11\mister11-web"; git rev-parse --abbrev-ref HEAD; git rev-parse HEAD; git log -15 --oneline

main
0dcc3e76e8579b44d63143c6004b401112f65818
0dcc3e7 fix(match): sincronizar goles encajados del portero en toma de datos de estadisticas con bitacora, marcador y eventos rivales
cde7d65 fix(match): sincronizar goles del rival con goles encajados del portero en toma de datos de estadisticas
040ff3c feat(owner-decisions): Oleada 9.3 aplica D1 Mister marca, D2 rechazo SVG con brief biomecánico, D3 deuda sin nativo, D4 Planes individuales/posición como está, D5 trayectorias doradas, D6 consentimiento server-side con inventario, D7 preparador físico; remata S1-S8
e553a0f fix(lineup): asegurar renderizado de fotos de jugadores en exportación PNG
59de265 docs(audit): oleada 9 — informe integral literal autocontenido (no resumen)
48e9c3a audit(final): oleada 9 corte definitivo — 11 frentes + 29 residuos R1-R29 con etiqueta CERRADO/FIX/DEUDA-DUEÑO + veredicto tri-nivel honesto + 7 decisiones DUEÑO declaradas no auto-firmadas + console_errors=[] + 9 regresiones B10 PASS
cab3da2 feat(types): P9 B8 migración incremental a TS del núcleo clínico (exerciseSafety+catálogo, luego engines) + claves i18n como Record<Lengua,string> estricto para que el slug-fallback de B10 sea error de compilación; tsc --noEmit verde
dfe7686 test(ci): P8 B9 Vitest con cobertura>=75% en core clínico; arreglar learn-and-verify y acoplar deploy a luz verde; re-correr gate pegando matriz con procedencia + fallback_derived_count + 5 linters literales + JSON cruzado + aserciones B10 (valor+clave+wordlist)
b5ddb7b perf(match): P7 B7 migrar cola B localStorage->IndexedDB SIN tocar el flujo de auto-guardado (test de rehidratación 0 pérdida, check-in intacto = condición dura) + code-splitting Pizarra/Partidos/PDF para línea C (antes/después gzip)
906ed61 chore(obs): P6 B6 Sentry web con scrub de PII de menores; limpiar console.log de prod; reescribir README como doc de arquitectura (no template Vite)
40c09be feat(i18n): P5 wordlist determinista por lengua (cierre finito de B10); gate evalua pertenencia-por-wordlist, clasificador queda como backstop; EN migrada primero; 5 (b) revisadas por DUEÑO; prohibido ensanchar cognados/native
09f903e fix(pizarra): P4 P14-FIX limpieza determinista de canvas entre fotogramas (mata teal residual Y balón duplicado); 1 balón por rAF; trayectoria nunca teal; check-chart-palette al canvas runtime; 10x determinista 0 fallos; no toca formación
e7e46b6 feat(illustrations): P3 B5-A piloto BAJO RIESGO sin fisio (clínica desde targetZones+cue, reviewedByHuman del DUEÑO); ALTO RIESGO en pausa, G10 bloqueando; exerciseSafety.js:103 verificado
3f2ec2a test+evidence: P10 cierra lagunas E6-E16 (write scopeado, aritmética histograma, paleta SVG, clase canvas-runtime, wordlist+5(b), rehidratación check-in, gzip, scrub, tsc+sello i18n) y ejecuta B9 REAL (Vitest>=75% + CI acoplado + apéndice literal); re-etiqueta FASE 5
7c1ec5d chore(confirm): P2 cierre de bordes E1-E5 (G10 conservador para PENDIENTE-FISIO; ageFromBirth(null) fail-closed; autoridad cross-equipo por get(); veredicto global B10-FIX-5 literal; reconciliación unknowns 108->90)
```

### 1.2. Estado del árbol de trabajo (`git status --short`)

* **Archivos rastreados modificados (`M`)**: `0` (`git diff --stat` vacío).
* **Archivos no rastreados (`??`)**: `108` entradas en total (103 archivos auxiliares en `scratch/`, 2 PDFs de prueba en raíz, `scripts/Sesion_Sesion_20261014.pdf`, `scripts/audit-consents-inventory.mjs` y `docs/CATALOGO_PROMPTS_VIDEOS_MISTER11.md`).

```text
// Comando ejecutado:
// Set-Location "c:\Users\jhojan\Desktop\MISTER 11\mister11-web"; git status --short

?? Sesion_Sesion_20261006.pdf
?? Sesion_Sesion_20261014.pdf
?? docs/CATALOGO_PROMPTS_VIDEOS_MISTER11.md
?? scratch/add_landing_keys.cjs
?? scratch/add_schedule_and_plans_keys.cjs
?? scratch/all_exercises_dump.json
?? scratch/all_pricing_keys.json
?? scratch/analyze_es419_unknowns.mjs
?? scratch/analyze_h15_36_keys.mjs
?? scratch/analyze_unknowns_and_cognates.mjs
?? scratch/analyze_unknowns_tria.mjs
?? scratch/apply_i18n_cleanup.mjs
?? scratch/apply_i18n_cleanup_batch2.mjs
?? scratch/apply_p1_p3_cleanups.cjs
?? scratch/apply_p3_translations.cjs
?? scratch/apply_portal_fixes.mjs
?? scratch/apply_pricing_and_pdf_keys.cjs
?? scratch/audit_player_portal_live.cjs
?? scratch/audit_portal_toasts_empty.mjs
?? scratch/audit_pricing.cjs
?? scratch/build_audit_complete.cjs
?? scratch/build_catalog_md.js
?? scratch/capture_frame.js
?? scratch/captured_outputs.json
?? scratch/check_ci_runs.mjs
?? scratch/check_fr_en.mjs
?? scratch/check_fr_foreign_en.mjs
?? scratch/check_pt_rings.mjs
?? scratch/check_reconcile.mjs
?? scratch/compare_safety_map.mjs
?? scratch/current_prompt.txt
?? scratch/demo_micro_loop_vectorial.html
?? scratch/diagnose_cross_detections.mjs
?? scratch/diagnose_pizarra_animation.mjs
?? scratch/dump_pricing.cjs
?? scratch/execute_audit.cjs
?? scratch/extract_frames.html
?? scratch/fetch_fonts.cjs
?? scratch/find_player_keys.mjs
?? scratch/find_pricing_issues.cjs
?? scratch/find_subtitles.mjs
?? scratch/fix_assert_test.cjs
?? scratch/fix_banner_commas.cjs
?? scratch/fix_chip_exact.cjs
?? scratch/fix_clinical_chip.cjs
?? scratch/fix_pdf_brand.cjs
?? scratch/fix_portal_i18n_keys.cjs
?? scratch/fix_reg1.mjs
?? scratch/full_user_prompt.txt
?? scratch/gemini_generated_video_4d797787.mp4
?? scratch/gemini_generated_video_8efaa77d.mp4
?? scratch/generate_full_audit.cjs
?? scratch/generate_tria.mjs
?? scratch/glute_bridge_frame.png
?? scratch/insert_exercise_level.cjs
?? scratch/insert_game_keys.cjs
?? scratch/inspect_en_unknowns.mjs
?? scratch/inspect_pt_pdf.mjs
?? scratch/inspect_unknowns.mjs
?? scratch/patch_assert_age_safe.cjs
?? scratch/patch_assert_regex.cjs
?? scratch/patch_audit.cjs
?? scratch/patch_canonical_guides.cjs
?? scratch/patch_clinical_chip.cjs
?? scratch/patch_closure_gate.mjs
?? scratch/patch_exercise_library.cjs
?? scratch/patch_final_emojis.cjs
?? scratch/patch_hex001_duplicate.cjs
?? scratch/patch_landing_selector.cjs
?? scratch/patch_landing_table_headers.cjs
?? scratch/patch_localized_exercise.cjs
?? scratch/patch_player_leaderboard.cjs
?? scratch/patch_player_plans_is_en.cjs
?? scratch/patch_player_profile_autosave.cjs
?? scratch/patch_player_schedule_is_en.cjs
?? scratch/patch_player_stats_is_en.cjs
?? scratch/patch_r_items.cjs
?? scratch/patch_remaining_player_stats_is_en.cjs
?? scratch/print_all_pricing.cjs
?? scratch/print_pricing_dom.mjs
?? scratch/register_all_used_keys.cjs
?? scratch/register_banner_keys.cjs
?? scratch/register_sync_keys.cjs
?? scratch/replace_dispatch.cjs
?? scratch/run_full_live_audit.cjs
?? scratch/run_gate_diagnostic.mjs
?? scratch/run_live_dom_audit.cjs
?? scratch/run_player_portal_audit_complete.cjs
?? scratch/test_618_sources.mjs
?? scratch/test_cognate_cleanup.mjs
?? scratch/test_detector.mjs
?? scratch/test_fabric_check.mjs
?? scratch/test_full_matrix_after_h24.mjs
?? scratch/test_g1_d4.mjs
?? scratch/test_g2_d5_injection.mjs
?? scratch/test_gate_clean.mjs
?? scratch/test_h14_h17.mjs
?? scratch/test_h20.mjs
?? scratch/test_matrix.mjs
?? scratch/test_p14_reproduction.mjs
?? scratch/test_player_tabs_live.cjs
?? scratch/test_reviewer_login.cjs
?? scratch/tria_table.md
?? scratch/unknowns_dump.json
?? scratch/view_reference_video.html
?? scratch/vitest.injection.config.js
?? scripts/Sesion_Sesion_20261014.pdf
?? scripts/audit-consents-inventory.mjs
```

### 1.3. Listado de `docs/` y `scripts/`

```text
// Comando ejecutado:
// Set-Location "c:\Users\jhojan\Desktop\MISTER 11\mister11-web"; Get-ChildItem docs -Name; "-----SCRIPTS-----"; Get-ChildItem scripts -Name

auditoria-modulos
pdf
release
ARCHITECTURE.md
AUDITORIA_FINAL_OLEADA9.md
backlog-h2.md
backlog.md
CATALOGO_PROMPTS_VIDEOS_MISTER11.md
CHECKLIST_IMPLEMENTACION.md
HOW_TO_CONTRIBUTE_LEARNINGS.md
HOW_TO_EVOLVE_KNOWLEDGE.md
i18n-duplication-breakdown.md
i18n-duplication-report.md
i18n-federation-verification.md
i18n-production-evidence.md
index.html
INFORME_ARQUITECTURA_I18N.md
INFORME_ESTADO_INTEGRAL_MISTER11.md
LECCIONES_APRENDIDAS.md
OLEADA-6.1-CIERRE-CATALOGO.md
OLEADA-6.2-LOCALIZACION-Y-CARRIL-A.md
OLEADA-6.3b-ESTANDAR-ILUSTRACIONES-Y-EVIDENCIA.md
UNIVERSAL_ENGINEERING_LEARNINGS.md
verificacion-captura-live.md
-----SCRIPTS-----
lib
assert-event-integrity.mjs
assert-p2-edges-confirmation.mjs
assert-pdf-images.mjs
assert-pdf-quality.mjs
assert-test-pdf.mjs
audit-consents-inventory.mjs
audit-hardcoded.cjs
audit-literals.js
audit-literals.mjs
audit-player-portal-dom.cjs
audit-translation-duplication.mjs
audit_browser_e2e.cjs
before-implement-check.js
check-chart-palette.mjs
check-circular-deps.mjs
check-contrast-guard.mjs
check-i18n.js
check-interpolation.mjs
check-manifest.mjs
check-viewport.mjs
ci-exercise-catalog.mjs
ci-i18n-gate.mjs
closure-gate.mjs
closure_matrix_sample.json
compile_docs_html.mjs
detect-string-cross-leakage.mjs
gen-rules-age-lists.mjs
generate-duplication-breakdown.mjs
generate-tier1-locales.mjs
generate_all_pdfs.mjs
learn-from-errors.js
migrate-catalog-6-1.mjs
mister11_state_evidence.json
patch-all-locales-wave6-2.mjs
qa-cross-device-matrix.mjs
qa-language-runtime.js
qa-language.js
qa_exports.mjs
raw_dom_evidence.json
reset-reviewer-account.js
seed-reviewer-account.js
Sesion_Sesion_20261014.pdf
test-age-gate-rules.mjs
test-ai-swot-summary.mjs
test-artifacts-i18n.mjs
test-attendance-engine.js
test-board-and-dashboard-reproduction.mjs
test-board-formations-and-fields.mjs
test-board-interaction-v2.mjs
test-chart-data-unicity.mjs
test-checkin-rehydration.mjs
test-convocation-png-layout.mjs
test-data-unicity-3matches.mjs
test-gk-engine.js
test-i18n-typecheck-breakage.mjs
test-i18n-wordlist-closure.mjs
test-landing-responsive.mjs
test-live-capture-reproduction.mjs
test-logger-scrub.mjs
test-match-status-and-sort.mjs
test-mp4-export-final-frame.mjs
test-mp4-export-parameters.mjs
test-multi-match-analysis-data.mjs
test-p14-animation-determinism.mjs
test-pilot-illustrations.mjs
test-player-plans-privacy.mjs
test-rasterize-canonical.mjs
test-render-smoke.mjs
test-rules-age-codegen.mjs
test-rules-emulator.mjs
test-safety-map-integrity.mjs
test-score-and-anas-card.mjs
test-source-unicity.mjs
test-spellchecker.mjs
test-staff-invite-flow.mjs
test-unified-board-sprint.mjs
test-xg-indices.mjs
translate-all-remaining-terms.mjs
universal-linter.js
update-knowledge-base.js
upload_apk_storage.mjs
```

---

## SECCIÓN 2 — ESTADO DE FRENTES Y RESIDUOS

### 2.1. Tabla de Frentes Principales, Guardas S1–S8, Residuos R1–R29 y Pendientes

| Frente / Ítem | Etiqueta actual | Evidencia literal verificada | Qué falta | Siguiente acción | Dueño |
|---|---|---|---|---|---|
| **Maestro Oleada 8 (Fases 1–5)** | `[CERRADO]` | `docs/AUDITORIA_FINAL_OLEADA9.md:60-95`, `closure-gate.mjs` pasos `[1/7]` a `[6/7]` PASS | Nada en fases 1–5 | Mantener regresión en CI | Tech Lead |
| **P1 — Planes scopeados por `playerId` + Edad server-side** | `[CERRADO]` | Commit `d7a3299`; `scripts/test-player-plans-privacy.mjs` y `scripts/test-age-gate-rules.mjs` PASS | Despliegue live de `firestore.rules` (ver D6-R) | Ejecutar deploy tras backfill D6-R | DUEÑO / Admin Firebase |
| **P2 — Cierre de bordes E1–E5 (Paleta, Contraste, G10)** | `[CERRADO]` | Commit `7c1ec5d`; `scripts/assert-p2-edges-confirmation.mjs` y `check-contrast-guard.mjs` PASS | Nada | Mantener guarda en CI | Tech Lead |
| **P3 — B5-A Piloto ilustraciones bajo riesgo sin fisio** | `[PARCIAL]` | Commit `e7e46b6` + `040ff3c`; guarda fail-closed activa en `src/utils/exerciseSafety.js:103`; los 5 SVG (`sys-1,2,3,8,9`) están en `status: "rejected_by_owner"`, `reviewed_by_human: false` | Rediseño biomecánico de los 5 SVG rechazados por el dueño (D2-R) | Entregar nuevos SVG 2.5D/3D ligeros y que el dueño firme `reviewed_by_human: true` (Plazo: Oleada 10) | DUEÑO / Fisio / Diseñador Técnico |
| **P4 — P14-FIX Animación pizarra (determinismo 10x)** | `[CERRADO]` | Commit `09f903e` + `040ff3c`; `scripts/test-p14-animation-determinism.mjs` (10/10 corridas, 0 residuos, 1 balón/rAF, trayectorias `#D4A843`) | Nada en runtime local | Mantener test determinista | Tech Lead |
| **P5 — Wordlist determinista por lengua (6 lenguas)** | `[PARCIAL]` | Commit `40c09be` + `040ff3c`; `scripts/test-i18n-wordlist-closure.mjs` certifica `17.335 / 17.340` celdas con evidencia positiva y `5` en `pending-native-5b` | Revisión por hablante nativo PT e ID de las 5 claves `(b)` (D3-R) | Validar las 5 claves con revisor nativo PT/ID (Plazo: Build 96) | DUEÑO / Revisor Nativo PT e ID |
| **P6 — B6 Sentry web + Scrubbing PII de menores** | `[CERRADO]` | Commit `906ed61`; `scripts/test-logger-scrub.mjs` certifica 0 fugas PII en payload Sentry | Limpieza de 12 `console.log` en 3 archivos protegidos (ver R29) | Autorizar toque en zonas protegidas para R29 (Plazo: Oleada 10) | DUEÑO |
| **P7 — B7 Cola B a IndexedDB + Code-Splitting** | `[PARCIAL]` | Commit `b5ddb7b`; `scripts/test-checkin-rehydration.mjs` PASS (0 pérdida, check-in intacto); chunk crítico reducido de `402.66 kB` a `391.51 kB` gzip | Reducir chunk crítico `index` por debajo de `300 kB` gzip (R21) | Code-splitting adicional de iconos/librerías en Oleada 10 | DUEÑO / Frontend Tech Lead |
| **P8 — B9 Vitest >=75% + CI acoplado** | `[PARCIAL]` | Commit `dfe7686`; `vitest.config.js` con umbrales 75% en 4 motores; `minutesEngine.js` en `57.12%` branches | Subir ramas de `minutesEngine.js` >=75% (S3/R23) y activar branch protection en GitHub (R24) | Ampliar tests de ramas en `minutesEngine` y activar check requerido en GitHub (Plazo: Oleada 10 / Build 96) | QA Lead / DUEÑO |
| **P9 — B8 Tipos estáticos en núcleo clínico + Sello i18n** | `[CERRADO]` | Commit `cab3da2`; `npx tsc --noEmit` exit code 0; `scripts/test-i18n-typecheck-breakage.mjs` PASS | Nada | Mantener `tsc --noEmit` en gate | Tech Lead |
| **P10 — Cierre de lagunas de evidencia E6–E17** | `[CERRADO]` | Commit `3f2ec2a`; evidencias literales integradas en `docs/AUDITORIA_FINAL_OLEADA9.md` | Nada | Cerrado | Tech Lead |
| **Post-9.3 (`e553a0f`, `cde7d65`, `0dcc3e7`)** | `[CERRADO]` | Commits `e553a0f` (fotos PNG alineación) y `cde7d65` + `0dcc3e7` (`getGkConcededCount` sincronizado en `LiveStats.jsx`, `Partidos.jsx`, `ratingFormula.js`; 36/36 tests en `pure-engines.test.js` PASS) | Nota de gobernanza: `cde7d65` y `0dcc3e7` tocaron `LiveStats.jsx` y `Partidos.jsx` por petición directa del usuario en el turno 9 | Mantener cubierto en `pure-engines.test.js` | Tech Lead |
| **Guarda S1 — Rechazo B5-A fail-closed** | `[CERRADO]` | `src/utils/exerciseSafety.js:103` y `scripts/test-pilot-illustrations.mjs` bloquean prescripción cuando `status === 'rejected_by_owner'` o `reviewed_by_human !== true` | Rediseño gráfico (D2-R) | Esperar nuevos SVG del diseñador/fisio (Plazo: Oleada 10) | DUEÑO / Fisio |
| **Guarda S2 (R18) — `markerCoords` biomecánicas** | `[DEUDA FINITA CON DUEÑO]` | `src/data/vectorIllustrations.js` mantiene coordenadas empíricas rechazadas con `status: "rejected_by_owner"` | Derivar `markerCoords` de articulaciones/cues validados por fisioterapeuta | Calibrar coordenadas anatómicas durante rediseño D2-R (Plazo: Oleada 10) | DUEÑO / Fisio Colegiado |
| **Guarda S3 (R23) — Umbral per-file Vitest** | `[PARCIAL]` | `vitest.config.js:16-26` aplica `75%` en `lines/branches/functions/statements` a `exerciseSafety`, `lineupEngine`, `ratingFormula`, `materialGlossary`; `minutesEngine.js` tiene `branches: 57.12%` | Cubrir ramas de `minutesEngine.js` hasta `>= 75%` y añadir `branches: 75` a su regla en `vitest.config.js` | Añadir casos de test de bordes de sustituciones/prórrogas en `pure-engines.test.js` (Plazo: Oleada 10) | QA Lead / Tech Lead |
| **Guarda S4 — `check-chart-palette` para `#D4A843` vs `#0D9488`** | `[CERRADO]` | `scripts/check-chart-palette.mjs` y `scratch/test_g2_d5_injection.mjs` aceptan `#D4A843` en `category: 'trajectory'` (0 violaciones) y rechazan `#0D9488` (2 violaciones, fail-closed) | Nada | Mantener linter activo | Tech Lead |
| **Guarda S5 — Anti-lavado de las 5 claves `(b)`** | `[CERRADO]` | `src/i18n/wordlist/canonicalWordlist.js:40-77` y `scripts/closure-gate.mjs:512-516` retienen las 5 claves como `pending-native-5b` | Corregir línea 1074 de `closure-gate.mjs` para que `pending-native-5b` compute en `activeStats.unknowns` (`PASS-CON-DEUDA`) | Actualizar suma en `closure-gate.mjs:1074` en Oleada 9.4 (Plazo: Inmediato) | Tech Lead |
| **Guarda S6 — Gobernanza del generador de sesiones** | `[CERRADO]` | `src/utils/sessionGeneratorGovernance.js` exige `requiresPhysioApproval: true` y bloquea alto riesgo sin `rigVerifiedBy` | Firma del preparador físico sobre la matriz (D7-R) | Revisión con Preparador Físico antes de Fase 6 | DUEÑO / Preparador Físico |
| **Guarda S7 (R16) — 11 nodos en reposo pizarra** | `[CERRADO]` | `scripts/test-p14-animation-determinism.mjs` vuelca las coordenadas exactas de los 11 jugadores en formación 4-3-3 en reposo y post-animación | Nada | Mantener test | Tech Lead |
| **Guarda S8 — Regla server-side de consentimiento** | `[PARCIAL]` | `firestore.rules` + `scripts/test-age-gate-rules.mjs` bloquean spoof de `consentStatus` | Inventario en producción, backfill y `firebase deploy --only firestore:rules` (D6-R) | Re-autenticar Firebase CLI y ejecutar backfill antes de Build 96 | DUEÑO / Admin Firebase |
| **Residuos R1, R2, R3, R4, R5, R6, R7, R9, R10, R12, R14, R15, R16, R17, R19, R20, R22, R25, R26, R27, R28** | `[CERRADO]` | Verificados con código y tests en `docs/AUDITORIA_FINAL_OLEADA9.md:563-958` | Nada | Mantener en suite de regresión | Tech Lead |
| **Residuos R8, R11, R13, R18, R21, R23, R24, R29** | `[DEUDA FINITA CON DUEÑO]` | Documentados individualmente en la Sección 5 de este informe | Acciones humanas/técnicas detalladas en Sección 5 | Ejecutar según plan de Sección 6 | Ver tabla Sección 5 |
| **Oleada 9.4 — Literales faltantes G1–G5** | `[PARCIAL]` | Los 5 scripts/evidencias existen y fueron ejecutados en vivo hoy (salidas literales incluidas en la Sección 6.1 de este documento), pero **aún no se han anexado ni commiteado en `docs/AUDITORIA_FINAL_OLEADA9.md`** | Añadir apéndice Oleada 9.4 en `docs/AUDITORIA_FINAL_OLEADA9.md` y commitear | Ejecutar Paso 1 del Plan de Continuación (Plazo: Inmediato en Oleada 10) | Tech Lead |
| **P11 — Inventario completo de ejercicios (118 vs filtros)** | `[PARCIAL]` | Verificado en código hoy: existen **118 ejercicios** (`10` en `SYSTEM_CORE_EXERCISES` + `108` en `HOME_EXERCISES_108`). Filtros de `filterHomeExercises`: `92` prescribibles sin supervisión (>=13 años), `81` (10 años), `100` con supervisión (>=14 años). El número `87` en `closure-gate.mjs:57` es el conteo de celdas `wordlist-exact` del portal i18n, no de ejercicios | Generar formalmente `docs/EXERCISE_INVENTORY_OLEADA10.md` (y JSON auditable) | Ejecutar Paso 2 del Plan de Continuación (Plazo: Oleada 10) | Tech Lead / Fisio |
| **P12 — Guía SVG orientativa no validada clínicamente** | `[DEUDA FINITA CON DUEÑO]` | Actualmente `ExerciseIllustrationBlock.jsx` y `exerciseSafety.js` bloquean prescripción si `reviewed_by_human !== true`; no existe aún el modo separado `orientative_guide` con `viewable: true, unlockPrescription: false` | Definir e implementar contrato `viewable` vs `prescribable` manteniendo `unlockPrescription = false` sin fisio | Ejecutar Paso 3 del Plan de Continuación tras aprobación del dueño (Plazo: Oleada 10) | DUEÑO / Tech Lead |
| **Videos 3D de referencia (`Mister11_Glute_Bridge.mp4` y videos en `scratch/`)** | `[DEUDA FINITA CON DUEÑO]` | En disco existen: `.user_uploaded/media_1794255681140_af45ccb9.mp4` (`Mister11_Glute_Bridge.mp4`, 2.529.394 bytes), `scratch/gemini_generated_video_4d797787.mp4` (2.436.688 bytes) y `scratch/gemini_generated_video_8efaa77d.mp4`. No existe aún un archivo de video etiquetado explícitamente como plancha lateral en el catálogo oficial ni clasificación formal en `exerciseSafetyMap.js` | Clasificar formalmente cada activo de video 3D como referencia estética/orientativa (`unlockPrescription = false`) y mapear a qué ID (`sys-2` / `sys-9`) corresponde cada archivo MP4 | Revisión y clasificación por el DUEÑO en P12 (Plazo: Oleada 10) | DUEÑO |

---

## SECCIÓN 3 — VEREDICTO GLOBAL ACTUAL

### 3.1. Salida literal completa de `$ node scripts/closure-gate.mjs`

```text
// Comando ejecutado:
// Set-Location "c:\Users\jhojan\Desktop\MISTER 11\mister11-web"; node scripts/closure-gate.mjs
// Exit code: 0

==============================================================================
MÍSTER 11 — GATE MAESTRO DE CIERRE DEFINITIVO
DUEÑO FIRMÓ EXERCISE_NAME_POLICY = LOCALIZAR (Opción A: localizar en lengua activa)
==============================================================================

▶ [1/7] Evaluando Matriz de Pertenencia de Nombres de Ejercicio (Campo × Superficie × Lengua)...
  • Contador de ejercicios evaluados: 118 ejercicios.
    - 108 ejercicios de HOME_EXERCISES_108 (hex-001 a hex-108).
    - 10 ejercicios de SYSTEM_CORE_EXERCISES (sys-1 a sys-10).
    - Total combinaciones evaluadas: 2950 (118 ejercicios × 5 lenguas × 5 superficies).
  • Desconocidos (U): 0 (ESPERADO: 0) -> PASS ✅
  • Divergencias entre superficies: 0 (ESPERADO: 0) -> PASS ✅
  • Fallback Derived Count: 0 (ESPERADO: 0) -> PASS ✅

▶ [2/7] Auditando Chip Clínico de Fallback (Identidad de Markup y Contraste WCAG 1.4.3)...
  ✅ Identidad exacta de cadena y markup certificada en Portal == Library == PDF para PT, FR e ID

  [CHECK-CONTRAST-GUARD] SALIDA DEL CHIP POR TEMA Y LENGUA:
    • Tema Claro (PT/FR/ID):
        - Texto (#1B3A2D sobre #f9f2e3):     11.15:1 (MÍNIMO 4.5:1) -> PASS ✅
        - Icono/Borde (#9C6A3B sobre #f9f2e3): 4.15:1 (MÍNIMO 3.0:1) -> PASS ✅
    • Tema Oscuro (PT/FR/ID):
        - Texto (#F2EDE4 sobre #152C22):     12.73:1 (MÍNIMO 4.5:1) -> PASS ✅
        - Icono/Borde (#D4A843 sobre #152C22): 6.70:1 (MÍNIMO 3.0:1) -> PASS ✅
    • Verificación de Fallo: #D4A843 sobre fondo dorado claro da 1.83:1 (< 4.5:1) -> Eliminado y sustituido por #1B3A2D (11.66:1).

▶ [3/7] Verificando Fugas de Idioma (Carril A nativo vs Carril C excepciones)...
  • Escaneando DOBLE ASERCIÓN (Pertenencia de Valor no-tautológica + Clave Resuelta) en LAS 6 LENGUAS (H8, H14, H16):
    - Superficie [nav]: 18 claves × 6 lenguas evaluadas -> PASS ✅ (0 fugas)
    - Superficie [tabs]: 9 claves × 6 lenguas evaluadas -> PASS ✅ (0 fugas)
    - Superficie [h2_titles]: 2 claves × 6 lenguas evaluadas -> PASS ✅ (0 fugas)
    - Superficie [subtitles]: 9 claves × 6 lenguas evaluadas -> PASS ✅ (0 fugas)
    - Superficie [card_labels]: 11 claves × 6 lenguas evaluadas -> PASS ✅ (0 fugas)
    - Superficie [plan_badges]: 3 claves × 6 lenguas evaluadas -> PASS ✅ (0 fugas)
    - Superficie [material]: 19 claves × 6 lenguas evaluadas -> PASS ✅ (0 fugas)
    - Superficie [toasts]: 24 claves × 6 lenguas evaluadas -> PASS ✅ (0 fugas)
    - Superficie [empty_states]: 8 claves × 6 lenguas evaluadas -> PASS ✅ (0 fugas)
    - Superficie [breadcrumbs]: 0 claves -> [X] N/A (no implementado en arquitectura portal)

  [TABLA 6x6 MATRIZ DE PERTENENCIA RECONCILIADA (618 CELDAS)]
  | Target Col \ Detected | ES | ES-419 | EN | PT | FR | ID | DEUDA [5b] | VENCIDO [FAIL] | Total | Estado |
  |---|---|---|---|---|---|---|---|---|---|---|
  | ES | 103 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 103 | PASS ✅ |
  | ES-419 | 0 | 103 | 0 | 0 | 0 | 0 | 0 | 0 | 103 | PASS ✅ |
  | EN | 0 | 0 | 103 | 0 | 0 | 0 | 0 | 0 | 103 | PASS ✅ |
  | PT | 0 | 0 | 0 | 102 | 0 | 0 | 1 | 0 | 103 | PASS-CON-DEUDA [P] (1 [5b]) |
  | FR | 0 | 0 | 0 | 0 | 103 | 0 | 0 | 0 | 103 | PASS ✅ |
  | ID | 0 | 0 | 0 | 0 | 0 | 99 | 4 | 0 | 103 | PASS-CON-DEUDA [P] (4 [5b]) |

  [HISTOGRAMA DE FUENTES DE CLASIFICACIÓN (618 CELDAS) — H16]
  | Fuente de Clasificación | Celdas | % del Total | Naturaleza de la Evidencia |
  |---|---|---|---|
  | whitelist-brand | 15 | 2.4% | Evidencia Positiva (Carril C allowlist marca/siglas) |
  | cognado | 61 | 9.9% | Evidencia Positiva (Cognado legítimo declarado) |
  | pending (vigente) | 0 | 0.0% | Bypass Provisional Vigente |
  | pending-EXPIRED | 0 | 0.0% | 🔴 [VENCIDO en Build 95] (Requiere firma Dueño) |
  | wordlist-exact | 87 | 14.1% | Evidencia Positiva (Término esperado en Wordlist Canónico P5) |
  | rama2-lexical-native | 450 | 72.8% | Evidencia Positiva (Marcadores léxicos/diacríticos de la lengua) |
  | pending-native-5b | 5 | 0.8% | [PENDIENTE-NATIVA] (Deuda finita de 5 claves con DUEÑO) |
  | rama3-exact (foráneo) | 0 | 0.0% | Fuga Foránea (Cruce exacto de diccionario ajeno) |
  | rama2-lexical-foreign | 0 | 0.0% | Fuga Foránea (Marcador léxico foráneo) |
  | DEFAULT-unknown | 0 | 0.0% | [P] PARCIAL (Sin evidencia léxica explícita; default no-tautológico) |
  | TOTAL EVALUADO | 618 | 100.0% | 618 celdas (103 claves × 6 lenguas) |

  [AUDITORÍA H15: FUENTE DE DETECCIÓN DE LAS 36 CLAVES SANEADAS DE PT/FR/ID]
  • Total claves saneadas en B10: 36.
  • Rama 3 (Cruce exacto con esDict): cazó 36/36 (100.0%) de las claves con fuga.
  • Rama 2 (Clasificador léxico regex): cazó 15/36 (41.7%) de las claves con fuga.
  • Origen inicial de detección: Captura de pantalla del DUEÑO (reporte manual en prompt B10).
  • Conclusión honesta: La Rama 3 es el detector primario real para fugas exactas de diccionario; Rama 2 actúa como backstop para textos libres.

  [EJECUTANDO TESTS DE REGRESIÓN AUTOMATIZADOS (H9, H11, H14, H17)]
  ✅ Regresión H9: Inyección de inglés ("Custom Training") en ES detectada y bloqueada con éxito (Fuente: rama2-lexical-foreign).
  ✅ Regresión H9: Inyección de español ("Prevención") en FR detectada y bloqueada con éxito.
  ✅ Regresión H11: Inyección de clave con valor=placeholder ("badge.prevencion") detectada y caída de gate certificada.
  ✅ Regresión B10: Inyección de token inglés "Stats" en ES detectada y bloqueada con éxito.
  ✅ Regresión H14: Inyección sin stopword ("Zzzqwerty Training") en ES devuelve "unknown" (DEFAULT-unknown), NO pasa por default.
  ✅ Regresión D1 / H17: "Mister" en ES clasificado como "whitelist-brand" (Carril C), e inyección de inglés no-marca ("Coach") en ES rechazada como fuga (rama3-exact).
  ✅ Regresión H20.1: Inyección de palabra española ("Prevención") en FR clasificada como "rama3-exact", NUNCA como "cognado".
  ✅ Regresión H20.2: Palabra inglesa sin marcador ("UnlistedWord") en EN clasificada como "DEFAULT-unknown", NUNCA como "rama2-lexical-native".
  ✅ Regresión H18: Los 3 niveles de veredicto (FAIL por fuga/vencido, PASS-CON-DEUDA por unknown, PASS-LIMPIO 0+0) certificados formalmente.
  ✅ Regresión H22.1: Inyección de inglés ("PHYSICAL") en PT detectada como fuga exacta (rama3-exact), NUNCA aprobada como cognado.
  ✅ Regresión H22.2: Inyección de español ("Ficha") en PT detectada como fuga exacta (rama3-exact), NUNCA aprobada como cognado.
  ✅ Regresión H23.1: Inyección de forma española ("Fortalecimiento") en PT bloqueada como fuga exacta (rama3-exact), no admitida en nativePatterns.pt.
  ✅ Regresión H23.2: Forma portuguesa legítima ("Fortalecimento") en PT aprobada afirmativamente como nativa (rama2-lexical-native).
  ✅ Regresión H24: Batería anti-contrabando 100% PASS: Las 39 palabras añadidas a EN dieron negativo en las otras 5 lenguas.

  [TABLA LITERAL CAMPO × LENGUA (Strings Reales Auditados)]
  | Campo | ES | ES-419 | EN | PT | FR | ID |
  |---|---|---|---|---|---|---|
  | tab.physical | FÍSICO | FÍSICO | PHYSICAL | FÍSICO | PHYSIQUE | FISIK |
  | plans.title | Planes individuales | Planes individuales | Individual Training Plans | Planos de Treino Individuais | Plans d'entraînement individuel | Rencana Pelatihan Individu |
  | plans.subtitle | Rutinas personalizadas asignadas por el cuerpo técnico | Rutinas personalizadas asignadas por el cuerpo técnico | Custom routines assigned by coaching staff | Rotinas personalizadas atribuídas pela comissão técnica | Routines personnalisées assignées par le staff technique | Rutinitas khusus yang ditugaskan oleh staf pelatih |
  | card.position | Posición Principal | Posición Principal | Main Position | Posição principal | Position principale | Posisi utama |
  | card.category | Categoría | Categoría | Category | Categoria | Catégorie | Kategori |
  | badge.prevencion | Prevención | Prevención | Prevention | Prevenção | Prévention | Pencegahan |
  | badge.recuperacion | Recuperación | Recuperación | Recovery | Recuperação | Récupération | Pemulihan |
  | badge.fortalecimiento | Fortalecimiento | Fortalecimiento | Strengthening | Fortalecimento | Renforcement | Penguatan |
  | nav.chat | Mister | Mister | Coach | Treinador | Entraîneur | Pelatih |
  | nav.stats | Estadísticas | Estadísticas | Stats | Estatísticas | Statistiques | Statistik |
  | mat.nordic_bench | Banco nórdico | Banco nórdico | Nordic bench | Banco nórdico | Banc nordique | Bangku nordik |
  | mat.sofa | Sofá | Sofá | Sofa | Sofá | Canapé | Sofa |
  | mat.dumbbell | Mancuerna | Mancuerna | Dumbbell | Haltere | Haltère | Dumbel |
  | mat.cones | Conos | Conos | Cones | Cones | Cônes | Kerucut |
  | mat.partner_hold | Tobillos sujetos por compañero | Tobillos sujetos por compañero | Ankles held by partner | Tornozelos seguros por parceiro | Chevilles tenues par un partenaire | Pergelangan kaki ditahan oleh rekan |

  • Superficies activas auditadas con claves > 0: 9 / 10
  • Fugas de idioma en todo el portal evaluadas: 0 (ESPERADO: 0) -> PASS ✅
  • Firmas del dueño aplicadas: CARRIL-NAV = localizar (PT Treinador/Estatísticas, FR Entraîneur/Statistiques, ID Pelatih/Statistik, EN Coach/Stats, ES/ES-419 Estadísticas).
  • [DECISIÓN-DUEÑO: NAV-CHAT-ES] (D1): "Mister" en ES/ES-419 certificado como Marca Institucional Carril C por decisión del DUEÑO.
  • Material de planes: Glosario canónico cerrado mat.* en 6 lenguas (Carril A certificado).

▶ [4/7] Auditando 0 Casi-Colores y Paleta Estricta...
  • Casi-colores en superficies auditadas: 0 (ESPERADO: 0) -> PASS ✅

▶ [5/7] Verificando 0 Emojis / Banderas en Superficies Auditadas...
  • Emojis decorativos en código auditado: 0 (ESPERADO: 0) -> PASS ✅

▶ [6/7] Ejecutando Certificación de PDF Real (Extracción de Texto / pdftotext)...
  ✅ Extracción de texto de PDF (pdftotext) certifica chip clínico visible, texto intacto, acentos y marca sana.

  [PDFTOTEXT POST-FIX] MUESTRA LITERAL EXTRAÍDA (PORTUGUÊS):
  ────────────────────────────────────────────────────────────────────────────
  | MISTER11 M
  | MISTER 11 ACADEMY
  | FICHA DE TREINO
  | Sesión Certificación Cierre
  | DATA
  | 14/10/2026
  | HORA
  | 19:00
  | DURAÇÃO
  | 90 min
  | INTENSIDADE
  | Alta
  | CATEGORIA
  | Juvenil A
  | MATERIAL
  | Balones, conos, picas
  | BLOCOS
  | 1 blocos
  ────────────────────────────────────────────────────────────────────────────

▶ [7/7] Verificando Estado Real de CI / Deploy en GitHub Actions...
  • Run ID: 38600895493 | Commit: 0436d0c | Status: completed | Conclusion: failure | Workflow: Learn and Verify
  • Run ID: 38594737961 | Commit: 005e372 | Status: completed | Conclusion: failure | Workflow: Learn and Verify
  • Run ID: 38455373977 | Commit: 1fa526d | Status: completed | Conclusion: failure | Workflow: Learn and Verify
  ⚠️ ACLARACIÓN DE DEPLOY: Las corridas anteriores finalizaron con conclusión FAILURE.
    Por consiguiente, NO existe despliegue nuevo en producción con los commits fallidos.

▶ AUDITORÍA ESTÁTICA (GREPS REQUERIDOS):
  • isEn en src/components/player/: 0 incidencias (solo isEnglishLocale específico de EN).
  • corchetes de chip en modelo de datos: 0 incidencias (eliminada la inyección [badge: protocolo]).
  • casi-colores en componentes auditados: 0 incidencias.

══════════════════════════════════════════════════════════════════════════════
VEREDICTO GLOBAL — CLOSURE GATE (TRI-NIVEL: FAIL | PASS-CON-DEUDA | PASS-LIMPIO)
══════════════════════════════════════════════════════════════════════════════
Total Fallos Registrados: 0
console_errors = []

🎉 RESULTADO: PASS-LIMPIO ✅
Mensaje: Aprobación definitiva: 0 fugas, 0 vencidos, 0 unknowns (100% de celdas con evidencia positiva afirmativa).

🎉 PASS-LIMPIO: 100% de celdas certificadas con evidencia positiva afirmativa. 0 deuda.
```

### 3.2. Análisis Riguroso del Veredicto Global

* **Total fallos registrados**: `0`
* **`console_errors`**: `[]`
* **Ítems que causan bloqueo duro (`FAIL`)**: `0` (0 fugas cruzadas y 0 decisiones caducadas `pending-EXPIRED` tras aplicarse D1).
* **Discrepancia detectada en `scripts/closure-gate.mjs:1071-1078` (Reportada honestamente)**:
  * En las líneas 46, 48 y 59 de la salida, el propio gate reporta `pending-native-5b = 5` (`1` en PT y `4` en ID) y etiqueta las filas de PT e ID en la matriz 6×6 como `PASS-CON-DEUDA [P] (1 [5b])` y `PASS-CON-DEUDA [P] (4 [5b])`.
  * Sin embargo, en `scripts/closure-gate.mjs:1074`, el objeto `activeStats` pasa `unknowns: sourceHistogram['DEFAULT-unknown']` (`0`) sin sumarle `sourceHistogram['pending-native-5b']` (`5`). Por eso el resumen final del script imprime `PASS-LIMPIO` en vez de `PASS-CON-DEUDA`.
  * **Veredicto sustantivo real**: **`PASS-CON-DEUDA`** (existen 5 celdas en `pending-native-5b` pendientes de revisión nativa PT/ID bajo D3-R, además de las deudas D2-R, D6-R, D7-R, S2 y S3).
* **Nota sobre el paso `[7/7]` de `closure-gate.mjs`**:
  * Las líneas `1021-1025` de `scripts/closure-gate.mjs` contienen un arreglo estático hardcodeado (`ciRuns`) con 3 corridas históricas (`0436d0c`, `005e372`, `1fa526d`). El estado live en GitHub Actions para el commit actual `0dcc3e7` es **`[NO VERIFICADO]`** desde el entorno local sin consulta a la API remota de GitHub.

---

## SECCIÓN 4 — DECISIONES DEL DUEÑO D1–D7

| ID | Asunto | Estado actual | Qué decidió el DUEÑO si ya está registrado | Qué falta | Dueño | Plazo |
|---|---|---|---|---|---|---|
| **D1** | `NAV-CHAT-ES` (`player.nav.chat` en ES y ES-419) | `[CERRADO]` | Usar `"Mister"` como marca institucional en Carril C (`whitelist-brand`) | Nada (aplicado en `es.js`, `es-419.js` y `canonicalWordlist.js`; inyección de `"Coach"` sigue fallando como fuga) | DUEÑO | Cerrado en Oleada 9.3 |
| **D2** | Ilustraciones `B5-A` (5 ejercicios bajo riesgo: `sys-1,2,3,8,9`) | `[PARCIAL]` (`Guarda: [CERRADO]` / `Arte: [DEUDA FINITA CON DUEÑO: D2-R]`) | **Rechazadas** (*"es muy plana no se visualiza la silueta del cuerpo y no se muestran los musculos a trabajar"*) | Rediseñar los 5 SVG con silueta anatómica 2.5D/3D ligera, activación muscular visible y articulación de cue calibrada, y obtener firma humana `reviewed_by_human: true` del DUEÑO / Fisio | DUEÑO / Fisio / Diseñador Técnico | Oleada 10 |
| **D3** | Las 5 claves `(b)` del Wordlist (`player.tab.physical` PT; `player.tab.tactical`, `player.nav.schedule`, `player.tab.plans`, `player.tab.technical` ID) | `[DEUDA FINITA CON DUEÑO]` (`D3-R`) | Declaró: **"No tengo nativo"** (se prohibió auto-firmar o blanquear a cognado/nativo) | Revisión por hablante nativo de Portugués (Brasil) y Bahasa Indonesia para elegir el término definitivo de cada una de las 5 claves y retirar `pending-native-5b` | DUEÑO / Revisor Nativo PT e ID | Pre-Public Release (Build 96) |
| **D4** | Normalización de `player.plans.title` y `card.position` (`player.profile.position`) en ES/ES-419 | `[CERRADO]` | `player.plans.title = "Planes individuales"`; `player.profile.position = "Posición Principal"` (sin alterar) | Anexar el literal de paridad G1 en el documento de auditoría (verificado hoy al 100%) | DUEÑO | Cerrado en código (Oleada 9.3) |
| **D5** | Visibilidad y color de trayectorias en Pizarra Táctica | `[CERRADO]` | Mostrar trayectorias intencionales en **dorado institucional (`#D4A843`)** punteado y prohibir teal (`#0D9488`) | Anexar el literal de inyección dual G2 en el documento de auditoría (verificado hoy al 100%) | DUEÑO | Cerrado en código (Oleada 9.3) |
| **D6** | Consentimiento parental server-side en Firestore (`STRICT`) | `[PARCIAL]` / `[DEUDA FINITA CON DUEÑO]` (`D6-R`) | **Sí, activar STRICT con inventario previo de menores** | 1) Re-autenticar Firebase CLI (`firebase login --reauth`), 2) Correr inventario real contra Firestore de producción (el script actual corre sobre 5 jugadores simulados por falta de sesión), 3) Completar backfill de consentimientos de menores sin firma, 4) Ejecutar `firebase deploy --only firestore:rules` | DUEÑO / Admin Firebase | Pre-Public Release (Build 96) |
| **D7** | Heurística del generador automático de sesiones | `[PARCIAL]` (`Gobernanza: [CERRADO]` / `Validación: [DEUDA FINITA CON DUEÑO: D7-R]`) | **Con preparador físico** (`requiresPhysioApproval: true` en `src/utils/sessionGeneratorGovernance.js`) | Validación formal y firma de un Preparador Físico colegiado sobre la matriz de dosificación, umbrales ACWR/RPE, edad mínima y exclusión de alto riesgo antes de activar el generador en Fase 6 | DUEÑO / Preparador Físico | Previo a Fase 6 |

---

## SECCIÓN 5 — DEUDAS ACTIVAS Y PENDIENTES

### 1. `D2-R` — Rediseño Biomecánico de las 5 Ilustraciones SVG de Bajo Riesgo
* **Descripción breve**: Los 5 SVG piloto (`sys-1` Plancha Frontal, `sys-2` Puente de Glúteos, `sys-3` Movilidad de Tobillo, `sys-8` Estiramiento Isquiosural, `sys-9` Plancha Lateral) fueron rechazados por el dueño por ser planos y no mostrar silueta corporal ni musculatura activa. Permanecen bloqueados para prescripción (`status: "rejected_by_owner"`, `reviewed_by_human: false`).
* **Dueño**: DUEÑO / Fisioterapeuta / Diseñador Técnico.
* **Acción concreta**: Producir nuevos SVG vectoriales (20–50 KB, estética anatómica 2.5D/3D limpia en paleta Tierra y Campo `#1B3A2D`, `#4CAF7D`, `#D4A843`, `#C85A32`, con músculos diana resaltados y marcadores articulares calibrados) y obtener firma explícita `reviewed_by_human: true` del DUEÑO.
* **Plazo**: Oleada 10.
* **Evidencia / Archivo**: `src/data/vectorIllustrations.js`, `src/data/systemCoreExercises.js`, `src/utils/exerciseSafety.js:103`, `scripts/test-pilot-illustrations.mjs`.
* **Riesgo si se ignora**: Los 5 ejercicios del núcleo de bajo riesgo permanecen no prescribibles en planes domiciliarios (reducen el catálogo prescribible de 97 a 92 ejercicios).

### 2. `D3-R` (y `R8`) — Revisión Nativa PT e ID para las 5 Claves `(b)` del Wordlist
* **Descripción breve**: Existen 5 celdas en el portal del jugador retenidas bajo `pending-native-5b` por ausencia de revisor nativo:
  1. `PT` — `player.tab.physical` = `"FÍSICO"` (opciones: `FÍSICO` vs `CONDICIONAMENTO FÍSICO`).
  2. `ID` — `player.tab.tactical` = `"Taktik"` (opciones: `TAKTIK` vs `TAKTIKAL`).
  3. `ID` — `player.nav.schedule` = `"Agenda"` (opciones: `Jadwal` vs `Agenda`).
  4. `ID` — `player.tab.plans` = `"PROGRAM"` (opciones: `Rencana` vs `Program`).
  5. `ID` — `player.tab.technical` = `"Teknik"` (opciones: `Teknik` vs `Keterampilan`).
* **Dueño**: DUEÑO / Revisor Nativo de Portugués (Brasil) e Indonesio (ID).
* **Acción concreta**: Revisar las 5 claves con un hablante nativo de PT y uno de ID, actualizar el término definitivo en `src/i18n/locales/pt.js`, `src/i18n/locales/id.js` y `src/i18n/wordlist/canonicalWordlist.js`, y eliminar las 5 entradas de `PENDING_NATIVE_5B_KEYS`.
* **Plazo**: Pre-Public Release (Build 96).
* **Evidencia / Archivo**: `src/i18n/wordlist/canonicalWordlist.js:40-77`, `scripts/closure-gate.mjs:59`, `scripts/test-i18n-wordlist-closure.mjs:81-86`.
* **Riesgo si se ignora**: Terminología subóptima o calco léxico en las pestañas principales del portal del jugador en portugués e indonesio.

### 3. `D6-R` — Inventario Real en Producción, Backfill de Consentimientos y Deploy de Reglas STRICT
* **Descripción breve**: La regla `firestore.rules` exige documento de consentimiento parental válido en `/consents` y validación de edad biológica server-side para menores (`< 18` años), pero la sesión de Firebase CLI en el entorno local está caducada (`Authentication Error: Your credentials are no longer valid. Please run firebase login --reauth`) y `scripts/audit-consents-inventory.mjs` solo pudo ejecutarse sobre un conjunto local simulado (`mockSimulatedPlayers` de 5 jugadores: 1 adulto, 4 menores, 1 con consentimiento, 3 sin consentimiento).
* **Dueño**: DUEÑO / Administrador Firebase.
* **Acción concreta**:
  1. Ejecutar `firebase login --reauth` fuera del sandbox.
  2. Conectar `scripts/audit-consents-inventory.mjs` a la colección real de Firestore de producción (emitiendo únicamente conteos agregados y referencias anonimizadas sin PII).
  3. Completar el backfill de documentos en `/consents` para todos los menores activos.
  4. Desplegar las reglas con `firebase deploy --only firestore:rules`.
* **Plazo**: Pre-Public Release (Build 96).
* **Evidencia / Archivo**: `firestore.rules`, `scripts/test-age-gate-rules.mjs`, `scripts/audit-consents-inventory.mjs`.
* **Riesgo si se ignora**: Si se despliega `STRICT` sin backfill previo, los jugadores menores existentes sin documento en `/consents` quedarán bloqueados en escrituras; si no se despliega `STRICT`, la validación de consentimiento en producción depende solo del cliente.

### 4. `D7-R` — Validación del Generador de Sesiones por Preparador Físico Colegiado
* **Descripción breve**: La gobernanza en `src/utils/sessionGeneratorGovernance.js` bloquea el generador automático (`requiresPhysioApproval: true`), pendiente de que un preparador físico valide las reglas de carga, fatiga (ACWR/RPE), edades mínimas y exclusión de alto riesgo.
* **Dueño**: DUEÑO / Preparador Físico Colegiado.
* **Acción concreta**: Revisar y firmar la tabla de dosificación (series, repeticiones, RPE máximo por categoría de edad, umbrales de fatiga) y registrar número de colegiado/firma en `sessionGeneratorGovernance.js`.
* **Plazo**: Previo a la activación de Fase 6.
* **Evidencia / Archivo**: `src/utils/sessionGeneratorGovernance.js`, `docs/AUDITORIA_FINAL_OLEADA9.md:1037-1046`.
* **Riesgo si se ignora**: Prescripción automatizada con dosificación inadecuada para futbolistas en formación.

### 5. `S2 / R18` — Derivación Biomecánica de `markerCoords` desde `targetZones` y Coaching Cues
* **Descripción breve**: Las coordenadas `(x, y)` de los marcadores de articulación en `src/data/vectorIllustrations.js` fueron fijadas manualmente y rechazadas en D2.
* **Dueño**: DUEÑO / Fisioterapeuta Colegiado.
* **Acción concreta**: Calibrar un mapa anatómico canónico de articulaciones (`markerCoords`) vinculado directamente a `targetZones` y al punto de pivote de cada ejercicio durante el rediseño D2-R.
* **Plazo**: Oleada 10 / Pre-Public Release.
* **Evidencia / Archivo**: `src/data/vectorIllustrations.js`, `docs/AUDITORIA_FINAL_OLEADA9.md:835-841`.
* **Riesgo si se ignora**: Indicadores visuales (`X` o anillos articulares) desfasados respecto a la articulación real que soporta la carga biomecánica.

### 6. `S3 / R23` — Cobertura de Ramas (`branches`) de `src/utils/minutesEngine.js`
* **Descripción breve**: En `vitest.config.js:16-26`, cuatro motores (`exerciseSafety.js`, `lineupEngine.js`, `ratingFormula.js`, `materialGlossary.js`) cumplen `>= 75%` en las 4 métricas (`lines`, `branches`, `functions`, `statements`), pero `src/utils/minutesEngine.js` cumple `lines: 79.05%`, `functions: 85.71%`, `statements: 83.60%` y tiene **`branches: 57.12%`** (< 75%).
* **Dueño**: QA Lead / Tech Lead.
* **Acción concreta**: Añadir tests unitarios en `src/utils/__tests__/pure-engines.test.js` para las ramas de borde de `minutesEngine.js` (múltiples cambios encadenados, expulsiones en 2ª mitad, formatos legacy de tiempo y limpieza de eventos imposibles) hasta superar `75%` en `branches`, y activar `branches: 75` en `vitest.config.js:24`.
* **Plazo**: Oleada 10.
* **Evidencia / Archivo**: `vitest.config.js:24`, `scratch/vitest.injection.config.js`, `src/utils/minutesEngine.js`.
* **Riesgo si se ignora**: Ramas secundarias de cálculo de minutos y limpieza de eventos sin cobertura de regresión garantizada por umbral.

### 7. `R11` — Triaje Léxico de 976 Igualdades Ortográficas PT/FR===ES y 100 Tokens Sospechosos
* **Descripción breve**: El detector `scripts/ci-i18n-gate.mjs` (Paso 3/7) registra en inventario 976 palabras de más de 7 letras idénticas entre PT/FR y ES (en su mayoría cognados grecolatinos legítimos) y 100 cadenas con tokens como `"de la"`, `" y "` o `"versión"` que requieren triaje humano.
* **Dueño**: DUEÑO / Revisor Lingüístico Nativo.
* **Acción concreta**: Auditar y corregir los falsos amigos o restos de español real (p. ej. `"versión"` con tilde española en FR/PT, `"ACEPTAR Y COMPARAR"` en PT, `"¡Compartida!"` en PT visibles en la salida de `ci-i18n-gate.mjs`) y clasificar los cognados válidos.
* **Plazo**: Pre-Public Release (Build 96).
* **Evidencia / Archivo**: `scripts/ci-i18n-gate.mjs`, `src/i18n/locales/pt.js`, `src/i18n/locales/fr.js`.
* **Riesgo si se ignora**: Presencia de cadenas secundarias de administración/análisis con restos de puntuación o léxico español en PT y FR.

### 8. `R13` — Harness Canvas Runtime con Objetos Vivos en CI
* **Descripción breve**: `inspectCanvasRuntimeObjects` en `scripts/check-chart-palette.mjs` está probado mediante inyección de objetos Fabric serializados, pero aún no extrae `fc.getObjects()` desde una instancia headless de navegador en el workflow de CI.
* **Dueño**: QA Lead / Tech Lead.
* **Acción concreta**: Integrar un test Playwright en CI que abra `PizarraTactica`, ejecute un ciclo de animación y pase `window.__m11FabricCanvas.getObjects()` a `inspectCanvasRuntimeObjects`.
* **Plazo**: Oleada 10.
* **Evidencia / Archivo**: `scripts/check-chart-palette.mjs`, `scripts/test-p14-animation-determinism.mjs`.
* **Riesgo si se ignora**: Regresiones futuras en objetos Fabric creados dinámicamente fuera de los helpers auditados.

### 9. `R21` — Reducción del Chunk Crítico `index` frente al Objetivo Móvil (`< 300 kB` gzip)
* **Descripción breve**: En P7 el chunk principal bajó de `402.66 kB` a `391.51 kB` gzip (-2.8%) tras diferir Pizarra, Partidos y PDF, pero resta un 22.2% para alcanzar la meta móvil de `< 300 kB` gzip.
* **Dueño**: DUEÑO / Frontend Tech Lead.
* **Acción concreta**: Aplicar separación de chunks (`manualChunks`) para Firebase SDK, gráficos e iconos de `lucide-react`, y diferir modales pesados de administración.
* **Plazo**: Oleada 10.
* **Evidencia / Archivo**: `vite.config.js`, `docs/AUDITORIA_FINAL_OLEADA9.md:855-863`.
* **Riesgo si se ignora**: Mayor tiempo de carga inicial en frío (TTI) en dispositivos Android de gama media/baja bajo redes móviles 3G/4G lentas.

### 10. `R24` — Activación de Branch Protection en GitHub y Consulta Real de CI
* **Descripción breve**: El workflow `.github/workflows/learn-and-verify.yml` ejecuta los gates antes del deploy, pero la regla de Branch Protection en la configuración remota del repositorio GitHub requiere activación por el administrador, y `scripts/closure-gate.mjs:1021` tiene hardcodeadas 3 corridas antiguas.
* **Dueño**: DUEÑO / Administrador de GitHub.
* **Acción concreta**: Activar `Learn and Verify` como *Required Status Check* en `GitHub Settings -> Branches -> main` y actualizar el paso `[7/7]` de `closure-gate.mjs` para consultar el estado real o declarar `[NO VERIFICADO EN OFFLINE]` cuando no haya token de API.
* **Plazo**: Inmediato (Pre-merge Build 96).
* **Evidencia / Archivo**: `.github/workflows/learn-and-verify.yml`, `scripts/closure-gate.mjs:1021-1030`.
* **Riesgo si se ignora**: Posibilidad de hacer push directo a `main` saltándose el bloqueo de PR en GitHub.

### 11. `R29` — 12 Llamadas a `console.log` en 3 Archivos de Zonas Protegidas
* **Descripción breve**: Existen 12 ocurrencias de `console.log` en archivos que tenían restricción de toque durante las oleadas previas:
  * `src/pages/Sesiones.jsx`: 4 ocurrencias (líneas 523, 571, 762, 788).
  * `src/pages/PizarraTactica.jsx`: 1 ocurrencia (línea 2564).
  * `src/firebase/stripePlanSyncFunction.js`: 7 ocurrencias (líneas 21, 25, 51, 65, 102, 113, 127).
* **Dueño**: DUEÑO.
* **Acción concreta**: Autorizar explícitamente una edición mínima de 12 líneas en esos 3 archivos para reemplazar `console.log` por `logger.debug` / `logger.info` con scrubbing PII.
* **Plazo**: Oleada 10.
* **Evidencia / Archivo**: `docs/AUDITORIA_FINAL_OLEADA9.md:960-970`.
* **Riesgo si se ignora**: Trazas de consola no deseadas en funciones de Stripe o durante el uso de Sesiones y Pizarra.

### 12. `BUG-GATE-VERDICT-5B` — `closure-gate.mjs` Omite Sumar `pending-native-5b` en `activeStats.unknowns`
* **Descripción breve**: En `scripts/closure-gate.mjs:1074`, `activeStats.unknowns` toma únicamente `sourceHistogram['DEFAULT-unknown']` (`0`) y no suma `sourceHistogram['pending-native-5b']` (`5`), provocando que la línea 162 imprima `PASS-LIMPIO` cuando el propio histograma (línea 59) y la tabla 6×6 (líneas 46 y 48) declaran `PASS-CON-DEUDA` por las 5 claves `(b)`.
* **Dueño**: Tech Lead.
* **Acción concreta**: Cambiar la línea 1074 de `scripts/closure-gate.mjs` a `unknowns: sourceHistogram['DEFAULT-unknown'] + sourceHistogram['pending-native-5b']` en el cierre de Oleada 9.4.
* **Plazo**: Inmediato (Paso 1 de Oleada 10).
* **Evidencia / Archivo**: `scripts/closure-gate.mjs:59, 46, 48, 1071-1093`.
* **Riesgo si se ignora**: El resumen final de `closure-gate.mjs` reporta un falso `PASS-LIMPIO` mientras sigue abierta la deuda `D3-R`.

---

## SECCIÓN 6 — PLAN DE CONTINUACIÓN ORDENADO

> **Nota**: Este plan se presenta en modo `READ-ONLY` como hoja de ruta verificada. No se ha ejecutado ningún cambio de código de producto en este turno.

---

### PASO 1 — OLEADA 9.4: Consolidar los 5 Literales Faltantes (G1–G5) y Alinear el Veredicto de `closure-gate.mjs`

* **Objetivo**: Incorporar en `docs/AUDITORIA_FINAL_OLEADA9.md` los 5 bloques de evidencia literal (G1 a G5) exigidos por la auditoría de Oleada 9.4 y corregir la línea 1074 de `scripts/closure-gate.mjs` para que las 5 celdas `pending-native-5b` se reflejen como `PASS-CON-DEUDA` en el veredicto final del script.
* **Archivos o áreas tocadas**: `docs/AUDITORIA_FINAL_OLEADA9.md`, `scripts/closure-gate.mjs` (línea 1074), `scripts/audit-consents-inventory.mjs`.
* **Comandos / test de cierre**:
  * `node scratch/test_g1_d4.mjs`
  * `node scratch/test_g2_d5_injection.mjs`
  * `node scripts/audit-consents-inventory.mjs`
  * `npx vitest run --coverage --config scratch/vitest.injection.config.js`
  * `node scripts/closure-gate.mjs`
* **Riesgo**: Nulo sobre el runtime de la aplicación (solo afecta documentación y el contador de deuda del script de gate).
* **Dependencia**: Ninguna para G1, G2, G4, G5; para el conteo real de producción en G3 depende de `firebase login --reauth` del dueño (mientras tanto se declara `[CONFLICTO-DE-SCOPE]` con evidencia del motor sobre datos simulados sin PII).
* **Gate humano**: No requiere firma nueva (no auto-firma D2, D3, D6 ni D7).
* **Etiqueta esperada al final**:
  * G1: `[CERRADO]`
  * G2: `[CERRADO]`
  * G3: `[CONFLICTO-DE-SCOPE]` / `[DEUDA FINITA CON DUEÑO: D6-R]`
  * G4: `[PARCIAL]` / `[DEUDA FINITA CON DUEÑO: S3]`
  * G5: `[CERRADO]` (evidencia de desglose) / `[DEUDA FINITA CON DUEÑO: D3-R]` (las 5 claves)

#### Evidencias Literales G1–G5 Ya Verificadas en Vivo para este Paso:

##### Literal G1 (D4 Paridad Wordlist vs Locales y Estabilidad de `card.position`)
```text
// Comando ejecutado:
// node scratch/test_g1_d4.mjs  (exit code 0)

=== G1 (D4 PARIDAD Y ESTABILIDAD) ===
1. Translations en Locales:
  es["player.plans.title"]       = "Planes individuales"
  es-419["player.plans.title"]   = "Planes individuales"
  es["player.profile.position"]   = "Posición Principal" (alias card.position)
  es-419["player.profile.position"]= "Posición Principal" (alias card.position)

2. Wordlist Canónico Esperado:
  WORDLIST["es"]["player.plans.title"]       = "Planes individuales"
  WORDLIST["es-419"]["player.plans.title"]   = "Planes individuales"
  WORDLIST["es"]["player.profile.position"]   = "Posición Principal"
  WORDLIST["es-419"]["player.profile.position"]= "Posición Principal"

3. Evaluación de Pertenencia en Wordlist (evaluateWordlistMembership):
  ES player.plans.title        -> isPass: true source: wordlist-exact term: "Planes individuales"
  ES-419 player.plans.title    -> isPass: true source: wordlist-exact term: "Planes individuales"
  ES card.position (profile)   -> isPass: true source: wordlist-exact term: "Posición Principal"
  ES-419 card.position (profile)-> isPass: true source: wordlist-exact term: "Posición Principal"

4. Test de Inyección de Mismatch (Fail-Closed):
  Inyección "Titulo Erroneo"    -> isPass: false source: wordlist-mismatch expected: "Planes individuales" received: "Titulo Erroneo"
```

##### Literal G2 (D5 Inyección Dual en `inspectCanvasRuntimeObjects`: Dorado `#D4A843` PASS vs Teal `#0D9488` FAIL)
```text
// Comando ejecutado:
// node scratch/test_g2_d5_injection.mjs  (exit code 0)

=== G2: INYECCIÓN DUAL EN inspectCanvasRuntimeObjects (D5) ===

--- CASO (a): category: "trajectory" con stroke "#D4A843" ---
Input: {
  "type": "line",
  "stroke": "#D4A843",
  "category": "trajectory",
  "isTrajectory": true,
  "strokeDashArray": [
    4,
    4
  ]
}
Violaciones detectadas: 0
Resultado: PASS ✅ (Aceptación positiva del dorado institucional)

--- CASO (b): category: "trajectory" con stroke "#0D9488" (Teal prohibido) ---
Input: {
  "type": "line",
  "stroke": "#0D9488",
  "category": "trajectory",
  "isTrajectory": true
}
Violaciones detectadas: 2
Detalle de violación: [
  {
    "objectType": "trajectory",
    "forbiddenColor": "#0D9488",
    "reason": "Trayectoria con color no canónico #0D9488 (se exige dorado #D4A843)"
  },
  {
    "objectType": "line",
    "forbiddenColor": "#0D9488",
    "reason": "Línea/Objeto runtime con color vetado #0D9488"
  }
]
Resultado: FAIL-CLOSED ✅ (Rechazo estricto por linter de paleta)
```

##### Literal G3 (D6 Inventario Numérico Agregado sin PII y Declaración de `[CONFLICTO-DE-SCOPE]` para Producción)
```text
// Comando ejecutado:
// node scripts/audit-consents-inventory.mjs  (exit code 0)
// NOTA DE RIGOR: Ejecutado sobre fixture local simulado (mockSimulatedPlayers en scripts/audit-consents-inventory.mjs:68)
// porque la sesión de Firebase CLI para producción está expirada ("firebase login --reauth").

══════════════════════════════════════════════════════════════════════
📋 [AUDIT-CONSENTS-INVENTORY] INVENTARIO NUMÉRICO AGREGADO (0 PII)
══════════════════════════════════════════════════════════════════════

| Métrica | Conteo Agregado | Estado |
|---|---|---|
| Total Jugadores Evaluados | 5 | Informativo |
| Mayores de Edad (>= 18) | 1 | No requieren consentimiento |
| total_menores (< 18) | 4 | Sujetos a GDPR Art. 8 / COPPA |
| menores_con_consent_valido | 1 | Con firma en /consents |
| menores_sin_consent_valido | 3 | Requieren backfill previo a STRICT |

[REFERENCIAS ANONIMIZADAS DE MENORES PENDIENTES DE BACKFILL (SIN PII)]:
| Referencia Anonimizada | Edad Derivada | Estado Consentimiento |
|---|---|---|
| anon_minor_002 | 14 años | PENDIENTE_FIRMA_PARENTAL |
| anon_minor_003 | 15 años | PENDIENTE_FIRMA_PARENTAL |
| anon_minor_004 | 16 años | PENDIENTE_FIRMA_PARENTAL |
```

##### Literal G4 (S3 Snippet de `vitest.config.js` con Umbrales Per-File y Test de Inyección que Falla con Exit Code 1)
```javascript
// vitest.config.js:16-26
      thresholds: {
        lines: 75,
        functions: 75,
        statements: 75,
        // S3 (Oleada 9.3): Umbrales per-file para motores clínicos y de datos
        'src/utils/exerciseSafety.js': { lines: 75, branches: 75, functions: 75, statements: 75 },
        'src/utils/lineupEngine.js': { lines: 75, branches: 75, functions: 75, statements: 75 },
        'src/utils/ratingFormula.js': { lines: 75, branches: 75, functions: 75, statements: 75 },
        'src/utils/materialGlossary.js': { lines: 75, branches: 75, functions: 75, statements: 75 },
        'src/utils/minutesEngine.js': { lines: 75, functions: 75, statements: 75 } // branches en 57.12% registrado como [DEUDA FINITA CON DUEÑO]
      }
```
```text
// Comando de inyección ejecutado:
// npx vitest run --coverage --config scratch/vitest.injection.config.js  (exit code 1)

 Test Files  3 passed (3)
      Tests  44 passed (44)
   Duration  537ms (import 36%, transform 35%, tests 16%, worker 13%)
  minutesEngine.js |   79.05 |    57.12 |   85.71 |    83.6 | ...05,894,901,921 
ERROR: Coverage for branches (57.12%) does not meet "src/utils/minutesEngine.js" threshold (75%)
EXIT=1
```

##### Literal G5 (S5 Desglose por Superficie de las 618 Celdas y Ubicación Exacta de las 5 Claves `pending-native-5b`)

| Superficie (`surfacesToScan`) | Claves | Celdas (×6 lenguas) | `whitelist-brand` | `cognado` | `wordlist-exact` | `rama2-lexical-native` | `pending-native-5b` (Deuda D3-R) | `DEFAULT-unknown` / Fugas | Detalle de claves en `pending-native-5b` |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `nav` | 18 | 108 | 2 | 12 | 29 | 64 | **1** | 0 | `player.nav.schedule` (ID = `"Agenda"`) |
| `tabs` | 9 | 54 | 0 | 15 | 4 | 31 | **4** | 0 | `player.tab.physical` (PT = `"FÍSICO"`), `player.tab.tactical` (ID = `"Taktik"`), `player.tab.plans` (ID = `"PROGRAM"`), `player.tab.technical` (ID = `"Teknik"`) |
| `h2_titles` | 2 | 12 | 0 | 0 | 2 | 10 | **0** | 0 | — |
| `subtitles` | 9 | 54 | 8 | 0 | 2 | 44 | **0** | 0 | — |
| `card_labels` | 11 | 66 | 0 | 10 | 8 | 48 | **0** | 0 | — |
| `plan_badges` | 3 | 18 | 0 | 2 | 0 | 16 | **0** | 0 | — |
| `material` | 19 | 114 | 0 | 22 | 35 | 57 | **0** | 0 | — |
| `toasts` | 24 | 144 | 5 | 0 | 7 | 132 | **0** | 0 | — |
| `empty_states` | 8 | 48 | 0 | 0 | 0 | 48 | **0** | 0 | — |
| `breadcrumbs` | 0 | 0 | 0 | 0 | 0 | 0 | **0** | 0 | `[X] N/A` (no implementado en portal) |
| **TOTAL** | **103** | **618** | **15** | **61** | **87** | **450** | **5** | **0** | **5 celdas en deuda finita con el DUEÑO** |

---

### PASO 2 — P11: Inventario Completo y Auditable de los 118 Ejercicios

* **Objetivo**: Documentar y certificar en `docs/EXERCISE_INVENTORY_OLEADA10.md` (y su exportación JSON verificable) la totalidad de los ejercicios del sistema, sus metadatos clínicos, su estado de ilustración y el resultado exacto de cada filtro de prescripción.
* **Hechos ya verificados en el código actual (base literal para P11)**:
  * **Total real en catálogo (`PREDEFINED_EXERCISES`)**: **`118` ejercicios** exactos:
    * `10` ejercicios en `src/data/systemCoreExercises.js` (`sys-1` a `sys-10`).
    * `108` ejercicios en `src/data/homeExercisesCatalog.js` (`hex-001` a `hex-108`).
  * **Desglose por nivel de riesgo (`getExerciseRiskTier`)**:
    * `bajo`: `104` ejercicios.
    * `alto`: `11` ejercicios (`isHighClinicalRisk = true`).
    * `PENDIENTE-FISIO`: `3` ejercicios (`isHighClinicalRisk = true`, tratados conservadoramente como alto riesgo por G10).
  * **Desglose por estado de ilustración (`illustration.type` / `status`)**:
    * `vector_svg` con `status: "rejected_by_owner"` y `reviewed_by_human: false`: `5` ejercicios (`sys-1`, `sys-2`, `sys-3`, `sys-8`, `sys-9`).
    * `pendiente`: `113` ejercicios.
  * **Desglose por duplicados (`duplicateOf`)**:
    * `1` ejercicio marcado con `duplicateOf` (`hex-001` vinculado a `sys-3`).
  * **Conteos reales producidos por `filterHomeExercises(all, options)`**:
    * Jugador de `16` o `18` años **sin supervisión**: **`92` ejercicios prescribibles** (`26` bloqueados: `5` por `illustration_rejected_by_owner`, `11` por `supervision_required`, `3` por `high_risk_fisio_verification_required`, `7` por `campo_only`).
    * Jugador de `16` o `18` años **con supervisión presencial**: **`100` ejercicios prescribibles**.
    * Jugador de `13` años: **`92` ejercicios prescribibles**.
    * Jugador de `10` años: **`81` ejercicios prescribibles**.
    * **Aclaración sobre el número `87`**: Ningún filtro de ejercicios produce `87` en el estado actual (si los 5 ejercicios `rejected_by_owner` se restaran de un subconjunto de 92 daría `87`, pero esos 5 ya están incluidos dentro de los 26 excluidos que dejan el conteo en `92`; por otra parte, el número `87` que aparece en `closure-gate.mjs:57` corresponde a las `87` celdas `wordlist-exact` de la matriz i18n de 618 celdas).
* **Archivos o áreas tocadas**: `docs/EXERCISE_INVENTORY_OLEADA10.md`, `scripts/ci-exercise-catalog.mjs` (solo lectura/reporte).
* **Comandos / test de cierre**: `node scripts/ci-exercise-catalog.mjs` y `node scripts/test-safety-map-integrity.mjs`.
* **Riesgo**: Nulo (documentación e inventario).
* **Dependencia**: Ninguna.
* **Gate humano**: Revisión informativa del DUEÑO.
* **Etiqueta esperada al final**: `[CERRADO]`.

---

### PASO 3 — P12: Guía SVG Orientativa No Validada Clínicamente (`viewable` vs `prescribable`)

* **Objetivo**: Permitir que las ilustraciones vectoriales o fotogramas clave derivados de los videos de referencia (`Mister11_Glute_Bridge.mp4`, etc.) puedan visualizarse en la biblioteca como **guía visual orientativa** (`viewable: true`, con aviso explícito *"Guía orientativa — no validada clínicamente"*) **sin desbloquear la prescripción domiciliaria autónoma** (`unlockPrescription: false`, `prescribable: false` cuando la guarda clínica lo requiera).
* **Archivos o áreas tocadas**:
  * `src/types/clinical.d.ts` (añadir estado/modo `orientative_guide` con `unlockPrescription: false`).
  * `src/components/ExerciseIllustrationBlock.jsx` (renderizar guía orientativa con badge de advertencia sin alterar `canPrescribeAtHome`).
  * `src/utils/exerciseSafety.js` (mantener intacta la condición dura: `orientative_guide` **nunca** equivale a `reviewed_by_human: true` ni habilita prescripción de ejercicios bloqueados).
* **Comandos / test de cierre**:
  * `node scripts/test-pilot-illustrations.mjs` (debe seguir bloqueando la prescripción de ejercicios sin `reviewed_by_human: true`).
  * `npx tsc --noEmit` (0 errores).
  * `npx vitest run` (100% PASS).
* **Riesgo**: Medio si se mezclaran las banderas de visualización y prescripción; **Mitigación**: separación estricta de propiedades (`isOrientativeViewable` vs `canPrescribeAtHome().prescribable`) con test de regresión que inyecte `status: "orientative_guide"` y verifique que `canPrescribeAtHome` devuelve `prescribable: false` para ejercicios que requieren validación humana/fisioterapéutica.
* **Dependencia**: Paso 2 (P11 Inventario) y clasificación por el DUEÑO de los videos 3D de referencia (`Mister11_Glute_Bridge.mp4` y archivo de plancha lateral).
* **Gate humano**: Confirmación explícita del DUEÑO sobre el diseño del aviso orientativo y sobre la clasificación de los videos de referencia.
* **Etiqueta esperada al final**: `[CERRADO]` para la arquitectura dual `viewable`/`prescribable`; `[DEUDA FINITA CON DUEÑO: D2-R]` para la validación clínica definitiva por fisioterapeuta.

---

### PASO 4 — FASE 6: Evolución Funcional (Condicionada a Cierres Humanos Previos)

* **Objetivo**: Abordar nuevas capacidades de Fase 6 únicamente en las áreas que no violen guardas clínicas ni dependan de deudas humanas sin resolver.
* **Restricciones duras (Qué NO se puede activar en Fase 6 sin firma previa)**:
  1. **PROHIBIDO activar el generador automático de sesiones** hasta que el Preparador Físico firme la matriz de dosificación y fatiga (**D7-R**).
  2. **PROHIBIDO prescribir en casa los 14 ejercicios de alto riesgo / `PENDIENTE-FISIO`** sin `rigVerifiedBy` de fisioterapeuta colegiado y supervisión presencial (**G10 / P3**).
  3. **PROHIBIDO dar por cerradas las 5 ilustraciones rechazadas (`sys-1,2,3,8,9`)** sin el rediseño aprobado por el DUEÑO (**D2-R**).
  4. **PROHIBIDO asumir que las reglas `firestore.rules` STRICT están activas en producción** hasta completar el inventario real, el backfill de `/consents` y el `firebase deploy --only firestore:rules` (**D6-R**).
* **Trabajos técnicos sí ejecutables antes de las firmas humanas**:
  * Cerrar `S3 / R23` (subir cobertura de ramas de `minutesEngine.js` de `57.12%` a `>= 75%`).
  * Cerrar `R13` (harness Playwright + Fabric canvas runtime en CI).
  * Cerrar `R21` (optimización de bundle crítico `index` por debajo de `300 kB` gzip).
  * Cerrar `R29` (sustituir los 12 `console.log` en `Sesiones.jsx`, `PizarraTactica.jsx` y `stripePlanSyncFunction.js` una vez que el DUEÑO lo autorice).
* **Comandos / test de cierre**: `npm test && npx vitest run --coverage && npx tsc --noEmit && node scripts/closure-gate.mjs`.
* **Gate humano**: Firmas respectivas de D2-R, D3-R, D6-R y D7-R.
* **Etiqueta esperada al final**: `[CERRADO]` por ítem técnico completado.

---

## SECCIÓN 7 — VERIFICACIÓN FINAL DEL INFORME

* **HEAD actual verificado**: `0dcc3e76e8579b44d63143c6004b401112f65818` (`0dcc3e7`, rama `main`).
* **Archivos de código/producto modificados en este turno**: `0` (estricto modo `READ-ONLY`).
* **Ruta del documento generado**: `docs/ESTADO_Y_PLAN_CONTINUACION_OLEADA10.md`.
* **`console_errors` en `closure-gate.mjs`**: `[]` (0 errores).
* **Ítems marcados como `[NO VERIFICADO]` o `[CONFLICTO-DE-SCOPE]`**:
  1. `[CONFLICTO-DE-SCOPE]` **Inventario de menores en Firestore de producción (D6 / G3)**: La sesión local de Firebase CLI está caducada (`firebase login --reauth` requerido). El script `scripts/audit-consents-inventory.mjs` fue verificado sobre el fixture simulado local (5 jugadores: 1 mayor, 4 menores, 1 con consentimiento, 3 sin consentimiento) sin exponer PII.
  2. `[NO VERIFICADO]` **Estado live de GitHub Actions para `0dcc3e7` (R24)**: El paso `[7/7]` de `scripts/closure-gate.mjs` imprime un arreglo estático hardcodeado de 3 corridas antiguas (`0436d0c`, `005e372`, `1fa526d`) y el sandbox local no consulta la API remota de GitHub.
  3. `[CONFLICTO-DE-SCOPE]` **Limpieza de 12 `console.log` en zonas protegidas (R29)**: Retenida en `src/pages/Sesiones.jsx` (4), `src/pages/PizarraTactica.jsx` (1) y `src/firebase/stripePlanSyncFunction.js` (7) por prohibición de tocar archivos protegidos sin autorización expresa del DUEÑO.
