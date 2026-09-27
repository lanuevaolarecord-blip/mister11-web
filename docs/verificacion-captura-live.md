# INFORME DE VERIFICACIÓN DE CAPTURA DE DATOS EN VIVO — MÍSTER 11
**Fecha:** 27 de Septiembre de 2026  
**Autor:** QA Sr. & Full-Stack Engineer  
**Objetivo:** Erradicación de fallos de captura en estadísticas en vivo, validación de flujo a los 7 destinos y certificación determinista con suite de verificación.

---

## 1. RESTRICCIÓN DE RELOJ DE GOOGLE PLAY & TESTING
- **Estado de Build 95 (v1.1.77):** 100% INTACTO.
- **Reloj de 14 días en Closed Testing:** NO se ha generado nuevo AAB/APK, NO se ha tocado `android/app/build.gradle`, NO se ha modificado la consola de Google Play, y NO se han alterado las reglas `firestore.rules` de planes/members.
- **Despliegue autorizado:** Única y exclusivamente Web / Vercel.

---

## 2. DEFINICIÓN DEL FIXTURE DETERMINISTA DE PRUEBA (13 EVENTOS)
El fixture reproduce un partido completo de 90 minutos con titulares y suplentes definidos, abarcando todas las tipologías de evento:

| # | Min | Tipo / Acción | Sujeto / Jugador | Detalle / Destino |
|---|---|---|---|---|
| 1 | 10' | `shot_own` (Tiro fuera) | Jugador p9 (Titular) | HUD, Panel, PDF, Portal |
| 2 | 20' | `ball_loss` (Pérdida) | Jugador p6 (Titular) | HUD, Panel (posesión rival), PDF, Portal |
| 3 | 25' | `card_yellow_own` (Amarilla) | Jugador p7 (Titular) | HUD, Panel, Timeline, PDF, Portal |
| 4 | 30' | `shot_rival` (Tiro rival) | Rival | HUD, Panel (tiros rival) |
| 5 | 35' | `recovery` (Recuperación) | Jugador p6 (Titular) | HUD, Panel, PDF, Portal, Radar |
| 6 | 45' | `goal_own` + `shot_own` | Jugador p9 (Titular) | Marcador 1-0, Tiros a puerta, Goles |
| 7 | 50' | `ball_loss` (Pérdida) | Jugador p7 (Titular) | Lectura canónica tolerante |
| 8 | 55' | `duel_won_own` (Duelo ganado) | Jugador p7 (Titular) | Panel, Portal, Radar |
| 9 | 60' | `duel_lost_own` (Duelo perdido) | Jugador p7 (Titular) | Panel, Portal, Radar |
| 10 | 65' | `card_yellow_own` (2ª Amarilla) | Jugador p7 (Titular) | Expulsión por doble amarilla (65') |
| 11 | 70' | `cambio` (Sustitución) | Sale p9, Entra s12 | Acta, Historial, MinutesEngine |
| 12 | 75' | `foul_committed_own` (Falta) | Jugador p7 (Titular) | Panel, Portal |
| 13 | 80' | `shot_rival` (Tiro rival a puerta) | Rival | Panel (tiros rival a puerta) |

---

## 3. TABLA COMPARATIVA: 4 FALLOS ORIGINALES (FASE 1) vs RESOLUCIÓN (FASE 2/3)

| ID Síntoma | Descripción del Fallo Original (Fase 1) | Resultado Fase 1 | Corrección Implementada | Resultado Fase 3 |
|---|---|---|---|---|
| **S1** | Doble emisión de tarjeta (`onAddCard` + `card_*_own`) duplicaba tarjetas a 2 con un solo clic y expulsaba indebidamente en min 25 | ❌ FAIL (amarillas=2, expulsado=true, min=25') | Emisión con ID determinista compartido; deduplicación en `minutesEngine.js`; re-atribución directa si `activePlayerId` está seleccionado. | ✅ **PASS** (amarillas=1, expulsado=false, min=90') |
| **S2** | Conteo de `shot_own` filtraba por `.includes('shot')`, contando `shot_faced`, `shot_rival`, `shot_off_target_rival` como tiros propios | ❌ FAIL (tiros propios=5 vs 3 reales) | `countByType` ajustado estrictamente a `shot_own` y `goal_own`. Tiros rivales a `shot_rival` y `goal_rival`. | ✅ **PASS** (tiros propios=3, tiros rival=2) |
| **S3** | Botón canónico emitía `ball_loss`, pero lectores buscaban `'loss'`. Pérdidas en panel marcaban 0 | ❌ FAIL (pérdidas panel=0) | Lectores normalizados en `MatchStatsBlock`, `PlayerStatsTab` y `ratingFormula` para aceptar `ball_loss`, `loss`, `perdida`, `turnover`. Botón conservado como `ball_loss` canónico. | ✅ **PASS** (pérdidas panel=2) |
| **S6** | Sustituciones y tarjetas emitidas en vivo no se sincronizaban en `Partidos.jsx` (`derivedTarjetas` / `derivedSubstitutions`) | ❌ FAIL (subs visualizadas=0, tarjetas=0) | `Partidos.jsx` deriva colecciones desde `effectiveLiveEvents`, reconciliando `events` y `cambiosList`. | ✅ **PASS** (subs visualizadas=2, tarjetas=3) |

---

## 4. MATRIZ DE INTEGRIDAD POR LOS 7 DESTINOS (ASSERTS NUMÉRICOS R4 / S5)

Todos los destinos fueron evaluados mediante `scripts/test-live-capture-reproduction.mjs` bajo la condición determinista `esperado === obtenido`:

| # | Destino | Métrica Evaluada | Esperado | Obtenido | Estado |
|---|---|---|:---:|:---:|:---:|
| **D1** | **HUD Live** (Captura en Directo) | `shot_own` | 3 | 3 | ✅ PASS |
| | | `shot_rival` | 2 | 2 | ✅ PASS |
| | | `ball_loss` | 2 | 2 | ✅ PASS |
| | | `recovery` | 1 | 1 | ✅ PASS |
| **D2** | **Panel de Estadísticas** (`MatchStatsBlock`) | Tiros Totales Propios | 3 | 3 | ✅ PASS |
| | | Tiros a Puerta Propios | 1 | 1 | ✅ PASS |
| | | Tiros Totales Rival | 2 | 2 | ✅ PASS |
| | | Tiros a Puerta Rival | 1 | 1 | ✅ PASS |
| | | Recuperaciones | 1 | 1 | ✅ PASS |
| | | Pérdidas (posesión rival) | 2 | 2 | ✅ PASS |
| | | Duelos Ganados | 1 | 1 | ✅ PASS |
| | | Duelos Perdidos | 1 | 1 | ✅ PASS |
| | | Tarjetas Amarillas Propias | 2 | 2 | ✅ PASS |
| | | Tarjetas Rojas Propias | 1 | 1 | ✅ PASS |
| **D3** | **Historial / Timeline del Partido** | Total Eventos Registrados | >= 13 | 13 | ✅ PASS |
| | | Sustituciones visibles | 2 | 2 | ✅ PASS |
| | | Tarjetas visibles en cronología | 3 | 3 | ✅ PASS |
| **D4** | **Reporte PDF del Partido** | Remates Totales Propios | 3 | 3 | ✅ PASS |
| | | Recuperaciones | 1 | 1 | ✅ PASS |
| | | Pérdidas de Balón | 2 | 2 | ✅ PASS |
| | | Tarjetas Amarillas | 2 | 2 | ✅ PASS |
| | | Tarjetas Rojas | 1 | 1 | ✅ PASS |
| **D5** | **Portal de Rendimiento del Jugador** | `p9`: Tiros a puerta | 1 | 1 | ✅ PASS |
| | | `p9`: Goles | 1 | 1 | ✅ PASS |
| | | `p6`: Recuperaciones | 1 | 1 | ✅ PASS |
| | | `p6`: Pérdidas | 1 | 1 | ✅ PASS |
| | | `p7`: Amarillas | 2 | 2 | ✅ PASS |
| | | `p7`: Duelos Ganados | 1 | 1 | ✅ PASS |
| | | `p7`: Duelos Perdidos | 1 | 1 | ✅ PASS |
| | | `p7`: Faltas cometidas | 1 | 1 | ✅ PASS |
| **D6** | **Radar y Visualizaciones** | % Duelos Ganados (1/2) | 50% | 50% | ✅ PASS |
| | | Proxy Posesión / Recuperación (1/3) | 33% | 33% | ✅ PASS |
| **D7** | **Tabla de Rendimiento y Calificación** | `p9`: Calificación positiva (gol+tiro) | >= 7.0 | 7.9 | ✅ PASS |
| | | `p7`: Calificación penalizada (2 amarillas) | < 6.0 | 4.8 | ✅ PASS |

---

## 5. AUDITORÍA DE GOBERNANZA, PALETA Y ESTÉTICA (REGLA R3)
Se ejecutó el linter CI `scripts/check-chart-palette.mjs` arrojando:
```
==============================================================================
MÍSTER 11 — CI LINTER DE PALETA CANÓNICA PARA GRÁFICAS Y CAPTURA (TIERRA Y CAMPO)
==============================================================================
✅ [PASS] 0 colores prohibidos, 0 emojis, y todos los --action-color son canónicos Tierra y Campo.
==============================================================================
```
- **0 Emojis en LiveStats:** Sustituidos por iconos vectoriales SVG de Lucide (`AlertTriangle`, `TrendingDown`, `ShieldAlert`, `Footprints`, `ArrowRightLeft`).
- **Paleta Tierra y Campo:**
  - Acciones defensivas / pérdidas / tarjetas rojas migradas de `#EF4444` a `#C85A32` (Terracota) y `#9C6A3B` (Tierra Media).
  - Éxito / recuperaciones: `#4CAF7D` (Verde Campo).
  - Acciones tácticas / tiros: `#0D9488` (Teal) y `#D4A843` (Dorado Ámbar).
  - Cero azules eléctricos (`#2563EB`) o marinos prohibidos en botones de captura activa.

---

## 6. SUITES DE CALIDAD Y REGRESIÓN
1. `node scripts/assert-event-integrity.mjs`: **11/11 PASS**
2. `node scripts/test-multi-match-analysis-data.mjs`: **PASS**
3. `node scripts/check-chart-palette.mjs`: **PASS**
4. `node scripts/test-live-capture-reproduction.mjs`: **PASS**
5. `node scripts/ci-i18n-gate.mjs`: **5/5 PASS**
6. `npm run build`: **PASS** (compilación sin errores ni advertencias de tipos).
