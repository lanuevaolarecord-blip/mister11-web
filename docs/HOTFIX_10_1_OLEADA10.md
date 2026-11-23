# MÍSTER11 — HOTFIX-10.1: DOBLE CONTEO EN ESTADÍSTICAS (E1), PORTERO EN TOMA DE DATOS E INFORME (E2) Y Z-ORDER/SELECCIÓN EN PIZARRA (E3)

- **Build**: `95` (Closed Testing)
- **Rama**: `main`
- **HEAD de partida**: `926df4dd202386e4e5224a28f5487c24afb2aae9` (`926df4d`)
- **Estado del Gate Maestro**: `PASS-CON-DEUDA ⚠️` (`5` celdas `pending-native-5b`, `0` `DEFAULT-unknown`, `0` fallos)

---

## 1. Causa Raíz de E1 — Doble Conteo Temporal (`+2 -> +1`) en Botones de Estadísticas

### Diagnóstico Técnico
1. **Doble ID temporal en estado optimista (`localEvents` vs `useLiveStats.events` vs `onSnapshot`)**:
   - En `src/components/LiveStats.jsx`, al pulsar un botón de estadística (`handlePress`, `handlePlayerAction`, `innerAddLiveEvent`, `handleConfirmPlayerSelection`, `handleIndividualAction`, `handleIndividualCard`, botones de portero `gkAction` y contadores post-partido), la interfaz generaba un ID local `tempId = "local_" + Date.now() + ...` y añadía `localDoc` inmediatamente a `localEvents`.
   - A continuación invocaba `await hook(type, currentHalf, extraData)` (`useLiveStats.addLiveEvent`), el cual generaba un **segundo ID distinto** (`newId = "evt_" + Date.now() + ...`) y añadía síncronamente otra copia optimista a `liveStatsHook.events` antes de resolver `addDoc`, o bien Firestore disparaba `onSnapshot` con su `doc.id` definitivo de 20 caracteres antes de que el microtask de `await hook(...)` eliminara `tempId` de `localEvents`.
   - Como `rawEvents` en `LiveStats.jsx` deduplicaba únicamente comparando `baseIds.has(e?.id)`, durante los 100–600 ms de vuelo de `addDoc` coexistían en `rawEvents` la copia de `localEvents` (`id: local_...`) y la copia de `cleanBase` (`id: evt_...` o `id: doc.id`), haciendo que el contador del botón subiera de golpe en **+2** y, al resolverse la promesa y ejecutarse `setLocalEvents(prev => prev.filter(e => e.id !== tempId))`, bajara de **+2 a +1**.
2. **Ausencia de filtro de idempotencia ante eventos sintéticos**:
   - No existía un registro canónico de `eventId` ni una guardia contra el disparo cruzado `touchend`/`pointerup` + `click` sintético en un mismo gesto físico ni contra reintentos con el mismo `eventId`.

---

## 2. Solución Aplicada a E1 y Evidencia de Tests

### Archivos Creados / Modificados
- `src/utils/matchEventIdempotency.js` (nuevo motor puro):
  - `createMatchEventId(prefix, meta)`: genera un `eventId` único y determinista por acción (respetando `meta.eventId` en reintentos).
  - `mergeAndDedupeMatchEvents(...eventLists)`: reconcilia múltiples fuentes (`cleanBase`, `localEvents`, `matchDayEvents`) por clave canónica `eventId || clientEventId || id`. Si un mismo `eventId` está simultáneamente en `localEvents` y en `liveStatsHook.events` o `onSnapshot` (incluso con `doc.id` distinto de Firestore), mantiene **1 única instancia**.
  - `createActionIdempotencyGuard({ syntheticWindowMs, lockWhilePending })`: bloquea duplicados sintéticos de un mismo gesto físico (`touchend` + `click` sintético, mismo `gestureId` o `duplicate_event_id`) permitiendo 2 taps humanos deliberados consecutivos.
- `src/components/LiveStats.jsx` y `src/pages/Partidos.jsx`:
  - Todos los handlers de captura adquieren un `eventId` canónico mediante `idempotencyGuardRef.current.tryAcquire(...)` y lo propagan tanto a `localDoc` como al payload de `hook(type, half, { ...extra, id: tempId, eventId: tempId })`.
  - `rawEvents` en `LiveStats.jsx` y `effectiveLiveEvents` en `Partidos.jsx` usan `mergeAndDedupeMatchEvents(...)`.

### Casos Verificados en Tests (`src/utils/__tests__/pure-engines.test.js`)
- `1 tap => 1 incremento`, sin salto temporal a `+2` al coexistir copia optimista local, hook y `onSnapshot`: **PASS**
- `2 taps reales deliberados => 2 incrementos independientes`: **PASS**
- `tap + synthetic click / mismo gesto físico => 1 incremento`: **PASS**
- `reintento de red con mismo eventId, listener duplicado y cola offline => 1 incremento`: **PASS**

---

## 3. Causa Raíz de E2 — Portero No Agregado Correctamente en Toma de Datos e Informe

### Diagnóstico Técnico
1. **Detección restrictiva del rol de portero**:
   - `LiveStats.jsx` (línea 792) y `Partidos.jsx` (líneas 109, 682, 790) solo comprobaban `p.posicion === 'POR' || p.position === 'POR' || p.posicion === 'GK'`, ignorando variantes reales como `'Portero'`, `'PO'`, `'Goalkeeper'`, `'Arquero'`, `'Guardameta'`, roles en `customRoles` o el portero seleccionado en la barra individual. Cuando `activeGoalkeeper` resultaba `null`, los botones de portería grababan `playerId: null`.
2. **Omisión de eventos de portero en la Tabla e Informe Individual (`LiveStats.jsx` Tab 4 y `Partidos.jsx`)**:
   - En `LiveStats.jsx` (línea 2383), `paradas` solo contaba `countP('save_own')` e ignoraba `countP('save')` (que es el tipo emitido por el botón `"Parada"` del panel de portero), además de no calcular ni exponer `golesEncajados`, `penaltisParados`, `salidas`, `erroresGol`, `porteriaCero`, `golesEncajadosPor90` ni la nota específica de portero (`calcPerformanceScore`).
   - En el modal de Carga Post-Partido (`showPostMatchModal`), los porteros solo tenían contadores de jugador de campo y ningún contador de portería (`Paradas`, `Goles Encajados`, `Penalti Parado`, `Salidas`, `Error -> Gol`).
   - En `Partidos.jsx`, la Sección 9 (`SEC_GK`) y el modal de Vista Previa del Informe no mostraban el desglose individual del portero o porteros participantes (incluyendo sustituciones de portero y autogoles).

---

## 4. Solución Aplicada a E2 y Evidencia de Tests

### Archivos Creados / Modificados
- `src/utils/goalkeeperStats.js` (nuevo motor puro):
  - `isCanonicalGoalkeeper(playerOrRole, context)`: reconoce todas las variantes (`POR`, `PO`, `GK`, `Portero`, `Goalkeeper`, `Arquero`, `Guardameta`, `isGoalkeeper: true`).
  - `resolveActiveGoalkeeper(onPitchPlayersList, playersList, matchData, activePlayerId)`: resuelve de forma determinista el portero activo en cancha.
  - `computePlayerOnPitchIntervals(playerId, events, teamContext)` y `computeGoalkeeperMatchStats(player, matchEvents, teamContext)`: calcula `{ isGoalkeeper, minutesPlayed, goalsConceded, saves, normalSaves, decisiveSaves, penaltiesSaved, claims, errorGoal, cleanSheet, goalsAgainstPer90, savePct, gkExertionIndex, ratingInputs }` respetando tramos en cancha por sustituciones/expulsiones, deduplicando `gol_rival` + `conceded` por `rivalGoalId`/minuto y contabilizando autogoles (`own_goal` / `autogol`) como gol encajado del portero sin sumarlos como gol a favor del autor.
- `src/utils/ratingFormula.js`, `src/components/LiveStats.jsx` y `src/pages/Partidos.jsx`:
  - Integración completa de `computeGoalkeeperMatchStats` y `isCanonicalGoalkeeper` en `deriveStatsFromEvents`, `calcPerformanceScore`, Tab 4 (`StatsDataTable`), modal Post-Partido, cierre de acta (`handleFinishMatch`), Sección 9 (`SEC_GK`) y Vista Previa del Informe (`showReportPreview`).

### Casos Verificados en Tests (`src/utils/__tests__/pure-engines.test.js`)
- Portero titular 90' con 0 goles recibidos => `cleanSheet: true`, `goalsConceded: 0`, `goalsAgainstPer90: 0`: **PASS**
- Portero titular 90' con 2 goles recibidos => `cleanSheet: false`, `goalsConceded: 2`, `goalsAgainstPer90: 2`: **PASS**
- Portero sustituido al 45' (GK1 recibe 1 gol en 1T, GK2 recibe 1 gol en 2T) => cada portero suma 1 y el equipo suma 2 sin duplicar: **PASS**
- Jugador no portero => `isGoalkeeper: false`: **PASS**
- Autogol (`own_goal`) => cuenta como gol encajado del portero en cancha y NO como gol a favor del defensa: **PASS**

---

## 5. Causa Raíz de E3 — Z-Order de Formas y Selección de Cono Cerca de Jugador en Pizarra

### Diagnóstico Técnico
1. **Formas/cuadrados por encima de los jugadores (`ensurePlayersOnTop` y `preserveObjectStacking`)**:
   - En `src/pages/PizarraTactica.jsx` (líneas 273–279), `ensurePlayersOnTop` ejecutaba un único bucle `fc.getObjects().forEach(...)` haciendo `fc.bringToFront(obj)` tanto para `isPlayer` como para `isMaterial`. Cuando se insertaba una `zona_rectangular` (o material) después de los 11 jugadores, dicho objeto ocupaba el último índice del array y era enviado al frente **después** de los jugadores, quedando encima de ellos.
   - Además, `new fabric.Canvas(...)` no tenía `preserveObjectStacking: true`, por lo que al seleccionar o crear un cuadrado (`zone_rect` / `zona_rectangular`), Fabric.js lo renderizaba en la cima absoluta del canvas bloqueando el arrastre de los jugadores situados dentro.
2. **Dificultad para seleccionar un cono cerca de un jugador**:
   - Los jugadores tienen `BOARD_LAYERS.PLAYERS (40) > BOARD_LAYERS.TOOLS (30)` y un bounding box táctil de `48x48 px`, mientras que un cono tiene un tamaño visual de `~15 px`. El `findTarget` nativo de Fabric recorre el array de arriba abajo por bounding box, por lo que cualquier toque sobre el centro de un cono próximo a un jugador impactaba primero la caja extendida del jugador y seleccionaba siempre al jugador.

---

## 6. Solución Aplicada a E3 y Evidencia de Tests

### Archivos Creados / Modificados
- `src/utils/boardLayers.js` (nuevo motor puro):
  - Define la jerarquía inmutable `BOARD_LAYERS = { FIELD: 0, SHAPES: 20, TOOLS: 30, PLAYERS: 40, BALL: 50, UI_OVERLAY: 60 }`.
  - `classifyBoardObjectLayer(obj)`, `setBoardLayer(obj, layer)` y `reorderBoardCanvas(canvas)` ordenan determinísticamente todas las piezas en pasadas por capa y activan `canvas.preserveObjectStacking = true`.
- `src/utils/boardSelection.js` (nuevo motor puro):
  - `ensureMinTouchHitbox(obj, 48)`: garantiza un hitbox táctil invisible `>= 48x48 dp` para conos y herramientas pequeñas sin cambiar su tamaño visual.
  - `resolveBoardTargetAtPointer(canvas, pointer, options)` e `installSmartBoardSelection(canvas, getOptions)`: envuelve `canvas.findTarget` priorizando por modo (`auto | players | tools`), distancia al centro geométrico de cada pieza y especificidad de área (un toque en el centro de un cono gana frente al borde de la caja de 48dp de un jugador cercano, mientras que un toque en el torso del jugador selecciona al jugador; las formas `SHAPES` nunca bloquean a jugadores, balones ni conos).
- `src/pages/PizarraTactica.jsx`:
  - Integra `reorderBoardCanvas`, `ensureMinTouchHitbox` e `installSmartBoardSelection`.
  - Añade barra compacta de modo de selección (`Auto` / `Jugadores` / `Materiales`, `>= 48x48 dp`) y selector flotante por **Long-Press (420 ms)** (`pizarra-overlap-picker`) cuando el usuario mantiene pulsado sobre un solape ambiguo.

### Casos Verificados en Tests (`src/utils/__tests__/pure-engines.test.js`)
- Insertar 11 jugadores y luego insertar un cuadrado => todos los jugadores tienen `zIndex > shape.zIndex` y siguen arrastrables encima del cuadrado: **PASS**
- Cono solapado con jugador => tap en centro del cono selecciona el cono (`modo Auto`), tap en torso del jugador selecciona el jugador, modos `Players`/`Tools` filtran explícitamente, y hitbox del cono `>= 48x48 dp`: **PASS**
- 10 reproducciones de animación en reposo => `1` balón, `0` líneas teal residuales, trayectorias doradas (`#D4A843`) limpias en reposo y `0` deriva de formación: **PASS**

---

## 7. Salida Literal de `node scripts/closure-gate.mjs`

```text
  • Resultado de Auditoría:
      1. 118/118 nombres de ejercicio 100% nativos en las 5 lenguas (2950/2950 celdas, 0 U, 0 divergencias).
      2. Chip clínico de fallback con identidad de markup y contraste WCAG AA >= 4.5:1 (11.15:1 claro / 12.73:1 oscuro).
      3. Matriz 6x6 reconciliada (618 celdas): 0 fugas foráneas, 0 DEFAULT-unknown, 5 celdas en deuda [PENDIENTE-NATIVA] (1 PT + 4 ID).
      4. Cero bypasses vencidos y 0 cognados espurios (FR 'plan' saneado con acento léxico).
      5. Telemetría P6 neutralizada en producción y Vitest >= 75% de cobertura en motores puros.
==============================================================================
RESULTADO: PASS-CON-DEUDA ⚠️ (0 fallos activos; 5 celdas pending-native-5b pendientes de curación nativa)
==============================================================================
GATE_EXIT=0
```

---

## 8. Salida Literal de `npx tsc --noEmit`

```text
TSC_EXIT=0
```

---

## 9. Salida Literal de `npx vitest run --coverage`

```text
 RUN  v5.1.0 C:/Users/jhojan/Desktop/MISTER 11/mister11-web
      Coverage enabled with v8

 ✓ src/utils/__tests__/lineup18.test.js (2 tests) 17ms
 ✓ src/utils/__tests__/pure-engines.test.js (52 tests) 46ms
 ✓ src/utils/__tests__/teamCodeValidation.test.js (6 tests) 5ms

 Test Files  3 passed (3)
      Tests  60 passed (60)
   Start at  14:04:39
   Duration  543ms (import 46%, transform 25%, worker 18%, tests 11%)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   85.36 |    67.36 |   91.96 |   88.32 |                   
 data              |     100 |     86.2 |     100 |     100 |                   
  ...eSafetyMap.js |     100 |     86.2 |     100 |     100 | 30,59,74-78       
 utils             |   84.91 |    67.01 |   91.66 |   87.93 |                   
  ...ciseSafety.js |   89.31 |     77.3 |   93.75 |   91.37 | ...56,325,357-359 
  lineupEngine.js  |   91.22 |    84.93 |     100 |   90.56 | ...66,227,249,253 
  ...alGlossary.js |     100 |    91.66 |     100 |     100 | 197               
  minutesEngine.js |   79.05 |    57.43 |   85.71 |    83.6 | ...05,894,901,921 
  ratingFormula.js |   98.93 |    84.83 |     100 |     100 | ...50,272-273,276 
-------------------|---------|----------|---------|---------|-------------------
VITEST_EXIT=0
```

---

## 10. Salida Literal de `git diff --stat` y `git diff --name-status`

### `git diff --stat`
```text
 src/components/LiveStats.jsx             | 435 +++++++++++++++--------
 src/pages/Partidos.jsx                   | 235 +++++++++++--
 src/pages/PizarraTactica.jsx             | 310 ++++++++++++++--
 src/utils/__tests__/pure-engines.test.js | 585 +++++++++++++++++++++++++++++++
 src/utils/ratingFormula.js               | 106 +++---
 5 files changed, 1427 insertions(+), 244 deletions(-)
```

### `git diff --name-status` (y archivos nuevos acotados de `HOTFIX-10.1`)
```text
M	src/components/LiveStats.jsx
M	src/pages/Partidos.jsx
M	src/pages/PizarraTactica.jsx
M	src/utils/__tests__/pure-engines.test.js
M	src/utils/ratingFormula.js
A	src/utils/matchEventIdempotency.js
A	src/utils/goalkeeperStats.js
A	src/utils/boardLayers.js
A	src/utils/boardSelection.js
A	docs/HOTFIX_10_1_OLEADA10.md
```
