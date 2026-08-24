# 📋 INFORME MAESTRO — MÍSTER11
## Auditoría de Producto, Competitividad y Estrategia de Lanzamiento
**Fecha de generación:** 24 de agosto de 2026
**Versión auditada:** `1.1.45` (versionCode `60`)
**Preparado para:** Fundadores / Inversores / Equipo de producto

---

## 1. 🏟️ IDENTIDAD DEL PROYECTO

| Campo | Valor |
|---|---|
| **Nombre del producto** | Míster11 |
| **Descripción** | Plataforma SaaS de gestión integral para entrenadores y cuerpos técnicos de fútbol formativo (Sub-6 a Sub-18) y fútbol amateur |
| **Versión web (`package.json`)** | `1.1.45` |
| **Bundle ID Android** | `com.mister11.app` |
| **versionCode Android** | `60` |
| **URL de producción** | https://www.mister11.app |
| **Firebase Project ID** | `mister11` |
| **Dominio verificado** | `mister11.app` (marca verificada en Google) |
| **Fase Play Store** | Prueba cerrada (Internal Testing) |
| **Target de mercado** | Entrenadores fútbol formativo Sub-6 a Sub-18 y fútbol amateur hispanohablante |
| **Monetización** | Free / Pro (7,99 €/mes) / Club (39,99 €/mes) + Trial 7 días |

---

## 2. ⚙️ STACK TECNOLÓGICO

### Frontend Web
| Tecnología | Versión | Rol |
|---|---|---|
| React | 18.x | Framework UI principal |
| React Router DOM | 6.x | Enrutamiento SPA |
| Vite | 8.x | Bundler / Dev server |
| vite-plugin-pwa | — | Service Worker / PWA offline |
| Fabric.js | 5.3.0 | Canvas interactivo para pizarra táctica |
| jsPDF + jspdf-autotable | 4.x | Generación de informes PDF |
| html2canvas | 1.4.1 | Captura de canvas a PNG / MP4 |
| Groq SDK | — | LLM para IA generadora de ejercicios |
| DOMPurify | — | Sanitización XSS de outputs de IA |
| @dnd-kit | 6.x | Drag & drop en sesiones y convocatorias |
| browser-image-compression | 2.0.2 | Compresión de imágenes de jugadores |
| lucide-react | — | Iconografía vectorial |
| Recharts | — | Gráficas de datos y estadísticas |

### Backend / Servicios Cloud
| Tecnología | Versión / Rol |
|---|---|
| Firebase JS SDK | 12.x |
| Cloud Firestore | Base de datos principal + caché offline persistente |
| Firebase Authentication | Email/Password + Google OAuth + Anónimo |
| Firebase Storage | Imágenes, avatares, escudos de equipos |
| Firebase Hosting | Despliegue web de producción |
| Firebase Extensions | Run Payments with Stripe (extensión oficial) |
| Stripe | Checkout + Webhooks para suscripciones Pro/Club |
| Groq API | LLM (LLaMA 3 / Mixtral) para generación de ejercicios |
| Vercel Serverless | Funciones serverless (`/api/ia-generate`) |

### Android Nativo (Capacitor)
| Tecnología | Versión |
|---|---|
| Capacitor | 8.x |
| @capacitor-firebase/authentication | — (Google Sign-In nativo Android) |
| @capacitor/local-notifications | — |
| @capacitor/share | — |
| @capacitor/filesystem | — |
| @capacitor/status-bar | — |
| minSdkVersion | 24 (Android 7.0) |
| targetSdkVersion | 34 (Android 14) |
| Keystore | `mister11.keystore` (firma v1 + v2) |

---

## 3. 📱 MÓDULOS Y FUNCIONALIDADES

### 3.1 Rutas activas del router (`App.jsx`)

| Ruta | Módulo | Archivo | Tamaño | Plan |
|---|---|---|---|---|
| `/` | Landing Page | `LandingPage.jsx` | 26 KB | Público |
| `/dashboard` | Dashboard principal | `Dashboard.jsx` | 38 KB | Free |
| `/pizarra` | Pizarra Táctica | `PizarraTactica.jsx` | 135 KB | Free/Pro |
| `/equipo` | Mi Equipo | `MiEquipo.jsx` | 50 KB | Free |
| `/sesiones` | Sesiones de entrenamiento | `Sesiones.jsx` | 90 KB | Free (max 10)/Pro |
| `/planificacion` | Planificación de temporada | `Planificacion.jsx` | 69 KB | Pro |
| `/tests` | Tests físicos y psicológicos | `Tests.jsx` | 112 KB | Pro |
| `/partidos` | Partidos y Live Stats | `Partidos.jsx` | 115 KB | Pro |
| `/ia` | IA Generadora de ejercicios | `IAGeneradora.jsx` | 31 KB | Free (5 gen.)/Pro |
| `/player` | Portal del Jugador | `PlayerDashboard.jsx` | — | Pro |
| `/admin` | Panel de administración | `AdminPanel.jsx` | 84 KB | Dev Only |
| `/demo` | Modo demo público | `DemoMode.jsx` | 14 KB | Público |
| `/login` | Autenticación | `Login.jsx` | — | Público |
| `/join-team` | Unirse a equipo | `JoinTeam.jsx` | 20 KB | Público |
| `/accept-invitation` | Aceptar invitación | `AcceptInvitation.jsx` | 14 KB | Público |
| `/shared-session/:id` | Sesión compartida pública | `SharedSession.jsx` | — | Público |
| `/shared-plan/:id` | Plan compartido público | `SharedPlan.jsx` | — | Público |
| `/consentimiento` | Formulario RGPD | `ConsentForm.jsx` | 24 KB | Público |
| `/consentimiento-firma` | Firma consentimiento | `ConsentimientoFirma.jsx` | 17 KB | Público |
| `/instalar` | Instrucciones de instalación PWA | `Instalar.jsx` | — | Público |

### 3.2 Hooks de datos (`src/hooks/` — 23 archivos)

| Hook | Función |
|---|---|
| `useTeams.js` | Gestión de equipos, cambio de equipo activo |
| `usePlayers.js` | Jugadores del equipo activo |
| `useSessions.js` | Sesiones de entrenamiento (Firestore) |
| `useExercises.js` | Biblioteca de ejercicios del entrenador |
| `useCaptures.js` | Capturas de la pizarra táctica |
| `usePlan.js` | Lógica central de planes Free/Pro/Club + límites |
| `useMatches.js` | Partidos del equipo |
| `useMatchEvents.js` | Eventos en tiempo real de partido |
| `useLiveStats.js` | Estadísticas live del partido (Firestore onSnapshot) |
| `useAttendance.js` | Control de asistencia a sesiones y partidos |
| `useIAUsage.js` | Límites y contador de uso de la IA |
| `useHealthAlerts.js` | Alertas automáticas de salud del jugador |
| `useLocalNotifications.js` | Notificaciones locales (Capacitor) |
| `useNotifications.js` | Notificaciones in-app |
| `usePWA.js` | Detección de instalación PWA |
| `useOfflineStatus.js` | Detección de estado offline/online |
| `useTranslation.js` | Sistema i18n ES/EN |
| `useSettings.js` | Configuración de usuario |
| `useCustomFormations.js` | Formaciones personalizadas de pizarra |
| `usePlayerPlans.js` | Planes de mejora asignados al jugador |
| `usePlayerSeasonStats.js` | Estadísticas acumuladas de temporada del jugador |
| `useTeamMembers.js` | Miembros del equipo y roles del cuerpo técnico |
| `useClub.js` | Datos del club (modo Club multi-equipo) |

### 3.3 Utilidades de documentos (`src/utils/` — 19 archivos)

| Utilidad | Función |
|---|---|
| `pdfGenerator.js` (73 KB) | PDF de sesión completa: bloques, ejercicios, imágenes |
| `pdfTheme.js` (12 KB) | Tema visual PDF + conversión imagen→PNG universal |
| `matchPdfReport.js` (20 KB) | Informe PDF del partido con estadísticas individuales |
| `attendancePdfReport.js` (6 KB) | Informe PDF de asistencia mensual |
| `exportMonthlyPlan.js` (6 KB) | PDF del plan mensual de planificación |
| `teamReportGenerator.js` (7 KB) | Informe consolidado del equipo |
| `sessionSharing.js` (7 KB) | Lógica de compartir sesión/plan por enlace público |
| `downloadCSV.js` (2 KB) | Exportación CSV de estadísticas de equipo |
| `download.js` (8 KB) | Descarga de archivos (APK, PDF, MP4) |
| `calcularEdad.js` (3 KB) | Cálculo de edad desde fecha de nacimiento |
| `formaciones.js` (5 KB) | Definiciones de formaciones tácticas predefinidas |
| `playerMatchStats.js` (7 KB) | Cálculo de estadísticas agregadas por jugador |
| `normalizeInput.js` | Normalización NFC para acentos en PDFs |
| `seedData.js` (6 KB) | Datos de muestra para modo demo |
| `calendarHelper.js` (3 KB) | Utilidades para el calendario de planificación |
| `teamCode.js` (3 KB) | Generación y validación de códigos de equipo |
| `uploadImage.js` | Compresión y subida de imágenes a Firebase Storage |
| `toast.js` | Sistema de notificaciones toast |

### 3.4 Componentes principales (`src/components/`)

| Componente | Rol |
|---|---|
| `LiveStats.jsx` (46 KB) | Estadísticas en vivo del partido multi-dispositivo |
| `MultiMatchAnalysis.jsx` (31 KB) | Análisis de tendencias de múltiples partidos |
| `PlayerAnalyticsModal.jsx` (19 KB) | Análisis avanzado individual del jugador |
| `TeamAttendanceTab.jsx` (32 KB) | Control de asistencia del equipo |
| `TeamStaffTab.jsx` (34 KB) | Gestión del cuerpo técnico y roles |
| `BlockEditor.jsx` (11 KB) | Editor de bloques de sesión de entrenamiento |
| `ExerciseLibrary.jsx` (9 KB) | Biblioteca de ejercicios con filtros |
| `UpgradeModal.jsx` (21 KB) | Modal de conversión Free→Pro/Club (Stripe) |
| `InviteCoachModal.jsx` (7 KB) | Invitación de entrenador colaborador |
| `CustomFormationModal.jsx` (8 KB) | Creador de formaciones personalizadas |
| `AssignPlanModal.jsx` (8 KB) | Asignación de planes de mejora a jugadores |
| `SignatureCanvas.jsx` (4 KB) | Firma digital táctil para consentimientos RGPD |
| `LiveFieldSession.jsx` (12 KB) | Modo Campo: control en tiempo real del entrenamiento |
| `RPETestModal.jsx` (3 KB) | Test RPE post-sesión por jugador |
| `WellnessTestModal.jsx` (2 KB) | Check-in diario de bienestar del jugador |
| `ErrorBoundary.jsx` (4 KB) | Captura global de errores React |

### 3.5 Portal del Jugador (`src/components/player/` — 10 archivos)

| Componente | Pestaña | Función |
|---|---|---|
| `PlayerHomeTab.jsx` (11 KB) | 🏠 GENERAL | Perfil, dorsal, posición, resumen de temporada |
| `PlayerProfileTab.jsx` (41 KB) | 💪 FÍSICO | Altura, peso, IMC, historial físico completo |
| `PlayerStatsTab.jsx` (18 KB) | 📊 ESTADÍSTICAS | Goles, asistencias, minutos, tarjetas, nota media |
| `PlayerPlansPortalTab.jsx` (8 KB) | 📋 PLANES | Planes de mejora asignados por el entrenador |
| `PlayerScheduleTab.jsx` (10 KB) | 📅 AGENDA | Calendario de sesiones y partidos del jugador |
| `PlayerAutonomousTestsTab.jsx` (17 KB) | 🧠 TESTS | ACSI-28, MTQ-10, Cohesión de Equipo, Metas Individuales |
| `PlayerBottomNav.jsx` | 🔽 NAV | Bottom navigation exclusiva del portal del jugador |

---

## 4. 💰 MONETIZACIÓN Y PAGOS

### 4.1 Planes y Límites (extraídos de `usePlan.js` — objeto `LIMITS`)

| Característica | FREE | PRO (7,99 €/mes) | CLUB (39,99 €/mes) |
|---|:---:|:---:|:---:|
| Equipos gestionables | 1 | 3 | 40 |
| Jugadores por equipo | 23 | 23 | 23 |
| Sesiones de entrenamiento | 10 | 1.000 | 1.000 |
| Exportación PDF / CSV | ❌ | ✅ | ✅ |
| IA Generadora (gen./equipo) | 5 | 1.000 | 1.000 |
| Pizarra táctica (exportar) | Limitada | ✅ | ✅ |
| Exportación MP4 de jugadas | ❌ | ✅ | ✅ |
| Live Stats partidos | ❌ | ✅ | ✅ |
| Tests físicos completos | ❌ | ✅ | ✅ |
| Portal del Jugador | ❌ | ✅ | ✅ |
| Planificación macro (PDF) | ❌ | ✅ | ✅ |
| Multi-usuario cuerpo técnico | ❌ | ❌ | ✅ |
| Panel administrativo de club | ❌ | ❌ | ✅ |
| Soporte prioritario 24/7 | ❌ | ❌ | ✅ |
| Trial gratuito | 7 días PRO | — | — |

### 4.2 Flujo de Pago Stripe (verificado en `UpgradeModal.jsx`)

```
1. Usuario llega a paywall → se abre UpgradeModal (PRO / CLUB)
2. Clic en "EMPEZAR CON PRO" → createStripeCheckoutSession()
3. Se crea doc en Firestore: customers/{uid}/checkout_sessions/{id}
4. Firebase Extension escucha → genera URL de Stripe Checkout
5. Redirect a Stripe Checkout (página segura de Stripe)
6. Pago exitoso → redirect a /dashboard?payment=success
7. Webhook Stripe → actualiza customers/{uid}/subscriptions
8. usePlan.js detecta via onSnapshot → isPro = true → desbloqueo inmediato
```

### 4.3 Paywalls activos (verificados en código fuente)

| Punto de paywall | Módulo origen | Plan requerido |
|---|---|---|
| Crear sesión número 11 | Sesiones | Pro |
| Exportar cualquier PDF | Sesiones, Partidos, Tests, Planificación | Pro |
| Generar ejercicio número 6 con IA | IA Generadora | Pro |
| Acceder a Live Stats de partido | Partidos | Pro |
| Acceder a Tests Físicos avanzados | Tests | Pro |
| Crear equipo número 2 | Mi Equipo | Pro |
| Crear equipo número 4 | Mi Equipo | Club |
| Acceder al Portal del Jugador | Portal | Pro |
| Exportar MP4 de pizarra táctica | Pizarra | Pro |

### 4.4 Códigos Promocionales

| Código | Tipo | Duración | Estado |
|---|---|---|---|
| `BETA2026` | Hardcoded en `UpgradeModal.jsx` | 90 días PRO | 🟢 Activo |
| Códigos custom | Firestore `promoCodes/{code}` | Configurable (`durationDays`) | 🟢 Activo |

---

## 5. 🔥 FIREBASE (BACKEND)

### Servicios activos
| Servicio | Estado | Uso |
|---|---|---|
| **Cloud Firestore** | 🟢 Activo | Base de datos principal |
| **Firebase Auth** | 🟢 Activo | Email/Password + Google OAuth + Anónimo |
| **Firebase Storage** | 🟢 Activo | Imágenes y avatares |
| **Firebase Hosting** | 🟢 Activo | Despliegue web producción |
| **Firebase Extensions (Stripe)** | 🟢 Activo | Pagos Pro/Club |

### Estructura de datos en Firestore
```
users/{uid}/
  └── teams/{teamId}/
      ├── sessions/{sessionId}/         ← Sesiones de entrenamiento
      ├── players/{playerId}/            ← Jugadores del equipo
      │   └── wellness/{date}/           ← Check-in diario de bienestar
      ├── matches/{matchId}/             ← Partidos
      │   └── liveStats/{statId}/        ← Estadísticas en vivo
      ├── tests/{testId}/                ← Tests físicos
      ├── test_results/{resultId}/       ← Resultados psicológicos (portal jugador)
      ├── evaluaciones/{evalId}/         ← Evaluaciones del equipo
      ├── attendance/{attendId}/         ← Asistencia
      ├── exercises/{exerciseId}/        ← Biblioteca de ejercicios
      ├── pizarras/{pizarraId}/          ← Pizarras táticas guardadas
      │   └── frames/{frameId}/          ← Frames de animación de pizarra
      ├── pizarraEstado/                 ← Estado colaborativo en tiempo real
      ├── ia_usage/{teamId}/             ← Contador de uso de IA
      └── planificacion/config           ← Configuración del plan de temporada

customers/{uid}/
  ├── checkout_sessions/{id}/           ← Sesiones de pago Stripe
  └── subscriptions/{subId}/            ← Suscripciones activas

clubs/{clubId}/
  ├── teams/                             ← Equipos del club
  └── members/                          ← Miembros con roles (owner/admin/coach)

sharedSessions/{shareCode}/             ← Sesiones compartidas (público, sin auth)
sharedPlans/{planId}/                   ← Planes compartidos (público)
promoCodes/{code}/                      ← Códigos promocionales custom
config/global                           ← Versión remota + URL descarga APK
```

### Caché Offline
- Modo `persistentLocalCache` con `persistentMultipleTabManager` activo.
- La app funciona completamente sin conexión, sincronizando al reconectar.
- El Portal del Jugador tiene fallback adicional en `localStorage` para wellness.

---

## 6. 🤖 IA GENERADORA DE EJERCICIOS

- **Motor LLM:** API Groq (LLaMA 3 / Mixtral) via Vercel Serverless `/api/ia-generate.js`
- **Variable de entorno:** `GROQ_API_KEY` (en Vercel, nunca expuesta al cliente)
- **Control de uso:** `useIAUsage.js` — 5 generaciones/equipo (Free), 1.000 (Pro/Club)
- **Coste estimado por generación:** ~$0,000032 USD (~800 tokens) → margen bruto >99,6%

### Parámetros de generación (verificados en `IAGeneradora.jsx`)

| Parámetro | Opciones disponibles |
|---|---|
| **Edad / Categoría** | Fútbol base (6-10), Prebenjamín, Benjamín, Alevín, Infantil, Cadete, Juvenil, Amateur |
| **Número de jugadores** | 1 a 22 |
| **Objetivo** | 13 opciones: resistencia, velocidad, pressing, posesión, transición, finalización, calentamiento, etc. |
| **Duración** | 5, 10, 15, 20, 25, 30 minutos |
| **Materiales** | Balones, conos, petos, porterías, escalera, vallas, aros |
| **Espacio** | Área penal, medio campo, 3/4 campo, campo completo, espacio reducido, sala/gimnasio |
| **Intensidad** | Baja, Media, Alta, Máxima |

### Módulo de Prevención de Lesiones (diferenciador único)

| Parámetro | Opciones |
|---|---|
| **Zona anatómica** | Rodilla, tobillo, isquiotibial, lumbar, hombro, cuádriceps, aductores, core/pelvis, gemelos |
| **Nivel de dificultad** | Básico, Intermedio, Avanzado |

---

## 7. 🏆 RANKING DE MÓDULOS POR IMPORTANCIA

### Metodología: 25 puntos por criterio (uso en campo, diferenciación, retención, monetización, madurez)

| Pos | Módulo | Uso | Diferenciación | Retención | Monetización | Madurez | **TOTAL** |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 🥇 | IA Generadora de Ejercicios | 22 | 25 | 20 | 20 | 9 | **96** |
| 🥈 | Pizarra Táctica | 25 | 24 | 19 | 17 | 10 | **95** |
| 🥉 | Partidos / Live Stats | 24 | 22 | 20 | 18 | 10 | **94** |
| 4 | Sesiones de Entrenamiento | 25 | 18 | 20 | 16 | 10 | **89** |
| 5 | Portal del Jugador | 15 | 25 | 20 | 19 | 9 | **88** |
| 6 | Tests Físicos y Psicológicos | 18 | 22 | 18 | 18 | 10 | **86** |
| 7 | Mi Equipo / Asistencia | 20 | 16 | 19 | 14 | 10 | **79** |
| 8 | Planificación de Temporada | 14 | 20 | 17 | 16 | 9 | **76** |
| 9 | Consentimientos RGPD | 10 | 24 | 18 | 12 | 10 | **74** |
| 10 | Modo Campo (Live Session) | 21 | 18 | 14 | 12 | 8 | **73** |
| 11 | Modo Club (multi-equipo) | 10 | 18 | 15 | 20 | 8 | **71** |
| 12 | PDFs e Informes exportables | 12 | 16 | 14 | 18 | 10 | **70** |
| 13 | Dashboard | 18 | 12 | 16 | 10 | 10 | **66** |
| 14 | Estadísticas Multi-partido | 12 | 16 | 14 | 14 | 9 | **65** |

---

## 8. ⚔️ COMPARATIVA CON COMPETENCIA

### Funcionalidades clave vs. competidores directos

| Funcionalidad | **Míster11** | TacticalPad | SportEasy | TeamSnap | Heja | 360Player | CoachNow | Hudl/Wyscout |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Pizarra táctica animada | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ✅ |
| Exportar video MP4 jugadas | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **IA generadora de ejercicios** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **IA prevención de lesiones** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| PDF de sesiones | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Live Stats partido | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| xG / Heatmaps | 🔜 | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Tests físicos estandarizados | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Tests psicológicos autónomos | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Portal jugador autónomo | ✅ | ❌ | ✅ | ⚠️ | ✅ | ✅ | ❌ | ✅ |
| **RGPD firma digital para menores** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Multi-usuario cuerpo técnico | ✅ (Club) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Modo offline completo | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| App Android nativa | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Idioma español 100% nativo | ✅ | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Precio base** | **Gratis** | 9 USD/mes | 9 €/eq | 12 USD/eq | Gratis | 15 €/jug | 12 USD/mes | 250 €+/mes |

*✅ completo · ⚠️ parcial · ❌ no disponible · 🔜 en roadmap*

### Análisis DAFO

| FORTALEZAS | DEBILIDADES |
|---|---|
| ✅ Todo en uno (única app del nicho hispanohablante) | ⚠️ Sin heatmaps ni análisis xG (roadmap Q1 2027) |
| ✅ IA generadora única en el mercado ES/LATAM | ⚠️ Sin análisis de video (roadmap) |
| ✅ RGPD con firma táctil para menores (único verificado) | ⚠️ Prueba cerrada en Play Store (no abierta al público) |
| ✅ Exportación MP4 de pizarra (solo Hudl lo tiene gratis) | ⚠️ Sin portal específico para padres/tutores |
| ✅ Precio competitivo: 7,99 €/mes vs. 9-15 € competidores | ⚠️ Awareness de marca prácticamente nulo (beta) |
| ✅ Español 100% nativo en toda la interfaz | ⚠️ Sin integración con GPS/wearables |

| OPORTUNIDADES | AMENAZAS |
|---|---|
| 🟢 Mercado sub-penetrado en España y LATAM | 🔴 TeamSnap y Heja en expansión hacia Europa |
| 🟢 Federaciones buscan digitalización obligatoria | 🔴 Competidores añadirán IA en 2026-2027 |
| 🟢 RGPD como barrera de entrada para competidores anglosajones | 🔴 Presión de precios hacia la baja |
| 🟢 Comunidades WhatsApp de entrenadores muy activas | 🔴 Churn si faltan xG y video en usuarios avanzados |
| 🟢 Portal de padres: diferenciador no explorado por nadie | 🔴 Posible entrada de grandes plataformas al nicho |

---

## 9. 🎯 OBJETIVOS Y KPIs

### Corto plazo (0–3 meses)

| Objetivo | KPI | Meta |
|---|---|---|
| Apertura Play Store pública | Fecha apertura | Septiembre 2026 |
| Primeros usuarios reales | MAU | 100 usuarios |
| Conversión Free→Pro | % conversión | 5% |
| Reseñas positivas Play Store | Nº reseñas ≥ 4★ | 10 reseñas |
| Presencia RRSS | Seguidores TikTok + IG | 500 por canal |

### Medio plazo (3–6 meses)

| Objetivo | KPI | Meta |
|---|---|---|
| Ingresos recurrentes | MRR | 500 €/mes |
| Base de usuarios | MAU | 1.000 usuarios |
| Retención de suscriptores | Churn mensual | < 8% |
| Valoración Play Store | Rating promedio | ≥ 4,4 ★ |

### Largo plazo (6–12 meses)

| Objetivo | KPI | Meta |
|---|---|---|
| Ingresos recurrentes | MRR | 2.000 €/mes |
| Base de usuarios | MAU | 5.000 usuarios |
| Equipos activos | Nº equipos | 500 equipos |
| Clubs suscritos | Nº suscripciones Club | 10 clubs |
| Monetización | % usuarios de pago | 8–10% |
| Expansión | Mercados activos | ES, MX, COL, ARG |

---

## 10. 📣 PLAN DE LANZAMIENTO EN REDES SOCIALES

### Estrategia por canal

| Canal | Tipo de Contenido | Frecuencia | Objetivo |
|---|---|---|---|
| **TikTok** | Demos rápidas (15-60 seg), hooks de producto | 5/semana | Awareness y viralidad |
| **Instagram Reels** | Demos + carruseles educativos | 4/semana | Comunidad y leads |
| **YouTube Shorts** | Clips de funciones clave | 3/semana | Descubrimiento |
| **YouTube Largo** | Tutoriales completos de módulos | 1/semana | SEO y autoridad |
| **WhatsApp / Telegram** | Grupos de entrenadores + compartir demos | Diario | Conversión directa |
| **Twitter / X** | Threads de funcionalidades | 3/semana | Tráfico cualificado |

### Los 10 Hooks Virales (basados en módulos reales)

| # | Hook | Módulo |
|---|---|---|
| 1 | "¿Sabías que puedes exportar tus jugadas tácticas como video MP4 desde el móvil?" | Pizarra |
| 2 | "Le di 10 segundos a la IA de Míster11 para que generara ejercicios de pressing para Alevín" | IA |
| 3 | "Mi asistente registró todos los goles del partido desde su móvil. Al final teníamos el acta lista" | Live Stats |
| 4 | "¿Todavía preparas sesiones en Word? Yo las genero en PDF profesional en 30 segundos" | PDF |
| 5 | "Cada mañana mis jugadores me dicen cómo durmieron. Sé exactamente quién está al 100%" | Wellness |
| 6 | "Mi jugador de 14 años ve sus goles y asistencias de la temporada en su propio móvil" | Portal Jugador |
| 7 | "Los padres firman el consentimiento de imagen con el dedo desde casa. Se acabó el papel" | RGPD |
| 8 | "La IA genera ejercicios de prevención para isquiotibiales adaptados al nivel del jugador" | IA Prevención |
| 9 | "Dibujo una corrección táctica desde la sala y mi segundo entrenador la ve en campo al instante" | Pizarra Live |
| 10 | "Mis jugadores completan el test de fortaleza mental desde su portal. Yo veo el radar chart" | Tests |

### Embudo de conversión

```
RRSS (TikTok/IG) → Hook 3 segundos → Perfil → mister11.app
       ↓
Demo Mode / Registro gratuito → Trial 7 días PRO completo
       ↓
Activación: crear equipo + primera sesión (Aha Moment)
       ↓
Paywall: sesión 11 / exportar PDF / IA gen. 6+ / Live Stats
       ↓
Modal Upgrade → Stripe Checkout → PRO 7,99 €/mes
       ↓
Retención: partido con Live Stats → PDF del acta → hábito semanal
       ↓
Expansión: cuerpo técnico → upsell Club 39,99 €/mes
```

### ASO para Google Play Store

| Campo | Valor |
|---|---|
| **Nombre** | Mister11 - Coach de Futbol |
| **Descripción corta** | Pizarra táctica, IA, Live Stats, tests y portal del jugador en una sola app |
| **Categoría** | Deportes |
| **Keywords principales** | entrenador futbol, pizarra táctica, sesiones entrenamiento, live stats futbol, IA entrenamiento |
| **Rating objetivo** | ≥ 4,4 ★ |

---

## 11. 🕐 HISTORIAL DE HITOS

| Período | Hito conseguido |
|---|---|
| 2024 Q4 | Inicio del proyecto — decisión de stack React + Vite + Capacitor |
| 2025 Q1 | Módulos core: Sesiones, Mi Equipo, Dashboard, Login |
| 2025 Q2 | Pizarra Táctica con Fabric.js + exportación PNG |
| 2025 Q2 | Integración Stripe completa + paywalls Free/Pro |
| 2025 Q3 | IA Generadora con Groq + prevención de lesiones |
| 2025 Q3 | Live Stats de partidos multi-dispositivo en tiempo real |
| 2025 Q3 | Exportación MP4 de pizarra táctica animada |
| 2025 Q4 | Consentimientos RGPD digitales con firma táctil |
| 2025 Q4 | Alta en Google Play Store (prueba cerrada) |
| 2025 Q4 | Verificación de marca "Míster11" en Google |
| 2026 Q1 | Tests Físicos completos con radar chart + tests psicológicos |
| 2026 Q1 | Modo Club multi-usuario con roles y panel administrativo |
| 2026 Q2 | Fix crítico: acentos NFC en PDFs (`normalizeInput.js`) |
| 2026 Q2 | Fix crítico: Google Sign-In nativo Android (`@capacitor-firebase/authentication`) |
| 2026 Q3 | Portal del Jugador completo (6 pestañas + tests autónomos) |
| 2026 Q3 | Fix reglas Firestore: permisos wellness y test_results |
| **2026-08-24** | **v1.1.45 (versionCode 60) — versión actual en producción** |

---

## 12. ⚠️ PUNTOS PENDIENTES / RECOMENDACIONES

> [!WARNING]
> **Apertura Play Store:** La app sigue en prueba cerrada (internal testing). Abrir a prueba abierta o producción es la prioridad crítica número 1 para poder escalar la base de usuarios.

> [!WARNING]
> **Heatmaps / xG:** Es la brecha más visible frente a competidores de nivel medio-alto (360Player, Hudl). Sin esta funcionalidad, los clubs semi-profesionales elegirán otra solución. Roadmap Q1 2027.

> [!NOTE]
> **Portal de Padres:** Ningún competidor relevante en el segmento hispanohablante ofrece un portal específico para padres/tutores. Es un diferenciador de alto valor que no requiere gran inversión de desarrollo.

> [!NOTE]
> **Video Analysis básico:** Añadir upload de clips cortos con anotaciones del entrenador permitiría competir directamente con CoachNow (12 USD/mes) sin necesidad de infraestructura de video compleja.

> [!TIP]
> **RRSS — Prioridad TikTok:** Las demos de la IA generadora y la exportación MP4 de pizarra son los contenidos con mayor potencial viral. Un ciclo de 30 días con los 10 hooks identificados debería generar las primeras 500+ instalaciones sin coste de adquisición.

> [!TIP]
> **Código BETA2026:** Usar activamente este código en grupos de WhatsApp de entrenadores permite onboarding rápido sin fricción de pago. 90 días es suficiente para establecer el hábito de uso y convertir orgánicamente.

> [!TIP]
> **Tests automatizados:** El proyecto tiene `@playwright/test` como devDependency. Implementar tests e2e de las rutas principales (login, sesiones, PDF export, Live Stats) aumentaría la estabilidad del ciclo de releases y reduciría el tiempo de QA manual.

---

## 13. 📊 RESUMEN EJECUTIVO DE ESTADO

| Área | Estado |
|---|---|
| 🌐 Web en producción (`www.mister11.app`) | 🟢 Operativa |
| 📱 App Android AAB/APK `versionCode 60` | 🟢 Compilada y firmada |
| 🔥 Firebase (Firestore, Auth, Storage, Hosting) | 🟢 Activo |
| 💳 Stripe Checkout (pagos Pro / Club) | 🟢 Activo |
| 🤖 IA Generadora (Groq via Vercel) | 🟢 Activa |
| 📄 Exportación PDF (sesiones, partidos, asistencia) | 🟢 Operativa |
| 🎬 Exportación MP4 de pizarra táctica | 🟢 Operativa |
| 📊 Live Stats multi-dispositivo | 🟢 Operativo |
| 👤 Portal del Jugador (6 pestañas) | 🟢 Operativo |
| 🔐 Consentimientos RGPD con firma táctil | 🟢 Operativo |
| 🏟️ Modo Club multi-equipo | 🟢 Operativo |
| 📦 Google Play Console | 🟡 Prueba cerrada — pendiente apertura |
| 🗺️ Heatmaps / xG | 🔴 En roadmap (Q1 2027) |
| 🎥 Análisis de video | 🔴 En roadmap |
| 👨‍👩‍👧 Portal de Padres | 🔴 En roadmap (Q1 2027) |

---

*Informe generado el 24/08/2026 con Antigravity IDE para el proyecto Míster11 v1.1.45.*
*Archivos auditados: `src/pages/` (40 archivos), `src/components/` (50 archivos), `src/hooks/` (23 archivos), `src/utils/` (19 archivos).*
*Fuentes de verdad: `usePlan.js` (LIMITS), `UpgradeModal.jsx` (precios Stripe), `IAGeneradora.jsx` (parámetros IA), `App.jsx` (rutas).*
