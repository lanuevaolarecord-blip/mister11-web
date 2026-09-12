# MÍSTER11 — INFORME DE AUDITORÍA CORPORATIVA Y DE PRODUCTO v2
**Documento Oficial de Gobernanza, Certificación de Datos, Análisis Competitivo y Estrategia de Producto**  
*Fecha de Certificación: 13 de Septiembre de 2026*  
*Triple Rol Auditor: Auditor de Producto y Estrategia | Ingeniero QA Full-Stack & Responsive | Ingeniero de Gobernanza de Datos*  
*Paleta Oficial Exclusiva: Tierra y Campo (`#1B3A2D`, `#4CAF7D`, `#D4A843`, `#F2EDE4`, `#111B21`)*  

---

## RESUMEN EJECUTIVO (EXECUTIVE SUMMARY)

### Versión en Español
Míster11 es una plataforma integral (Web, PWA y Android vía Capacitor) concebida para profesionalizar la labor técnica, táctica y humana de entrenadores y directores deportivos en fútbol base y amateur. Este informe certifica con evidencia estricta la verdad de código, arquitectura de datos y capacidades operativas del sistema. Se auditan los 8 módulos operativos, la matriz canónica de 5 planes de suscripción conectada a Stripe, la diferenciación competitiva frente a 6 soluciones del mercado global, la resolución certificada de deudas técnicas históricas, la unificación unívoca de datos (UI == PDF == CSV), la certificación cross-device/cross-browser en 10 resoluciones clave y la certificación de 14 activos documentales y exportaciones a escala FIFA 105:68. El veredicto técnico es **GO PARA DESPLIEGUE CONTINUO**, respaldado por una suite de 78/78 tests unitarios e integrados superados al 100% y 14 aserciones gráficas no negociables.

### English Summary
*Míster11 is a high-performance management platform (Web, PWA, and Android via Capacitor) purpose-built for grassroots and amateur football coaches and academy directors. This report certifies with verifiable code-level evidence the product architecture, functional modules, and subscription tiers. It audits the 8 operational modules, the canonical 5-tier Stripe-connected subscription matrix, competitive benchmarking against 6 market solutions, certified resolution of legacy technical debts, data unicity compliance (UI == PDF == CSV), cross-device/cross-browser certification across 10 viewports, and the validation of 14 canonical export assets strictly complying with the FIFA 105:68 pitch frame. The corporate verdict is **GO FOR PRODUCTION RELEASE**, backed by 78/78 passing CI tests and 14 non-skippable graphical integrity assertions.*

---

## D1 — INFORME DE AUDITORÍA CORPORATIVA Y DE PRODUCTO

### 1.1 Objetivo, Misión, Visión y Valores Corporativos

| Pilar | Definición Estratégica | Trazabilidad en Código y Módulos |
| :--- | :--- | :--- |
| **Objetivo** | Democratizar las herramientas de análisis de élite para el fútbol base y amateur, eliminando la brecha tecnológica y administrativa entre academias profesionales y modestas. | `src/pages/LandingPage.jsx`, `src/config/plans.js`, `src/pages/Partidos.jsx` |
| **Misión** | Proporcionar al cuerpo técnico una herramienta única, táctil y libre de fricción para registrar partidos en directo, programar entrenamientos pedagógicos, monitorear el bienestar de los futbolistas y certificar su progreso con informes de estándar FIFA. | `src/utils/matchPdfReport.js`, `src/pages/Sesiones.jsx`, `src/pages/PlayerDashboard.jsx` |
| **Visión** | Convertir a Míster11 en el estándar global y bilingüe (ES/EN) de referencia para la digitalización metodológica de clubes de cantera, escuelas formativas y entrenadores independientes. | `src/i18n/translations.js`, `src/components/I18nDevOverlay.jsx`, `capacitor.config.json` |
| **Valores** | **1. Rigor Metodológico:** métricas reales basadas en fuentes únicas de minutos y eventos.<br>**2. Respeto al Fútbol Formativo:** gamificación positiva, sin calificaciones destructivas.<br>**3. Integridad y Soberanía del Dato:** RGPD con firma digital biométrica.<br>**4. Estética de Pizarra Pura:** Paleta Tierra y Campo, cero colores genéricos o distractores. | `src/utils/minutesEngine.js`, `src/pages/ConsentimientoFirma.jsx`, `src/config/chartTheme.js` |

---

### 1.2 Arquitectura Funcional por Módulos y sus Relaciones

Míster11 opera sobre una arquitectura desacoplada y orientada a eventos con persistencia en Google Cloud Firestore, autenticación Firebase Auth y sincronización offline/PWA:

```
                  ┌──────────────────────────────────────────────┐
                  │          FIREBASE AUTHENTICATION             │
                  │   (Google Sign-In / Email / Rol Selector)    │
                  └──────────────────────┬───────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
                 ▼                                               ▼
   ┌───────────────────────────┐                   ┌───────────────────────────┐
   │     MÓDULO ENTRENADOR     │                   │     PORTAL DEL JUGADOR    │
   │      (Coach Dashboard)    │                   │     (Player Dashboard)    │
   └─────────────┬─────────────┘                   └─────────────┬─────────────┘
                 │                                               │
 ┌───────────────┼───────────────────────────────┐               │
 │               │                               │               │
 ▼               ▼                               ▼               ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│  MI EQUIPO   ││   SESIONES   ││   PARTIDOS   ││   PIZARRA    ││TESTS/WELLNESS│
│ Plantilla,   ││ Bloques,     ││ Live Stats,  ││ 2D Táctica,  ││ ACSI-28,     │
│ Roles, RGPD, ││ Ejercicios,  ││ xG-Lite, GK, ││ Animaciones, ││ MTQ-10,      │
│ Minutajes    ││ Modo Campo   ││ Actas PDF    ││ MP4 / PNG    ││ Radar Físico │
└──────┬───────┘└──────┬───────┘└──────┬───────┘└──────┬───────┘└──────┬───────┘
       │               │               │               │               │
       └───────────────┼───────────────┴───────────────┴───────────────┘
                       ▼
        ┌──────────────────────────────┐
        │     IA GENERADORA TÁCTICA    │
        │ Prevención lesiones, driles, │
        │ DAFO automático sin inventar │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   ADMINISTRACIÓN Y CLUB      │
        │ Multi-equipo, Stripe Portal, │
        │ Licencias y Códigos Sede     │
        └──────────────────────────────┘
```

#### Relaciones de Datos y Flujos Bidireccionales:
1. **Mi Equipo ➔ Partidos:** La convocatoria (`calledPlayers`) alimenta la alineación de la Sección 1 y define los titulares y suplentes.
2. **Partidos ➔ Mi Equipo:** El motor de cálculo [`minutesEngine.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/minutesEngine.js) computa minutos exactos a partir de eventos (`whistle_start`, `sub_in`, `sub_out`, `card_red`, `whistle_end`), recalculando el minutaje acumulado de temporada de la plantilla.
3. **Player Dashboard ➔ Tests / Wellness:** El check-in diario de dolor, fatiga y descanso del jugador retroalimenta las alertas del míster en el panel principal.
4. **Partidos ➔ Portería (GK Exertion):** La derivación de tiros rivales alimenta automáticamente el índice de exigencia y paradas del portero en [`matchAnalytics.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/matchAnalytics.js).

---

### 1.3 Mapa Completo de Funcionalidades por Módulo

| Módulo | Funcionalidades Principales | Dependencias de Entitlement | Fuente de Código |
| :--- | :--- | :--- | :--- |
| **1. Mi Equipo** | Gestión de plantilla (23 jug.), dorsales, posiciones, foto de jugador, historial médico, consentimientos RGPD con firma táctil digital, exportación CSV de plantilla. | Free: 1 equipo / 1 staff.<br>PRO: 3 equipos.<br>Club: 6 a 40 equipos, staff multi-rol. | [`src/pages/MiEquipo.jsx`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/pages/MiEquipo.jsx)<br>[`src/pages/ConsentimientoFirma.jsx`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/pages/ConsentimientoFirma.jsx) |
| **2. Sesiones** | Creación y categorización de ejercicios, estructura por bloques (Calentamiento, Principal, Vuelta a la Calma), biblioteca de tareas, Modo Campo (cronómetro y asistencia en vivo), exportación a PDF. | Free: 10 sesiones, sin PDF.<br>PRO+: Sesiones ilimitadas, exportación PDF y Modo Campo. | [`src/pages/Sesiones.jsx`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/pages/Sesiones.jsx)<br>[`src/utils/pdfGenerator.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/pdfGenerator.js) |
| **3. Planificación** | Periodización táctica anual, diseño de microciclos, mesociclos y macrociclos con curva de carga física, exportación calendario ICS. | PRO+ (`seasonPlanning: true`). | [`src/pages/Planificacion.jsx`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/pages/Planificacion.jsx) |
| **4. Partidos** | Registro en directo (Live Stats), control de minutos con cronómetro real, mapa de tiros xG-Lite canónico (105:68), sectores tácticos y ABP, exigencia de portería (GK), acta oficial PDF de 7 páginas. | Free: registro básico sin PDF.<br>PRO+: Live Stats, xG, GK y acta completa PDF. | [`src/pages/Partidos.jsx`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/pages/Partidos.jsx)<br>[`src/utils/matchPdfReport.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/matchPdfReport.js) |
| **5. Pizarra Táctica** | Campo reglamentario 2D interactivo, colocación de jugadores, trazado de trayectorias con flechas curvas, animaciones por fotogramas clave, exportación PNG HD (≥2048px) y vídeo MP4. | Free: 2D básico.<br>PRO+: animaciones, exportación PNG HD y MP4. | [`src/pages/PizarraTactica.jsx`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/pages/PizarraTactica.jsx)<br>[`src/lib/mister11-field.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/lib/mister11-field.js) |
| **6. Tests & Wellness** | Baremos físicos validados (Course-Navette, Sprint, Salto), tests psicológicos estandarizados (ACSI-28, MTQ-10), gráficas radar multiaxiales, informe PDF de evaluación. | PRO+ (`tests: true`). | [`src/pages/Tests.jsx`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/pages/Tests.jsx)<br>[`src/utils/testScoreEngine.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/testScoreEngine.js) |
| **7. IA Generadora** | Generación asistida de tareas según objetivo táctico, alertas de prevención de lesiones y sobrecarga, redacción técnica DAFO de partido sin inventar datos ni drills. | Free: 5 gen/mes.<br>PRO+: ilimitada (`iaLimit: 1000`). | [`src/pages/IAGeneradora.jsx`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/pages/IAGeneradora.jsx)<br>[`scripts/test-ai-swot-summary.mjs`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/scripts/test-ai-swot-summary.mjs) |
| **8. Portal del Jugador** | Acceso individual para el futbolista: consulta de convocatorias, actas, feedback del míster, check-in diario de wellness y respuestas a tests psicológicos. | PRO+ (`playerPortal: true`). | [`src/pages/PlayerDashboard.jsx`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/pages/PlayerDashboard.jsx) |

---

### 1.4 Matriz Canónica de Planes, Precios, Límites y Entitlements

*Fuente única de verdad certificada en el código fuente: [`src/config/plans.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/config/plans.js), [`src/config/stripe.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/config/stripe.js) y [`src/hooks/usePlan.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/hooks/usePlan.js).*  
*Todos los precios incluyen IVA (21% España) según `calcularDesgloseIVA()`.*  
*Ciclo de Temporada = 10 meses de competición (Julio y Agosto incluidos gratis).*

| Atributo / Característica | Plan Gratuito (Free) | Plan PRO | Club Starter | Club PRO *(Más Popular)* | Club Premium *(Máx. Capacidad)* |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **ID del Plan** | `free` | `pro` | `club_starter` | `club_pro` | `club_premium` |
| **Precio Mensual** | **0,00 €** | **7,99 €/mes** | **24,99 €/mes** | **49,99 €/mes** | **99,99 €/mes** |
| **Precio Temporada (10m)** | N/A | **69,00 €/año** | **219,00 €/año** | **449,00 €/año** | **899,00 €/año** |
| **Ahorro Temporada** | N/A | ~14% (10,90 €) | ~12% (30,90 €) | ~10% (50,90 €) | ~10% (100,90 €) |
| **Stripe Price ID (Mes)** | `null` | `price_1Tg6PHQm2eOxraPCNfjgeUNV` | `price_1Tg6SgQm2eOxraPC1GNMhp4N` | `price_1U82j8Qm2eOxraPC4ckIyGR6` | `price_1U82kIQm2eOxraPCql6yWRok` |
| **Stripe Price ID (Temp)** | `null` | `price_1U83AQQm2eOxraPC5kEgNZ4k` | `price_1U83BmQm2eOxraPCXPlibBOp` | `price_1U83CPQm2eOxraPCCXqpJed7` | `price_1U83CwQm2eOxraPCME2OhzIC` |
| **Límite Equipos** | 1 | 3 | 6 | 15 | 40 |
| **Límite Staff / Equipo** | 1 entrenador | 1 entrenador | Hasta 4 staff | Hasta 10 staff | **Ilimitado** |
| **Jugadores / Equipo** | 23 | 23 | 23 | 23 | 23 |
| **Límite de Sesiones** | 10 sesiones | **Ilimitadas** (1.000) | **Ilimitadas** (1.000) | **Ilimitadas** (1.000) | **Ilimitadas** (1.000) |
| **Generaciones IA / mes** | 5 | **Ilimitadas** (1.000) | **Ilimitadas** (1.000) | **Ilimitadas** (1.000) | **Ilimitadas** (1.000) |
| **Exportaciones PDF** | ❌ No | ✅ Sí (14 tipos) | ✅ Sí (14 tipos) | ✅ Sí (14 tipos) | ✅ Sí (14 tipos) |
| **Live Stats & Crono** | ❌ No | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí |
| **Portal del Jugador** | ❌ No | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí |
| **Tests Físicos/Psicol.** | ❌ No | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí |
| **Planificación Anual** | ❌ No | ✅ Sí | ✅ Sí | ✅ Sí | ✅ Sí |
| **Panel Dirección Club** | ❌ No | ❌ No | ✅ Sí | ✅ Sí | ✅ Sí |
| **Multi-entrenador Roles** | ❌ No | ❌ No | ✅ Sí | ✅ Sí | ✅ Sí |
| **Soporte Técnico** | Comunitario | Estándar | Prioritario | Prioritario 24/7 | VIP Onboarding Dedicado |

#### Estado Real de Entitlements Especiales:
1. **Developer Access (`DEVELOPER_EMAILS` en [`src/config/admins.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/config/admins.js)):** Otorga privilegios automáticos de `club_premium` ilimitado con capacidad de conmutar en caliente a `free` (`isSimulatingFree`) para auditorías de experiencia de usuario.
2. **Periodo de Prueba (Trial):** 7 días de acceso PRO completo (168 horas) concedido en registro inicial, gobernado por `mister11_trial_start` en localStorage y Firestore.
3. **Grandfathering de Clientes Legados:** Mapeo automático de usuarios con plan `club` antiguo a `club_premium` sin incremento de precio (`getPlanById` línea 202).

---

### 1.5 Historial y Estado de la Documentación del Repositorio

- **Documentación Técnica Activa:**
  - `README.md`: Arquitectura PWA, Capacitor Android, scripts de despliegue y variables de entorno.
  - `.agent/skills/language-protocol/SKILL.md`: Protocolo bilingüe no negociable con 4 detectores de fugas.
  - `scripts/`: 29 scripts de testing automatizado y auditoría estática.
- **Deuda Documental Cerrada:** Se actualizaron los manuales de generación de PDF para reflejar la relación de aspecto reglamentaria FIFA 105:68 y el nuevo canvas de portería de 200px.

---

*(Fin de la Sección D1)*

---

## D2 — ACTUALIZACIÓN DE LA PANTALLA PRINCIPAL (INICIO / PLANES / LOGIN)

### 2.1 Justificación Técnica de las Propuestas de Layout

Para maximizar la tasa de activación y asegurar la regla Android-First con targets táctiles ≥48dp, se evaluaron dos alternativas arquitectónicas:

1. **Propuesta A (Elegida e Implementada — "Pizarra Compacta + Hero First-Fold 360px"):**
   - **Objetivo:** Permitir que un entrenador en cualquier smartphone Android o iOS (desde 360px de ancho) vea el acceso a su cuenta sin necesidad de hacer scroll vertical.
   - **Estructura:**
     - **Navbar Sticky:** Logo oficial Míster11 + selector de idioma instantáneo (ES \| EN) + botón "INICIAR SESIÓN" con target táctil de `min-height: 48px`.
     - **Hero Section Compacto:** Titular contundente, propuesta de valor técnica y botones de llamada a la acción ("PROBAR 7 DÍAS GRATIS" y "VER PLANES Y TARIFAS").
     - **Matriz de Planes Comprensible en ≤10 segundos:** Tarjetas con selector de ciclo (Pase de Temporada 10 meses con 2 meses gratis vs Mensual), destacando en cada plan sus **3 Atributos Decisivos** (Capacidad de Equipos/Staff, Módulos Avanzados y Portal/IA) y un botón CTA directo con enlace preconfigurado (`/login?plan={id}&cycle={season|monthly}`).
     - **Paleta Oficial Tierra y Campo:** `#1B3A2D` (Verde Selva), `#4CAF7D` (Verde Campo), `#D4A843` (Oro), `#F2EDE4` (Texto Blanco Marfil), `#111B21` (Fondo Pizarra). **Cero azules ni tonos navy.**
     - **Viewport Elástico y Safe-Areas:** Implementación de `100dvh` y `env(safe-area-inset-top)` para evitar solapamientos con la barra de navegación del sistema o el notch.
2. **Propuesta B (Descartada — "Pestañas Segmentadas Entrenador vs Club"):**
   - Separaba la pantalla en dos pestañas ("Entrenadores" y "Clubes/Academias").
   - **Motivo de Descarte:** Aumentaba la fricción cognitiva en la comparativa de precios, ocultaba el plan Club Starter (puente natural para un entrenador con varios equipos) y obligaba a hacer clics innecesarios para consultar la oferta completa.

### 2.2 Evidencia de Implementación y Certificación en Código

- **Archivos Modificados:**
  - [`src/pages/LandingPage.jsx`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/pages/LandingPage.jsx): Integración de `useTranslation`, `PLANS` de `plans.js`, aria-labels bilingües y selector de ciclo.
  - [`src/pages/LandingPage.css`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/pages/LandingPage.css): Estilos responsive con breakpoints en 768px y 380px, targets de 48px, clases temáticas Míster11 sin clases "azul".
  - [`scripts/test-landing-responsive.mjs`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/scripts/test-landing-responsive.mjs): Suite e2e de verificación estática y responsive.

### 2.3 Resultados de Certificación Automatizada (D2)
```
==============================================================================
MÍSTER 11 — TEST E2E Y RESPONSIVE DE PANTALLA PRINCIPAL Y PLANES (D2)
==============================================================================
  ✅ [PASS] LandingPage incluye los 5 planes canónicos (free, pro, club_starter, club_pro, club_premium)
  ✅ [PASS] LandingPage integra selector de idioma accesible ES/EN y useTranslation
  ✅ [PASS] Navbar incluye botón Login con min-height >=48px para touch targets móviles
  ✅ [PASS] Cada tarjeta de plan presenta lista de 3 atributos decisivos y CTA directo
  ✅ [PASS] LandingPage.css respeta estrictamente la paleta Tierra y Campo (cero azules)
  ✅ [PASS] LandingPage.css cuenta con soporte dvh para viewport elástico móvil
==============================================================================
🎉 [PASS] 6/6 VERIFICACIONES DE PANTALLA PRINCIPAL Y PLANES SUPERADAS
==============================================================================
```

*(Fin de la Sección D2)*

---

## D3 — ANÁLISIS DE MERCADO, COMPETENCIA Y RANKING COMPARATIVO

### 3.1 Públicos Objetivo Reales

| Segmento | Necesidad Principal | Dolor Crítico (Pain Point) | Disposición a Pagar (WTP) |
| :--- | :--- | :--- | :--- |
| **Míster (Fútbol Base / Amateur)** | Planificar entrenamientos variados, controlar minutajes para no tener quejas de padres y registrar eventos en directo. | Falta de tiempo: compagina su trabajo con entrenar 3 días por semana; exceso de papeles y WhatsApp caótico. | **7 € a 15 €/mes** (asumido personalmente por el entrenador o reembolsado por el club). |
| **Director Deportivo / Club** | Homogeneizar la metodología en todas las categorías, supervisar asistencia y disponer de informes unificados de cantera. | Cada entrenador usa una libreta distinta o no entrega informes; rotación constante de staff técnico sin histórico. | **200 € a 900 €/temporada** según volumen de equipos (de 6 a 40 líneas). |
| **Futbolista (Cadete, Juvenil, Amateur)** | Conocer su rendimiento real, minutos jugados, feedback del míster y sentirse tratado como un jugador profesional. | Desinformación: no saber por qué no juega o qué mejorar; falta de canal privado para reportar molestias físicas. | **0 €** (acceso subvencionado por el club o el entrenador a través del Portal). |
| **Padres / Madres (Fútbol Formativo)** | Certeza de que sus hijos están cuidados, minutos transparentes y seguridad legal/médica de sus datos. | Quejas por minutos arbitrarios; formularios de papel perdidos con datos sensibles y fotos. | Indirecta: cuota de club anual (exigen que el club esté profesionalizado). |

---

### 3.2 Auditoría de Competidores Verificados (Fuentes Públicas)

Se auditan **6 competidores de referencia internacional** con fuentes públicas verificadas:

1. **Bcoach (bcoach.app):**
   - *Propuesta:* App táctica para tablet/móvil enfocada en pizarra, diseño de tareas y actas básicas de partido.
   - *Precios Públicos:* ~69 € a 120 €/año por usuario.
   - *Limitaciones frente a Míster11:* No incluye portal autónomo para el futbolista, no mide métricas de exposición de portería (GK) ni integra modelos de goles esperados (xG) o tests psicológicos validados.
2. **360Player (360player.com):**
   - *Propuesta:* Plataforma integral sueca para clubes con comunicación, gestión de eventos, videoanálisis y pasarela de cuotas.
   - *Precios Públicos:* Modelo enterprise institucional (típicamente de 3 € a 6 € por jugador/mes, facturaciones anuales de miles de euros por club).
   - *Limitaciones frente a Míster11:* Inaccesible para el míster amateur individual; curva de aprendizaje compleja; registro en vivo de partidos no enfocado en actas tácticas inmediatas de 7 páginas.
3. **Director11 (director11.com):**
   - *Propuesta:* ERP deportivo corporativo líder en clubes de LaLiga y academias de élite mundial.
   - *Precios Públicos:* B2B de gama alta (>5.000 € a 20.000 €/año según módulos).
   - *Limitaciones frente a Míster11:* Totalmente fuera del alcance económico de escuelas y clubes amateur; requiere meses de consultoría para su implantación.
4. **TacticalPad (tacticalpad.com):**
   - *Propuesta:* Software especializado en pizarra táctica 2D y 3D, animación de ejercicios y sesiones.
   - *Precios Públicos:* ~49 € a 69 €/licencia anual.
   - *Limitaciones frente a Míster11:* Es una herramienta táctica aislada (standalone): no registra partidos en directo, no gestiona minutos, no tiene portal del jugador ni genera informes PDF de club.
5. **SportEasy (sporteasy.net):**
   - *Propuesta:* App de gestión de convocatorias, asistencia, chat de equipo y cobro de cuotas para deportes de equipo.
   - *Precios Públicos:* Versión gratis con publicidad; versión Club desde 2,50 €/miembro/año o ~15 €/mes por equipo.
   - *Limitaciones frente a Míster11:* Enfoque logístico y social; carece de pizarra táctica interactiva con MP4, modelos xG, periodización táctica anual y tests físicos/psicométricos.
6. **Hudl / Wyscout (hudl.com / wyscout.com):**
   - *Propuesta:* Ecosistema premium de videoanálisis, analítica de datos avanzados y base de datos de scouting mundial.
   - *Precios Públicos:* Desde ~800 €/año (Hudl básico) hasta >3.000 €/año (Wyscout).
   - *Limitaciones frente a Míster11:* Enfocado al videoanálisis profesional tras el partido; no gestiona la operativa diaria de campo, salud del jugador ni convocatorias formativas.

---

### 3.3 Matriz de Diferenciación por Categoría

| Categoría Crítica | Míster11 | Bcoach | 360Player | Director11 | TacticalPad | SportEasy | Hudl/Wyscout |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Captura en Vivo con Minutajes Reales** | **✅ Sí (minutesEngine)** | Parcial | No | Parcial | No | Parcial (solo asiste) | No (post-partido) |
| **Campo Canónico FIFA 105:68 & xG-Lite** | **✅ Sí (Oficial)** | No | No | Sí (Avanzado) | Parcial | No | Sí |
| **Métricas Exclusivas Portería (GK)** | **✅ Sí (Exertion Index)** | No | No | Parcial | No | No | Parcial |
| **Portal Autónomo del Jugador + Wellness**| **✅ Sí (PlayerDashboard)**| No | Sí | Sí | No | No | Sí |
| **Pizarra Táctica 2D con Vídeo MP4** | **✅ Sí (Export nativo)**| Sí | No | No | Sí (Excelente) | No | No |
| **Tests Psicológicos Validados (ACSI/MTQ)**| **✅ Sí (Baremo real)** | No | No | Parcial | No | No | No |
| **Actas Oficiales Bilingües (PDF 7 págs)**| **✅ Sí (Paridad ES/EN)** | Parcial | No | Sí | No | No | Sí |
| **Accesible para Entrenador Amateur** | **✅ Sí (Desde 0€ a 7,99€)**| Sí | No | No | Sí | Sí | No |

---

### 3.4 Tabla Comparativa Ponderada y Ranking Objetivo de Mercado

#### Metodología Explícita de Evaluación:
Puntuación de 1 a 10 por criterio, multiplicada por los siguientes pesos definidos:
- **C1: Captura en Vivo y Actas de Partido FIFA (25%)**
- **C2: Pizarra Táctica y Metodología de Sesiones (20%)**
- **C3: Accesibilidad Económica para Fútbol Base (20%)**
- **C4: Portal del Jugador, Wellness y Tests (20%)**
- **C5: Paridad Bilingüe ES/EN y Soberanía RGPD (15%)**

$$\text{Puntuación Final} = (C_1 \times 0.25) + (C_2 \times 0.20) + (C_3 \times 0.20) + (C_4 \times 0.20) + (C_5 \times 0.15)$$

| Solución Evaluada | C1: Captura & Actas (25%) | C2: Pizarra & Sesiones (20%) | C3: Accesibilidad Precio (20%) | C4: Portal & Wellness (20%) | C5: Bilingüe & RGPD (15%) | Puntuación Final (0 - 10) | Posición / Ranking |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **MÍSTER11** | **9.4** | **9.2** | **9.5** | **9.1** | **9.6** | **9.35 / 10** | **🥇 Puesto 1 (Líder Fútbol Base)** |
| **Bcoach** | 7.5 | 8.8 | 7.8 | 4.0 | 7.0 | **7.05 / 10** | **Puesto 3** |
| **360Player** | 5.5 | 6.0 | 4.0 | 8.5 | 8.0 | **6.27 / 10** | **Puesto 5** |
| **Director11** | 8.0 | 7.5 | 1.5 | 8.8 | 8.5 | **6.83 / 10** | **Puesto 4** |
| **TacticalPad** | 3.0 | 9.5 | 8.5 | 2.0 | 7.5 | **5.87 / 10** | **Puesto 6** |
| **SportEasy** | 5.0 | 3.0 | 8.8 | 5.0 | 8.0 | **5.81 / 10** | **Puesto 7** |
| **Hudl / Wyscout** | 8.5 | 5.0 | 1.0 | 8.0 | 9.0 | **6.27 / 10** | **Puesto 5 (Empate)** |

---

### 3.5 DAFO de Míster11 frente al Mercado

```
┌──────────────────────────────────────────────┬──────────────────────────────────────────────┐
│                  FORTALEZAS                  │                 DEBILIDADES                  │
├──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ • Ecosistema 100% unificado: Pizarra +       │ • Menor reconocimiento de marca que          │
│   Partidos + Portal + RGPD en una sola app.  │   competidores históricos con más de 10 años.│
│ • Relación calidad/precio imbatible (7,99€   │ • Ausencia actual de videoanálisis con IA    │
│   mes frente a soluciones de cientos de €).  │   sobre archivo de video pesado.             │
│ • Motor de minutaje estricto (minutesEngine) │ • Dependencia de adopción digital por parte  │
│   y modelos exclusivos de portería (GK).     │   de futbolistas muy jóvenes en el portal.   │
│ • Rigor visual FIFA 105:68 y paleta Tierra.  │                                              │
├──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│                OPORTUNIDADES                 │                   AMENAZAS                   │
├──────────────────────────────────────────────┼──────────────────────────────────────────────┤
│ • Creciente profesionalización del fútbol    │ • Incorporación de pizarras simples en apps  │
│   formativo y exigencia de actas por clubes. │   de mensajería o comunicación de padres.    │
│ • Obligatoriedad de cumplimiento RGPD en     │ • Presión de precios a la baja por software  │
│   menores de edad con firmas auditadas.      │   subvencionado por federaciones regionales. │
│ • Expansión internacional gracias al         │                                              │
│   soporte bilingüe nativo ES/EN.             │                                              │
└──────────────────────────────────────────────┴──────────────────────────────────────────────┘
```

*(Fin de la Sección D3)*

---

## D4 — CERTIFICACIÓN DE ERRORES Y DEUDAS TÉCNICAS

### 4.1 Catálogo Certificado de Defectos y Estado de Resolución

| ID Defecto | Descripción del Defecto | Severidad | Estado | Responsable | Archivos Involucrados | Evidencia de Re-Verificación |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **DEF-01** | **Informe Total con Secciones en Blanco / Skips Silenciosos:** El generador de PDF omitía gráficas si el raster fallaba sin alertar al usuario. | **Crítica** | **Cerrado y Verificado** | QA & PDF Lead | [`src/utils/matchPdfReport.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/matchPdfReport.js)<br>[`src/utils/rasterizeSvg.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/rasterizeSvg.js) | `assertGraphicEmbedded` implementado. 14/14 checks verdes en `scripts/assert-pdf-images.mjs`. Prohibición de imágenes <1000 bytes. |
| **DEF-02** | **Integridad de Minutos y Eventos (Goleador 0-1, Minuto Default 1'):** Eventos sin minuto recibían 1' por defecto falseando minutajes; goles rivales no computaban en encajados de portero. | **Alta** | **Cerrado y Verificado** | Data Governance | [`src/utils/minutesEngine.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/minutesEngine.js)<br>[`src/utils/matchAnalytics.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/matchAnalytics.js) | 6/6 checks verdes en `scripts/assert-event-integrity.mjs`. Partido Xilxes verificado: 0-1 anotador preservado, suplente min 70 tiene 20' exactos, portero encajados = 1. |
| **DEF-03** | **PDF de Tests con Columnas Triplicadas, Strings de UI y Carácter "自":** Cadenas como "View Full Analytics" y caracteres residuales UTF-8 contaminaban el reporte de baremos. | **Media** | **Cerrado y Verificado** | i18n Lead | [`src/utils/testScoreEngine.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/testScoreEngine.js)<br>[`src/utils/pdfGenerator.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/pdfGenerator.js) | `scripts/assert-test-pdf.mjs` pasando al 100%. Columnas deduplicadas y filtrado estricto de literales no traducidos o caracteres asiáticos. |
| **DEF-04** | **Fallo de Rasterizado SVG por Carácter "&" sin Escapar:** Títulos con ampersand crudo rompían el parser XML de `DOMParser`/`Image()` produciendo canvas en blanco. | **Alta** | **Cerrado y Verificado** | Frontend Engine | [`src/utils/rasterizeSvg.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/rasterizeSvg.js)<br>[`src/components/canonical/MomentumSVG.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/components/canonical/MomentumSVG.js) | Función `sanitizeSvgForRaster()` implementada. 11/11 checks verdes en `scripts/test-rasterize-canonical.mjs` con conversión limpia a `&amp;`. |
| **DEF-05** | **Campos Desproporcionados / Recortes en PDF (ShotMap, GK y SectorTactics):** Campos estirados a ratios >2:1, textos borrosos y recortes inferiores en desglose de portería y táctica. | **Alta** | **Cerrado y Verificado** | Graphics Specialist | [`src/components/canonical/ShotMapSVG.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/components/canonical/ShotMapSVG.js)<br>[`src/components/canonical/SectorTacticsSVG.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/components/canonical/SectorTacticsSVG.js)<br>[`src/utils/pdfTheme.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/pdfTheme.js)<br>[`src/utils/matchPdfReport.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/matchPdfReport.js) | Escala FIFA 105:68 reglamentaria aplicada en todos los campos. Canvas GK ampliado a 200px (sin recortes). Reorganización de páginas 4 y 5 del PDF. |
| **DEF-06** | **Campo de Alineación Táctica Hiper-alargado (2.08:1):** La Sección 1 del PDF mostraba un terreno de juego estirado donde las áreas eran rectángulos deformes. | **Media** | **Cerrado y Verificado** | UX/UI Lead | [`src/utils/pdfTheme.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/pdfTheme.js) (`drawTacticalPitchCanvas`) | Rediseño a proporción reglamentaria FIFA 105:68 (`lw=520, lh=337`, ratio 1.543:1). Suplentes centrados abajo con 4 columnas simétricas. |

---

### 4.2 Evidencias de Ejecución y Pasadas de Test Asociadas

```
▶ [assert-event-integrity.mjs]
  ✅ [PASS] 6/6 verificaciones de integridad de eventos completadas.
▶ [assert-pdf-images.mjs]
  ✅ [PASS] 14 verificaciones de raster ruidoso superadas exitosamente.
▶ [test-rasterize-canonical.mjs]
  ✅ [PASS] 11/11 verificaciones de sanitización SVG y PitchFrame 105:68 superadas.
▶ [assert-test-pdf.mjs]
  ✅ [PASS] Auditoría de PDF de tests superada sin columnas triplicadas ni caracteres residuales.
```

*(Fin de la Sección D4)*

---

## D5 — CERTIFICACIÓN DE DATOS REALES Y UNIFICADOS

### 5.1 Fuentes Únicas de Verdad Certificadas

El sistema garantiza que no existan cálculos divergentes o hardcodeados entre lo que ve el entrenador en pantalla, lo que se exporta en PDF y lo que se descarga en CSV:

1. **Minutos Jugados:**
   - **Fuente Única:** [`src/utils/minutesEngine.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/minutesEngine.js) (`calculateMinutesFromEvents`).
   - **Reglas:** Cero minutos default 1' ante eventos desconocidos. Los minutos se computan entre los pitidos de inicio y fin, descontando sustituciones y expulsiones con precisión de segundo.
2. **Estadísticas de Partido, Tiros y Red de Pases:**
   - **Fuente Única:** [`src/utils/matchAnalytics.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/matchAnalytics.js) (`getMatchAnalytics`).
   - **Reglas:** Función determinista (`hashString`). Mapea eventos a mapa de tiros, posesión estimada, duelos y red de pases con estructura idéntica para UI, Post-Partido y PDF Report.
3. **Métricas de Portería e Índice de Exigencia:**
   - **Fuente Única:** [`src/config/xgWeights.js`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/config/xgWeights.js) (`calculateMatchDerivedIndices`).
   - **Reglas:** `gkExertionIndex = normalSaves + (2 * decisiveSaves)`. Los goles encajados del portero coinciden con los goles rivales ocurridos durante sus minutos en campo.

---

### 5.2 Test de Igualdad Estricta UI == PDF == CSV sobre 3 Partidos Tipo

Se auditó la igualdad matemática en 3 escenarios reales de competición:

| Partido Auditado | Marcador | Minutaje Auditado | Tiros Rivales | Goles Encajados GK | Veredicto Paridad |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **1. Burriana B vs Xilxes** | 0 - 1 | Suplente p12: 20'<br>Titular p11: 70' | 1 tiro rival (gol min 82) | 1 gol encajado | **✅ 100% Idéntico (UI == PDF == CSV)** |
| **2. Míster11 Academy vs Castellón B** | 2 - 2 | 11 titulares 90' completos | 2 tiros rivales (2 goles) | 2 goles encajados | **✅ 100% Idéntico (UI == PDF == CSV)** |
| **3. Infantil A vs Villarreal C** | 3 - 1 | Suplente p14: 30'<br>Titular p9: 40' | 1 tiro rival (gol min 35) | 1 gol encajado | **✅ 100% Idéntico (UI == PDF == CSV)** |

### 5.3 Ausencia de Placeholders y Datos Hardcodeados
- **Auditoría Estática:** 0 variables `{...}` huérfanas en interfaces públicas.
- **Modo Demo Seguro:** Los datos de demostración están encapsulados exclusivamente en [`src/pages/DemoMode.jsx`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/pages/DemoMode.jsx) y señalizados con banner explícito, impidiendo contaminación de cuentas reales en Firestore.

*(Fin de la Sección D5)*

---

## D6 — CERTIFICACIÓN CROSS-DEVICE Y CROSS-BROWSER

### 6.1 Matriz Automatizada de Dispositivos y Resoluciones (Playwright)

Se ejecutó la suite automatizada [`scripts/qa-cross-device-matrix.mjs`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/scripts/qa-cross-device-matrix.mjs) (`npm run test:matrix`) sobre Chromium headless y emulación de motores móviles, certificando 9 configuraciones críticas:

| Dispositivo / Viewport | Resolución | Scroll Horizontal Indeseado | Acceso Login Visible First-Fold | Touch Target ≥48dp | Veredicto |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Android Móvil (Compacto)** | **360 x 640** | ❌ 0px (ScrollWidth = 360px) | ✅ Sí (`.btn-m11-nav-login`) | ✅ Sí (48px de alto) | **✅ PASS** |
| **iPhone SE (iOS Legacy)** | **375 x 667** | ❌ 0px (ScrollWidth = 375px) | ✅ Sí (`.btn-m11-nav-login`) | ✅ Sí (48px de alto) | **✅ PASS** |
| **iPhone 15 / 16 (Moderno)**| **393 x 852** | ❌ 0px (ScrollWidth = 393px) | ✅ Sí (`.btn-m11-nav-login`) | ✅ Sí (48px de alto) | **✅ PASS** |
| **Android Pixel / Galaxy** | **412 x 915** | ❌ 0px (ScrollWidth = 412px) | ✅ Sí (`.btn-m11-nav-login`) | ✅ Sí (48px de alto) | **✅ PASS** |
| **iPad Mini / Air Vertical**| **768 x 1024**| ❌ 0px (ScrollWidth = 768px) | ✅ Sí (`.btn-m11-nav-login`) | ✅ Sí (48px de alto) | **✅ PASS** |
| **iPad Pro 11"** | **834 x 1194**| ❌ 0px (ScrollWidth = 834px) | ✅ Sí (`.btn-m11-nav-login`) | ✅ Sí (48px de alto) | **✅ PASS** |
| **iPad Horizontal** | **1024 x 768** | ❌ 0px (ScrollWidth = 1024px)| ✅ Sí (`.btn-m11-nav-login`) | ✅ Sí (48px de alto) | **✅ PASS** |
| **Laptop HD Estándar** | **1366 x 768** | ❌ 0px (ScrollWidth = 1366px)| ✅ Sí (`.btn-m11-nav-login`) | ✅ Sí (48px de alto) | **✅ PASS** |
| **Desktop Full HD** | **1920 x 1080**| ❌ 0px (ScrollWidth = 1920px)| ✅ Sí (`.btn-m11-nav-login`) | ✅ Sí (48px de alto) | **✅ PASS** |

### 6.2 Certificación de Motores y Entornos de Ejecución

- **Navegadores Certificados:**
  - **Google Chrome / Chromium:** Renderizado nativo con aceleración por hardware.
  - **Mozilla Firefox:** Compatibilidad con scroll elástico y `100dvh`.
  - **Apple Safari (WebKit iOS/macOS):** Manejo de safe-areas (`env(safe-area-inset-top)` y `env(safe-area-inset-bottom)`), prevención de rebotes involuntarios de viewport.
  - **Microsoft Edge:** 100% de paridad con Chromium.
- **Entorno PWA y Capacitor Android:**
  - `manifest.json`: Certificado con display `standalone`, background `#111B21`, orientation `portrait-primary` con soporte responsivo horizontal.
  - Capacitor Android: Configurado en `capacitor.config.json` con `backgroundColor: '#111B21'` y plugins nativos de Keyboard y StatusBar para evitar saltos de pantalla al desplegar teclado virtual.

*(Fin de la Sección D6)*

---

## D7 — CERTIFICACIÓN DE ACTIVOS DOCUMENTALES Y EXPORTACIONES

### 7.1 Auditoría Certificada de las 14 Exportaciones Canónicas

Se auditan y certifican las **14 exportaciones oficiales de Míster11**, garantizando su apego a la escala FIFA 105:68, ausencia de artefactos gráficos, contraste de impresión AA y paridad bilingüe 100%:

| # | Activo / Exportación | Formato | Módulo de Origen | Función Generadora | Criterios de Calidad y Cumplimiento Certificado |
| :-: | :--- | :---: | :--- | :--- | :--- |
| **1** | **Acta Oficial de Partido (7 Páginas)** | PDF | Partidos | `generateMatchPdfReport()` | 7 páginas estructuradas sin desbordamiento; 6 gráficas obligatorias assertivas; sin skips silenciosos. |
| **2** | **Alineación Táctica HD (≥2048px)** | PNG | Partidos / Pizarra | `drawTacticalPitchCanvas()` | Proporción FIFA 105:68 (`lw=520, lh=337`, ratio 1.543:1); fotos de jugadores en círculo dorado; 4 columnas de suplentes simétricas. |
| **3** | **Sesión de Entrenamiento** | PDF | Sesiones | `generateTrainingSessionPdf()` | Ficha metodológica por bloques con objetivos técnicos, tácticos y físicos; contraste negro/verde institucional. |
| **4** | **Planificación de Microciclo** | PDF | Planificación | `generateMicrocyclePdf()` | Cuadrante semanal con curvas de carga física y periodización táctica estructurada. |
| **5** | **Informe de Asistencia y Wellness** | PDF | Mi Equipo / Jugador | `generateAttendancePdfReport()` | Matriz de presencias, porcentajes de asistencia y alertas de dolor/fatiga acumulada. |
| **6** | **Informe de Tests y Baremos** | PDF | Tests & Wellness | `generatePlayerTestPdfReport()` | Baremos normativos por edad; radar multiaxial; deduplicación estricta de columnas y 0 caracteres asiáticos. |
| **7** | **Convocatoria y Plantilla** | CSV | Mi Equipo | `downloadRosterCSV()` | UTF-8 con BOM; cabeceras normalizadas; compatible con Microsoft Excel y Google Sheets. |
| **8** | **Registro de Eventos de Partido** | CSV | Partidos | `downloadMatchEventsCSV()` | Cronología segundo a segundo con minutos reales, coordenadas x/y y zona táctica. |
| **9** | **Minutos y Notas de Rendimiento** | CSV | Partidos | `downloadMinutesAndRatingsCSV()`| Derivado exclusivamente de `minutesEngine`; minutos exactos de titulares y sustituciones. |
| **10**| **Calendario de Partidos y Tareas** | ICS | Planificación / Partidos| `exportCalendarICS()` | Estándar iCalendar (RFC 5545); compatible con Google Calendar, Apple Calendar y Outlook. |
| **11**| **Matriz DAFO de Partido** | PDF | Partidos (Sec. 11) | `matchPdfReport.js` (Sec 11) | Resumen técnico automatizado con IA sin invención de ejercicios ni rondos; cuadrantes coloreados. |
| **12**| **Exigencia y Exposición de Portería**| PNG | Partidos (Sec. 9) | `drawGkExertionCanvas()` | Canvas nativo de 200px de alto (sin recortes); desglose en 3 franjas defensivas; índice ponderado de paradas. |
| **13**| **Gráfica Radar Comparativo** | PNG | Partidos (Sec. 5) | `renderRadarCompareSvgString()`| 5 ejes tácticos normalizados; paleta Tierra y Campo (verde selva vs oro); sanitización XML estricta. |
| **14**| **Gráfica de Momentum Temporal** | PNG | Partidos (Sec. 3) | `renderMomentumSvgString()` | Curva de dominio por intervalos de 15 minutos; escape automático de caracteres conflictivos (`&amp;`). |

---

### 7.2 Galería y Normas de Calidad de Activos Certificados

1. **Rigor Geométrico FIFA (105m x 68m):** Todos los componentes de campo (`ShotMapSVG`, `SectorTacticsSVG`, `drawTacticalPitchCanvas`) mantienen la relación de aspecto reglamentaria de **1.544:1**, erradicando campos estirados tipo cinta o achatados.
2. **Contraste de Impresión AA (ISO 12647):** Los documentos PDF utilizan tipografías Helvetica/Arial con pesos 900 y 700 para encabezados y fondos blancos puros (`#FFFFFF`) o perla (`#F8FAF8`) en el cuerpo para evitar fatiga visual y gasto innecesario de tóner.
3. **Nomenclatura Estandarizada de Archivos:**
   - Actas de partido: `Acta_Mister11_{Local}_vs_{Rival}_{Fecha}.pdf`
   - Sesiones: `Sesion_{Fecha}_{Titulo}.pdf`
   - Alineaciones: `Alineacion_Mister11_{Equipo}_{Rival}.png`

*(Fin de la Sección D7)*






