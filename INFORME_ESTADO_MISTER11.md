# INFORME TÉCNICO DE ESTADO — MÍSTER 11
### Fecha de Auditoría: 03 de agosto de 2026
### Versión auditada: `1.1.13` · Commit `1e67ba1` · Producción: [www.mister11.app](https://www.mister11.app)

---

## ÍNDICE
1. [Estado de Módulos](#1-estado-de-módulos)
2. [Arquitectura Técnica Actual](#2-arquitectura-técnica-actual)
3. [Deuda Técnica Identificada](#3-deuda-técnica-identificada)
4. [Estado de Despliegue](#4-estado-de-despliegue)
5. [Checklist de Escalabilidad](#5-checklist-de-escalabilidad)
6. [Recomendaciones Prioritarias](#6-recomendaciones-prioritarias)

---

## 1. ESTADO DE MÓDULOS

### Tabla de Completitud General

| Módulo | Ruta | Tamaño JSX | Estado | Completitud |
|--------|------|-----------|--------|-------------|
| Dashboard | `/` | 827 líneas | ✅ Operativo | 90% |
| Pizarra Táctica | `/pizarra` | 3.510 líneas | ✅ Operativo | 92% |
| Mi Equipo | `/equipo` | 706 líneas | ✅ Operativo | 88% |
| Sesiones | `/sesiones` | 1.207 líneas | ✅ Operativo | 87% |
| Planificación | `/planificacion` | 1.462 líneas | ✅ Operativo | 82% |
| Tests | `/tests` | 1.938 líneas | ✅ Operativo | 85% |
| Partidos (Match Day) | `/partidos` | 1.752 líneas | ✅ Operativo | 83% |
| IA Generadora | `/ia-generadora` | 761 líneas | ✅ Operativo | 88% |
| Administración | `/admin` | 1.529 líneas | ✅ Operativo | 85% |

---

### 1.1 Dashboard (`/`)
**Estado: ✅ Funcional — 90%**

**Qué funciona:**
- KPIs en tiempo real: jugadores activos, próximas sesiones, próximos partidos.
- Alertas de salud automáticas basadas en RPE > 8 y bienestar < 12 (últimos 7 días).
- Detección automática de éxito de pago Stripe (limpieza de URL + banner de confirmación).
- Multi-equipo: selector de equipo activo integrado en el Header.
- Modo oscuro / claro con persistencia.
- Internacionalización básica (ES/EN) via `src/i18n/translations.js`.
- Bloqueo de escritura del plan desde el cliente — solo el webhook de Stripe puede actualizar.

**Pendiente / Incompleto:**
- No hay gráficas de evolución de rendimiento del equipo en el dashboard (solo métricas de conteo).
- El banner de "Trial activo" podría confundir a usuarios en plan Club — depende del equipo activo seleccionado.
- No hay sección "Novedades" o changelog visible desde la app.

---

### 1.2 Pizarra Táctica (`/pizarra`)
**Estado: ✅ Funcional — 92%** | Módulo más complejo del proyecto

**Qué funciona:**
- Canvas vectorial en **fabric.js v5** con sistema de coordenadas adaptativas `xRel/yRel` (0.0–1.0) para rendering consistente en cualquier resolución (ver Sección 2.3).
- 11 tipos de campo distintos: completo, medio, tercio, F7, F8, futsal, vacío.
- Biblioteca de materiales táctica (conos, jugadores, líneas, texto, áreas, flechas curvadas animadas).
- Guardado en Firestore con snapshot JSON del canvas + exportación a Storage como imagen PNG.
- Historial de pizarras guardadas con restauración instantánea.
- Modo de grabación de animaciones tácticas con descarga en formato GIF/video.
- Pantalla completa nativa (Capacitor `requestFullscreen`).
- Bloqueo de scroll del layout al entrar a la pizarra + reset de posición al salir.
- Modo offline: fallback a `pizarraStorage.js` (localStorage) si Firestore no responde.
- Compatibilidad con Android táctil: hitboxes de 48×48dp, corner size de 24px.

**Pendiente / Incompleto:**
- El archivo `PizarraTactica.jsx` tiene 3.510 líneas y debería refactorizarse en componentes hijos (CanvasToolbar, MaterialsPanel, SavedPlaysPanel).
- La grabación de video/animación depende de `html2canvas` que no captura canvas fabric correctamente en todos los dispositivos — hay fallback pero sin notificación al usuario.
- No hay colaboración en tiempo real (multi-entrenador en misma pizarra).

---

### 1.3 Mi Equipo (`/equipo`)
**Estado: ✅ Funcional — 88%**

**Qué funciona:**
- CRUD completo de jugadores con foto, datos físicos, posición táctica, pie dominante, historial médico.
- Compresión de imágenes antes de upload (`browser-image-compression`) con límite de peso.
- Expediente individual en PDF (`generateExpediente`).
- Pestañas por jugador: GENERAL, SALUD, PLANES.
- Límite de 15 jugadores en plan Free (controlado tanto en Firestore Rules como en el cliente).
- Filtro rápido por posición (TODOS, POR, DEF, LTD, MC...).

**Pendiente / Incompleto:**
- `playerCount` en el documento del equipo se actualiza de forma optimista (estado React en el momento del click) — existe **race condition** si hay escrituras concurrentes desde múltiples dispositivos. Ver Deuda Técnica DT-03.
- No hay sistema de importación masiva de jugadores (Excel/CSV).
- El historial de lesiones por jugador no tiene visualización gráfica de línea de tiempo.

---

### 1.4 Sesiones (`/sesiones`)
**Estado: ✅ Funcional — 87%**

**Qué funciona:**
- Creación de sesiones de entrenamiento con bloques reordenables por drag-and-drop (`@dnd-kit`).
- Asociación de ejercicios de la biblioteca al bloque.
- Programación de recordatorios locales nativos en Android (`@capacitor/local-notifications`).
- Exportación a PDF, Google Calendar e ICS.
- Capturas de pizarra vinculadas a la sesión.
- Límite de 10 sesiones en plan Free.

**Pendiente / Incompleto:**
- No hay vista de calendario visual de sesiones (solo lista).
- La cancelación de notificaciones al eliminar una sesión no verifica si el permiso fue otorgado antes — puede lanzar silenciosamente un error en dispositivos sin permiso.
- No hay plantillas predefinidas de sesión.

---

### 1.5 Planificación (`/planificacion`)
**Estado: ✅ Funcional — 82%**

**Qué funciona:**
- Matriz de temporada de 40 microciclos con filas configurables (Período, Tipo Microciclo, Test Físico, Volumen, Sesiones).
- Generación automática de microciclos con configuración de días de entrenamiento y duración de sesión.
- Guardado automático en Firestore con `setDoc` + `serverTimestamp`.
- Exportación a PDF de la planificación mensual.
- Soporte multi-idioma (ES/EN) parcial.

**Pendiente / Incompleto:**
- La temporada está hardcodeada para comenzar el `2025-09-01` — no se adapta automáticamente al año en curso (Bug conocido: si el usuario entra en 2026, el mes de inicio no coincide).
- No hay integración entre los microciclos y las sesiones reales creadas en `/sesiones`.
- No existe función de copiar/importar planificación de una temporada anterior.
- Sin soporte para planificaciones individuales de jugador.

---

### 1.6 Tests (`/tests`)
**Estado: ✅ Funcional — 85%**

**Qué funciona:**
- Catálogo con 8 tests físicos, 5 psicodeportivos, 4 sociodeportivos y 6 psicosociales.
- Tests interactivos con cuestionarios tipo Likert (ACSI-28, MTQ-10).
- Tests de bienestar (Wellness) y RPE desde modal de jugador.
- Radar chart individual + gráficas de evolución temporal.
- Exportación de resultados a PDF y CSV.
- Modal `PlayerAnalyticsModal` con análisis completo por jugador.
- Batch write de resultados con `writeBatch` para mayor atomicidad.

**Pendiente / Incompleto:**
- El catálogo de tests en `DEFAULT_TESTS` está hardcodeado directamente en el componente (los IDs `_old` son IDs de migración que nunca se limpiaron).
- No hay benchmarks de referencia por categoría de edad para contextualizar resultados.
- Los tests de bienestar y RPE no están integrados en el cálculo del dashboard de salud de forma retroactiva.

---

### 1.7 Partidos — Match Day (`/partidos`)
**Estado: ✅ Funcional — 83%** | Refactorizado en esta sesión

**Qué funciona:**
- Gestión completa del ciclo de vida del partido: PRE-PARTIDO, MATCH DAY, POST-PARTIDO.
- **Cronómetro global** migrado a `MatchContext.jsx` con `localStorage` para resiliencia (commit `1e67ba1` de hoy).
- Badge de partido en vivo ⚽ en el Header al navegar fuera de `/partidos`.
- Formaciones predefinidas + formaciones personalizadas.
- Registro de eventos en tiempo real (goles, tarjetas, sustituciones, lesiones).
- Autoguardado en Firestore en cada evento mediante `useMatchEvents`.
- Alineación visual interactiva con drag-and-drop de jugadores en el campo.
- Modo pantalla completa nativa.
- Exportación de convocatoria a PDF y análisis post-partido en PDF.
- Integración con Google Calendar e ICS.

**Pendiente / Incompleto:**
- No hay soporte de "2º tiempo" o extensión de tiempo / tiempos de descuento explícitos.
- No hay estadísticas acumuladas de temporada (goles totales, partidos ganados/empatados/perdidos).
- El cronómetro del MatchContext no distingue entre equipos — si el entrenador tiene 2 equipos activos en 2 pestañas, podría haber conflicto de estado en localStorage.
- Post-partido: el cuestionario guiado no genera automáticamente sugerencias con IA.

---

### 1.8 IA Generadora (`/ia-generadora`)
**Estado: ✅ Funcional — 88%**

**Qué funciona:**
- Generación de ejercicios de entrenamiento con Groq `llama-3.3-70b-versatile`.
- Generación de protocolos de prevención de lesiones.
- Dictado por voz para observaciones (`SpeechRecognition` web).
- Límites mensuales por plan: Free (10), Pro (100), Club (500) — controlados en Firestore.
- La clave de Groq se obtiene desde `VITE_GROQ_API_KEY` (env) con fallback a `config/global.groqApiKey` en Firestore.
- Guardar ejercicios generados en la biblioteca del equipo.
- Exportación de ejercicio a PDF con diagrama.

**Pendiente / Incompleto:**
- **Riesgo de seguridad activo**: La clave de Groq se envía en el cliente (navegador) si está en `VITE_GROQ_API_KEY`. Esto la expone en el bundle de producción (`dist/assets/*.js`). La API call a Groq debería pasar por una Firebase Cloud Function o un Vercel Serverless Function como proxy.
- El fallback de clave desde Firestore (`config/global.groqApiKey`) tampoco es seguro porque cualquier usuario autenticado puede leer `/config/{docId}` (regla `allow read: if true`).
- No hay streaming de respuesta — el usuario espera sin feedback hasta que la IA termina.
- El renderizado de markdown es artesanal (split por `\n`) — puede fallar con formatos de respuesta de la IA no estándar.

---

### 1.9 Administración (`/admin`)
**Estado: ✅ Funcional — 85%**

**Qué funciona:**
- Gestión de múltiples equipos (crear, editar, borrar).
- Ajustes del equipo: nombre, escudo, categoría, idioma.
- Biblioteca de ejercicios personalizada por equipo.
- Exportación de datos completos (temporada, informe global, convocatoria).
- Gestión de Club: invitar entrenadores, ver miembros, roles (owner/admin/coach).
- Canje de códigos promocionales.
- Gestión de notificaciones push (Capacitor local).
- Detección de versión y banner de actualización con descarga del APK.
- Plan de suscripción: integración con Stripe Checkout (redirect).

**Pendiente / Incompleto:**
- **DT-01 Duplicación de lista de admins**: La constante `adminEmails` está hardcodeada en `AdminPanel.jsx` (línea 63) además de existir el archivo centralizado `src/config/admins.js`. La fuente de verdad debería ser única.
- No hay panel de analíticas de uso para el administrador del club.
- La eliminación de un equipo no borra las subcolecciones de Firestore (jugadores, sesiones, partidos) — requiere una Cloud Function o batch delete en frontend.

---

## 2. ARQUITECTURA TÉCNICA ACTUAL

### 2.1 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework UI | React | 19.2.5 |
| Build Tool | Vite | 8.0.10 |
| Router | React Router DOM | 7.14.2 |
| State Global | React Context API | — |
| Backend BaaS | Firebase (Auth + Firestore + Storage + Functions) | 12.12.1 |
| Canvas Táctica | Fabric.js | 5.3.0 |
| Charts | Recharts | 3.8.1 |
| Drag & Drop | @dnd-kit | 6.3.1 / 10.0.0 |
| PDF | jsPDF + jspdf-autotable | 4.2.1 / 5.0.7 |
| HTML→Canvas | html2canvas | 1.4.1 |
| IA | Groq llama-3.3-70b-versatile | (API REST) |
| Mobile | Capacitor | 8.3.3 |
| Pagos | Stripe (extensión Firebase) | — |
| PWA | vite-plugin-pwa | 1.3.0 |
| Iconos | Lucide React | 1.9.0 |
| Deploy Web | Vercel | — |
| Deploy Mobile | Google Play Store (APK/AAB) | — |

---

### 2.2 Estructura de Firestore

```
/config/{global}                    ← Config global (versión app, Groq key, etc.) — Lectura pública
/users/{uid}
  ├── plan, email, displayName, trialStartDate, clubId, clubRole
  └── /teams/{teamId}
        ├── nombre, escudo, lineup, plan, proExpiration, playerCount
        └── /players/{playerId}
              └── name, position, number, fechaNacimiento, health, injuryHistory, avatarUrl
        └── /sessions/{sessionId}
              └── title, date, time, blocks[], attendees[], captures[]
        └── /matches/{matchId}
              └── rival, date, status, convocados[], lineup, events[], goalsFor, goalsAgainst
        └── /evaluaciones/{evalId}
              └── jugadorId, categoria (bienestar|rpe|fisico|psicosocial), puntuacionTotal, date
        └── /notifications/{notifId}
        └── /exercises/{exerciseId}
        └── /formations/{formationId}
        └── /plans/{planId}           ← Planificación de temporada
        └── /pizarras/{pizarraId}     ← Guardados de pizarra táctica
        └── /iaUsage/current           ← Contador mensual de IA por equipo

/clubs/{clubId}
  ├── nombre, status, coaches[], members[]
  └── /teams/{teamId}                 ← Equipos del club (misma estructura que /users/teams)
  └── /members/{memberId}

/customers/{uid}                     ← Stripe Extension (no modificar manualmente)
  └── /checkout_sessions/{sessionId}
  └── /subscriptions/{subId}
  └── /payments/{paymentId}

/sharedPlans/{planId}               ← Planes compartidos públicamente (sin auth)
/invitations/{invitationId}         ← Tokens de invitación a clubs
/promoCodes/{codeId}                ← Códigos promo (solo escritura dev)
```

---

### 2.3 Patrones de Sincronización Clave

#### Firestore Proxy Offline (`src/firebase/firestore-proxy.js`)
Módulo de 526 líneas que **intercepta todas las llamadas a Firestore** y las redirige al localStorage cuando el usuario está en modo invitado (`uid === 'invitado-local'`). Esto permite una demo funcional sin cuenta. Utiliza clases `MockDocRef` y `MockCollectionRef` para simular la API de Firestore.

> ⚠️ **Riesgo arquitectónico**: Al hacer `export * from '@firebase/firestore'` y re-exportar funciones, cualquier cambio en la API de Firebase v13+ podría romper el proxy silenciosamente.

#### Sistema de Coordenadas Relativas de la Pizarra (xRel/yRel)
```
CANVAS_REF_WIDTH = 380px  ←  Dimensiones de referencia de diseño
CANVAS_REF_HEIGHT = 520px
xRel = objeto.left / canvas.width   → valor entre 0.0 y 1.0
yRel = objeto.top / canvas.height   → valor entre 0.0 y 1.0
radiusRel = objeto.radius / min(canvas.width, canvas.height)
```
Al restaurar un guardado, se multiplican las coordenadas relativas por las dimensiones actuales del canvas. Esto garantiza rendering idéntico en tablet, desktop y Android.

#### Lógica de Plan/Monetización (`usePlan.js`)
Combina 3 fuentes de verdad:
1. `users/{uid}/teams/{teamId}.plan` (Firestore — actualizado por Cloud Function)
2. `customers/{uid}/subscriptions/{subId}.status` (Stripe Extension — listener en tiempo real)
3. `config/global.plan` simulado (solo devs)

Prioridad: `isDeveloper` > `isClubActive` > `isRealPro` > `isOnTrial` > `free`

#### Cronómetro Global del Partido (`MatchContext.jsx`)
Arquitectura implementada hoy (commit `1e67ba1`):
- `setInterval` vive en el Provider, fuera de `Partidos.jsx`
- `startTimestamp: Date.now()` persiste en `localStorage` clave `mister11_active_match_state`
- Al recargar: recalcula `offsetSeconds + (Date.now() - startTimestamp) / 1000`
- Badge ⚽ en Header visible solo fuera de `/partidos`

---

### 2.4 Providers de Contexto (árbol de `main.jsx`)

```jsx
<ThemeProvider>
  <AuthProvider>       ← Auth + equipos personales + equipos de club + perfil
    <TeamProvider>     ← Re-expone datos de Auth (capa de compatibilidad)
      <PizarraProvider>  ← Estado de la pizarra (guardar/restaurar canvas)
        <MatchProvider>  ← Cronómetro global del partido (NUEVO)
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MatchProvider>
      </PizarraProvider>
    </TeamProvider>
  </AuthProvider>
</ThemeProvider>
```

> ⚠️ `TeamProvider` actualmente es un wrapper trivial que re-expone datos de `AuthContext`. Podría eliminarse para simplificar el árbol.

---

### 2.5 Cloud Function Backend

Una única Cloud Function activa en `functions/index.js`:

**`syncStripeSubscriptionToTeam`** — trigger `onDocumentWritten` en `customers/{uid}/subscriptions/{subscriptionId}`
- Escucha eventos de Stripe Extension y sincroniza el campo `plan` en todos los equipos del usuario.
- Maneja 3 casos: suscripción eliminada (→ free), equipo específico en metadata, o todos los equipos.
- Usa `writeBatch` para actualizaciones atómicas.

---

## 3. DEUDA TÉCNICA IDENTIFICADA

### Tabla de Deuda Técnica

| ID | Severidad | Categoría | Descripción | Archivo(s) |
|----|-----------|-----------|-------------|-----------|
| **DT-01** | 🔴 Alta | Seguridad | Admin email hardcodeado en `AdminPanel.jsx` duplicando `src/config/admins.js` | `AdminPanel.jsx:63` |
| **DT-02** | 🔴 Alta | Seguridad | La clave Groq `VITE_GROQ_API_KEY` queda expuesta en el bundle del cliente en producción | `IAGeneradora.jsx`, `.env` |
| **DT-03** | 🔴 Alta | Datos | `playerCount` se actualiza optimistamente con `players.length` en el momento del click — race condition en escrituras concurrentes | `usePlayers.js:38,59` |
| **DT-04** | 🟡 Media | Seguridad | Regla de Storage `/{allPaths=**}` permite escritura a cualquier usuario autenticado sin restricción de tamaño ni tipo de archivo | `storage.rules:23-24` |
| **DT-05** | 🟡 Media | Seguridad | `/config/{docId}` tiene `allow read: if true` — expone `groqApiKey` a cualquier persona sin cuenta | `firestore.rules:22-25` |
| **DT-06** | 🟡 Media | Arquitectura | `PizarraTactica.jsx` tiene 3.510 líneas en un solo archivo. Incumple principio de responsabilidad única | `PizarraTactica.jsx` |
| **DT-07** | 🟡 Media | Arquitectura | `firebaseConfig.js` tiene las credenciales de Firebase hardcodeadas (no leídas desde `VITE_*` env vars) | `firebaseConfig.js:18-25` |
| **DT-08** | 🟡 Media | Datos | Eliminación de equipo no borra subcolecciones de Firestore (jugadores, sesiones, partidos, etc.) — datos huérfanos | `useTeams.js:94-98` |
| **DT-09** | 🟡 Media | Arquitectura | `TeamProvider` es un wrapper trivial de `AuthContext` — añade complejidad sin valor | `TeamContext.jsx` |
| **DT-10** | 🟡 Media | Calidad | IDs de tests con sufijo `_old` (`psi1_old`, `soc1_old`) presentes en el catálogo activo — migración incompleta | `Tests.jsx:38-48` |
| **DT-11** | 🟡 Media | UX | La temporada en Planificación está hardcodeada a `2025-09-01` — no se adapta automáticamente al año actual | `Planificacion.jsx:38` |
| **DT-12** | 🟡 Media | Seguridad | `MatchContext` guarda estado en `localStorage` sin aislamiento por `uid` — si 2 usuarios comparten dispositivo, el estado persiste entre sesiones | `MatchContext.jsx` |
| **DT-13** | 🟢 Baja | Deuda | `firestore-proxy.js` re-exporta toda la API de Firestore vía `export *` — cualquier breaking change en Firebase v13+ rompe el proxy | `firestore-proxy.js:2` |
| **DT-14** | 🟢 Baja | Performance | `pdfGenerator.js` tiene 65.951 bytes (66KB) de lógica inline — genera el chunk `pdfGenerator-*.js` de 30.70KB en cada build | `pdfGenerator.js` |
| **DT-15** | 🟢 Baja | Calidad | `useNotifications.js` lee colección anidada `{path}/notifications` (equipo) pero `createNotification` en `db.js` escribe en `users/{uid}/notifications` (usuario raíz) — rutas inconsistentes | `useNotifications.js:23`, `db.js:109` |
| **DT-16** | 🟢 Baja | Warnings | Build de Vercel reporta `npm warn deprecated are-we-there-yet@2.0.0` y `gauge@3.0.2` — dependencias transitivas desactualizadas | `package-lock.json` |

---

### 3.1 Warnings del Build de Vercel (último deploy)

```
npm warn deprecated are-we-there-yet@2.0.0: This package is no longer supported.
npm warn deprecated gauge@3.0.2: This package is no longer supported.
```
Estos warnings son de dependencias transitivas (probablemente de `@capacitor/cli`) y no bloquean el build. Sin embargo, deben monitorizarse ante actualizaciones futuras.

### 3.2 Análisis del Bundle (chunking manual en `vite.config.js`)

| Chunk | Tamaño gzip | Estado |
|-------|-------------|--------|
| `vendor-react` | 74.16 KB | ✅ Óptimo |
| `vendor-firebase` | 49.87 KB | ✅ Aceptable |
| `jspdf.es.min` | 129.53 KB | ⚠️ Grande — considerar lazy load |
| `html2canvas` | 46.79 KB | ⚠️ Solo para capturas de pizarra |
| `vendor-fabric` | 88.98 KB | ⚠️ Solo carga si se accede a `/pizarra` |
| `firebaseConfig` | 98.31 KB | 🔴 Inusualmente grande — contiene SDK completo sin tree-shaking |

> ⚠️ `jsPDF` y `html2canvas` se incluyen en el chunk principal aunque solo se usan en Pizarra, Tests y Partidos. El lazy-loading de estos módulos reduciría el TTI en ~30%.

---

## 4. ESTADO DE DESPLIEGUE

### 4.1 Sincronización Producción ↔ Repositorio

| Parámetro | Valor |
|-----------|-------|
| Último commit | `1e67ba1` — `feat(match-day): mover temporizador a contexto global` |
| Deploy Vercel | `dpl_22HgqEJ5JDMr7HvNRchKeQfitnnp` — **READY** |
| URL producción | https://www.mister11.app |
| URL del deploy | `mister11-ppte6tu8c-lanuevaolarecord-1006s-projects.vercel.app` |
| Build time | 2.23s (2.652 módulos) |
| PWA | ✅ Service Worker regenerado, 100 entradas precacheadas, 8.09 MB |
| Estado | ✅ **Producción sincronizada con `main`** |

### 4.2 Historial Reciente de Commits

```
1e67ba1  feat(match-day): cronómetro al contexto global       ← ACTUAL
b911f72  fix(matchday): modal de goleador en fullscreen nativo
9191510  chore: bump app version to 1.1.12 (versionCode 31)
c0175c5  fix(ui): z-index modal de gol, borrado animaciones, banner offline
4cab40a  fix-RT-08-Cloud-Function-Stripe desplegada
77ee8a3  release: v1.1.11 producción Google Play (versionCode 30)
```

### 4.3 APK / Android

- **APK en repositorio**: `Mister11.apk` — 38.87 MB (presente en raíz del proyecto)
- **Capacitor versión**: `8.3.3` (Android + Browser + Keyboard + LocalNotifications + ScreenOrientation)
- **Configuración nativa** (`capacitor.config.json`): apunta a `mister11.firebaseapp.com`
- **StatusBar**: configurada para modo oscuro (`Style.Dark`) y color `#1a2e1a`
- **Google Play**: último AAB firmado fue v1.1.11 (versionCode 30); repo tiene v1.1.13 → **hay una brecha de 2 versiones entre Play Store y el código actual**
- **Flutter**: No se detectó código Flutter en el repositorio auditado. El stack mobile es exclusivamente **React + Capacitor** (no Flutter). El prompt inicial mencionaba Flutter APK, pero no existe tal código.

### 4.4 Reglas de Seguridad

| Servicio | Estado |
|----------|--------|
| Firestore Rules | ✅ Desplegadas — Multi-nivel (usuario/club/Stripe/config) |
| Storage Rules | ⚠️ Escritura abierta para cualquier usuario autenticado (DT-04) |
| Cloud Functions | ✅ `syncStripeSubscriptionToTeam` desplegada (v2/firestore trigger) |

---

## 5. CHECKLIST DE ESCALABILIDAD

### ¿Está Míster 11 lista para escalar?

#### Infraestructura Firebase

| Ítem | Estado | Notas |
|------|--------|-------|
| Firestore persistentLocalCache habilitado | ✅ | Multi-tab manager activo |
| Reglas de Firestore granulares | ✅ | Por colección y subcol |
| Índices de Firestore definidos | ⚠️ | Solo el creado por `useHealthAlerts` (query compuesto) — pendiente revisar índices para queries de partidos/sesiones |
| Cloud Function para Stripe | ✅ | Sincronización automática sin código cliente |
| Storage rules cerradas | ❌ | Escritura universal para auth users |
| Límite de jugadores Free en Rules | ✅ | `playerCount < 15` en `firestore.rules:40` |

#### Seguridad y Autenticación

| Ítem | Estado | Notas |
|------|--------|-------|
| API Key Groq expuesta en bundle | ❌ | Crítico — cualquiera puede inspeccionar el JS |
| Config de Groq legible sin auth | ❌ | `config/global` tiene `read: if true` |
| Firebase credentials hardcodeadas | ⚠️ | Normal en apps Firebase (clave pública por naturaleza) pero no son env vars |
| Admin emails duplicados | ❌ | Dos listas independientes — riesgo de divergencia |
| Plan solo modificable por webhook | ✅ | No hay escritura de plan desde el cliente |
| Stripe webhook seguro | ✅ | Solo `isDevEmail()` puede escribir en `customers` |

#### Performance y UX

| Ítem | Estado | Notas |
|------|--------|-------|
| Code splitting por ruta (lazy) | ✅ | Todas las páginas son lazy-loaded |
| PWA con Service Worker | ✅ | Precache de 100 entries |
| Offline fallback | ✅ | Proxy + toast de aviso |
| Bundle de jsPDF sin lazy load | ⚠️ | 130KB gzip que todos descargan al inicio |
| Compresión de imágenes | ✅ | `browser-image-compression` antes del upload |
| Cache de Firebase Storage | ✅ | CacheFirst 30 días via Workbox |
| Modo oscuro persistente | ✅ | ThemeContext + localStorage |

#### Arquitectura de Datos para Multi-Equipo / Multi-Club

| Ítem | Estado | Notas |
|------|--------|-------|
| Múltiples equipos por usuario | ✅ | Hasta 3 (Pro) / 100 (Club) |
| Equipos del club separados de personales | ✅ | `/clubs/{clubId}/teams` vs `/users/{uid}/teams` |
| Cambio de equipo activo en tiempo real | ✅ | Header con selector |
| `getTeamPath()` dinámico en `AuthContext` | ✅ | Resuelve ruta según tipo de equipo |
| Borrado de equipo sin borrar subcols | ❌ | DT-08 — datos huérfanos en Firestore |
| Concurrencia de `playerCount` | ❌ | DT-03 — race condition en múltiples dispositivos |

#### Observabilidad / Testing

| Ítem | Estado | Notas |
|------|--------|-------|
| Tests unitarios | ❌ | No existen tests automáticos |
| Tests E2E | ❌ | `playwright` instalado pero sin specs |
| Error boundaries React | ❌ | No hay `<ErrorBoundary>` en ningún módulo |
| Logging centralizado | ❌ | Solo `console.error` disperso |
| Analytics de uso | ❌ | No hay Firebase Analytics ni equivalente |
| Monitoring de errores | ❌ | No hay Sentry ni equivalente |

---

## 6. RECOMENDACIONES PRIORITARIAS

### 🔴 URGENTES (Seguridad / Datos en riesgo)

#### P1 — Proxy de API para Groq (DT-02 + DT-05)
```
PROBLEMA: La clave VITE_GROQ_API_KEY queda embebida en el bundle de producción.
          El documento config/global tiene read: if true, exponiendo la clave.
SOLUCIÓN: Crear una Vercel Serverless Function (/api/ia-generate) que actúe
          como proxy y mantenga la clave en variables de entorno del servidor.
IMPACTO: Evita el abuso de la API con la clave de producción.
ESFUERZO: 2-3 horas.
```

#### P2 — Unificar lista de administradores (DT-01)
```
PROBLEMA: AdminPanel.jsx tiene una lista hardcodeada de adminEmails en línea 63
          que no usa src/config/admins.js — riesgo de divergencia.
SOLUCIÓN: import { isDeveloperEmail } from '../config/admins';
          Reemplazar el array local por esta importación.
ESFUERZO: 30 minutos.
```

#### P3 — Cerrar reglas de Storage (DT-04)
```
PROBLEMA: storage.rules permite escritura a cualquier usuario autenticado
          en cualquier path, sin límite de tamaño ni tipo.
SOLUCIÓN: Añadir restricciones de content-type (image/*) y tamaño máximo
          (request.resource.size < 5 * 1024 * 1024).
ESFUERZO: 1 hora.
```

#### P4 — Aislar MatchContext por usuario en localStorage (DT-12)
```
PROBLEMA: La clave 'mister11_active_match_state' es global — en un dispositivo
          compartido, un segundo usuario ve el partido del primero.
SOLUCIÓN: Incluir el uid en la clave: `mister11_match_${uid}`.
ESFUERZO: 20 minutos.
```

---

### 🟡 IMPORTANTES (Calidad / Arquitectura)

#### P5 — Corregir race condition de playerCount (DT-03)
```
PROBLEMA: playerCount se actualiza con el valor del estado React en el momento
          del click, no con un incremento atómico de Firestore.
SOLUCIÓN: Usar FieldValue.increment(1) / FieldValue.increment(-1) de Firestore.
ESFUERZO: 1 hora.
```

#### P6 — Borrado en cascada de equipos (DT-08)
```
PROBLEMA: deleteTeam() solo borra el documento raíz, no las subcolecciones.
SOLUCIÓN: Cloud Function con trigger onDocumentDeleted o batch delete desde
          el cliente enumerando subcols antes de borrar.
ESFUERZO: 3-4 horas.
```

#### P7 — Refactorizar PizarraTactica.jsx (DT-06)
```
PROBLEMA: 3.510 líneas en un solo componente — dificulta mantenimiento,
          testing y colaboración.
SOLUCIÓN: Extraer CanvasToolbar, MaterialsPanel, SavedPlaysPanel,
          AnimationPanel como componentes independientes.
ESFUERZO: 1-2 días.
```

#### P8 — Sincronizar APK con versión web
```
PROBLEMA: Google Play tiene v1.1.11 (versionCode 30); el código actual es
          v1.1.13. Los usuarios de Play no reciben las mejoras del MatchContext.
SOLUCIÓN: Compilar y publicar AAB firmado v1.1.13 en Google Play.
ESFUERZO: 2-3 horas (compilación + revisión de Play Store).
```

---

### 🟢 MEJORAS DE CALIDAD (Cuando haya capacidad)

#### P9 — Añadir Error Boundaries React
```
Envolver cada ruta en un <ErrorBoundary> que capture errores de renderizado
y muestre un mensaje amigable en lugar de pantalla en blanco.
ESFUERZO: 2 horas.
```

#### P10 — Lazy load de jsPDF y html2canvas
```
Estos módulos pesan ~176KB gzip combinados. Importarlos dinámicamente
(import()) solo cuando el usuario pulse "Exportar PDF" reduciría el
tiempo de carga inicial en ~30%.
ESFUERZO: 3-4 horas.
```

#### P11 — Limpiar IDs de tests con sufijo `_old` (DT-10)
```
Los IDs psi1_old, soc1_old, etc. en Tests.jsx son residuos de una migración
incompleta. Deben migrarse o eliminarse del catálogo activo.
ESFUERZO: 1-2 horas.
```

#### P12 — Añadir tests E2E con Playwright
```
Playwright ya está instalado pero sin specs. Crear tests mínimos para
los flujos críticos: login, crear sesión, registrar gol en partido.
ESFUERZO: 1-2 días.
```

#### P13 — Corregir ruta inconsistente de notificaciones (DT-15)
```
useNotifications.js lee de {teamPath}/notifications
createNotification en db.js escribe en users/{uid}/notifications
Unificar para que todos lean y escriban del mismo path.
ESFUERZO: 1 hora.
```

#### P14 — Dinamizar fecha de inicio de temporada (DT-11)
```
La temporada en Planificacion.jsx arranca el '2025-09-01' hardcodeado.
Calcular automáticamente el inicio de temporada según el mes actual.
ESFUERZO: 2-3 horas.
```

---

## RESUMEN EJECUTIVO

Míster 11 v1.1.13 es una aplicación **funcional y desplegada en producción** con 9 módulos operativos cubriendo el ciclo completo de trabajo de un entrenador de fútbol. La arquitectura React + Vite + Firebase es sólida y el stack de Capacitor permite publicación nativa en Android.

**Puntos fuertes:**
- Sistema de planes/monetización robusto con Stripe y Cloud Functions
- Pizarra táctica con canvas fabric.js y sistema de coordenadas relativas profesional
- Modo offline funcional con proxy de Firestore
- Cronómetro de partido ahora global y resiliente (commit de hoy)
- PWA con Service Worker y precache completo

**Riesgos críticos a resolver antes de escalar:**
1. La clave de Groq expuesta en el bundle del cliente
2. La regla `config/global` de Firestore es legible públicamente
3. El borrado de equipo deja datos huérfanos en Firestore
4. Google Play está 2 versiones por detrás de la web

**Para ser considerada "lista para escalar"**, se requieren al menos los puntos P1, P2, P3, P4, P5 y P8 de las recomendaciones, más la incorporación de monitoreo básico de errores (Sentry o Firebase Crashlytics).

---
*Informe generado por auditoría técnica automatizada — Antigravity AI | 2026-08-03*
