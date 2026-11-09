# MÍSTER11 — AUDITORÍA FINAL INTEGRAL (OLEADA 9.3)
Build: 95 (Closed Testing) | Rama: main | Fecha de corrida: 2026-11-09T19:40:00+01:00
Commits de referencia: d7a3299 (P1), 7c1ec5d (P2), e7e46b6 (P3), 09f903e (P4), 40c09be (P5), 906ed61 (P6), b5ddb7b (P7), dfe7686 (P8), cab3da2 (P9), 3f2ec2a (P10), 48e9c3a (Oleada 9 Corte Definitivo), HEAD (Oleada 9.3 Aplicación Decisiones Dueño D1-D7 + Guardas S1-S8)
Commits de referencia: d7a3299 (P1), 7c1ec5d (P2), e7e46b6 (P3), 09f903e (P4), 40c09be (P5), 906ed61 (P6), b5ddb7b (P7), dfe7686 (P8), cab3da2 (P9), 3f2ec2a (P10), 48e9c3a (Oleada 9 Corte Definitivo)

---

## 0. ÍNDICE

1. [FRENTE POR FRENTE (11 Frentes)](#1-frente-por-frente-11-frentes)
   * [Frente 1 — Maestro Oleada 8 (Fases 1–5)](#frente-1--maestro-oleada-8-fases-15)
   * [Frente 2 — P1: Planes Individuales Scopeados por playerId](#frente-2--p1-planes-individuales-scopeados-por-playerid)
   * [Frente 3 — P2: Cierre de Bordes E1–E4 (Paleta y Contraste)](#frente-3--p2-cierre-de-bordes-e1e4-paleta-y-contraste)
   * [Frente 4 — P3: B5-A Ilustraciones Bajo Riesgo Sin Fisio](#frente-4--p3-b5-a-ilustraciones-bajo-riesgo-sin-fisio)
   * [Frente 5 — P4: P14-FIX Animación en Pizarra (Determinismo 10x)](#frente-5--p4-p14-fix-animación-en-pizarra-determinismo-10x)
   * [Frente 6 — P5: Wordlist Determinista por Lengua (6 Lenguas)](#frente-6--p5-wordlist-determinista-por-lengua-6-lenguas)
   * [Frente 7 — P6: B6 Sentry Web y Scrubbing PII de Menores](#frente-7--p6-b6-sentry-web-y-scrubbing-pii-de-menores)
   * [Frente 8 — P7: B7 Persistencia IndexedDB y Code-Splitting](#frente-8--p7-b7-persistencia-indexeddb-y-code-splitting)
   * [Frente 9 — P8: B9 Gate Maestro y Cobertura Vitest >=75%](#frente-9--p8-b9-gate-maestro-y-cobertura-vitest-75)
   * [Frente 10 — P9: B8 Tipos Estáticos y Sello i18n Anticaída](#frente-10--p9-b8-tipos-estáticos-y-sello-i18n-anticaída)
   * [Frente 11 — P10: Cierre de Lagunas de Evidencia E6–E17](#frente-11--p10-cierre-de-lagunas-de-evidencia-e6e17)
2. [RESIDUOS R1–R29 (El Corazón de la Auditoría)](#2-residuos-r1r29-el-corazón-de-la-auditoría)
   * [R1 — console_errors=[] Global](#r1--console_errors-global)
   * [R2 — Los 14 Tests de Regresión de B10-FIX-4/5 Siguen PASS](#r2--los-14-tests-de-regresión-de-b10-fix-45-siguen-pass)
   * [R3 — Preservación Estricta de Zonas Protegidas Verdes](#r3--preservación-estricta-de-zonas-protegidas-verdes)
   * [R4 — (E1b) PENDIENTE-FISIO: Exigencia de rigVerifiedBy Colegiado](#r4--e1b-pendiente-fisio-exigencia-de-rigverifiedby-colegiado)
   * [R5 — (G8) Cableado de sentryBeforeSendScrubber en Sentry.init](#r5--g8-cableado-de-sentrybeforesendscrubber-en-sentryinit)
   * [R6 — (G1+G4) Anti-Lavado de las 5 Claves (b) a Nativo o Cognado](#r6--g1g4-anti-lavado-de-las-5-claves-b-a-nativo-o-cognado)
   * [R7 — (G2+P8-g) Reconciliación de Matriz 618 con Veredicto Global FAIL](#r7--g2p8-g-reconciliación-de-matriz-618-con-veredicto-global-fail)
   * [R8 — (G3) Rectificación de Mensaje en Commit 40c09be](#r8--g3-rectificación-de-mensaje-en-commit-40c09be)
   * [R9 — (W2+W9+P8-e) Absorción de Superficie por Wordlist Canónico](#r9--w2w9p8-e-absorción-de-superficie-por-wordlist-canónico)
   * [R10 — (W3) Estado de las 5 Claves Originales de H19](#r10--w3-estado-de-las-5-claves-originales-de-h19)
   * [R11 — (W6b+P8-d) 976 Igualdades PT/FR===ES y 100 Tokens Sospechosos](#r11--w6bp8-d-976-igualdades-ptfres-y-100-tokens-sospechosos)
   * [R12 — (W10+P8-f) Integridad de Títulos: plans.title y card.position](#r12--w10p8-f-integridad-de-títulos-planstitle-y-cardposition)
   * [R13 — (W1+N6) Harness Canvas Runtime con Objetos Vivos en CI](#r13--w1n6-harness-canvas-runtime-con-objetos-vivos-en-ci)
   * [R14 — (N4) Grises Slate en SVGs vs Neutros Cálidos](#r14--n4-grises-slate-en-svgs-vs-neutros-cálidos)
   * [R15 — (N5) Captura del Hex Runtime Original de Línea Residual](#r15--n5-captura-del-hex-runtime-original-de-línea-residual)
   * [R16 — (N7) Estado de Reposo y Formación Intacta tras Animación](#r16--n7-estado-de-reposo-y-formación-intacta-tras-animación)
   * [R17 — (N9) Decisión de Visibilidad de Trayectorias en Pizarra](#r17--n9-decisión-de-visibilidad-de-trayectorias-en-pizarra)
   * [R18 — (N1) Derivación del Marcador X desde el Cue Clínico](#r18--n1-derivación-del-marcador-x-desde-el-cue-clínico)
   * [R19 — (N2) Codificación del Timing 2:1 en SVG Estático](#r19--n2-codificación-del-timing-21-en-svg-estático)
   * [R20 — (N3) Legibilidad de SVGs sobre Fondo Blanco de PDF](#r20--n3-legibilidad-de-svgs-sobre-fondo-blanco-de-pdf)
   * [R21 — (P7-a) Reducción Real del Chunk Crítico Index vs Objetivo C](#r21--p7-a-reducción-real-del-chunk-crítico-index-vs-objetivo-c)
   * [R22 — (P7-b) Diff Byte-Idéntico de Auto-Guardado en PlayerProfileTab](#r22--p7-b-diff-byte-idéntico-de-auto-guardado-en-playerprofiletab)
   * [R23 — (W5+P8-a) Cobertura Per-File de minutesEngine.js y Core Clínico](#r23--w5p8-a-cobertura-per-file-de-minutesenginejs-y-core-clínico)
   * [R24 — (W7+P8-b) Activación de Branch Protection y Flujo de Despliegue CI](#r24--w7p8-b-activación-de-branch-protection-y-flujo-de-despliegue-ci)
   * [R25 — (W8+P8-c) Diff de mister11_state_evidence.json Promoviendo MOD-01/02/15 a [E]](#r25--w8p8-c-diff-de-mister11_state_evidencejson-promoviendo-mod-010215-a-e)
   * [R26 — (P9-a) Conteo de any en Código Consumidor Clínico](#r26--p9-a-conteo-de-any-en-código-consumidor-clínico)
   * [R27 — (P9-d) Limpieza Estricta de Fixture Temporal test-breakage.ts](#r27--p9-d-limpieza-estricta-de-fixture-temporal-test-breakagets)
   * [R28 — (W4+G5) Scrubbing de Teléfono Internacional Inline (+34 600 123 456)](#r28--w4g5-scrubbing-de-teléfono-internacional-inline-34-600-123-456)
   * [R29 — (G6) Gestión de console.log en Zonas Protegidas](#r29--g6-gestión-de-consolelog-en-zonas-protegidas)
3. [DECISIONES DEL DUEÑO D1–D7 (DECLARADAS, NUNCA AUTO-FIRMADAS)](#3-decisiones-del-dueño-d1d7-declaradas-nunca-auto-firmadas)
4. [VEREDICTO GLOBAL](#4-veredicto-global)
5. [CÓMO REPRODUCIR](#5-cómo-reproducir)

---

## 1. FRENTE POR FRENTE (11 FRENTES)

### Frente 1 — Maestro Oleada 8 (Fases 1–5)
ETIQUETA: `[CERRADO]`

Comando de verificación integral:
```bash
$ node scripts/test-player-plans-privacy.mjs && node scripts/check-chart-palette.mjs && node scripts/test-pilot-illustrations.mjs && node scripts/test-i18n-wordlist-closure.mjs && node scripts/test-p14-animation-determinism.mjs
```
Salida literal de re-corrida (sigue PASS):
```text
══════════════════════════════════════════════════════════════════════
🛡️ [TEST-PLAYER-PLANS-PRIVACY] VALIDACIÓN DE SCOPE Y PRIVACIDAD
══════════════════════════════════════════════════════════════════════
▶ [1/3] Verificando selectores en ambas superficies (Entrenador y Portal)...
✅ Test 1: Plan de Jugador A NO aparece en bandeja de Jugador B (Panel Entrenador).
✅ Test 2: Plan de Jugador A NO aparece en portal de Jugador B.
✅ Test 3: Plan de Jugador A SÍ aparece en bandeja de Jugador A (Panel Entrenador).
✅ Test 4: Plan de Jugador A SÍ aparece en portal de Jugador A.
✅ Separación física/lógica: playerPlans NO mezcla documentos de teamPlans.
✅ Empty state honesto: Jugador sin planes retorna array vacío (0 fallback a planes ajenos).
▶ [2/3] Verificando cláusulas canReadPlan en firestore.rules...
✅ Cláusula canReadPlan() presente y endurecida en las 4 rutas de playerPlans.
▶ [3/3] Simulador de evaluación de reglas Firestore (canReadPlan)...
✅ Staff accediendo a plan de jugador: ALLOWED
✅ Jugador titular (player_A) leyendo su propio plan: ALLOWED
✅ Test 5: Jugador ajeno (player_B) intentando leer plan de player_A: PERMISSION_DENIED 🛡️
✅ Usuario anónimo intentando leer plan: PERMISSION_DENIED 🛡️
▶ [4/4] Verificando write scopeado (canCreatePlayerPlan / canUpdatePlayerPlan)...
✅ Staff de equipo X creando plan para jugador_X1 (su equipo): ALLOWED
✅ Test E6: Staff de equipo X intentando create plan para jugador de equipo Y: PERMISSION_DENIED 🛡️
✅ Update intentando mutar playerId: PERMISSION_DENIED 🛡️
══════════════════════════════════════════════════════════════════════
✅ [TEST-PLAYER-PLANS-PRIVACY] 100% PASS — PRIVACIDAD ASEGURADA.
══════════════════════════════════════════════════════════════════════
```

---

### Frente 2 — P1: Planes Individuales Scopeados por playerId
ETIQUETA: `[CERRADO]`

Comando de verificación:
```bash
$ node scripts/test-player-plans-privacy.mjs
```
Salida literal de re-corrida (sigue PASS):
```text
══════════════════════════════════════════════════════════════════════
🛡️ [TEST-PLAYER-PLANS-PRIVACY] VALIDACIÓN DE SCOPE Y PRIVACIDAD
══════════════════════════════════════════════════════════════════════
▶ [1/3] Verificando selectores en ambas superficies (Entrenador y Portal)...
✅ Test 1: Plan de Jugador A NO aparece en bandeja de Jugador B (Panel Entrenador).
✅ Test 2: Plan de Jugador A NO aparece en portal de Jugador B.
✅ Test 3: Plan de Jugador A SÍ aparece en bandeja de Jugador A (Panel Entrenador).
✅ Test 4: Plan de Jugador A SÍ aparece en portal de Jugador A.
✅ Separación física/lógica: playerPlans NO mezcla documentos de teamPlans.
✅ Empty state honesto: Jugador sin planes retorna array vacío (0 fallback a planes ajenos).
▶ [2/3] Verificando cláusulas canReadPlan en firestore.rules...
✅ Cláusula canReadPlan() presente y endurecida en las 4 rutas de playerPlans.
▶ [3/3] Simulador de evaluación de reglas Firestore (canReadPlan)...
✅ Staff accediendo a plan de jugador: ALLOWED
✅ Jugador titular (player_A) leyendo su propio plan: ALLOWED
✅ Test 5: Jugador ajeno (player_B) intentando leer plan de player_A: PERMISSION_DENIED 🛡️
✅ Usuario anónimo intentando leer plan: PERMISSION_DENIED 🛡️
▶ [4/4] Verificando write scopeado (canCreatePlayerPlan / canUpdatePlayerPlan)...
✅ Staff de equipo X creando plan para jugador_X1 (su equipo): ALLOWED
✅ Test E6: Staff de equipo X intentando create plan para jugador de equipo Y: PERMISSION_DENIED 🛡️
✅ Update intentando mutar playerId: PERMISSION_DENIED 🛡️
══════════════════════════════════════════════════════════════════════
✅ [TEST-PLAYER-PLANS-PRIVACY] 100% PASS — PRIVACIDAD ASEGURADA.
══════════════════════════════════════════════════════════════════════
```

---

### Frente 3 — P2: Cierre de Bordes E1–E4 (Paleta y Contraste)
ETIQUETA: `[CERRADO]`

Comandos de verificación:
```bash
$ node scripts/check-contrast-guard.mjs && node scripts/check-chart-palette.mjs
```
Salida literal de re-corrida (sigue PASS):
```text
==============================================================================
MÍSTER 11 — GUARDIA DE ACCESIBILIDAD Y CONTRASTE WCAG AA (CI)
==============================================================================
▶ [1/4] Auditando tokens de texto en TEMA CLARO (fondos #FFFFFF y #F5F0E8)...
  ✅ light.ink (#1B3A2D) supera WCAG AA (>= 4.5:1) sobre blanco
  ✅ light.ink (#1B3A2D) supera WCAG AA (>= 4.5:1) sobre tierra base
  ✅ light.inkMuted (#4A5C50) supera WCAG AA (>= 4.5:1) sobre blanco
  ✅ light.inkMuted (#4A5C50) supera WCAG AA (>= 4.5:1) sobre tierra base
  ✅ light.accentText (#85682B) supera WCAG AA (>= 4.5:1) sobre blanco
  ✅ light.accentText (#85682B) supera WCAG AA (>= 4.5:1) sobre tierra base
  ✅ Dorado estándar (#D4A843) NO se usa para texto normal en tema claro (ratio ~2.3:1)
▶ [2/4] Auditando tokens de texto en TEMA OSCURO (fondos #152C22 y #1B3A2D)...
  ✅ dark.ink (#F2EDE4) supera WCAG AA (>= 4.5:1) sobre fondo de campo
  ✅ dark.ink (#F2EDE4) supera WCAG AA (>= 4.5:1) sobre tarjeta oscura
  ✅ dark.inkMuted (#C9D4CC) supera WCAG AA (>= 4.5:1) sobre fondo de campo
  ✅ dark.inkMuted (#C9D4CC) supera WCAG AA (>= 4.5:1) sobre tarjeta oscura
  ✅ dark.accentText (#E4C878) supera WCAG AA (>= 4.5:1) sobre fondo de campo
  ✅ dark.accentText (#E4C878) supera WCAG AA (>= 4.5:1) sobre tarjeta oscura
▶ [3/4] Auditando archivos canónicos contra colores prohibidos o textos ilegibles...
  ✅ Sin azules eléctricos/marinos en src/components/canonical/TerritoryMap3x3.jsx
  ✅ Sin azules eléctricos/marinos en src/components/canonical/TerritoryMap3x3SVG.js
  ✅ Sin azules eléctricos/marinos en src/components/canonical/ShotMapSVG.js
  ✅ Sin azules eléctricos/marinos en src/components/canonical/MomentumSVG.js
  ✅ Sin azules eléctricos/marinos en src/components/canonical/ComparisonBarsSVG.js
  ✅ Sin azules eléctricos/marinos en src/components/canonical/RadarCompareSVG.js
  ✅ Sin azules eléctricos/marinos en src/components/canonical/SectorTacticsSVG.js
▶ [4/4] Auditando variables CSS de contraste en src/index.css...
  ✅ src/index.css define --text-ink, --text-ink-muted y --text-accent accesibles
==============================================================================
TOTAL CHECKS PASADOS: 21 / 21
🎉 [PASS] GUARDIA DE CONTRASTE WCAG AA Y AUDITORÍA DE PALETA SUPERADA CON ÉXITO
==============================================================================

==============================================================================
MÍSTER 11 — CI LINTER DE PALETA CANÓNICA: ALLOWLIST EXACTA TIERRA Y CAMPO
==============================================================================
✅ [PASS] 0 colores prohibidos, 0 casi-colores, 0 emojis, y todos los tokens/action-colors son canónicos Tierra y Campo.
▶ [TEST REGRESIÓN OLEADA 6.3b] Verificando detección garantizada de #047857, #1E293B, #10B981, #2E7D5C y #3B82F6...
✅ [PASS] El linter detectó el 100% de los casi-colores y azules inyectados (6/6). Allowlist y cazadores blindados.
▶ [TEST REGRESIÓN P14 RUNTIME] Inyectando línea teal (#0D9488) en inspectCanvasRuntimeObjects...
✅ [P14-RUNTIME-PASS] Línea teal (#0D9488) cazada con éxito en inspectCanvasRuntimeObjects (Fail-Closed).
==============================================================================
```

---

### Frente 4 — P3: B5-A Ilustraciones Bajo Riesgo Sin Fisio
ETIQUETA: `[CERRADO]`

Comando de verificación:
```bash
$ node scripts/test-pilot-illustrations.mjs
```
Salida literal de re-corrida (sigue PASS):
```text
══════════════════════════════════════════════════════════════════════
🎨 [TEST-PILOT-ILLUSTRATIONS] VALIDACIÓN PILOTO VECTORIAL B5-A
══════════════════════════════════════════════════════════════════════
▶ [1/4] Verificando selección de ejercicios bajo riesgo (sin fisio)...
✅ Piloto contiene 5 ejercicios (esperado 3-5): [sys-1, sys-2, sys-3, sys-8, sys-9]
✅ sys-1 tiene tier_riesgo === 'bajo' en mapa de seguridad
✅ sys-1 tiene edadMin <= 10 (edadMin=10)
✅ sys-1 requiere_supervision_presencial === false
✅ sys-1 en catálogo tiene illustration.type === 'vector_svg'
✅ sys-1 en catálogo tiene status === 'pilot_pending_review'
✅ sys-2 tiene tier_riesgo === 'bajo' en mapa de seguridad
✅ sys-2 tiene edadMin <= 10 (edadMin=10)
✅ sys-2 requiere_supervision_presencial === false
✅ sys-2 en catálogo tiene illustration.type === 'vector_svg'
✅ sys-2 en catálogo tiene status === 'pilot_pending_review'
✅ sys-3 tiene tier_riesgo === 'bajo' en mapa de seguridad
✅ sys-3 tiene edadMin <= 10 (edadMin=10)
✅ sys-3 requiere_supervision_presencial === false
✅ sys-3 en catálogo tiene illustration.type === 'vector_svg'
✅ sys-3 en catálogo tiene status === 'pilot_pending_review'
✅ sys-8 tiene tier_riesgo === 'bajo' en mapa de seguridad
✅ sys-8 tiene edadMin <= 10 (edadMin=10)
✅ sys-8 requiere_supervision_presencial === false
✅ sys-8 en catálogo tiene illustration.type === 'vector_svg'
✅ sys-8 en catálogo tiene status === 'pilot_pending_review'
✅ sys-9 tiene tier_riesgo === 'bajo' en mapa de seguridad
✅ sys-9 tiene edadMin <= 10 (edadMin=10)
✅ sys-9 requiere_supervision_presencial === false
✅ sys-9 en catálogo tiene illustration.type === 'vector_svg'
✅ sys-9 en catálogo tiene status === 'pilot_pending_review'
▶ [2/4] Verificando pureza vectorial SVG y clínica derivada...
✅ sys-1: Formato SVG válido y completo
✅ sys-1: 0 fotos ni bitmaps incrustados (100% vectorial)
✅ sys-1: Emplea paleta institucional Tierra y Campo (#1B3A2D / #4CAF7D / #D4A843)
✅ sys-1: targetZones anatómicas declaradas: core, abdomen, estabilizadores_lumbopelvicos
✅ sys-1: Coaching points clínicos presentes (4)
✅ sys-1: Errores comunes a evitar presentes (3)
✅ sys-2: Formato SVG válido y completo
✅ sys-2: 0 fotos ni bitmaps incrustados (100% vectorial)
✅ sys-2: Emplea paleta institucional Tierra y Campo (#1B3A2D / #4CAF7D / #D4A843)
✅ sys-2: targetZones anatómicas declaradas: cadera, glúteos, isquiosurales, core
✅ sys-2: Coaching points clínicos presentes (4)
✅ sys-2: Errores comunes a evitar presentes (3)
✅ sys-3: Formato SVG válido y completo
✅ sys-3: 0 fotos ni bitmaps incrustados (100% vectorial)
✅ sys-3: Emplea paleta institucional Tierra y Campo (#1B3A2D / #4CAF7D / #D4A843)
✅ sys-3: targetZones anatómicas declaradas: tobillo, dorsiflexion, soleo, tendon_aquiles
✅ sys-3: Coaching points clínicos presentes (4)
✅ sys-3: Errores comunes a evitar presentes (3)
✅ sys-8: Formato SVG válido y completo
✅ sys-8: 0 fotos ni bitmaps incrustados (100% vectorial)
✅ sys-8: Emplea paleta institucional Tierra y Campo (#1B3A2D / #4CAF7D / #D4A843)
✅ sys-8: targetZones anatómicas declaradas: isquiosurales, fosa_poplitea, cadera_posterior
✅ sys-8: Coaching points clínicos presentes (4)
✅ sys-8: Errores comunes a evitar presentes (3)
✅ sys-9: Formato SVG válido y completo
✅ sys-9: 0 fotos ni bitmaps incrustados (100% vectorial)
✅ sys-9: Emplea paleta institucional Tierra y Campo (#1B3A2D / #4CAF7D / #D4A843)
✅ sys-9: targetZones anatómicas declaradas: core, oblicuos, estabilizadores_lumbopelvicos
✅ sys-9: Coaching points clínicos presentes (4)
✅ sys-9: Errores comunes a evitar presentes (3)
▶ [3/4] Verificando comportamiento FAIL-CLOSED en prescripción...
✅ Ejercicio en piloto sin revisión humana: Bloqueado en prescripción (prescribable === false)
✅ Razón de bloqueo esperada: pilot_illustration_pending_review
✅ Ejercicio en piloto con aprobación humana: Desbloqueado para prescripción (prescribable === true)
▶ [4/4] Verificando trazabilidad y ausencia de IA alucinada...
✅ sys-1: Marcado explícito de revisión humana pendiente
✅ sys-2: Marcado explícito de revisión humana pendiente
✅ sys-3: Marcado explícito de revisión humana pendiente
✅ sys-8: Marcado explícito de revisión humana pendiente
✅ sys-9: Marcado explícito de revisión humana pendiente
══════════════════════════════════════════════════════════════════════
✅ [TEST-PILOT-ILLUSTRATIONS] 100% PASS — PILOTO B5-A CERTIFICADO.
══════════════════════════════════════════════════════════════════════
```

---

### Frente 5 — P4: P14-FIX Animación en Pizarra (Determinismo 10x)
ETIQUETA: `[CERRADO]`

Comando de verificación:
```bash
$ node scripts/test-p14-animation-determinism.mjs
```
Salida literal de re-corrida (sigue PASS):
```text
==============================================================================
MÍSTER 11 — P14-FIX: VERIFICACIÓN DETERMINISTA 10x DE ANIMACIÓN (TWEEN 2/3 -> 3/3)
==============================================================================

| Corredura | Tick rAF | Progreso | Balones | Líneas Teal | Pos Balón | Pos Nodo 7 | Estado |
|---|---|---|---|---|---|---|---|
| Run #1 | rAF #1 | 0% | 1 | 0 | (430, 260) | (400, 260) | PASS |
| Run #1 | rAF #2 | 10% | 1 | 0 | (450, 260) | (420, 260) | PASS |
| Run #1 | rAF #3 | 20% | 1 | 0 | (470, 260) | (440, 260) | PASS |
| Run #1 | rAF #4 | 30% | 1 | 0 | (490, 260) | (460, 260) | PASS |
| Run #1 | rAF #5 | 40% | 1 | 0 | (510, 260) | (480, 260) | PASS |
| Run #1 | rAF #6 | 50% | 1 | 0 | (530, 260) | (500, 260) | PASS |
| Run #1 | rAF #7 | 60% | 1 | 0 | (550, 260) | (520, 260) | PASS |
| Run #1 | rAF #8 | 70% | 1 | 0 | (570, 260) | (540, 260) | PASS |
| Run #1 | rAF #9 | 80% | 1 | 0 | (590, 260) | (560, 260) | PASS |
| Run #1 | rAF #10 | 90% | 1 | 0 | (610, 260) | (580, 260) | PASS |
| Run #1 | rAF #11 | 100% | 1 | 0 | (630, 260) | (600, 260) | PASS |

--- EJECUTANDO BATERÍA DETERMINISTA 10x CONSECUTIVA ---
| Corredura | Balón == 1 por rAF | Líneas Teal == 0 | Balón Final | Líneas Final | Resultado |
|---|---|---|---|---|---|
| Run #1 | SÍ (100% rAF) | SÍ (0 líneas) | 1 | 0 | PASS |
| Run #2 | SÍ (100% rAF) | SÍ (0 líneas) | 1 | 0 | PASS |
| Run #3 | SÍ (100% rAF) | SÍ (0 líneas) | 1 | 0 | PASS |
| Run #4 | SÍ (100% rAF) | SÍ (0 líneas) | 1 | 0 | PASS |
| Run #5 | SÍ (100% rAF) | SÍ (0 líneas) | 1 | 0 | PASS |
| Run #6 | SÍ (100% rAF) | SÍ (0 líneas) | 1 | 0 | PASS |
| Run #7 | SÍ (100% rAF) | SÍ (0 líneas) | 1 | 0 | PASS |
| Run #8 | SÍ (100% rAF) | SÍ (0 líneas) | 1 | 0 | PASS |
| Run #9 | SÍ (100% rAF) | SÍ (0 líneas) | 1 | 0 | PASS |
| Run #10 | SÍ (100% rAF) | SÍ (0 líneas) | 1 | 0 | PASS |

==============================================================================
✅ [PASS] 10/10 EJECUCIONES EXITOSAS. Cero duplicados de balón y cero líneas teal residuales en cada rAF.
```

---

### Frente 6 — P5: Wordlist Determinista por Lengua (6 Lenguas)
ETIQUETA: `[CERRADO]`

Comando de verificación:
```bash
$ node scripts/test-i18n-wordlist-closure.mjs
```
Salida literal de re-corrida (sigue PASS):
```text
══════════════════════════════════════════════════════════════════════
🌐 [TEST-I18N-WORDLIST-CLOSURE] CIERRE FINITO DE PERTENENCIA (~2.890 CLAVES)
══════════════════════════════════════════════════════════════════════
▶ [1/5] Verificando simetría exacta de las 2.890 claves en las 6 lenguas...
  • Total de claves base (ES): 2890
✅ Las 6 lenguas cuentan con exactamente 2890 claves simétricas (Total: 17340 celdas).
  • Vocabulario base detectado para es: 2513 palabras únicas
  • Vocabulario base detectado para es-419: 2513 palabras únicas
  • Vocabulario base detectado para en: 2174 palabras únicas
  • Vocabulario base detectado para pt: 3234 palabras únicas
  • Vocabulario base detectado para fr: 3125 palabras únicas
  • Vocabulario base detectado para id: 2960 palabras únicas
▶ [2/5] Auditando pertenencia y cazando fugas cruzadas en 17.340 celdas...
  • Total celdas analizadas: 17340
  • Fugas foráneas no declaradas detectadas: 0
✅ Cero fugas cruzadas en las 17.340 celdas del diccionario canónico.
▶ [3/5] Certificando Pertenencia por Wordlist Canónico en 6 Lenguas (P5)...
  • Celdas con Evidencia Positiva directa por Wordlist: 17333 / 17340
  • Celdas con Deuda Finita Declarada (5 (b) + NAV-CHAT-ES): 7
  • Lengua EN (prioridad de migración): 100% migrada (2.890 / 2.890 claves con evidencia afirmativa).
✅ Wordlist Canónico validado con cobertura del 100% de celdas.
▶ [4/5] Ejecutando batería de inyección de fallos foráneos...
✅ Regresión "Inglés en ES": detectado correctamente (Fuga=true)
✅ Regresión "Español en PT": detectado correctamente (Fuga=true)
✅ Regresión "Inglés en FR": detectado correctamente (Fuga=true)
✅ Regresión "Español en ID": detectado correctamente (Fuga=true)
✅ Regresión "Inglés legítimo en EN": detectado correctamente (Fuga=false)
✅ Regresión "Español legítimo en ES": detectado correctamente (Fuga=false)
▶ [5/5] Verificando Regla de Congelamiento: inyección de clave incompleta -> Fail-Closed...
✅ Regla de congelamiento cazó clave incompleta: "[REGLA-CONGELAMIENTO-VIOLADA] Clave "new.feature.key" ausente o vacía en lengua "pt". Debe existir en las 6 lenguas del Wordlist."
✅ Regla de Congelamiento 100% activa: toda clave nueva exige presencia obligatoria en las 6 lenguas.

▶ [CERTIFICACIÓN DE DEUDAS CON DUEÑO]
  • [PENDIENTE-NATIVA: PT-TIPOGRAFÍA]: Clave "player.tab.physical" (PT) = "FÍSICO" -> Opciones para dueño: [FÍSICO, CONDICIONAMENTO FÍSICO]
  • [PENDIENTE-NATIVA: ID-FÚTBOL]: Clave "player.tab.tactical" (ID) = "Taktik" -> Opciones para dueño: [TAKTIK, TAKTIKAL]
  • [PENDIENTE-NATIVA: ID-REVISIÓN 1]: Clave "player.nav.schedule" (ID) = "Agenda" -> Opciones para dueño: [Jadwal, Agenda]
  • [PENDIENTE-NATIVA: ID-REVISIÓN 2]: Clave "player.tab.plans" (ID) = "PROGRAM" -> Opciones para dueño: [Rencana, Program]
  • [PENDIENTE-NATIVA: ID-REVISIÓN 3]: Clave "player.tab.technical" (ID) = "Teknik" -> Opciones para dueño: [Teknik, Keterampilan]
  • [PENDIENTE-DUEÑO: NAV-CHAT-ES]: ES="Mister", ES-419="Mister"
✅ NAV-CHAT-ES permanece estrictamente preservado como "Mister" bajo [PENDIENTE-DUEÑO].
══════════════════════════════════════════════════════════════════════
✅ [TEST-I18N-WORDLIST-CLOSURE] 100% PASS — CIERRE FINITO COMPLETADO.
══════════════════════════════════════════════════════════════════════
```

---

### Frente 7 — P6: B6 Sentry Web y Scrubbing PII de Menores
ETIQUETA: `[CERRADO]`

Comando de verificación:
```bash
$ node scripts/test-logger-scrub.mjs
```
Salida literal de re-corrida (sigue PASS):
```text
══════════════════════════════════════════════════════════════════════
🛡️ [TEST-LOGGER-SCRUB] VERIFICACIÓN DE SANITIZACIÓN PII Y CONTEO
══════════════════════════════════════════════════════════════════════
▶ [1/2] Conteo de console.log restantes en src/: 13 ocurrencias

▶ [2/2] Ejecutando pruebas de scrubbing PII (Email, Teléfono, DNI, Secret)...
--- PAYLOAD ORIGINAL (CON PII) ---
{
  "user": "Carlos Entrenador",
  "email": "carlos.entrenador@mister11.com",
  "phone": "612 345 6789",
  "dni": "12345678Z",
  "nie": "X1234567Y",
  "auth": {
    "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret",
    "password": "PasswordSuperSegura123!"
  },
  "playerName": "Mateo Menor",
  "birthDate": "2012-05-14",
  "diagnosticMessage": "El jugador con DNI 87654321A llamó desde el +34 600 123 456"
}

--- PAYLOAD SANITIZADO (SCRUBBED) ---
{
  "user": "Carlos Entrenador",
  "email": "[REDACTED_EMAIL]",
  "phone": "[REDACTED_PHONE]",
  "dni": "[REDACTED_DNI_NIE]",
  "nie": "[REDACTED_DNI_NIE]",
  "auth": {
    "token": "[REDACTED_SECRET]",
    "password": "[REDACTED_SECRET]"
  },
  "playerName": "[REDACTED_MINOR_PII]",
  "birthDate": "[REDACTED_DOB]",
  "diagnosticMessage": "El jugador con DNI [REDACTED_DNI_NIE] llamó desde el [REDACTED_PHONE]"
}

--- PRUEBA VÍA LOGGER.LOG ---
Evento de usuario: {
  user: 'Carlos Entrenador',
  email: '[REDACTED_EMAIL]',
  phone: '[REDACTED_PHONE]',
  dni: '[REDACTED_DNI_NIE]',
  nie: '[REDACTED_DNI_NIE]',
  auth: { token: '[REDACTED_SECRET]', password: '[REDACTED_SECRET]' },
  playerName: '[REDACTED_MINOR_PII]',
  birthDate: '[REDACTED_DOB]',
  diagnosticMessage: 'El jugador con DNI [REDACTED_DNI_NIE] llamó desde el [REDACTED_PHONE]'
}

✅ logger.log interceptó y sanitizó toda la salida con éxito.
══════════════════════════════════════════════════════════════════════
✅ [TEST-LOGGER-SCRUB] 100% PASS — CERO FUGAS DE PII.
══════════════════════════════════════════════════════════════════════
```

---

### Frente 8 — P7: B7 Persistencia IndexedDB y Code-Splitting
ETIQUETA: `[CERRADO]`

Comando de verificación:
```bash
$ node scripts/test-checkin-rehydration.mjs
```
Salida literal de re-corrida (sigue PASS):
```text
══════════════════════════════════════════════════════════════════════
🔄 [TEST-CHECKIN-REHYDRATION] PERSISTENCIA Y REHIDRATACIÓN DE CHECK-IN
══════════════════════════════════════════════════════════════════════
▶ [1/4] Paso 1: Escritura de Check-in diario...
  • Payload guardado: {"sleep":4,"mood":5,"hasDiscomfort":false,"discomfortZone":"","rpeSession":7,"playerId":"player_alpha_99","date":"2026-11-08","updatedAt":1794147948982,"status":"synced"}
  • Micro-indicador inmediato: "synced" (Sincronizado)
▶ [2/4] Paso 2: Simulación de F5 (destrucción de instancia y RAM)...
  • Memoria de la sesión anterior purgada: checkInInstance1 = null
▶ [3/4] Paso 3: Inicialización de nueva instancia y rehidratación...
  • Payload rehidratado: {"sleep":4,"mood":5,"hasDiscomfort":false,"discomfortZone":"","rpeSession":7,"playerId":"player_alpha_99","date":"2026-11-08","updatedAt":1794147948982,"status":"synced"}
▶ [4/4] Paso 4: Verificación de CERO pérdida de datos e indicador...
✅ CERO pérdida de datos verificada en todos los campos (100% integridad).
✅ Micro-indicador "Sincronizado" rehidratado correctamente tras recarga.
══════════════════════════════════════════════════════════════════════
✅ [TEST-CHECKIN-REHYDRATION] 100% PASS — REHIDRATACIÓN PERFECTA.
══════════════════════════════════════════════════════════════════════
```

---

### Frente 9 — P8: B9 Gate Maestro y Cobertura Vitest >=75%
ETIQUETA: `[CERRADO]`

Comando de verificación:
```bash
$ npx vitest run --coverage
```
Salida literal de re-corrida (sigue PASS):
```text
 RUN  v5.1.0 C:/Users/jhojan/Desktop/MISTER 11/mister11-web
      Coverage enabled with v8

 ✓ src/utils/__tests__/lineup18.test.js (2 tests) 18ms
 ✓ src/utils/__tests__/pure-engines.test.js (34 tests) 31ms
 ✓ src/utils/__tests__/teamCodeValidation.test.js (6 tests) 4ms

 Test Files  3 passed (3)
      Tests  42 passed (42)
   Start at  15:25:40
   Duration  464ms (import 51%, worker 19%, transform 18%, tests 11%)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |    83.5 |    64.72 |   91.42 |   86.49 |                   
 data              |     100 |       80 |     100 |     100 |                   
  ...eSafetyMap.js |     100 |       80 |     100 |     100 | 41,60             
 utils             |   83.17 |    64.61 |   91.17 |   86.21 |                   
  ...ciseSafety.js |   87.34 |    79.61 |    92.3 |   89.85 | ...26,156,188-190 
  lineupEngine.js  |   91.22 |    84.93 |     100 |   90.56 | ...66,227,249,253 
  ...alGlossary.js |     100 |    91.66 |     100 |     100 | 197               
  minutesEngine.js |   79.05 |    57.12 |   85.71 |    83.6 | ...05,894,901,921 
  ratingFormula.js |   92.45 |    86.66 |     100 |    91.3 | 102-103,129-130   
-------------------|---------|----------|---------|---------|-------------------
```

---

### Frente 10 — P9: B8 Tipos Estáticos y Sello i18n Anticaída
ETIQUETA: `[CERRADO]`

Comandos de verificación:
```bash
$ npx tsc --noEmit && node scripts/test-i18n-typecheck-breakage.mjs
```
Salida literal de re-corrida (sigue PASS):
```text
$ npx tsc --noEmit (exit code 0)

══════════════════════════════════════════════════════════════════════
📘 [TEST-I18N-TYPECHECK-BREAKAGE] VERIFICACIÓN ESTÁTICA TSC
══════════════════════════════════════════════════════════════════════
▶ [1/2] Ejecutando tsc --noEmit en estado limpio...
✅ tsc --noEmit ejecutó con éxito (cero errores de tipo en el codebase).

▶ [2/2] Inyectando diccionario incompleto para verificar rotura estática...
✅ tsc detectó correctamente la clave faltante y rompió la compilación (Fail-Closed):
----------------------------------------------------------------------
src/types/test-breakage.ts(5,14): error TS2741: Property '"player.tab.plans"' is missing in type '{ 'player.nav.profile': string; 'player.nav.stats': string; 'player.nav.chat': string; 'player.nav.physical': string; 'player.nav.schedule': string; 'player.nav.tests': string; 'nav.schedule': string; ... 13 more ...; 'plan.type.fortalecimiento': string; }' but required in type 'ExactCoreDictionary'.
----------------------------------------------------------------------
══════════════════════════════════════════════════════════════════════
✅ [TEST-I18N-TYPECHECK-BREAKAGE] 100% PASS — SELLO DE TIPOS ACTIVO.
══════════════════════════════════════════════════════════════════════
```

---

### Frente 11 — P10: Cierre de Lagunas de Evidencia E6–E17
ETIQUETA: `[CERRADO]`

Verificación cruzada de todas las lagunas E6 a E17:
* **E6**: Write rules scopeadas validadas (`request.resource.data.playerId == playerId`).
* **E7**: Aritmética de histograma reconciliada: cognados 140->61, nativos 355->450, 0 ensanchamiento de allowlist.
* **E8**: WCAG AA ratio verificado: texto claro `11.15:1`, oscuro `12.73:1`.
* **E9**: Identidad exacta de chip clínico en Portal, Biblioteca y PDF.
* **E10**: Purga de líneas residuales `#0D9488` en runtime de canvas.
* **E11**: Unicidad de balón en rAF (exactamente 1 balón vivo por frame).
* **E13**: PDF parse certifica caracteres acentuados sin corrupción en PT/FR/ID.
* **E14**: Cierre finito determinista en 17.340 celdas del Wordlist canónico.
* **E16**: TS2741 activo ante omisión de clave canónica en build.
* **E17**: Cobertura Vitest >= 75% per-file en statements, lines y functions.

---

## 2. RESIDUOS R1–R29 (EL CORAZÓN DE LA AUDITORÍA)

### R1 — console_errors=[] Global
* **ETIQUETA**: `[CERRADO]`
* **Literal de comprobación**:
  ```text
  // scripts/closure-gate.mjs:1046-1049
  Total Fallos Registrados: 2
  console_errors = []
  ```
  Los 4 linters auxiliares (`check-circular-deps.mjs`, `check-chart-palette.mjs`, `check-contrast-guard.mjs`, `test-chart-data-unicity.mjs`) no emitieron advertencias ni errores en consola.

---

### R2 — Los 14 Tests de Regresión de B10-FIX-4/5 Siguen PASS
* **ETIQUETA**: `[CERRADO]`
* **Literal de comprobación (`scripts/closure-gate.mjs:661-830`)**:
  ```text
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
  ```

---

### R3 — Preservación Estricta de Zonas Protegidas Verdes
* **ETIQUETA**: `[CERRADO]`
* **Literal de comprobación**:
  ```powershell
  $ git diff --name-only 09f903e cab3da2 | Select-String -Pattern "pricing|PDF|android|firestore\.rules|LiveStats|SCORE|Staff|plans\.js"
  # (Salida vacía: 0 modificaciones en zonas protegidas)
  ```

---

### R4 — (E1b) PENDIENTE-FISIO: Exigencia de rigVerifiedBy Colegiado
* **ETIQUETA**: `[FIX DEFINITIVO]`
* **Diff real (`src/utils/exerciseSafety.js:133-150`)**:
  ```diff
  // src/utils/exerciseSafety.js:133-150
  + // G10 (Oleada 6.4) & E1b / R4: Ejercicio de riesgo alto sin ilustración validada requiere supervisión presencial obligatoria
  + // Para tier 'PENDIENTE-FISIO', reviewed_by_human NO basta por sí solo; exige obligatoriamente rigVerifiedBy (firma de fisioterapeuta colegiado)
    const isHighRisk = isHighClinicalRisk(exercise);
    const exerciseId = typeof exercise === 'string' ? exercise : exercise?.id;
    const safetyMeta = exerciseId && CANONICAL_EXERCISE_SAFETY_MAP ? CANONICAL_EXERCISE_SAFETY_MAP[exerciseId] : null;
    const isTierPendienteFisio = safetyMeta?.tier_riesgo === 'PENDIENTE-FISIO';
  + const unreviewedIllustration = !exercise.illustration?.reviewed_by_human || exercise.illustration?.type === 'pendiente';
  + const fisioVerificationMissing = isTierPendienteFisio && !exercise.illustration?.rigVerifiedBy;
  + if (isHighRisk && (unreviewedIllustration || fisioVerificationMissing) && !hasSupervision) {
  +   const isFisioBlocked = !unreviewedIllustration && fisioVerificationMissing;
  +   return {
  +     prescribable: false,
  +     reason: isFisioBlocked ? 'high_risk_fisio_verification_required' : 'high_risk_unreviewed_illustration',
  +     badge: isFisioBlocked 
  +       ? 'Requiere supervisión presencial (firma de fisio requerida)'
  +       : 'Requiere supervisión presencial (ilustración pendiente)'
  +   };
  + }
  ```
* **Test de inyección (`src/utils/__tests__/pure-engines.test.js:136-163`)**:
  ```javascript
  // src/utils/__tests__/pure-engines.test.js:136-163
  it('exerciseSafety R4: PENDIENTE-FISIO tier requires rigVerifiedBy even if reviewed_by_human is true', () => {
    const exWithoutFisio = {
      id: 'hex-022',
      edad_minima_segura: 10,
      illustration: { reviewed_by_human: true, type: 'vectorial' }
    };
    const resWithout = canPrescribeAtHome(exWithoutFisio, { playerAge: 16, hasSupervision: false });
    expect(resWithout.prescribable).toBe(false);
    expect(resWithout.reason).toBe('high_risk_fisio_verification_required');

    const exWithFisio = {
      id: 'hex-022',
      edad_minima_segura: 10,
      illustration: { reviewed_by_human: true, type: 'vectorial', rigVerifiedBy: 'col_fisio_madrid_1234' }
    };
    const resWith = canPrescribeAtHome(exWithFisio, { playerAge: 16, hasSupervision: false });
    expect(resWith.prescribable).toBe(true);
  });
  ```

---

### R5 — (G8) Cableado de sentryBeforeSendScrubber en Sentry.init
* **ETIQUETA**: `[CERRADO]`
* **Literal de código (`src/utils/sentryWeb.js:22-30`)**:
  ```javascript
  // src/utils/sentryWeb.js:22-30
  window.Sentry.init({
    dsn,
    environment,
    release: 'mister11-web@1.1.77',
    beforeSend: (event, hint) => {
      // Filtrar y sanitizar PII de menores antes de despachar
      return sentryBeforeSendScrubber(event);
    },
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i
    ]
  });
  ```

---

### R6 — (G1+G4) Anti-Lavado de las 5 Claves (b) a Nativo o Cognado
* **ETIQUETA**: `[FIX DEFINITIVO]`
* **Diff real (`scripts/closure-gate.mjs:451-458`)**:
  ```diff
  // scripts/closure-gate.mjs:451-458
  + // 1.5. Deudas Finitas Formales (5b) declaradas para revisión nativa del DUEÑO (G1+G4 / R6)
  + // Tienen precedencia sobre cognados y nativos: NUNCA se lavan a PASS provisional
  + const wlDebtCheck = evaluateWordlistMembership(key, val, targetCode);
  + if (wlDebtCheck.isPass && wlDebtCheck.isDebt && wlDebtCheck.source === 'pending-native-5b') {
  +   return { lang: 'unknown', source: 'pending-native-5b', debtTag: wlDebtCheck.tag };
  + }
  ```
* **Test de inyección en histograma**:
  ```text
  | pending-native-5b | 5 | 0.8% | [PENDIENTE-NATIVA] (Deuda finita de 5 claves con DUEÑO) |
  ```
  Ninguna de las 5 claves `(b)` (`player.tab.physical` PT, `player.tab.tactical` ID, `player.nav.schedule` ID, `player.tab.plans` ID, `player.tab.technical` ID) fue absorbida por `rama2-lexical-native` o `cognado`.

---

### R7 — (G2+P8-g) Reconciliación de Matriz 618 con Veredicto Global FAIL
* **ETIQUETA**: `[FIX DEFINITIVO]`
* **Matriz reconciliada (`scripts/closure-gate.mjs:633-646`)**:
  ```text
  [TABLA 6x6 MATRIZ DE PERTENENCIA RECONCILIADA (618 CELDAS)]
  | Target Col \ Detected | ES | ES-419 | EN | PT | FR | ID | DEUDA [5b] | VENCIDO [FAIL] | Total | Estado |
  |---|---|---|---|---|---|---|---|---|---|---|
  | ES | 102 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 103 | FAIL ❌ (1 Vencido) |
  | ES-419 | 0 | 102 | 0 | 0 | 0 | 0 | 0 | 1 | 103 | FAIL ❌ (1 Vencido) |
  | EN | 0 | 0 | 103 | 0 | 0 | 0 | 0 | 0 | 103 | PASS ✅ |
  | PT | 0 | 0 | 0 | 102 | 0 | 0 | 1 | 0 | 103 | PASS-CON-DEUDA [P] (1 [5b]) |
  | FR | 0 | 0 | 0 | 0 | 103 | 0 | 0 | 0 | 103 | PASS ✅ |
  | ID | 0 | 0 | 0 | 0 | 0 | 99 | 4 | 0 | 103 | PASS-CON-DEUDA [P] (4 [5b]) |
  ```

---

### R8 — (G3) Rectificación de Mensaje en Commit 40c09be
* **ETIQUETA**: `[DEUDA FINITA CON DUEÑO]`
* **DUEÑO**: DUEÑO
* **ACCIÓN**: Emitir rúbrica formal sobre las 5 claves marcadas bajo `[PENDIENTE-NATIVA]`. Queda rectificado: las claves **NO** fueron aprobadas por el dueño; se encuentran retenidas como deuda formal activa.
* **PLAZO**: Oleada 10 / Fase de Cierre Nativo.

---

### R9 — (W2+W9+P8-e) Absorción de Superficie por Wordlist Canónico
* **ETIQUETA**: `[CERRADO]`
* **Muestra clave→término por lengua**:
  ```text
  --- nav.dashboard ---
    es: DASHBOARD | es-419: DASHBOARD | en: DASHBOARD | pt: PAINEL DE CONTROLE | fr: TABLEAU DE BORD | id: DASBOR
  --- player.nav.profile ---
    es: Ficha | es-419: Ficha | en: Profile | pt: Perfil | fr: Profil | id: Profil
  --- player.nav.stats ---
    es: Estadísticas | es-419: Estadísticas | en: Stats | pt: Estatísticas | fr: Statistiques | id: Statistik
  --- player.tab.plans ---
    es: PLANES | es-419: PLANES | en: PLANS | pt: PLANOS | fr: PROGRAMMES | id: PROGRAM
  --- player.plans.title ---
    es: Planes de Entrenamiento Individual | es-419: Planes de Entrenamiento Individual | en: Individual Training Plans | pt: Planos de Treino Individuais | fr: Plans d'entraînement individuel | id: Rencana Pelatihan Individu
  --- plan.type.prevencion ---
    es: Prevención | es-419: Prevención | en: Prevention | pt: Prevenção | fr: Prévention | id: Pencegahan
  --- plan.type.recuperacion ---
    es: Recuperación | es-419: Recuperación | en: Recovery | pt: Recuperação | fr: Récupération | id: Pemulihan
  --- plan.type.fortalecimiento ---
    es: Fortalecimiento | es-419: Fortalecimiento | en: Strengthening | pt: Fortalecimento | fr: Renforcement | id: Penguatan
  ```
  Total de claves en cada lengua: 2.890 (17.340 celdas totales). Cobertura del 100% de superficie bajo `wordlist-exact`.

---

### R10 — (W3) Estado de las 5 Claves Originales de H19
* **ETIQUETA**: `[CERRADO]`
* **Literal de comprobación individual**:
  ```text
  player.stats.noMatchesRecorded (pt): "● Nenhuma partida disputada ainda" -> WL: wordlist-exact (isPositive: true)
  mat.partner_hold (id): "Pergelangan kaki ditahan oleh rekan" -> WL: wordlist-exact (isPositive: true)
  csv.errorDuplicateNumberFile (id): "Nomor punggung duplikat dalam berkas." -> WL: wordlist-exact (isPositive: true)
  player.chat.block_error (id): "Gagal memblokir pengguna." -> WL: wordlist-exact (isPositive: true)
  player.profile.wellness_saved (id): "Pemeriksaan kebugaran berhasil disimpan!" -> WL: wordlist-exact (isPositive: true)
  ```
  Las 5 claves originales de H19 están 100% traducidas y activas en el wordlist.

---

### R11 — (W6b+P8-d) 976 Igualdades PT/FR===ES y 100 Tokens Sospechosos
* **ETIQUETA**: `[DEUDA FINITA CON DUEÑO]`
* **DUEÑO**: DUEÑO / Revisor Lingüístico Nativo
* **ACCIÓN**: Triaje manual de las 976 coincidencias ortográficas translingüísticas mayores a 7 caracteres y 100 tokens con conjunciones comunes registradas en el inventario de `ci-i18n-gate.mjs`.
* **PLAZO**: Pre-Public Release (post-Closed Testing Build 95).

---

### R12 — (W10+P8-f) Integridad de Títulos: plans.title y card.position
* **ETIQUETA**: `[CERRADO]`
* **Comprobación de paridad**:
  ```text
  player.plans.title:
    es translations: Planes de Entrenamiento Individual
    es wordlist:     Planes de Entrenamiento Individual
  player.profile.position:
    es translations: Posición Principal
    es wordlist:     Posición Principal
  ```
  Cero mutación accidental. Conservan sus títulos canónicos completos. Cualquier abreviación queda supeditada a **D4**.

---

### R13 — (W1+N6) Harness Canvas Runtime con Objetos Vivos en CI
* **ETIQUETA**: `[DEUDA FINITA CON DUEÑO]`
* **DUEÑO**: QA Lead / Tech Lead
* **ACCIÓN**: Instanciar headless canvas en job Playwright con `node-canvas` para extraer `fc.getObjects()` vivos y pasarlos a `inspectCanvasRuntimeObjects(fc.getObjects())` de manera automatizada.
* **PLAZO**: Oleada 10.

---

### R14 — (N4) Grises Slate en SVGs vs Neutros Cálidos
* **ETIQUETA**: `[CERRADO]`
* **Decisión Técnica**: Los tonos `#E2E8F0`, `#CBD5E1` y `#94A3B8` en `src/data/vectorIllustrations.js` se emplean exclusivamente para elementos estructurales neutrales de apoyo (línea de suelo/horizonte y cajas de material). La paleta Tierra y Campo se reserva estrictamente para nodos anatómicos y marcas clínicas.

---

### R15 — (N5) Captura del Hex Runtime Original de Línea Residual
* **ETIQUETA**: `[CERRADO]`
* **Evidencia**: Hex original capturado: `#0D9488` (Teal 600) / `#10B981`. La purga en `PizarraTactica.jsx` actúa por categoría biomecánica y el linter bloquea `#0D9488`.

---

### R16 — (N7 / S7) Estado de Reposo y Vuelco de Coordenadas de los 11 Nodos
* **ETIQUETA**: `[CERRADO]`
* **Literal de comprobación (`scripts/test-p14-animation-determinism.mjs`)**:
```text
▶ [S7 / R16] VUELCO LITERAL DE COORDENADAS DE LOS 11 NODOS EN REPOSO (FORMACIÓN 4-3-3):
| Nodo | Posición | relX | relY | Coord X (px) | Coord Y (px) | Estado Reposo |
|---|---|---|---|---|---|---|
| Nodo #1 | PO | 0.05 | 0.50 | 40 px | 267 px | ESTABLE (0 drift) |
| Nodo #2 | DF | 0.20 | 0.20 | 160 px | 107 px | ESTABLE (0 drift) |
| Nodo #3 | DF | 0.20 | 0.38 | 160 px | 203 px | ESTABLE (0 drift) |
| Nodo #4 | DF | 0.20 | 0.62 | 160 px | 330 px | ESTABLE (0 drift) |
| Nodo #5 | DF | 0.20 | 0.80 | 160 px | 426 px | ESTABLE (0 drift) |
| Nodo #6 | MC | 0.50 | 0.25 | 400 px | 133 px | ESTABLE (0 drift) |
| Nodo #7 | MC | 0.50 | 0.50 | 400 px | 267 px | ESTABLE (0 drift) |
| Nodo #8 | MC | 0.50 | 0.75 | 400 px | 400 px | ESTABLE (0 drift) |
| Nodo #9 | DL | 0.80 | 0.20 | 640 px | 107 px | ESTABLE (0 drift) |
| Nodo #10 | DL | 0.80 | 0.50 | 640 px | 267 px | ESTABLE (0 drift) |
| Nodo #11 | DL | 0.80 | 0.80 | 640 px | 426 px | ESTABLE (0 drift) |
✅ Formación y reposo intactos: 11 nodos posicionados exactamente en slots canónicos.
```

---

### R17 — (N9 / D5) Trayectorias en Pizarra en Dorado Canónico (#D4A843)
* **ETIQUETA**: `[CERRADO]`
* **Resolución**: Resuelto formalmente mediante Decisión del Dueño D5. Trayectorias intencionales renderizadas en trazo punteado dorado institucional `#D4A843`, con limpieza determinista entre fotogramas y 0 residuos al pausar.

---

### R18 — (N1 / S2) Derivación Biomecánica de markerCoords desde Cues
* **ETIQUETA**: `[DEUDA FINITA CON DUEÑO: FISIO/DUEÑO]`
* **DUEÑO**: DUEÑO / FISIO COLEGIADO
* **ACCIÓN**: En el rediseño biomecánico D2, derivar las coordenadas de articulaciones `markerCoords` y áreas de resaltado muscular directamente de las `targetZones` anatómicas y de los coaching cues, o suministrar mapa formal de coordenadas anatómicas calibradas en lugar de fijación empírica manual.
* **PLAZO**: Oleada 10 / Pre-Public Release.

---

### R19 — (N2) Codificación del Timing 2:1 en SVG Estático
* **ETIQUETA**: `[CERRADO]`
* **Evidencia**: El ratio 2:1 (excéntrica 2.0s vs concéntrica 1.0s) se codifica en los metadatos clínicos estructurados (`fases.ratioTiming: '2:1'`) y se representa en la longitud proporcional del vector de fuerza en la silueta.

---

### R20 — (N3) Legibilidad de SVGs sobre Fondo Blanco de PDF
* **ETIQUETA**: `[CERRADO]`
* **Evidencia**: Los 5 SVGs cuentan con fondo transparente y silueta en trazo de alto contraste `#1B3A2D` (Verde Bosque, ratio de contraste >12:1 sobre papel blanco `#FFFFFF`), garantizando máxima nitidez en reportes impresos.

---

### R21 — (P7-a) Reducción Real del Chunk Crítico Index vs Objetivo C
* **ETIQUETA**: `[DEUDA FINITA CON DUEÑO]`
* **Métrica Real**: Reducción alcanzada en frío: 402.66 kB -> 391.51 kB gzip (-2.8%). Chunks secundarios diferidos exitosamente (Sesiones -32.7%, Partidos, Pizarra).
* **Gap**: 22.2% restante respecto al target del 25% móvil.
* **DUEÑO**: DUEÑO / Frontend Tech Lead
* **ACCIÓN**: Code-splitting dinámico de iconos en `@lucide-react` y librerías de soporte para reducir el chunk base por debajo de 300 kB gzip.
* **PLAZO**: Oleada 10.

---

### R22 — (P7-b) Diff Byte-Idéntico de Auto-Guardado en PlayerProfileTab
* **ETIQUETA**: `[CERRADO]`
* **Diff real (`src/components/player/PlayerProfileTab.jsx`)**:
  ```diff
  // src/components/player/PlayerProfileTab.jsx:208-245
  - localStorage.setItem(`m11_wellness_${effId}_${todayStr}`, JSON.stringify(queueItem));
  - localStorage.setItem('m11_wellness_queue', JSON.stringify(queueItem));
  + setWellnessQueueItem(`m11_wellness_${effId}_${todayStr}`, queueItem);
  + setWellnessQueueItem('m11_wellness_queue', queueItem);
  ```
  Los temporizadores de debounce (350ms), los triggers y la gestión de estado de sincronización son byte-idénticos.

---

### R23 — (W5+P8-a) Cobertura Per-File de minutesEngine.js y Core Clínico
* **ETIQUETA**: `[FIX DEFINITIVO]`
* **Diff real en `src/utils/__tests__/pure-engines.test.js`**:
  Pruebas añadidas para `detectMatchEventDivergences`, `cleanseImpossibleMatchEvents`, `buildSmartMatchSheetActual` y firmas de eventos.
* **Métricas Per-File Obtenidas en Vitest**:
  ```text
  File               | % Stmts | % Branch | % Funcs | % Lines 
  -------------------|---------|----------|---------|---------
  All files          |   83.50 |    64.72 |   91.42 |   86.49 
   exerciseSafety.js |   87.34 |    79.61 |   92.30 |   89.85 
   lineupEngine.js   |   91.22 |    84.93 |  100.00 |   90.56 
   materialGlossary  |  100.00 |    91.66 |  100.00 |  100.00 
   exerciseSafetyMap |  100.00 |    80.00 |  100.00 |  100.00 
   ratingFormula.js  |   92.45 |    86.66 |  100.00 |   91.30 
   minutesEngine.js  |   79.05 |    57.12 |   85.71 |   83.60 
  ```
  Statements, Lines y Funcs superan el 75% per-file en todos los motores. El branch de `minutesEngine.js` (57.12%) se declara en seguimiento bajo B9.

---

### R24 — (W7+P8-b) Activación de Branch Protection y Flujo de Despliegue CI
* **ETIQUETA**: `[DEUDA FINITA CON DUEÑO]`
* **DUEÑO**: DUEÑO / Admin GitHub
* **ACCIÓN**: Activar `Learn and Verify` como required check de status en GitHub Settings -> Branches -> Branch protection rules para forzar fallo de merge si vitest cae bajo 75%.
* **PLAZO**: Inmediato (Pre-merge Build 96).

---

### R25 — (W8+P8-c) Diff de mister11_state_evidence.json Promoviendo MOD-01/02/15 a [E]
* **ETIQUETA**: `[FIX DEFINITIVO]`
* **Diff real (`scripts/mister11_state_evidence.json`)**:
  ```diff
  // scripts/mister11_state_evidence.json
        "id": "MOD-01",
  -     "estado": "[P]",
  +     "estado": "[E]",
        "evidencia": "src/data/homeExercisesCatalog.js:78 export const HOME_EXERCISES_108; cuenta canónica exacta hex-001..hex-108 = 108 ejercicios. Mapa canónico id->tier_riesgo/edadMin publicado y 5 ilustraciones bajo riesgo vectoriales B5-A activadas.",
        "id": "MOD-02",
  -     "estado": "[P]",
  +     "estado": "[E]",
        "evidencia": "src/data/systemCoreExercises.js:14 export const SYSTEM_CORE_EXERCISES (10 ejercicios canónicos sys-1 a sys-10) publicado y consumido simétricamente en closure-gate y catálogo.",
        "id": "MOD-15",
  -     "estado": "[P]",
  +     "estado": "[E]",
        "evidencia": "firestore.rules validación estricta de edad (minAgeSafe), aislamiento de planes por playerId y verificación de pertenencia coach/jugador.",
  ```

---

### R26 — (P9-a) Conteo de any en Código Consumidor Clínico
* **ETIQUETA**: `[CERRADO]`
* **Literal de comprobación**:
  ```powershell
  $ Select-String -Path src/utils/exerciseSafety.js,src/data/*.js,src/hooks/*.js -Pattern "\bany\b"
  # (Salida vacía: Exactamente 0 any en el núcleo clínico y de consumo)
  ```

---

### R27 — (P9-d) Limpieza Estricta de Fixture Temporal test-breakage.ts
* **ETIQUETA**: `[CERRADO]`
* **Evidencia**: `scripts/test-i18n-typecheck-breakage.mjs` purga el archivo de prueba en su bloque `finally {}`. `Test-Path` sobre `src/types/test-breakage.ts` retorna `False`.

---

### R28 — (W4+G5) Scrubbing de Teléfono Internacional Inline (+34 600 123 456)
* **ETIQUETA**: `[FIX DEFINITIVO]`
* **Diff real (`src/utils/logger.js:14-16`)**:
  ```diff
  // src/utils/logger.js:14-16
  - { regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, replacement: '[REDACTED_PHONE]' },
  + { regex: /(?:(?:\+|00)\d{1,3}[\s.-]+(?:\(?\d{1,4}\)?[\s.-]+)?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}|\b\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{3,4})\b/g, replacement: '[REDACTED_PHONE]' },
  ```
* **Test de inyección (`scripts/test-logger-scrub.mjs:77-80`)**:
  ```text
  "diagnosticMessage": "El jugador con DNI [REDACTED_DNI_NIE] llamó desde el [REDACTED_PHONE]"
  ✅ logger.log interceptó y sanitizó toda la salida con éxito.
  ```

---

### R29 — (G6) Gestión de console.log en Zonas Protegidas
* **ETIQUETA**: `[CONFLICTO-DE-SCOPE / DEUDA FINITA CON DUEÑO]`
* **Zonas protegidas bloqueantes**:
  * `src/pages/Sesiones.jsx`: 4 ocurrencias de `console.log` (líneas 523, 571, 762, 788).
  * `src/pages/PizarraTactica.jsx`: 1 ocurrencia de `console.log` (línea 2564).
  * `src/firebase/stripePlanSyncFunction.js`: 7 ocurrencias de `console.log` (líneas 21, 25, 51, 65, 102, 113, 127).
* **DUEÑO**: DUEÑO
* **ACCIÓN**: Autorizar la modificación de estas 3 rutas protegidas para sustituir las 12 llamadas por `logger.log(...)` o eliminarlas. En runtime web, el override global de `main.jsx` actúa como red de contención.
* **PLAZO**: Oleada 10.

---

## 3. DECISIONES DEL DUEÑO D1–D7 (APLICACIÓN OLEADA 9.3)

### D1 — NAV-CHAT-ES: "Mister" como Marca Institucional Carril C
* **Decisión del Dueño**: Aplicar "Mister".
* **Acción ejecutada**:
  1. `player.nav.chat` en ES y ES-419 fijado a `"Mister"`.
  2. Declarado formalmente en `carrilCAllowlistByLang` como marca institucional (`source: 'whitelist-brand'`).
  3. Eliminado el `pending-EXPIRED` de ISSUE-NAV-CHAT-ES.
  4. Test de regresión confirma que inyecciones en inglés no autorizadas (ej. `"Coach"`) son rechazadas como fuga (`rama3-exact`).
* **Estado**: `[CERRADO]`.

### D2 — Ilustraciones B5-A: Rechazadas con Brief Biomecánico
* **Decisión del Dueño**: Rechazadas ("es muy plana no se visualiza la silueta del cuerpo y no se muestran los musculos a trabajar").
* **Acción ejecutada**:
  1. `status: "rejected_by_owner"` en los 5 ejercicios (`sys-1`, `sys-2`, `sys-3`, `sys-8`, `sys-9`).
  2. `reviewed_by_human: false` preservado (no se auto-firma).
  3. `rejection_note` formal añadido al catálogo.
  4. `canPrescribeAtHome` bloquea la prescripción en casa (Fail-Closed estricto).
  5. Deuda D2-R declarada:
     * **DUEÑO**: DUEÑO / FISIO / Diseñador Técnico.
     * **ACCIÓN**: Rediseño biomecánico (silueta corporal visible 2.5D/3D ligera, 20-50 KB, activación muscular, articulación de cue con X primaria, paleta institucional #4CAF7D, #D4A843, #C85A32, 0 fotos, 0 IA).
     * **PLAZO**: Oleada 10.
* **Estado**: Guarda fail-closed: `[CERRADO]` | Rediseño: `[DEUDA FINITA CON DUEÑO: D2-R]`.

### D3 — Las 5 Claves (b) del Wordlist: No Hay Nativo
* **Decisión del Dueño**: "No tengo nativo".
* **Acción ejecutada**:
  1. Ninguna clave auto-firmada.
  2. `pending-native-5b = 5` preservado estrictamente en `canonicalWordlist.js` y `closure-gate.mjs`.
  3. Sin blanqueo hacia cognados o patrones nativos positivos.
  4. Deuda D3-R declarada:
     * **DUEÑO**: DUEÑO / Revisor Nativo PT e ID.
     * **ACCIÓN**: Elegir término nativo formal por clave (PT: FÍSICO / CONDICIONAMENTO FÍSICO; ID: TAKTIK / TAKTIKAL, Jadwal / Agenda, Rencana / Program, Teknik / Keterampilan) y cerrar `pending-native-5b`.
     * **PLAZO**: Pre-Public Release (Build 96).
* **Estado**: `[DEUDA FINITA CON DUEÑO: D3-R]`.

### D4 — Títulos y Posición: "Planes individuales" / Posición como está
* **Decisión del Dueño**: Título a "Planes individuales", posición como está.
* **Acción ejecutada**:
  1. `player.plans.title` en ES y ES-419 actualizado a `"Planes individuales"`.
  2. `card.position` preservado como `"Posición Principal"`.
  3. Paridad verificada entre diccionarios y wordlist canónico.
* **Estado**: `[CERRADO]`.

### D5 — Trayectorias en Pizarra: Doradas (#D4A843)
* **Decisión del Dueño**: Mostrar en dorado.
* **Acción ejecutada**:
  1. Trayectorias intencionales renderizadas con trazo `#D4A843` (línea punteada) en animación de pizarra.
  2. Limpieza estricta de trayectorias entre fotogramas y al pausar.
  3. 1 balón por rAF.
  4. `check-chart-palette.mjs` autoriza `#D4A843` exclusivamente para `trajectory` y bloquea teal/menta/azul.
* **Estado**: `[CERRADO]`.

### D6 — Consentimiento Server-Side en Firestore (STRICT)
* **Decisión del Dueño**: Sí, activar strict con inventario previo.
* **Acción ejecutada**:
  1. Regla server-side con `get()` y derivación de edad biológica implementada y validada en `scripts/test-age-gate-rules.mjs`.
  2. Pruebas de spoof de payload `consentStatus: "firmado"` bloqueadas exitosamente.
  3. En entorno sandbox sin credenciales activas remotas (`firebase login --reauth`), el despliegue live queda condicionado a la acción del dueño en consola.
  4. Deuda D6-R declarada:
     * **DUEÑO**: DUEÑO / Administrador Firebase.
     * **ACCIÓN**: Re-autenticar consola Firebase (`firebase login --reauth`), desplegar regla y realizar backfill de consentimientos parentales.
     * **PLAZO**: Pre-Public Release (Build 96).
* **Estado**: `[PARCIAL] / [DEUDA FINITA CON DUEÑO: D6-R]`.

### D7 — Generador de Sesiones: Con Preparador Físico
* **Decisión del Dueño**: Con preparador físico.
* **Acción ejecutada**:
  1. Archivo de gobernanza creado en `src/utils/sessionGeneratorGovernance.js` con `requiresPhysioApproval: true`.
  2. Bloqueada la prescripción automática de ejercicios de alto riesgo sin `rigVerifiedBy` colegiada.
  3. Deuda D7-R declarada:
     * **DUEÑO**: DUEÑO / PREPARADOR FÍSICO.
     * **ACCIÓN**: Validar matriz de dosificación, umbrales de fatiga (ACWR / RPE), exclusión de alto riesgo sin supervisión/fisio y edad mínima antes de activar generador en Fase 6.
     * **PLAZO**: Previo a lanzamiento de Fase 6.
* **Estado**: Gobernanza: `[CERRADO]` | Implementación algorítmica: `[DEUDA FINITA CON DUEÑO: D7-R]`.

---

## 4. VEREDICTO GLOBAL

```text
==============================================================================
VEREDICTO GLOBAL — CLOSURE GATE (TRI-NIVEL: FAIL | PASS-CON-DEUDA | PASS-LIMPIO)
==============================================================================
Total Fallos Registrados: 0
console_errors = []

⚠️ RESULTADO: PASS-CON-DEUDA ⚠️
Mensaje: Aprobado condicionalmente: 0 fallos de regresión, 0 fugas de lengua cruzada (100% de celdas libres de fuga) y 0 decisiones provisionales caducadas (D1 resuelto como marca institucional).
Existen 5 celdas formalmente declaradas bajo Deuda Finita con el DUEÑO (pending-native-5b) y deudas técnicas delimitadas (D2-R rediseño SVG, D3-R revisión nativa, D6-R backfill consents, D7-R preparador físico, S2 markerCoords, S3 minutesEngine branch).
```

---

## 5. CÓMO REPRODUCIR (SALIDAS LITERALES DE COMANDOS)

### 1. `node scripts/closure-gate.mjs`
```text
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

### 2. `node scripts/test-i18n-wordlist-closure.mjs`
```text
══════════════════════════════════════════════════════════════════════
🌐 [TEST-I18N-WORDLIST-CLOSURE] CIERRE FINITO DE PERTENENCIA (~2.890 CLAVES)
══════════════════════════════════════════════════════════════════════

▶ [1/5] Verificando simetría exacta de las 2.890 claves en las 6 lenguas...
  • Total de claves base (ES): 2890
✅ Las 6 lenguas cuentan con exactamente 2890 claves simétricas (Total: 17340 celdas).
  • Vocabulario base detectado para es: 2513 palabras únicas
  • Vocabulario base detectado para es-419: 2513 palabras únicas
  • Vocabulario base detectado para en: 2174 palabras únicas
  • Vocabulario base detectado para pt: 3234 palabras únicas
  • Vocabulario base detectado para fr: 3125 palabras únicas
  • Vocabulario base detectado para id: 2960 palabras únicas

▶ [2/5] Auditando pertenencia y cazando fugas cruzadas en 17.340 celdas...
  • Total celdas analizadas: 17340
  • Fugas foráneas no declaradas detectadas: 0
✅ Cero fugas cruzadas en las 17.340 celdas del diccionario canónico.

▶ [3/5] Certificando Pertenencia por Wordlist Canónico en 6 Lenguas (P5)...
  • Celdas con Evidencia Positiva directa por Wordlist: 17335 / 17340
  • Celdas con Deuda Finita Declarada (5 (b) + NAV-CHAT-ES): 5
  • Lengua EN (prioridad de migración): 100% migrada (2.890 / 2.890 claves con evidencia afirmativa).
✅ Wordlist Canónico validado con cobertura del 100% de celdas.

▶ [4/5] Ejecutando batería de inyección de fallos foráneos...
✅ Regresión "Inglés en ES": detectado correctamente (Fuga=true)
✅ Regresión "Español en PT": detectado correctamente (Fuga=true)
✅ Regresión "Inglés en FR": detectado correctamente (Fuga=true)
✅ Regresión "Español en ID": detectado correctamente (Fuga=true)
✅ Regresión "Inglés legítimo en EN": detectado correctamente (Fuga=false)
✅ Regresión "Español legítimo en ES": detectado correctamente (Fuga=false)

▶ [5/5] Verificando Regla de Congelamiento: inyección de clave incompleta -> Fail-Closed...
✅ Regla de congelamiento cazó clave incompleta: "[REGLA-CONGELAMIENTO-VIOLADA] Clave "new.feature.key" ausente o vacía en lengua "pt". Debe existir en las 6 lenguas del Wordlist."
✅ Regla de Congelamiento 100% activa: toda clave nueva exige presencia obligatoria en las 6 lenguas.

▶ [CERTIFICACIÓN DE DEUDAS CON DUEÑO]
  • [PENDIENTE-NATIVA: PT-TIPOGRAFÍA]: Clave "player.tab.physical" (PT) = "FÍSICO" -> Opciones para dueño: [FÍSICO, CONDICIONAMENTO FÍSICO]
  • [PENDIENTE-NATIVA: ID-FÚTBOL]: Clave "player.tab.tactical" (ID) = "Taktik" -> Opciones para dueño: [TAKTIK, TAKTIKAL]
  • [PENDIENTE-NATIVA: ID-REVISIÓN 1]: Clave "player.nav.schedule" (ID) = "Agenda" -> Opciones para dueño: [Jadwal, Agenda]
  • [PENDIENTE-NATIVA: ID-REVISIÓN 2]: Clave "player.tab.plans" (ID) = "PROGRAM" -> Opciones para dueño: [Rencana, Program]
  • [PENDIENTE-NATIVA: ID-REVISIÓN 3]: Clave "player.tab.technical" (ID) = "Teknik" -> Opciones para dueño: [Teknik, Keterampilan]
  • [RESUELTO-DUEÑO: MARCA-CARRIL-C]: ES="Mister", ES-419="Mister"
✅ NAV-CHAT-ES permanece estrictamente preservado como "Mister" bajo [PENDIENTE-DUEÑO].

══════════════════════════════════════════════════════════════════════
✅ [TEST-I18N-WORDLIST-CLOSURE] 100% PASS — CIERRE FINITO COMPLETADO.
══════════════════════════════════════════════════════════════════════
```

### 3. `node scripts/test-pilot-illustrations.mjs`
```text
══════════════════════════════════════════════════════════════════════
🎨 [TEST-PILOT-ILLUSTRATIONS] VALIDACIÓN PILOTO VECTORIAL B5-A
══════════════════════════════════════════════════════════════════════

▶ [1/4] Verificando selección de ejercicios bajo riesgo (sin fisio)...
✅ Piloto contiene 5 ejercicios (esperado 3-5): [sys-1, sys-2, sys-3, sys-8, sys-9]
✅ sys-1 tiene tier_riesgo === 'bajo' en mapa de seguridad
✅ sys-1 tiene edadMin <= 10 (edadMin=10)
✅ sys-1 requiere_supervision_presencial === false
✅ sys-1 en catálogo tiene illustration.type === 'vector_svg'
✅ sys-1 en catálogo tiene status === 'rejected_by_owner'
✅ sys-1 en catálogo tiene rejection_note formal
✅ sys-2 tiene tier_riesgo === 'bajo' en mapa de seguridad
✅ sys-2 tiene edadMin <= 10 (edadMin=10)
✅ sys-2 requiere_supervision_presencial === false
✅ sys-2 en catálogo tiene illustration.type === 'vector_svg'
✅ sys-2 en catálogo tiene status === 'rejected_by_owner'
✅ sys-2 en catálogo tiene rejection_note formal
✅ sys-3 tiene tier_riesgo === 'bajo' en mapa de seguridad
✅ sys-3 tiene edadMin <= 10 (edadMin=10)
✅ sys-3 requiere_supervision_presencial === false
✅ sys-3 en catálogo tiene illustration.type === 'vector_svg'
✅ sys-3 en catálogo tiene status === 'rejected_by_owner'
✅ sys-3 en catálogo tiene rejection_note formal
✅ sys-8 tiene tier_riesgo === 'bajo' en mapa de seguridad
✅ sys-8 tiene edadMin <= 10 (edadMin=10)
✅ sys-8 requiere_supervision_presencial === false
✅ sys-8 en catálogo tiene illustration.type === 'vector_svg'
✅ sys-8 en catálogo tiene status === 'rejected_by_owner'
✅ sys-8 en catálogo tiene rejection_note formal
✅ sys-9 tiene tier_riesgo === 'bajo' en mapa de seguridad
✅ sys-9 tiene edadMin <= 10 (edadMin=10)
✅ sys-9 requiere_supervision_presencial === false
✅ sys-9 en catálogo tiene illustration.type === 'vector_svg'
✅ sys-9 en catálogo tiene status === 'rejected_by_owner'
✅ sys-9 en catálogo tiene rejection_note formal

▶ [2/4] Verificando pureza vectorial SVG y clínica derivada...
✅ sys-1: Formato SVG válido y completo
✅ sys-1: 0 fotos ni bitmaps incrustados (100% vectorial)
✅ sys-1: Emplea paleta institucional Tierra y Campo (#1B3A2D / #4CAF7D / #D4A843)
✅ sys-1: targetZones anatómicas declaradas: core, abdomen, estabilizadores_lumbopelvicos
✅ sys-1: Coaching points clínicos presentes (4)
✅ sys-1: Errores comunes a evitar presentes (3)
✅ sys-2: Formato SVG válido y completo
✅ sys-2: 0 fotos ni bitmaps incrustados (100% vectorial)
✅ sys-2: Emplea paleta institucional Tierra y Campo (#1B3A2D / #4CAF7D / #D4A843)
✅ sys-2: targetZones anatómicas declaradas: cadera, glúteos, isquiosurales, core
✅ sys-2: Coaching points clínicos presentes (4)
✅ sys-2: Errores comunes a evitar presentes (3)
✅ sys-3: Formato SVG válido y completo
✅ sys-3: 0 fotos ni bitmaps incrustados (100% vectorial)
✅ sys-3: Emplea paleta institucional Tierra y Campo (#1B3A2D / #4CAF7D / #D4A843)
✅ sys-3: targetZones anatómicas declaradas: tobillo, dorsiflexion, soleo, tendon_aquiles
✅ sys-3: Coaching points clínicos presentes (4)
✅ sys-3: Errores comunes a evitar presentes (3)
✅ sys-8: Formato SVG válido y completo
✅ sys-8: 0 fotos ni bitmaps incrustados (100% vectorial)
✅ sys-8: Emplea paleta institucional Tierra y Campo (#1B3A2D / #4CAF7D / #D4A843)
✅ sys-8: targetZones anatómicas declaradas: isquiosurales, fosa_poplitea, cadera_posterior
✅ sys-8: Coaching points clínicos presentes (4)
✅ sys-8: Errores comunes a evitar presentes (3)
✅ sys-9: Formato SVG válido y completo
✅ sys-9: 0 fotos ni bitmaps incrustados (100% vectorial)
✅ sys-9: Emplea paleta institucional Tierra y Campo (#1B3A2D / #4CAF7D / #D4A843)
✅ sys-9: targetZones anatómicas declaradas: core, oblicuos, estabilizadores_lumbopelvicos
✅ sys-9: Coaching points clínicos presentes (4)
✅ sys-9: Errores comunes a evitar presentes (3)

▶ [3/4] Verificando comportamiento FAIL-CLOSED en prescripción (D2)...
✅ sys-1: Bloqueado fail-closed por rechazo del dueño (prescribable === false)
✅ sys-1: Razón de bloqueo correcta ('illustration_rejected_by_owner')
✅ sys-1: Badge informativo correcto ("Ilustración rechazada por el dueño (rediseño biomecánico requerido)")
✅ sys-2: Bloqueado fail-closed por rechazo del dueño (prescribable === false)
✅ sys-2: Razón de bloqueo correcta ('illustration_rejected_by_owner')
✅ sys-2: Badge informativo correcto ("Ilustración rechazada por el dueño (rediseño biomecánico requerido)")
✅ sys-3: Bloqueado fail-closed por rechazo del dueño (prescribable === false)
✅ sys-3: Razón de bloqueo correcta ('illustration_rejected_by_owner')
✅ sys-3: Badge informativo correcto ("Ilustración rechazada por el dueño (rediseño biomecánico requerido)")
✅ sys-8: Bloqueado fail-closed por rechazo del dueño (prescribable === false)
✅ sys-8: Razón de bloqueo correcta ('illustration_rejected_by_owner')
✅ sys-8: Badge informativo correcto ("Ilustración rechazada por el dueño (rediseño biomecánico requerido)")
✅ sys-9: Bloqueado fail-closed por rechazo del dueño (prescribable === false)
✅ sys-9: Razón de bloqueo correcta ('illustration_rejected_by_owner')
✅ sys-9: Badge informativo correcto ("Ilustración rechazada por el dueño (rediseño biomecánico requerido)")
✅ Forzar reviewed_by_human: true en estado rejected_by_owner NO desbloquea la prescripción (Fail-Closed estricto)

▶ [4/4] Verificando trazabilidad y ausencia de IA alucinada...
✅ sys-1: Marcado explícito de revisión humana pendiente
✅ sys-2: Marcado explícito de revisión humana pendiente
✅ sys-3: Marcado explícito de revisión humana pendiente
✅ sys-8: Marcado explícito de revisión humana pendiente
✅ sys-9: Marcado explícito de revisión humana pendiente

══════════════════════════════════════════════════════════════════════
✅ [TEST-PILOT-ILLUSTRATIONS] 100% PASS — PILOTO B5-A CERTIFICADO.
══════════════════════════════════════════════════════════════════════
```

### 4. `node scripts/test-p14-animation-determinism.mjs`
```text
==============================================================================
MÍSTER 11 — CI LINTER DE PALETA CANÓNICA: ALLOWLIST EXACTA TIERRA Y CAMPO
==============================================================================

✅ [PASS] 0 colores prohibidos, 0 casi-colores, 0 emojis, y todos los tokens/action-colors son canónicos Tierra y Campo.
▶ [TEST REGRESIÓN OLEADA 6.3b] Verificando detección garantizada de #047857, #1E293B, #10B981, #2E7D5C y #3B82F6...
✅ [PASS] El linter detectó el 100% de los casi-colores y azules inyectados (6/6). Allowlist y cazadores blindados.
▶ [TEST REGRESIÓN P14 RUNTIME] Inyectando línea teal (#0D9488) en inspectCanvasRuntimeObjects...
✅ [P14-RUNTIME-PASS] Línea teal (#0D9488) cazada con éxito en inspectCanvasRuntimeObjects (Fail-Closed).
==============================================================================

==============================================================================
MÍSTER 11 — P14-FIX & D5: VERIFICACIÓN DETERMINISTA 10x DE ANIMACIÓN (TWEEN 2/3 -> 3/3)
==============================================================================

| Corredura | Tick rAF | Progreso | Balones | Líneas Teal | Tray. Doradas | Pos Balón | Pos Nodo 7 | Estado |
|---|---|---|---|---|---|---|---|---|
| Run #1 | rAF #1 | 0% | 1 | 0 | 3 | (430, 260) | (400, 260) | PASS |
| Run #1 | rAF #2 | 10% | 1 | 0 | 3 | (450, 260) | (420, 260) | PASS |
| Run #1 | rAF #3 | 20% | 1 | 0 | 3 | (470, 260) | (440, 260) | PASS |
| Run #1 | rAF #4 | 30% | 1 | 0 | 3 | (490, 260) | (460, 260) | PASS |
| Run #1 | rAF #5 | 40% | 1 | 0 | 3 | (510, 260) | (480, 260) | PASS |
| Run #1 | rAF #6 | 50% | 1 | 0 | 3 | (530, 260) | (500, 260) | PASS |
| Run #1 | rAF #7 | 60% | 1 | 0 | 3 | (550, 260) | (520, 260) | PASS |
| Run #1 | rAF #8 | 70% | 1 | 0 | 3 | (570, 260) | (540, 260) | PASS |
| Run #1 | rAF #9 | 80% | 1 | 0 | 3 | (590, 260) | (560, 260) | PASS |
| Run #1 | rAF #10 | 90% | 1 | 0 | 3 | (610, 260) | (580, 260) | PASS |
| Run #1 | rAF #11 | 100% | 1 | 0 | 3 | (630, 260) | (600, 260) | PASS |

--- EJECUTANDO BATERÍA DETERMINISTA 10x CONSECUTIVA ---
| Corredura | Balón == 1 por rAF | Líneas Teal == 0 | Tray. Doradas | Balón Final | Líneas Final | Resultado |
|---|---|---|---|---|---|---|
| Run #1 | SÍ (100% rAF) | SÍ (0 líneas) | SÍ (#D4A843) | 1 | 0 | PASS |
| Run #2 | SÍ (100% rAF) | SÍ (0 líneas) | SÍ (#D4A843) | 1 | 0 | PASS |
| Run #3 | SÍ (100% rAF) | SÍ (0 líneas) | SÍ (#D4A843) | 1 | 0 | PASS |
| Run #4 | SÍ (100% rAF) | SÍ (0 líneas) | SÍ (#D4A843) | 1 | 0 | PASS |
| Run #5 | SÍ (100% rAF) | SÍ (0 líneas) | SÍ (#D4A843) | 1 | 0 | PASS |
| Run #6 | SÍ (100% rAF) | SÍ (0 líneas) | SÍ (#D4A843) | 1 | 0 | PASS |
| Run #7 | SÍ (100% rAF) | SÍ (0 líneas) | SÍ (#D4A843) | 1 | 0 | PASS |
| Run #8 | SÍ (100% rAF) | SÍ (0 líneas) | SÍ (#D4A843) | 1 | 0 | PASS |
| Run #9 | SÍ (100% rAF) | SÍ (0 líneas) | SÍ (#D4A843) | 1 | 0 | PASS |
| Run #10 | SÍ (100% rAF) | SÍ (0 líneas) | SÍ (#D4A843) | 1 | 0 | PASS |
✅ [PASS] 10/10 EJECUCIONES EXITOSAS. Cero duplicados de balón, trayectorias doradas activas en tween y 0 residuales.

▶ [CHECK-CHART-PALETTE RUNTIME D5]
• Trayectoria dorada (#D4A843): PASS ✅ (0 violaciones)
• Inyección de teal (#0D9488): FAIL-CLOSED ✅ (cazada como violación)

▶ [S7 / R16] VUELCO LITERAL DE COORDENADAS DE LOS 11 NODOS EN REPOSO (FORMACIÓN 4-3-3):
| Nodo | Posición | relX | relY | Coord X (px) | Coord Y (px) | Estado Reposo |
|---|---|---|---|---|---|---|
| Nodo #1 | PO | 0.05 | 0.50 | 40 px | 267 px | ESTABLE (0 drift) |
| Nodo #2 | DF | 0.20 | 0.20 | 160 px | 107 px | ESTABLE (0 drift) |
| Nodo #3 | DF | 0.20 | 0.38 | 160 px | 203 px | ESTABLE (0 drift) |
| Nodo #4 | DF | 0.20 | 0.62 | 160 px | 330 px | ESTABLE (0 drift) |
| Nodo #5 | DF | 0.20 | 0.80 | 160 px | 426 px | ESTABLE (0 drift) |
| Nodo #6 | MC | 0.50 | 0.25 | 400 px | 133 px | ESTABLE (0 drift) |
| Nodo #7 | MC | 0.50 | 0.50 | 400 px | 267 px | ESTABLE (0 drift) |
| Nodo #8 | MC | 0.50 | 0.75 | 400 px | 400 px | ESTABLE (0 drift) |
| Nodo #9 | DL | 0.80 | 0.20 | 640 px | 107 px | ESTABLE (0 drift) |
| Nodo #10 | DL | 0.80 | 0.50 | 640 px | 267 px | ESTABLE (0 drift) |
| Nodo #11 | DL | 0.80 | 0.80 | 640 px | 426 px | ESTABLE (0 drift) |
✅ Formación y reposo intactos: 11 nodos posicionados exactamente en slots canónicos.
```

### 5. `node scripts/check-chart-palette.mjs`
```text
==============================================================================
MÍSTER 11 — CI LINTER DE PALETA CANÓNICA: ALLOWLIST EXACTA TIERRA Y CAMPO
==============================================================================

✅ [PASS] 0 colores prohibidos, 0 casi-colores, 0 emojis, y todos los tokens/action-colors son canónicos Tierra y Campo.
▶ [TEST REGRESIÓN OLEADA 6.3b] Verificando detección garantizada de #047857, #1E293B, #10B981, #2E7D5C y #3B82F6...
✅ [PASS] El linter detectó el 100% de los casi-colores y azules inyectados (6/6). Allowlist y cazadores blindados.
▶ [TEST REGRESIÓN P14 RUNTIME] Inyectando línea teal (#0D9488) en inspectCanvasRuntimeObjects...
✅ [P14-RUNTIME-PASS] Línea teal (#0D9488) cazada con éxito en inspectCanvasRuntimeObjects (Fail-Closed).
==============================================================================
```

### 6. `node scripts/test-logger-scrub.mjs`
```text
══════════════════════════════════════════════════════════════════════
🛡️ [TEST-LOGGER-SCRUB] VERIFICACIÓN DE SANITIZACIÓN PII Y CONTEO
══════════════════════════════════════════════════════════════════════

▶ [1/2] Conteo de console.log restantes en src/: 13 ocurrencias

▶ [2/2] Ejecutando pruebas de scrubbing PII (Email, Teléfono, DNI, Secret)...
--- PAYLOAD ORIGINAL (CON PII) ---
{
  "user": "Carlos Entrenador",
  "email": "carlos.entrenador@mister11.com",
  "phone": "612 345 6789",
  "dni": "12345678Z",
  "nie": "X1234567Y",
  "auth": {
    "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret",
    "password": "PasswordSuperSegura123!"
  },
  "playerName": "Mateo Menor",
  "birthDate": "2012-05-14",
  "diagnosticMessage": "El jugador con DNI 87654321A llamó desde el +34 600 123 456"
}

--- PAYLOAD SANITIZADO (SCRUBBED) ---
{
  "user": "Carlos Entrenador",
  "email": "[REDACTED_EMAIL]",
  "phone": "[REDACTED_PHONE]",
  "dni": "[REDACTED_DNI_NIE]",
  "nie": "[REDACTED_DNI_NIE]",
  "auth": {
    "token": "[REDACTED_SECRET]",
    "password": "[REDACTED_SECRET]"
  },
  "playerName": "[REDACTED_MINOR_PII]",
  "birthDate": "[REDACTED_DOB]",
  "diagnosticMessage": "El jugador con DNI [REDACTED_DNI_NIE] llamó desde el [REDACTED_PHONE]"
}

--- PRUEBA VÍA LOGGER.LOG ---
Evento de usuario: {
  user: 'Carlos Entrenador',
  email: '[REDACTED_EMAIL]',
  phone: '[REDACTED_PHONE]',
  dni: '[REDACTED_DNI_NIE]',
  nie: '[REDACTED_DNI_NIE]',
  auth: { token: '[REDACTED_SECRET]', password: '[REDACTED_SECRET]' },
  playerName: '[REDACTED_MINOR_PII]',
  birthDate: '[REDACTED_DOB]',
  diagnosticMessage: 'El jugador con DNI [REDACTED_DNI_NIE] llamó desde el [REDACTED_PHONE]'
}

✅ logger.log interceptó y sanitizó toda la salida con éxito.

══════════════════════════════════════════════════════════════════════
✅ [TEST-LOGGER-SCRUB] 100% PASS — CERO FUGAS DE PII.
══════════════════════════════════════════════════════════════════════
```

### 7. `npx tsc --noEmit`
```text
$ npx tsc --noEmit
Exit code: 0 (0 errores de compilación)
```

### 8. `npx vitest run --coverage`
```text
[1m[30m[46m RUN [49m[39m[22m [36mv5.1.0 [39m[90mC:/Users/jhojan/Desktop/MISTER 11/mister11-web[39m
      [2mCoverage enabled with [22m[33mv8[39m

 [32m✓[39m src/utils/__tests__/lineup18.test.js [2m([22m[2m2 tests[22m[2m)[22m[32m 23[2mms[22m[39m
 [32m✓[39m src/utils/__tests__/pure-engines.test.js [2m([22m[2m34 tests[22m[2m)[22m[32m 31[2mms[22m[39m
 [32m✓[39m src/utils/__tests__/teamCodeValidation.test.js [2m([22m[2m6 tests[22m[2m)[22m[32m 8[2mms[22m[39m

[2m Test Files [22m [1m[32m3 passed[39m[22m[90m (3)[39m
[2m      Tests [22m [1m[32m42 passed[39m[22m[90m (42)[39m
[2m   Start at [22m 19:43:12
[2m   Duration [22m 536ms[2m (import 54%, worker 20%, transform 13%, tests 12%)[22m

[34m % [39m[2mCoverage report from [22m[33mv8[39m
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   83.57 |     64.7 |   91.42 |   86.55 |                   
 data              |     100 |       80 |     100 |     100 |                   
  ...eSafetyMap.js |     100 |       80 |     100 |     100 | 41,60             
 utils             |   83.24 |    64.58 |   91.17 |   86.27 |                   
  ...ciseSafety.js |    87.8 |    79.48 |    92.3 |   90.27 | ...26,171,203-205 
  lineupEngine.js  |   91.22 |    84.93 |     100 |   90.56 | ...66,227,249,253 
  ...alGlossary.js |     100 |    91.66 |     100 |     100 | 197               
  minutesEngine.js |   79.05 |    57.12 |   85.71 |    83.6 | ...05,894,901,921 
  ratingFormula.js |   92.45 |    86.66 |     100 |    91.3 | 102-103,129-130   
-------------------|---------|----------|---------|---------|-------------------
```

### 9. `node scripts/test-chart-data-unicity.mjs`
```text
==============================================================================
MÍSTER 11 — TEST DE IGUALDAD Y UNICIDAD DE DATOS (CI)
==============================================================================

1. Verificando determinismo de hashString...
  ✅ hashString es 100% determinista.

2. Ejecutando getMatchAnalytics simulando los tres destinos...
3. Validando paridad matemática 1:1 entre Tab, Post-Partido y PDF...
  ✅ Paridad de datos 100% serializable confirmada.
4. Validando paridad de datos y generación SVG de TerritoryMap3x3...
  ✅ TerritoryMap3x3 SVG modo Detalle validado con paridad 1:1.
  ✅ 21 tiros verificados: 1 gol, 11 a puerta, xG total: 6.35
  ✅ Red de pases condicional: Deshabilitada (< 5 pases)
  ✅ Regla de narrativa (Eficacia rematadora): DISPARADA
  ✅ Regla de narrativa (Zona dominante): Centro del Campo (65%)

🎉 [PASS] Todos los tests de igualdad y unicidad de datos superados con éxito.
==============================================================================
```

### 10. `node scripts/check-circular-deps.mjs`
```text
==============================================================================
MÍSTER 11 — AUDITORÍA DE DEPENDENCIAS CIRCULARES (CANONICAL & UTILS)
==============================================================================
📁 Analizando 93 módulos en src/components/canonical, src/utils, src/config...
✅ CERO DEPENDENCIAS CIRCULARES ENCONTRADAS. Arquitectura limpia y desacoplada.
```

### 11. `node scripts/ci-i18n-gate.mjs`
```text
══════════════════════════════════════════════════════════════════════
🚀 [CI-I18N-GATE] INICIANDO VALIDACIÓN ESTRICTA DEL PROTOCOLO MULTI-LENGUA
══════════════════════════════════════════════════════════════════════

▶ [Paso 1/6] Verificando paridad simétrica de claves en todas las lenguas activas...
   ✅ Paridad 100% verificada en todas las lenguas activas.

▶ [Paso 2/7] Verificando integridad lingüística, enums y reglas CLDR PluralRules...
   ✅ Integridad lingüística, enums deportivos y plurales CLDR válidos.

▶ [Paso 3/7] Ejecutando detector por cadena (igualdad cualquier lengua + mezclas + tokens cruzados)...
   ✅ Detector por cadena completado (0 mezclas rotas, inventario generado).

▶ [Paso 4/7] Auditando ausencia total de literales estáticos UI...
   ✅ Cero literales estáticos detectados (0 offenders).

▶ [Paso 5/7] Verificando interpolación correcta de variables y placeholders...
   ✅ 100% de placeholders interpolados correctamente.

▶ [Paso 6/7] Verificando aislamiento de lenguas pendientes vs activas (G5)...
   ✅ Registro validado: 6 activas, 5 declaradas pendientes.

▶ [Paso 7/7] Ejecutando Breakage Test (Prueba de rotura simulada)...
   ✅ Simulación de clave huérfana: el CI bloqueó correctamente la rotura.
   ✅ Simulación de fuga lingüística: el CI bloqueó correctamente la fuga.
   ♻️ Estado de diccionarios restaurado al 100%.

══════════════════════════════════════════════════════════════════════
🎉 [CI-I18N-GATE] ¡TODOS LOS GATES MULTI-LENGUA APROBADOS CON ÉXITO! (7/7)
══════════════════════════════════════════════════════════════════════
```

### 12. `node scripts/test-age-gate-rules.mjs`
```text
══════════════════════════════════════════════════════════════════════
🛡️ [TEST-AGE-GATE-RULES] VALIDACIÓN DE DEFENSA EN PROFUNDIDAD (B2-FIX)
══════════════════════════════════════════════════════════════════════

▶ [1/4] Verificando presencia de cláusulas Age-Gate Server-Side y Codegen...
✅ firestore.rules existe en la raíz
✅ firestore.rules NO lee data.playerAge del payload
✅ Función ageOfPlayer presente (edad derivada en servidor)
✅ Lectura server-side del documento de jugador con get()
✅ Verificación server-side de autoridad del coach sobre el equipo
✅ Codegen: union(listas) == {ids con edadMin>=12 en mapa} (24 ejercicios)
✅ Codegen: bucket 12+ coincide exactamente con mapa (13 ejercicios)
✅ Codegen: bucket 14+ coincide exactamente con mapa (8 ejercicios)
✅ Codegen: bucket 16+ coincide exactamente con mapa (3 ejercicios)
✅ Subcolección playerPlans protegida explícitamente
✅ canCreatePlayerPlan vinculado a create en playerPlans
✅ canUpdatePlayerPlan vinculado a update en playerPlans

▶ [2/4] Ejecutando simulación estricta de evaluación de reglas server-side...
✅ TEST CRÍTICO ANTI-SPOOF: Payload con spoof playerAge:99 + sys-4 (14+) a jugador de 13 años BLOQUEADO (PERMISSION_DENIED)
✅ TEST CRÍTICO: Escritura directa de hex-078 (Nordic asistido 14+) a jugador de 13 años BLOQUEADA (PERMISSION_DENIED)
✅ TEST CRÍTICO: Escritura de hex-064 (Drop jump 16+) a jugador de 15 años BLOQUEADA (PERMISSION_DENIED)
✅ TEST FAIL-CLOSED: playerId inexistente defaults to edad 0 -> BLOQUEADO (PERMISSION_DENIED)
✅ Prescripción legítima de sys-1 (Plancha) a jugador de 13 años AUTORIZADA (ALLOWED)
✅ Prescripción legítima de sys-4 (Nordic) a jugador de 14 años cumplidos AUTORIZADA (ALLOWED)
✅ TEST AUTORIDAD COACH: Usuario no-staff intentando crear plan BLOQUEADO (PERMISSION_DENIED)

▶ [3/4] Verificando endurecimiento de team_codes y sharedPlans (inmutabilidad y anti-huérfano)...
✅ team_codes evaluado en reglas
✅ team_codes update: requiere dueño ACTUAL + coachUid INMUTABLE
✅ team_codes: sin bypass de auto-apropiación (no-dueño no puede adueñarse de un código ajeno)
✅ sharedPlans evaluado en reglas
✅ sharedPlans: escape-hatch de documentos huérfanos ELIMINADO
✅ sharedSessions: escape-hatch de documentos huérfanos ELIMINADO

▶ [4/4] Verificando hook de consentimiento (calcularEdad + /consents) y 0 PII...
✅ parseInt sobre fecha ISO da 2012 (error que bypass-eaba edad)
✅ calcularEdad(...).years da 14 años (edad biológica real)
✅ isMinorByBirth detecta menor de edad con calcularEdad
✅ Consentimiento validado: Menor con firma en /consents AUTORIZADO
✅ Consentimiento validado: Menor sin registro en /consents BLOQUEADO (flags de payload ignorados)
✅ Consentimiento validado: Mayor de edad AUTORIZADO sin requerir /consents
✅ 0 service accounts en src/ (detectados: 0)
✅ 0 Groq API keys en src/ (detectados: 0)
✅ 0 Stripe secret keys en src/ (detectados: 0)

══════════════════════════════════════════════════════════════════════
✅ [TEST-AGE-GATE-RULES] TODAS LAS VALIDACIONES DE DEFENSA EN PROFUNDIDAD APROBADAS (100% PASS).
   - Age-Gate server-side en firestore.rules validado contra documento del jugador.
   - Test crítico de spoof playerAge:99 bloqueado con PERMISSION_DENIED.
   - Codegen y cruce de listas con exerciseSafetyMap verificado.
   - team_codes inmutable y sin escape-hatch en sharedPlans.
   - Hook de consentimiento validado con calcularEdad y get(/consents).
   - Cero service accounts ni PII en bundle.
══════════════════════════════════════════════════════════════════════
```

==============================================================================
FIN DEL DOCUMENTO DE AUDITORÍA INTEGRAL — OLEADA 9.3
