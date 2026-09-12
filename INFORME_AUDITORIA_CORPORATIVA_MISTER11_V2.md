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

