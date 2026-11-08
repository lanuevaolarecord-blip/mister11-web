# MÍSTER 11 — DOCUMENTO DE ARQUITECTURA DE SOFTWARE (BUILD 95)

> **Míster 11** es una plataforma integral de gestión táctica, preparación física, control de minutos, prevención de lesiones y seguimiento integral para clubes de fútbol formativo y profesional.
> Diseñada bajo filosofía **Android-First / Web-PWA**, con motores deterministas puros, protocolo estricto multi-lengua N-Tier, aislamiento riguroso de privacidad de menores y gobernanza clínica con fail-closed.

---

## 1. CAPAS DE LA ARQUITECTURA

La arquitectura del sistema está organizada en 5 capas desacopladas con flujo unidireccional de datos:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN (UI/UX)                 │
│   React 19 + Tailwind CSS + Lucide Icons + PWA / Capacitor     │
│   Touch Targets >= 48dp | Paleta Estricta Tierra y Campo        │
├─────────────────────────────────────────────────────────────────┤
│                   CAPA DE CONTEXTOS Y REACTIVIDAD               │
│   AuthContext | TeamContext | LanguageContext | MatchContext   │
│   PizarraContext | ThemeContext                                │
├─────────────────────────────────────────────────────────────────┤
│                MOTORES PUROS DETERMINISTAS (CORE ENGINES)        │
│   lineupEngine | minutesEngine | ratingFormula | exerciseSafety │
│   100% funciones puras | Sin dependencias de UI ni red | Vitest │
├─────────────────────────────────────────────────────────────────┤
│                SISTEMA DE LOCALIZACIÓN E I18N DETERMINISTA      │
│   Canales A/B/C | Glosario canónico mat.* | Canonical Wordlist  │
│   Evaluación por pertenencia de celda | 6 lenguas simétricas    │
├─────────────────────────────────────────────────────────────────┤
│               INFRAESTRUCTURA, PERSISTENCIA Y OBSERVABILIDAD     │
│   Firestore Security Rules (Scope por playerId / equipo)        │
│   Sentry Web + Privacy-Safe Logger con Scrub de PII de Menores   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. MOTORES PUROS DETERMINISTAS (CORE ENGINES)

Los motores de cálculo residen en `src/utils/` y están desacoplados de React, del DOM y de Firebase. Cada uno se valida exhaustivamente mediante suites de pruebas unitarias (`npx vitest run --coverage`) con cobertura superior al 75% en líneas y funciones.

### 2.1. `lineupEngine.js` (Motor de Alineaciones y Convocatorias)
- **Propósito**: Gestiona la asignación de posiciones, titulares, suplentes y descartes en convocatorias de 11 a 18 jugadores.
- **Validaciones**:
  - Exactitud del 11 inicial por sistema táctico (4-3-3, 4-4-2, 3-5-2, etc.).
  - Restricción obligatoria de exactamente 1 guardameta titular.
  - Asignación de dorsales únicos sin duplicados.
  - Prevención de jugadores lesionados no aptos médicamente en la alineación.

### 2.2. `minutesEngine.js` (Motor de Minutos y Eventos de Partido)
- **Propósito**: Cálculo exacto de minutos jugados por futbolista a partir de los eventos del acta oficial (inicio, sustituciones, expulsiones, prórrogas).
- **Características**:
  - `calculateMinutesFromEvents`: Resuelve la distribución de tiempo sin solapamientos.
  - `cleanseImpossibleMatchEvents`: Sanea eventos cronológicamente incoherentes (sustituciones dobles en el mismo minuto, sustituciones de jugadores no alineados).
  - Normalización canónica de estados (`'programado'`, `'en_juego'`, `'finalizado'`).

### 2.3. `ratingFormula.js` (Cálculo Algorítmico de Rendimiento)
- **Propósito**: Calcula la calificación individual (1.0 a 10.0) de cada jugador combinando:
  - Minutos disputados y posición táctica.
  - Goles, asistencias, tarjetas amarillas/rojas.
  - Métricas defensivas y coeficiente de goles recibidos para porteros y defensas.
  - Penalizaciones por indisciplina o expulsión directa.

### 2.4. `exerciseSafety.js` y `exerciseSafetyMap.js` (Gobernanza de Seguridad Clínica)
- **Propósito**: Clasificación de ejercicios por nivel de riesgo y validación de aptitud médica.
- **Tiers de Riesgo**:
  - **Bajo Riesgo**: Ejercicios de movilidad y estabilidad básica ejecutables con supervisión estándar (`sys-1`, `sys-2`, `sys-3`, `sys-8`, `sys-9`).
  - **Alto Riesgo (G10 Fail-Closed)**: Ejercicios de alta exigencia excéntrica o articular (ej. Nordic curl, Copenhague, Drop jump, ejercicios cervicales, pliometría intensa).
- **Regla Clínica Estricta**: Si un ejercicio de alto riesgo tiene ilustración en estado pendiente o no verificada por especialista de salud, el sistema activa bloqueo conservador preventivo (*fail-closed*), impidiendo su asignación desatendida.

---

## 3. PROTOCOLO MULTI-LENGUA DETERMINISTA (I18N)

Míster 11 opera con 6 lenguas canónicas simétricas Tier 1: **Español (ES), Español Latinoamérica (ES-419), Inglés (EN), Portugués Brasil (PT), Francés (FR) y Bahasa Indonesia (ID)**.

### 3.1. Canales de Localización
- **Carril A (Nativo)**: Términos completamente traducidos y adaptados al dialecto futbolístico local.
- **Carril B (Cognados y Términos Comunes)**: Palabras con ortografía idéntica o cuasi-idéntica legítima entre lenguas (ej. `Total`, `Club`, `Video`).
- **Carril C (Excepciones Técnicas y Siglas Universales)**: Allowlist formal de siglas técnicas y marcas de producto (`MÍSTER11`, `FIFA`, `PDF`, `CSV`, `GPS`, `RPE`, `EVA`, `ACWR`, `DNI/NIE`).

### 3.2. Glosario Canónico `mat.*`
Los materiales de entrenamiento están formalizados en un vocabulario cerrado en las 6 lenguas (`mat.nordic_bench`, `mat.sofa`, `mat.dumbbell`, `mat.cones`, `mat.partner_hold`, etc.), garantizando paridad exacta sin cadenas sueltas.

### 3.3. Wordlist Determinista por Lengua (`src/i18n/wordlist/`)
- Mapeo canónico exacto de las **2.890 claves** en las 6 lenguas (**17.340 celdas**).
- La validación del gate evalúa la pertenencia positiva al término esperado en esa lengua.
- El clasificador léxico actúa únicamente como **backstop** de seguridad para atrapar contrabando o inyecciones foráneas.
- **Regla de Congelamiento**: Toda nueva clave agregada exige obligatoriamente presencia simétrica en las 6 lenguas; de lo contrario, el gate rompe en build (*fail-closed*).
- **Deudas con Dueño Registradas**:
  - `[PENDIENTE-DUEÑO: NAV-CHAT-ES]`: "Mister" en ES y ES-419 reservado para firma explícita del dueño.
  - `[PENDIENTE-NATIVA]`: 5 claves marcadas para rúbrica nativa (PT-TIPOGRAFÍA, ID-FÚTBOL, ID-REVISIÓN x3).

---

## 4. OBSERVABILIDAD, SEGURIDAD Y PROTECCIÓN DE MENORES (B6)

Míster 11 procesa información sensible de deportistas menores de edad. Se implementa una política estricta de **cero filtraciones de PII**:

### 4.1. Sanitización Automática (`src/utils/logger.js`)
- Función `scrubPII`: Intercepta cadenas, objetos y arrays en tiempo real.
- Redacta de forma determinista:
  - Nombres de jugadores menores y tutores -> `[REDACTED_MINOR_PII]`
  - Fechas de nacimiento (`birthDate`, `dob`, formatos YYYY-MM-DD y DD/MM/YYYY) -> `[REDACTED_DOB]`
  - Correos electrónicos -> `[REDACTED_EMAIL]`
  - Números telefónicos -> `[REDACTED_PHONE]`
  - Documentos de identidad (DNI/NIE) -> `[REDACTED_DNI_NIE]`
  - Tokens y credenciales -> `[REDACTED_SECRET]`

### 4.2. Sentry y Web Crash Reporting (`src/utils/sentryWeb.js`)
- Inicializado en `src/main.jsx`.
- Implementa `sentryBeforeSendScrubber`: ningún evento telemétrico se despacha al proveedor externo sin haber sido completamente sanitizado previamente.
- En entorno de producción (`import.meta.env.PROD`), los logs de depuración (`console.log`, `console.debug`) se silencian automáticamente.

### 4.3. Reglas de Seguridad en Firestore (`firestore.rules`)
- **Aislamiento por `playerId`**: Los planes individuales en la subcolección `playerPlans` están rigurosamente scopeados.
- **Validación de Relación de Equipo**:
  ```
  canCreatePlayerPlan(teamRel, request.resource.data) &&
  exists(playerDocPath(teamRel, request.resource.data.get('playerId', '')))
  ```
  Un entrenador del equipo A no puede leer ni escribir planes de un jugador perteneciente al equipo B.

---

## 5. REGLAS VISUALES Y ACCESIBILIDAD (WCAG 2.1 AA)

- **Paleta Estricta Tierra y Campo**:
  - `#1B3A2D`: Verde Selva (Fondos y tipografía de alto contraste).
  - `#4CAF7D`: Verde Campo (Aciertos, confirmaciones, acentos primarios).
  - `#D4A843`: Oro Institucional (Insignias, acentos y líneas estructurales).
  - `#9C6A3B`: Ocre Míster 11 (Bordes e iconos secundarios).
  - `#C85A32`: Terracota / Advertencia (Correcciones y alertas).
  - `#F7F5F0` / `#FFFFFF`: Pergamino y Blanco (Fondos de lectura clara).
- **Prohibición de Casi-Colores y Emojis**: Cero valores cromáticos no canónicos (ej. `#0D9488` teal eliminado de pizarra). Cero emojis decorativos en superficies institucionales.
- **Contraste Mínimo**:
  - Texto normal: >= 4.5:1 contra el fondo.
  - Iconos y elementos gráficos esenciales: >= 3.0:1.
- **Touch Targets**: Botones y elementos pulsables con dimensiones mínimas de **48x48 dp** optimizados para pulgar en dispositivos Android.

---

## 6. COMANDOS DE VERIFICACIÓN, LINTERS Y GATES

Para auditar y certificar la integridad completa del sistema:

### 6.1. Gate Maestro de Cierre Definitivo (`closure-gate`)
Evalúa la matriz completa de nombres de ejercicio, chip clínico, contrastes WCAG, escáner de superficies en las 6 lenguas y estado del deploy:
```bash
npm run closure-gate
```
*O con Node directamente:*
```bash
node scripts/closure-gate.mjs
```

### 6.2. Gate Estricto Multi-Lengua N-Tier (`ci-i18n-gate`)
Verifica simetría de 2.890 claves, integridad CLDR, ausencia de fugas, interpolación de placeholders y prueba de rotura simulada (*breakage test*):
```bash
npm run i18n:ci
```
*O con Node:*
```bash
node scripts/ci-i18n-gate.mjs
```

### 6.3. Test de Wordlist y Cierre Finito (`test-i18n-wordlist-closure`)
Verifica la pertenencia de las 17.340 celdas, la regla de congelamiento fail-closed y el estado de deudas declaradas:
```bash
node scripts/test-i18n-wordlist-closure.mjs
```

### 6.4. Batería de Pruebas Unitarias con Cobertura (`vitest`)
Ejecuta la suite de pruebas unitarias sobre los motores puros y verifica que la cobertura supere el 75%:
```bash
npm run test:vitest
```

### 6.5. Auditoría de Scrubbing y Protección de Menores
Valida la eliminación de PII y conteo de logs:
```bash
node scripts/test-logger-scrub.mjs
```

---

## 7. GOBERNANZA DEL PROYECTO

- **Build Actual**: Build 95 (Fase de Closed Testing en Google Play Console).
- **Regla Anti-Regresiones**: Ninguna modificación de arquitectura, esquema de colores ni flujo de navegación se fusiona sin propuesta formal y validación por tests de pertenencia automatizados.
- **Documentación Viva**: Todo hallazgo cerrado debe registrar su prueba de pertenencia en los scripts de CI correspondientes.
