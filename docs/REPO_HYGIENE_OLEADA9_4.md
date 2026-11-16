# MÍSTER11 — INVENTARIO Y CLASIFICACIÓN DE HIGIENE DE REPOSITORIO (OLEADA 9.4)

* **Fecha**: `2026-11-16T20:30:00+01:00`
* **Modo**: Clasificación e inventario sin borrado ni movimiento de archivos (`0 git rm`, `0 rm`, `0 mv`).
* **Regla de PII**: Ningún contenido de PDF con posible información real es revelado; se etiqueta preventivamente como `[POSIBLE_PII_NO_REVELADA]`.

---

## 1. LISTADOS LITERALES DEL ÁRBOL DE ARCHIVOS

### 1.1. `$ git status --short`
```text
 M docs/AUDITORIA_FINAL_OLEADA9.md
 M scripts/closure-gate.mjs
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

### 1.2. `$ Get-ChildItem scratch -Name`
```text
screenshots
add_landing_keys.cjs
add_schedule_and_plans_keys.cjs
all_exercises_dump.json
all_pricing_keys.json
analyze_es419_unknowns.mjs
analyze_h15_36_keys.mjs
analyze_unknowns_and_cognates.mjs
analyze_unknowns_tria.mjs
apply_i18n_cleanup.mjs
apply_i18n_cleanup_batch2.mjs
apply_p1_p3_cleanups.cjs
apply_p3_translations.cjs
apply_portal_fixes.mjs
apply_pricing_and_pdf_keys.cjs
audit_player_portal_live.cjs
audit_player_portal_suite.cjs
audit_portal_toasts_empty.mjs
audit_pricing.cjs
audit_pricing_and_extract_dom.mjs
audit_suite_cierre.mjs
build_audit_complete.cjs
build_catalog_md.js
captured_outputs.json
capture_frame.js
check_ci_runs.mjs
check_fr_en.mjs
check_fr_foreign_en.mjs
check_pt_rings.mjs
check_reconcile.mjs
compare_safety_map.mjs
current_prompt.txt
demo_micro_loop_vectorial.html
diagnose_cross_detections.mjs
diagnose_pizarra_animation.mjs
dump_pricing.cjs
execute_audit.cjs
extract_frames.html
extract_session_text.mjs
fetch_fonts.cjs
find_player_keys.mjs
find_pricing_issues.cjs
find_subtitles.mjs
fix_assert_test.cjs
fix_banner_commas.cjs
fix_chip_exact.cjs
fix_clinical_chip.cjs
fix_pdf_brand.cjs
fix_portal_i18n_keys.cjs
fix_reg1.mjs
full_user_prompt.txt
gemini_generated_video_4d797787.mp4
gemini_generated_video_8efaa77d.mp4
generate_full_audit.cjs
generate_tria.mjs
glute_bridge_frame.png
insert_exercise_level.cjs
insert_game_keys.cjs
inspect_en_unknowns.mjs
inspect_pt_pdf.mjs
inspect_unknowns.mjs
patch_assert_age_safe.cjs
patch_assert_regex.cjs
patch_audit.cjs
patch_canonical_guides.cjs
patch_clinical_chip.cjs
patch_closure_gate.mjs
patch_exercise_library.cjs
patch_final_emojis.cjs
patch_hex001_duplicate.cjs
patch_landing_selector.cjs
patch_landing_table_headers.cjs
patch_localized_exercise.cjs
patch_player_leaderboard.cjs
patch_player_plans_is_en.cjs
patch_player_profile_autosave.cjs
patch_player_schedule_is_en.cjs
patch_player_stats_is_en.cjs
patch_remaining_player_stats_is_en.cjs
patch_r_items.cjs
print_all_pricing.cjs
print_pricing_dom.mjs
print_pricing_dom_exact.mjs
raw_dom_evidence.json
register_all_used_keys.cjs
register_banner_keys.cjs
register_sync_keys.cjs
replace_dispatch.cjs
run_certified_e2e.mjs
run_full_live_audit.cjs
run_gate_diagnostic.mjs
run_live_dom_audit.cjs
run_player_portal_audit_complete.cjs
test_618_sources.mjs
test_cognate_cleanup.mjs
test_detector.mjs
test_differential_plans.mjs
test_fabric_check.mjs
test_full_matrix_after_h24.mjs
test_g1_d4.mjs
test_g2_d5_injection.mjs
test_gate_clean.mjs
test_h14_h17.mjs
test_h20.mjs
test_matrix.mjs
test_p14_reproduction.mjs
test_player_tabs_live.cjs
test_reviewer_login.cjs
tria_table.md
unknowns_dump.json
verify_clinical_chip.mjs
verify_plans_scoping.mjs
view_reference_video.html
vitest.injection.config.js
```

### 1.3. `$ Get-ChildItem docs -Name`
```text
auditoria-modulos
pdf
release
ARCHITECTURE.md
AUDITORIA_FINAL_OLEADA9.md
backlog-h2.md
backlog.md
CATALOGO_PROMPTS_VIDEOS_MISTER11.md
CHECKLIST_IMPLEMENTACION.md
ESTADO_Y_PLAN_CONTINUACION_OLEADA10.md
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
```

### 1.4. `$ Get-ChildItem . -Filter *.pdf -Name` (y en `scripts/`)
```text
DIARIO_ENTRENADOR_SEMANA_MISTER11.pdf
FIRMA_APK.pdf
INFORME_AUDITORIA_GLOBAL_MISTER11.pdf
INFORME_AUDITORIA_MISTER11.pdf
INFORME_EJECUTIVO_MISTER11_COMPETENCIA.pdf
INFORME_PRUEBA_ENTRENADOR.pdf
INFORME_PRUEBA_ENTRENADOR_COMPLETO.pdf
INFORME_TECNICO_MISTER11.pdf
Sesion_Sesion_20261006.pdf
Sesion_Sesion_20261014.pdf
scripts/Sesion_Sesion_20261014.pdf
```

### 1.5. `$ Get-ChildItem . -Filter *.mp4 -Recurse -Name` (excluyendo `node_modules`)
```text
WhatsApp Video 2026-08-23 at 10.46.01 AM.mp4
scratch\gemini_generated_video_4d797787.mp4
scratch\gemini_generated_video_8efaa77d.mp4
C:\Users\jhojan\.gemini\antigravity\brain\fdc2c3b1-7b99-42ac-a604-1936ce8fcf0b\.user_uploaded\media_1794255681140_af45ccb9.mp4 (Mister11_Glute_Bridge.mp4)
```

### 1.6. `$ Get-ChildItem . -Filter *.png -Recurse -Name` (en raíz y `scratch/`)
```text
.\mobile.png
.\tablet.png
.\scratch\glute_bridge_frame.png
.\scratch\screenshots\01_landing_pt.png
.\scratch\screenshots\02_landing_fr.png
.\scratch\screenshots\03_landing_id.png
.\scratch\screenshots\04_staff_roles.png
.\scratch\screenshots\05_pizarra_pt.png
.\scratch\screenshots\06_pizarra_fr.png
.\scratch\screenshots\07_clinical_fallback_chip_pt.png
.\scratch\screenshots\07_clinical_fallback_chip_visible.png
.\scratch\screenshots\08_convocatoria_carril_c.png
.\scratch\screenshots\carril_c_convocatoria_fr.png
.\scratch\screenshots\carril_c_convocatoria_pt.png
.\scratch\screenshots\clinical_fallback_chip_fr.png
.\scratch\screenshots\clinical_fallback_chip_pt.png
.\scratch\screenshots\landing_fr.png
.\scratch\screenshots\landing_id.png
.\scratch\screenshots\landing_pt.png
.\scratch\screenshots\pizarra_fr.png
.\scratch\screenshots\pizarra_pt.png
.\scratch\screenshots\roles_staff_clean.png
.\scratch-screenshots\shotmodal_chips_Desktop__1280x800__dark.png
.\scratch-screenshots\shotmodal_chips_Desktop__1280x800__light.png
.\scratch-screenshots\shotmodal_chips_Mobile__360x640__dark.png
.\scratch-screenshots\shotmodal_chips_Mobile__360x640__light.png
```

---

## 2. TABLA MAESTRA DE CLASIFICACIÓN DE HIGIENE DE REPOSITORIO

| Ruta | Tipo | Contenido probable | ¿Es evidencia oficial? | ¿Contiene posible PII/datos reales? | ¿Contiene video/imagen posiblemente IA o externa? | Destino propuesto | Acción segura |
|---|---|---|---|---|---|---|---|
| `scratch/test_g1_d4.mjs` | Script ESM (`.mjs`) | Test de paridad D4 (`player.plans.title` = `"Planes individuales"` y `player.profile.position` = `"Posición Principal"`) e inyección fail-closed (Evidencia G1) | Sí (Evidencia G1 Oleada 9.4) | No | No | `MOVER_A_SCRIPTS` | Conservar intacto; ya anexada su salida literal en `docs/AUDITORIA_FINAL_OLEADA9.md` |
| `scratch/test_g2_d5_injection.mjs` | Script ESM (`.mjs`) | Test de inyección dual en `inspectCanvasRuntimeObjects`: trayectoria dorada `#D4A843` PASS y línea teal `#0D9488` FAIL-CLOSED (Evidencia G2) | Sí (Evidencia G2 Oleada 9.4) | No | No | `MOVER_A_SCRIPTS` | Conservar intacto; ya anexada su salida literal en `docs/AUDITORIA_FINAL_OLEADA9.md` |
| `scratch/vitest.injection.config.js` | Configuración Vitest (`.js`) | Configuración de inyección de umbral `branches: 75` para `src/utils/minutesEngine.js` que demuestra caída del gate con exit code 1 al estar en `57.12%` (Evidencia G4) | Sí (Evidencia G4 Oleada 9.4) | No | No | `MOVER_A_SCRIPTS` | Conservar intacto para verificación reproducible de S3/G4 |
| `scripts/audit-consents-inventory.mjs` | Script ESM (`.mjs`) | Motor de inventario numérico agregado de menores y consentimientos parentales con 0 PII y referencias anonimizadas (Evidencia G3) | Sí (Evidencia G3 Oleada 9.4) | No (Cero PII por diseño) | No | `MOVER_A_SCRIPTS` | Ya ubicado en `scripts/`; mantener para conectar a Firestore de producción cuando el DUEÑO ejecute `firebase login --reauth` |
| `docs/CATALOGO_PROMPTS_VIDEOS_MISTER11.md` | Documento Markdown (`.md`) | Catálogo completo de los 118 ejercicios (`sys-1..10` + `hex-001..108`) con sus IDs y nombres exactos en 24 bloques de 5 y prompts de referencia | Candidato a base de inventario P11 | No | No (Solo texto descriptivo) | `MOVER_A_DOCS_EVIDENCE` | Mantener en `docs/`; usar como insumo para generar `docs/EXERCISE_INVENTORY_OLEADA10.md` en P11 |
| `Sesion_Sesion_20261006.pdf` | Archivo PDF | PDF de sesión generado durante pruebas locales; no auditado su texto interno en este paso por precaución de privacidad | No | `[POSIBLE_PII_NO_REVELADA]` | No | `REVISAR_PII` | No commitear a Git; revisar con el DUEÑO si contiene nombres reales de jugadores/equipo antes de borrar o añadir a `.gitignore` |
| `Sesion_Sesion_20261014.pdf` | Archivo PDF | PDF de sesión generado por el test de certificación `closure-gate.mjs` / `assert-test-pdf.mjs` (`Sesión Certificación Cierre`, fecha `14/10/2026`) | Temporal de test | `[POSIBLE_PII_NO_REVELADA]` | No | `REVISAR_PII` | No commitear; añadir patrón `Sesion_Sesion_*.pdf` a `.gitignore` (`IGNORAR_GITIGNORE`) tras revisión del DUEÑO |
| `scripts/Sesion_Sesion_20261014.pdf` | Archivo PDF | Copia generada dentro de `scripts/` durante ejecución de pruebas de PDF (`14/10/2026`) | Temporal de test | `[POSIBLE_PII_NO_REVELADA]` | No | `REVISAR_PII` | No commitear; mantener sin rastrear hasta autorización de limpieza |
| `.user_uploaded/media_1794255681140_af45ccb9.mp4` (`Mister11_Glute_Bridge.mp4`) | Video MP4 (2.52 MB) | Video 3D de referencia de Puente de Glúteos (`sys-2`) subido por el usuario como modelo visual de maniquí anatómico verde con anillos dorados | Referencia de estilo del DUEÑO (pendiente P12) | No | Sí (Video 3D generado por IA) | `NO_USAR_COMO_ACTIVO_OFICIAL` | Fuera del repo Git (en directorio de sesión); no empaquetar en el bundle de la app ni usar para desbloquear prescripción clínica hasta clasificación en P12 |
| `scratch/gemini_generated_video_4d797787.mp4` | Video MP4 (2.43 MB) | Video generado por IA externa en pruebas previas de animación biomecánica | No | No | Sí (Procedencia IA externa) | `NO_USAR_COMO_ACTIVO_OFICIAL` | Clasificar también bajo `REVISAR_LICENSE_PROVENANCE`; prohibido incluir en `public/` o `src/` como activo clínico oficial |
| `scratch/gemini_generated_video_8efaa77d.mp4` | Video MP4 | Segundo video generado por IA externa en pruebas previas (candidato a referencia de plancha/ejercicio en `scratch/`) | No | No | Sí (Procedencia IA externa) | `NO_USAR_COMO_ACTIVO_OFICIAL` | Clasificar también bajo `REVISAR_LICENSE_PROVENANCE`; prohibido usar como activo clínico validado sin revisión de fisioterapeuta |
| `scratch/glute_bridge_frame.png` | Imagen PNG | Fotograma extraído de `Mister11_Glute_Bridge.mp4` (`t ≈ 1s`) mostrando maniquí anatómico verde `#2E6349` y anillos dorados `#F59E0B` | Material de apoyo técnico para P12 | No | Sí (Fotograma derivado de video IA) | `MANTENER_EN_SCRATCH` | Conservar en `scratch/` (o `MOVER_A_DOCS_EVIDENCE` si se documenta el pipeline de guía SVG orientativa en P12); nunca usar como ilustración clínica validada |
| `scratch/demo_micro_loop_vectorial.html` | Prototipo HTML/SVG | Prototipo de tarjeta móvil Android con micro-loop vectorial CSS/SVG (Curl Nórdico) en paleta Tierra y Campo | Material de diseño para P12 | No | No (100% código SVG/CSS propio) | `MANTENER_EN_SCRATCH` | Conservar como prototipo base para la guía SVG orientativa de P12 (`MOVER_A_DOCS_EVIDENCE` si se formaliza en Oleada 10) |
| `scratch/view_reference_video.html` | HTML auxiliar | Visor local de pruebas para inspeccionar duración y resolución de `gemini_generated_video_4d797787.mp4` | No | No | Referencia a video IA local | `MANTENER_EN_SCRATCH` | Mantener en `scratch/` sin commitear (`IGNORAR_GITIGNORE`) |
| `scratch/extract_frames.html` | HTML/Canvas auxiliar | Extractor en navegador de 7 fotogramas (`t = 0..4.8s`) sobre `<canvas>` para análisis de keyframes | Material de apoyo para pipeline P12 | No | No (Script HTML/JS) | `MANTENER_EN_SCRATCH` | Conservar en `scratch/` para extracción de poses clave en P12 |
| `scratch/capture_frame.js` | Script Playwright (`.js`) | Script auxiliar que abre un MP4 de referencia y captura `scratch/glute_bridge_frame.png` | No (Utilidad de inspección) | No | No | `MANTENER_EN_SCRATCH` | Conservar en `scratch/` como herramienta de apoyo para P12 |
| `scratch/all_exercises_dump.json` y `scratch/build_catalog_md.js` | JSON + Script Node | Volcado estructurado de los 118 ejercicios (`sys-1..10` + `hex-001..108`) y generador de `docs/CATALOGO_PROMPTS_VIDEOS_MISTER11.md` | Material base para P11 | No | No | `MANTENER_EN_SCRATCH` | Reutilizar en P11 para generar `docs/EXERCISE_INVENTORY_OLEADA10.md` |
| `scratch/test_*.mjs`, `scratch/test_*.cjs`, `scratch/verify_*.mjs`, `scratch/audit_*.mjs`, `scratch/audit_*.cjs` (27 scripts de test/diagnóstico previos) | Scripts de diagnóstico | Scripts de verificación puntual creados durante las Oleadas 6 a 9.3 (`test_618_sources.mjs`, `test_h14_h17.mjs`, `test_h20.mjs`, `test_p14_reproduction.mjs`, etc.) | Histórico de diagnóstico local | No | No | `MANTENER_EN_SCRATCH` | No commitear en masa; mantener ignorados (`IGNORAR_GITIGNORE`) o `BORRAR_POSTERIOR_CON_AUTORIZACION` tras cierre de Oleada 10 |
| `scratch/patch_*.cjs`, `scratch/fix_*.cjs`, `scratch/apply_*.mjs`, `scratch/insert_*.cjs`, `scratch/register_*.cjs` (48 scripts one-off de migración) | Scripts de parcheo ya ejecutados | Scripts de transformación puntual ya aplicados e integrados en commits anteriores de las Oleadas 6 a 9 | No (Ya consumidos) | No | No | `BORRAR_POSTERIOR_CON_AUTORIZACION` | No borrar ahora; retener en `scratch/` bajo `IGNORAR_GITIGNORE` hasta autorización explícita de limpieza del DUEÑO |
| `scratch/*.json`, `scratch/*.txt`, `scratch/tria_table.md` (`captured_outputs.json`, `raw_dom_evidence.json`, `unknowns_dump.json`, `current_prompt.txt`, `full_user_prompt.txt`) | Dumps temporales | Volcados intermedios de consola, DOM y texto de prompts | No | Revisar si algún dump DOM contiene datos de cuenta reviewer | No | `BORRAR_POSTERIOR_CON_AUTORIZACION` | No commitear a Git (`IGNORAR_GITIGNORE`); eliminar únicamente cuando el DUEÑO autorice purga de `scratch/` |
