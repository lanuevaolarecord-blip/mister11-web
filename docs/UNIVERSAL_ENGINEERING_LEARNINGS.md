# UNIVERSAL ENGINEERING LEARNINGS — ADN DE ARQUITECTURA Y DESARROLLO
## Sistema de Conocimiento Transversal y Buenas Prácticas Multi-Proyecto

Este compendio traduce los desafíos técnicos, bugs complejos y soluciones de ingeniería de software a principios universales y patrones agnósticos aplicables a cualquier aplicación moderna (Web, PWA, Mobile, Backend).

---

## 1. UI/UX Y ACCESIBILIDAD (Framework-Agnostic & Mobile-First)

### Lección 1.1: Elementos Críticos de Acción en Dispositivos Móviles
- **Anti-patrón:** Anidar botones de confirmación primaria (`Guardar`, `Comprar`, `Confirmar`) en el flujo normal de contenedores con scroll vertical que colisionan o quedan tapados por barras de navegación fijas inferiores (`BottomNavigation`, teclados virtuales o `safe-area-insets`).
- **Solución Universal:** Proyectar las barras de acción críticas mediante **Portales (React DOM)** o capas de posicionamiento fijo (`fixed bottom-0 z-[high]`) ancladas directamente al viewport raíz del documento, con padding dependiente de `env(safe-area-inset-bottom)`.
- **Caso de Éxito:** Míster11 (`DEF-M07-02` en gestión de plantilla y asistencia).

### Lección 1.2: Consistencia Visual e Iconografía Multiplataforma
- **Anti-patrón:** Emplear emojis del sistema operativo como iconos de botones o elementos funcionales de interfaz. Provocan inconsistencias cromáticas, degradados impredecibles según el dispositivo (Android vs iOS vs Windows) y problemas de accesibilidad para lectores de pantalla.
- **Solución Universal:** Utilizar exclusivamente librerías de iconografía vectorial SVG (ej. `lucide-react`, `heroicons`, `feather-icons`) con tamaños mínimos normalizados (`min-width: 48px`, `min-height: 48px` para touch targets) y atributos semánticos `aria-label` / `aria-hidden`.
- **Caso de Éxito:** Míster11 (estandarización global con Lucide en botones y estados).

### Lección 1.3: Carga Resiliente de Medios y Fallback Dinámico
- **Anti-patrón:** Renderizar etiquetas de imagen (`<img>`) asumiendo que el recurso remoto siempre existirá y responderá con HTTP 200, provocando cajas vacías, imágenes rotas o desalineación de grids.
- **Solución Universal:** Implementar un componente envoltorio con gestión interna de estado de error (`onError`), que ante la ausencia de URL o fallo de red renderice inmediatamente un componente de reserva (avatar con iniciales, silueta vectorial o placeholder con paleta de marca).
- **Caso de Éxito:** Míster11 (`PlayerCard` y generador de actas PDF con fallback de avatar circular).

### Lección 1.4: Contraste Certificado Dual (Modo Claro vs Modo Oscuro)
- **Anti-patrón:** Utilizar colores fijos o translúcidos (`rgba(0, 0, 0, 0.3)` o `color: #ffffff`) sobre contenedores que cambian dinámicamente de fondo al alternar de tema, produciendo texto invisible o campos de entrada grises ilegibles.
- **Solución Universal:** Definir un sistema de diseño semántico basado en tokens CSS por tema (`--bg-canvas`, `--bg-surface`, `--text-primary`, `--border-subtle`). Cada componente debe consumir variables semánticas garantizando un ratio de contraste mínimo WCAG AA (4.5:1 para texto regular, 7:1 para encabezados y botones).
- **Caso de Éxito:** Míster11 (`Login.css`, `JoinTeam.jsx`, `LandingPage.css`).

### Lección 1.5: Envoltura de Encabezados Complejos en Viewports Angostos
- **Anti-patrón:** Forzar en una única fila horizontal títulos editables y grupos de botones de control mediante `flex-direction: row; no-wrap`, provocando que el texto se trunque carácter a carácter en pantallas < 420px.
- **Solución Universal:** Aplicar layouts adaptativos `flex-wrap: wrap; gap: 8px;`, asignando `flex: 1 1 100%` al campo de texto y permitiendo que los botones de acción fluyan ordenadamente hacia la segunda fila.
- **Caso de Éxito:** Míster11 (`DEF-M07-03` en bloques de planificación deportiva).

---

## 2. GESTIÓN DE ESTADO, ASINCRONÍA Y RENDIMIENTO

### Lección 2.1: Gestión Inquebrantable de Estados de Carga
- **Anti-patrón:** Mutar el indicador de carga (`setIsLoading(false)`) únicamente al final del bloque `try` o en el bloque `catch`. Ante excepciones no controladas o flujos tempranos de retorno (`return;`), la interfaz queda bloqueada con spinners perpetuos.
- **Solución Universal:** Utilizar obligatoriamente la tríada `try / catch / finally`, ubicando el restablecimiento del estado (`setIsLoading(false)`, `setIsSaving(false)`) en el bloque `finally`.
- **Caso de Éxito:** Míster11 (módulo de asistencia y guardado de tests psicológicos).

### Lección 2.2: Búsquedas Reactivas con Debounce y Cancelación
- **Anti-patrón:** Disparar llamadas de red o lecturas a bases de datos en cada evento de teclado (`onChange`, `onInput`), agotando cuotas de API, generando condiciones de carrera (*race conditions*) y degradando el hilo principal.
- **Solución Universal:** Incorporar un temporizador de retardo (**Debounce de 300 ms - 500 ms**) mediante `setTimeout` / `clearTimeout` en el ciclo de vida del componente, asegurando que sólo se envíe la solicitud cuando el usuario pause la escritura.
- **Caso de Éxito:** Míster11 (búsqueda de equipos e invitaciones por código).

### Lección 2.3: Desacoplamiento entre Estado Visual y Estado de Datos
- **Anti-patrón:** Modificar modelos de datos persistentes o estados estructurales al activar una funcionalidad puramente cosmética o de presentación (ej. cambiar el tipo de tablero al activar pantalla completa).
- **Solución Universal:** Separar taxativamente el estado de visualización transitorio (`isFullscreen`, `isExpanded`, `activeTab`) del modelo canónico de datos de la entidad (`documentData`). La presentación nunca debe mutar la estructura del recurso.
- **Caso de Éxito:** Míster11 (Pizarra Táctica manteniendo `fieldType` al entrar en fullscreen).

### Lección 2.4: Procesamiento Intensivo Fuera del Hilo Principal
- **Anti-patrón:** Ejecutar transformaciones pesadas de imágenes, ensamblaje de video o exportaciones multipágina en el hilo principal de renderizado, congelando el navegador y activando avisos de página que no responde.
- **Solución Universal:** Delegar la carga de cómputo a **Web Workers**, estructurar el trabajo en chunks procesables e integrar un temporizador centinela (**Watchdog Timer**) de 15s-20s con barra de progreso basada en hitos reales y fallback de cancelación.
- **Caso de Éxito:** Míster11 (`DEF-M05-02` en exportación de video táctico MP4).

---

## 3. ARQUITECTURA DE DATOS, SEGURIDAD Y BACKEND

### Lección 3.1: Permisos Contextuales Multi-Organización
- **Anti-patrón:** Determinar las capacidades de un usuario en un módulo consultando exclusivamente su perfil global o suscripción personal en la base de datos (`user.role`, `user.plan`).
- **Solución Universal:** Resolver la autorización calculando **Permisos Contextuales**. La capacidad efectiva del usuario en una vista es la función resultante de su rol personal combinado con el plan y rol asignado dentro de la organización o equipo activo (`effectivePlan = isOwner ? user.plan : team.ownerPlan`).
- **Caso de Éxito:** Míster11 (Staff Técnico Heredado en clubes con planes Pro/Club).

### Lección 3.2: Doble Validación (Client-Side UX vs Server-Side Enforcement)
- **Anti-patrón:** Asumir que la validación en el cliente es suficiente para proteger transacciones de negocio, o confiar en reglas de base de datos permisivas para facilitar el desarrollo rápido.
- **Solución Universal:** Arquitectura de doble anillo: el cliente valida para brindar feedback visual instantáneo (formatos, longitudes, UX), mientras que el servidor (reglas de seguridad de base de datos o Cloud Functions) aplica validación estricta de autorización, cardinalidad y tipos.
- **Caso de Éxito:** Míster11 (reglas de lectura pública e indexación privada en `firestore.rules`).

### Lección 3.3: Cardinalidad Canónica y Verificación de Acumuladores
- **Anti-patrón:** Guardar contadores independientes que se incrementan o decrementan de forma distribuida sin reconciliación, provocando desfases donde las sumas reportan más elementos de los que existen físicamente.
- **Solución Universal:** Derivar contadores y resúmenes directamente de la longitud de las colecciones activas en tiempo real o ejecutar auditorías algorítmicas de reconciliación antes de persistir reportes de totales.
- **Caso de Éxito:** Míster11 (conteo de convocatorias y validación de 90 minutos reglamentarios en `minutesEngine.js`).

### Lección 3.4: Aislamiento Idempotente de Índices de Acceso
- **Anti-patrón:** Compartir namespaces o colecciones comunes para entidades de naturaleza dispar (ej. mezclar códigos de invitación de miembros con códigos de alumnos/jugadores en una sola tabla sin diferenciador).
- **Solución Universal:** Diseñar tablas e índices aislados para cada nivel de acceso (`team_codes` vs `staff_codes`), garantizando que la regeneración, expiración o rotación de una credencial sea idempotente y no colisione con roles alternos.
- **Caso de Éxito:** Míster11 (regeneración independiente de códigos de jugador y staff técnico).

---

## 4. INTERNACIONALIZACIÓN Y CALIDAD DE CÓDIGO (i18n & Linting)

### Lección 4.1: Cero Cadenas Hardcodeadas en UI (Zero-Offenders Gate)
- **Anti-patrón:** Escribir cadenas de texto directamente dentro del marcado JSX o HTML (`<button>Aceptar</button>`), impidiendo la localización dinámica y generando interfaces con idiomas mezclados.
- **Solución Universal:** Externalizar el 100% de literales a diccionarios organizados por dominio y consumirlos a través de hooks de traducción (`t('namespace.key')`). Integrar linters de CI (`ci-i18n-gate`) que bloqueen merges si existen literales en bruto.
- **Caso de Éxito:** Míster11 (sistema bilingüe ES / EN en Landing, Portal y Dashboard).

### Lección 4.2: Paleta Semántica y Prohibición de Colores Arbitrarios
- **Anti-patrón:** Introducir colores arbitrarios (`#3B82F6`, `#2563EB`) de librerías de estilos predeterminadas que rompen la identidad de marca institucional.
- **Solución Universal:** Configurar un design system con tokens estrictos mapeados en variables CSS y linters automatizados de paleta que impidan la propagación de colores no homologados.
- **Caso de Éxito:** Míster11 (validación mediante `check-chart-palette.mjs`).
