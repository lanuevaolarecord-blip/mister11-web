# MÍSTER11 — SISTEMA DE APRENDIZAJE CONTINUO
## Catálogo Maestro de Lecciones Aprendidas, Patrones de Error y Solución

> **Regla de Oro para Antigravity y Desarrolladores:**
> *"Nunca implementes una nueva funcionalidad o corrección sin consultar primero este registro de lecciones aprendidas de errores pasados."*

---

## 1. Inventario Exhaustivo de Problemas y Soluciones

### A. UI / UX Y ADAPTABILIDAD MÓVIL (Android First)

#### 1. Barra de Acciones Oculta en Móvil (`DEF-M07-02`)
- **Problema:** Los botones flotantes de acción primaria (ej. CANCELAR / GUARDAR) quedaban ocultos o superpuestos detrás de la barra de navegación inferior (`BottomNavigation`) en dispositivos Android con pantallas < 420px.
- **Solución:** Implementación de `ReactDOM.createPortal` para proyectar la barra de acciones directamente sobre `document.body` con clase fija (`fixed bottom-0 z-50`) y padding dinámico (`env(safe-area-inset-bottom)`).
- **Patrón:** Elementos críticos de acción deben desacoplarse del flujo local y renderizarse en un portal superior.
- **Lección:** En móvil, todo botón de confirmación/cancelación debe tener posicionamiento fijo accesible al pulgar (touch target $\ge 48\text{dp}$).

#### 2. Header de Bloque Cortado en Pantallas Pequeñas (`DEF-M07-03`)
- **Problema:** En pantallas < 600px, títulos editables largos empujaban los controles laterales y se cortaban carácter por carácter.
- **Solución:** Layout responsivo en 2 filas con `flex-wrap: wrap`, permitiendo que el input o título tome el 100% de la fila superior y los botones se ubiquen en la segunda fila.
- **Patrón:** En anchos móviles reducidos, dividir headers complejos con controles en múltiples filas con gap consistente.
- **Lección:** Probar siempre la interfaz con nombres de equipos y títulos reales largos (> 30 caracteres).

#### 3. Exportación MP4 de Pizarra Congelada (`DEF-M05-02`)
- **Problema:** La exportación de video MP4 se congelaba en el 21% o 88% cuando el hilo principal de JavaScript se bloqueaba por renderizado masivo de frames de Canvas.
- **Solución:** Migración del renderizado a un **Web Worker**, incorporación de un **watchdog timer** de 20 segundos para detectar atascos y fallback automático a descarga secuencial en ZIP de imágenes PNG o WebM.
- **Patrón:** Toda operación intensiva en CPU/Canvas debe ejecutarse fuera del hilo principal con watchdog de cancelación segura.
- **Lección:** Todo proceso largo debe reportar progreso continuo, permitir cancelación por el usuario y tener plan de contingencia.

#### 4. Fallas de Contraste en Modos Claro y Oscuro
- **Problema:** En modo claro, nombres de equipo en texto blanco sobre fondo verde menta translúcido (`rgba(76, 175, 125, 0.12)`) eran invisibles. Inputs heredaban fondos oscuros semitransparentes sobre tarjetas blancas, degradando la legibilidad.
- **Solución:** Estandarización de clases de alto contraste en `Login.css` (`.team-banner-found`, `.auth-select`, `.join-role-btn`) que conmutan dinámicamente según `html.dark` / `html.light`, garantizando ratios de contraste WCAG AA/AAA (> 7:1 en encabezados y > 14:1 en inputs).
- **Patrón:** Nunca usar colores fijos opacos o translúcidos sin contemplar el fondo del tema activo; separar variables semánticas por tema.
- **Lección:** Todo formulario de onboarding debe verificarse visualmente tanto en modo claro como en modo oscuro.

---

### B. LÓGICA DE NEGOCIO Y ESTADOS DE CARGA

#### 1. Botón de Asistencia Bloqueado en Carga Infinita
- **Problema:** Si una operación asíncrona de guardado fallaba por red o validación, la variable `isSaving` o `isLoading` permanecía en `true`, bloqueando el botón permanentemente con un spinner.
- **Solución:** Envolver toda mutación asíncrona en una estructura `try / catch / finally` inquebrantable, asegurando `setIsLoading(false)` en el bloque `finally`.
- **Patrón:** Patrón `ASYNC_OPERATION_WITH_LOADING`: la limpieza del estado de carga es obligatoria en `finally`.
- **Lección:** `finally { setIsLoading(false); }` no es opcional, es una directiva obligatoria de arquitectura.

#### 2. Staff Heredado — Permisos Evaluados por Contexto de Equipo
- **Problema:** Se evaluaba el plan del usuario autenticado (`user.plan`) para habilitar funciones Pro/Club. Si un entrenador asistente con plan Free era invitado a un equipo cuyo creador tenía plan Pro, las funciones avanzadas se bloqueaban injustamente.
- **Solución:** Hook `useEffectivePlan(activeTeam?.id)` que consulta el plan del propietario del equipo activo (`teamDoc.ownerId`), otorgando a los miembros del staff las herramientas del plan de la organización.
- **Patrón:** `CONTEXTUAL_PERMISSIONS`: Los permisos de equipo dependen del contexto del recurso activo, no del perfil individual del usuario.
- **Lección:** Separar la cuenta personal del contexto operativo del equipo.

#### 3. Convocatorias vs. Plantilla Real (Sincronización Estricta)
- **Problema:** En el módulo de partidos se informaba una convocatoria de 18 jugadores cuando la plantilla solo tenía 15 registrados, debido a acumuladores desincronizados.
- **Solución:** Auditoría y reconciliación de datos en tiempo real mediante `attendanceStatsHelper.js` y filtros reactivos que impiden convocar a más jugadores de los que existen físicamente en la plantilla activa.
- **Patrón:** Verificación de cardinalidad y fuentes canónicas únicas para conteos y resúmenes.
- **Lección:** Nunca mantener contadores estáticos o duplicados; derivar métricas de la lista viva de entidades.

---

### C. FIRESTORE, SEGURIDAD Y INTEGRIDAD DE DATOS

#### 1. Códigos de Invitación Rechazados por Reglas de Seguridad
- **Problema:** Los códigos de unión se validaban en el cliente, pero `firestore.rules` bloqueaba lecturas de usuarios no autenticados o con permisos insuficientes en colecciones privadas de equipos.
- **Solución:** Creación de colecciones de enlace público indexado (`team_codes` y `staff_codes`) con reglas estrictas de sólo lectura para validación inicial (`allow read: if true;`) y mutaciones restringidas (`allow write: if request.auth != null`).
- **Patrón:** Separar metadatos públicos de unión de los documentos sensibles internos del equipo.
- **Lección:** Validar la seguridad tanto en cliente como en servidor (`firestore.rules`) al diseñar nuevas colecciones.

#### 2. Cálculo Excesivo de Minutos en Partidos (`MinutesEngine`)
- **Problema:** Sustituciones complejas y tiempos extras generaban registros donde la suma de minutos jugados por posición excedía los 90 minutos reglamentarios del encuentro.
- **Solución:** Reconciliación algorítmica en `minutesEngine.js` que audita marcas de entrada y salida, recalculando intervalos y limitando el techo máximo al tiempo total pitado.
- **Patrón:** Validación de sumas acumulativas contra límites teóricos estrictos antes de persistir.
- **Lección:** Validar totales acumulados y no sólo transiciones individuales.

#### 3. Regeneración de Códigos sin Afectar Enlaces Existentes
- **Problema:** Regenerar el código de equipo rompía invitaciones de cuerpo técnico o viceversa por compartir namespaces.
- **Solución:** Aislamiento total: `teamCode` exclusivo para jugadores/tutores y `staffInviteCode` exclusivo para cuerpo técnico, con función de regeneración atómica que solo reescribe el índice de jugadores sin tocar `staff_codes`.
- **Patrón:** Separación estricta de dominios de autorización y regeneración idempotente.
- **Lección:** Cada rol debe tener su propio canal e índice de acceso independiente.

---

### D. INTERNACIONALIZACIÓN (i18n) BILINGÜE (ES / EN)

#### 1. Textos Mezclados en Landing y Tablas Comparativas (`DEF-M12-01`)
- **Problema:** Textos hardcodeados en español o inglés sin pasar por el hook de traducción `useTranslation` o diccionarios en `translations.js`.
- **Solución:** Auditoría con el linter de CI `scripts/ci-i18n-gate.mjs`, migrando el 100% de textos visibles a claves estructuradas en `translations.js`.
- **Patrón:** `ZERO_HARDCODED_STRINGS`: Cero textos en bruto en elementos JSX visibles.
- **Lección:** El CI debe fallar si existen offenders detectados por `ci-i18n-gate.mjs`.

---

### E. PALETA OFICIAL "TIERRA Y CAMPO"

#### 1. Uso Indebido de Azules Genéricos
- **Problema:** Presencia de colores no institucionales (`#3B82F6`, `#2563EB`) en botones y acentos de navegación.
- **Solución:** Reemplazo estricto por la Paleta Oficial Tierra y Campo mediante tokens CSS:
  - **Verde Selva (Institucional):** `#1B3A2D`
  - **Verde Campo (Acento / Éxito):** `#4CAF7D`
  - **Oro Míster11 (PRO / Destacados):** `#D4A843`
  - **Arena (Fondos Claros):** `#F5F0E8`
  - **Pizarra Carbón (Fondos Oscuros):** `#111B21` / `#0D0D0D`
- **Patrón:** Uso exclusivo de variables CSS (`var(--verde-selva)`, etc.), validado por `scripts/check-chart-palette.mjs`.
- **Lección:** El azul está reservado únicamente para logotipos externos de terceros (ej. Google Sign-In).

---

### F. RENDIMIENTO Y ACCESO EN TIEMPO REAL

#### 1. Búsquedas en Firestore sin Debounce
- **Problema:** En formularios de búsqueda de equipo por código, cada pulsación de tecla ejecutaba una lectura a Firestore, saturando la cuota.
- **Solución:** Implementación de un debounce de **300 ms** que espera a que el usuario complete el tamaño mínimo del código (6 caracteres) antes de disparar la consulta.
- **Patrón:** `REAL_TIME_SEARCH_DEBOUNCE`: `useEffect` con `setTimeout` de 300 ms y limpieza en `clearTimeout`.
- **Lección:** 300 ms es el estándar de oro para consultas en tiempo real sin saturación de API.

---

### G. ACCESIBILIDAD Y DISEÑO VECTORIAL

#### 1. Reemplazo de Emojis por Iconos Vectoriales
- **Problema:** El uso de emojis en botones provocaba inconsistencias de renderizado entre navegadores Android, iOS y Windows, luciendo poco profesional.
- **Solución:** Reemplazo integral por iconos vectoriales SVG de la librería canónica **Lucide React** (`lucide-react`).
- **Patrón:** Uso exclusivo de componentes Lucide con dimensiones táctiles fijas (`size={18}` a `size={24}`).
- **Lección:** En aplicaciones de producción de alto nivel, los emojis no sustituyen a la iconografía vectorial.

---

### H. PIZARRA TÁCTICA Y MODO CAMPO

#### 1. Pérdida del Tipo de Campo al Conmutar Pantalla Completa
- **Problema:** Al entrar en modo pantalla completa en la Pizarra Táctica, el canvas reseteaba la vista a campo completo (`fieldType: 'full'`), perdiendo la selección de medio campo o área.
- **Solución:** Separar el estado de presentación visual (`isFullscreen: boolean`) del modelo de datos de la sesión (`fieldType`).
- **Patrón:** Desacoplar estado de visualización temporal del estado de configuración de datos.
- **Lección:** Pasar a pantalla completa solo altera el viewport del DOM, nunca los metadatos de la sesión.

---

### I. EXPORTACIONES PDF Y GENERACIÓN DE IMÁGENES PNG

#### 1. Fallo al Renderizar Jugadores sin Fotografía
- **Problema:** En el generador de convocatorias PNG y en el informe de 7 páginas PDF, si un jugador no tenía imagen de perfil, el canvas mostraba errores o huecos vacíos.
- **Solución:** Implementación del patrón de fallback: si `photoUrl` es nulo o falla la carga (`onError`), se renderiza un avatar circular con la inicial del nombre sobre fondo institucional Verde Campo y borde Oro.
- **Patrón:** `IMAGE_WITH_FALLBACK`: Garantía de renderizado visual completo independiente de la existencia de medios externos.
- **Lección:** Toda imagen dinámica opcional debe tener un componente de reserva garantizado.
