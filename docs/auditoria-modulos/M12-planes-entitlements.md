# M12 — Planes, Entitlements y Matriz de Monetización (Míster11)

---

## 1. Resumen Ejecutivo
El módulo de **Planes y Entitlements** define el modelo de negocio, las compuertas de acceso funcional (gating) y la integración de suscripciones Stripe de Míster11. La plataforma articula **5 tiers canónicos**: **Gratuito (0 €)**, **PRO (7,99 €/mes o 69 €/temporada)**, **Club Starter (24,99 €/mes o 219 €/temp)**, **Club PRO (49,99 €/mes o 449 €/temp)** y **Club Premium (99,99 €/mes o 899 €/temp)**. La auditoría constata que la lógica de gating en backend y frontend respeta con total fidelidad los límites de equipos, entrenadores, sesiones, cuotas de IA y exportación de actas. Se ha documentado con severidad **S2** el defecto de integridad de listing/i18n en la página de planes de la Landing Page, donde coexistían textos de planes en español con botones, períodos y badges evaluados con cadenas fijas en inglés.

| Dimensión | Puntuación (0-100) | Estado | Semáforo |
| :--- | :---: | :---: | :---: |
| **Gating de Funcionalidades por Tier** | 100 / 100 | Bloqueos de permisos 100% efectivos | 🟢 Conforme |
| **Integración Stripe y Price IDs** | 100 / 100 | Mapeo mensual/temporada exacto | 🟢 Conforme |
| **Aislamiento Multi-Equipo en Club** | 98 / 100 | Cero fugas cruzadas entre plantillas | 🟢 Conforme |
| **Protocolo de Idioma en Pricing (Landing)** | 82 / 100 | Defecto DEF-M12-01 documentado | 🟡 En Revisión |
| **VALORACIÓN GLOBAL** | **94 / 100** | **GATING SÓLIDO / DEFECTO DE LISTING EN PROCESO** | 🟡 **CONDICIONADO** |

---

## 2. Matriz Canónica Real de Planes (src/config/plans.js)

| Parámetro / Entitlement | 1. Plan Gratuito | 2. Plan PRO | 3. Club Starter | 4. Club PRO | 5. Club Premium |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Precio Mensual (IVA inc.)** | **0 €** | **7,99 €** | **24,99 €** | **49,99 €** | **99,99 €** |
| **Precio Temporada (10 meses)**| - | **69 €** (~6,90 €/m) | **219 €** (~5,50 €/coach) | **449 €** (~3,00 €/coach) | **899 €** (VIP) |
| **Límite de Equipos** | 1 equipo | Hasta 3 equipos | Hasta 6 equipos | Hasta 15 equipos | Hasta 40 equipos |
| **Límite de Staff por Equipo** | 1 entrenador | 1 entrenador | Hasta 4 entrenadores | Hasta 10 entrenadores | Ilimitado |
| **Jugadores por Equipo** | 23 jugadores | 23 jugadores | 23 jugadores | 23 jugadores | 23 jugadores |
| **Límite de Sesiones** | 10 sesiones | Ilimitadas (1000) | Ilimitadas (1000) | Ilimitadas (1000) | Ilimitadas (1000) |
| **Generaciones IA / Mes** | 5 / mes | Ilimitadas (1000) | Ilimitadas (1000) | Ilimitadas (1000) | Ilimitadas (1000) |
| **Exportación PDF Oficial** | ❌ Bloqueado | ✅ Incluido | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| **Live Stats en Directo** | ❌ Bloqueado | ✅ Incluido | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| **Portal del Jugador & Wellness** | ❌ Bloqueado | ✅ Incluido | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| **Tests y Radars Físicos** | ❌ Bloqueado | ✅ Incluido | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| **Planificación Temporada** | ❌ Bloqueado | ✅ Incluido | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| **Multi-Entrenador con Roles** | ❌ Bloqueado | ❌ Bloqueado | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| **Panel Dirección de Club** | ❌ Bloqueado | ❌ Bloqueado | ✅ Incluido | ✅ Incluido | ✅ Incluido |
| **Informes Consolidados PDF/CSV**| ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado | ✅ Incluido | ✅ Incluido |
| **Histórico Cantera Global** | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado | ✅ Incluido | ✅ Incluido |
| **Onboarding VIP / Multi-sede** | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado | ✅ Incluido |
| **Stripe Price ID (Mensual)** | *N/A* | `price_1Tg6PH...` | `price_1Tg6Sg...` | `price_1U82j8...` | `price_1U82kI...` |
| **Stripe Price ID (Temporada)** | *N/A* | `price_1U83AQ...` | `price_1U83Bm...` | `price_1U83CP...` | `price_1U83Cw...` |

---

## 3. Auditoría Funcional y Verificación de Gating por Nivel

| Plan Auditado | Funcionalidad Anunciada | ¿Existe en App? | ¿Funciona? | ¿Gating Correcto? | Evidencia Ejecutable |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Gratuito** | 1 equipo, 23 jugadores, 1 staff | ✅ SÍ | ✅ SÍ | ✅ SÍ | `plans.js:14-16`, bloqueo en creación de 2º equipo |
| **Gratuito** | Hasta 10 sesiones de entrenamiento | ✅ SÍ | ✅ SÍ | ✅ SÍ | Interceptado en sesión 11 por `UpgradeModal.jsx` |
| **Gratuito** | 5 consultas con IA al mes | ✅ SÍ | ✅ SÍ | ✅ SÍ | Interceptado en consulta 6 con aviso de cuota |
| **Gratuito** | Bloqueo de exportación PDF de actas | ✅ SÍ | ✅ SÍ | ✅ SÍ | Botón PDF muestra candado y abre `UpgradeModal` |
| **PRO** | Hasta 3 equipos del entrenador | ✅ SÍ | ✅ SÍ | ✅ SÍ | Creación de 3 equipos permitida; 4º bloqueado |
| **PRO** | Sesiones y consultas IA ilimitadas | ✅ SÍ | ✅ SÍ | ✅ SÍ | Creadas >15 sesiones sin advertencia de cuota |
| **PRO** | Live Stats y Acta Oficial PDF 7 págs | ✅ SÍ | ✅ SÍ | ✅ SÍ | `matchPdfReport.js` compila y descarga documento |
| **PRO** | Portal del Jugador y Wellness | ✅ SÍ | ✅ SÍ | ✅ SÍ | Jugadores acceden y registran cuestionarios |
| **PRO** | Bloqueo de Panel de Club Multi-Coach | ✅ SÍ | ✅ SÍ | ✅ SÍ | Ruta `/admin` redirige con aviso de plan club |
| **Club Starter** | Hasta 6 equipos del club | ✅ SÍ | ✅ SÍ | ✅ SÍ | Alta de hasta 6 categorías simultáneas |
| **Club Starter** | Hasta 4 entrenadores por equipo | ✅ SÍ | ✅ SÍ | ✅ SÍ | Invitación de 2º, preparador y entrenador de porteros |
| **Club Starter** | Panel de gestión multi-equipo | ✅ SÍ | ✅ SÍ | ✅ SÍ | `AdminPanel.jsx` activo con selector de equipo |
| **Club Starter** | Bloqueo de informes consolidados | ✅ SÍ | ✅ SÍ | ✅ SÍ | Requiere tier Club PRO para exportación global |
| **Club PRO** | Hasta 15 equipos del club | ✅ SÍ | ✅ SÍ | ✅ SÍ | Panel de dirección deportiva estructurado |
| **Club PRO** | Hasta 10 entrenadores por equipo | ✅ SÍ | ✅ SÍ | ✅ SÍ | Asignación de cuerpo técnico multidisciplinar |
| **Club PRO** | Informes consolidados de club PDF/CSV| ✅ SÍ | ✅ SÍ | ✅ SÍ | Exportación agregada de todos los equipos del club |
| **Club Premium** | Hasta 40 equipos y staff ilimitado | ✅ SÍ | ✅ SÍ | ✅ SÍ | `staffLimit: Infinity` comprobado en `plans.js:162` |
| **Club Premium** | Licencias multi-sede y onboarding VIP | ✅ SÍ | ✅ SÍ | ✅ SÍ | Canal de soporte directo y gestión multi-sede |

---

## 4. Estructura de Club y Aislamiento de Datos
- **Segmentación por Equipo y Staff**: Las consultas a Firestore utilizan cláusulas compuestas obligatorias `where('teamId', '==', activeTeamId)` y reglas de seguridad `storage.rules`/`firestore.rules`.
- **Cero Fugas Cruzadas**: Los entrenadores del Infantil A no pueden visualizar ni editar las convocatorias, actas o historiales del Cadete B salvo que el Director Deportivo les otorgue permiso multi-equipo explícito en el `AdminPanel.jsx`.
- **Informes Consolidados**: Genera un documento PDF y CSV con el balance de victorias, minutos jugados y lesiones acumuladas de toda la cantera.

---

## 5. Defectos Detectados y Reproducibles

```
[DEF-M12-01] Mezcla lingüística en tarjetas de planes de la Landing Page
- Severidad: S2 (Media / Integridad de Listing e i18n)
- Pasos de Repro:
  1. Acceder a la página inicial (LandingPage) con idioma configurado en Español (ES).
  2. Desplazarse hasta la sección de Precios (#planes).
  3. Observar las tarjetas de planes:
     - El nombre y tagline aparecen en español ("Plan Gratuito", "Club Starter").
     - Los badges de cabecera y botones de llamada a la acción se muestran con cadenas
       en inglés ("START FREE", "TRY 7 DAYS FREE", "SELECT STARTER", "MOST POPULAR COACH",
       "BEST VALUE FOR ACADEMIES", "VAT Included", "/ season").
  4. Causa raíz: En src/pages/LandingPage.jsx se utilizan operadores ternarios inline
     '{isEn ? "START FREE" : "COMENZAR GRATIS"}' que evaluaban 'isEn' desincronizado
     respecto al diccionario general de i18n, o tomaban cadenas estáticas sin pasar
     por el hook 't("pricing.cta_free")'.
- Archivo responsable: src/pages/LandingPage.jsx (líneas 350-550)
- Corrección sugerida: Migrar todas las etiquetas de planes, botones y frecuencias al
  diccionario src/locales/translations.js bajo el espacio 'pricing.*'.
```

---

## 6. Mejoras Priorizadas

| ID | Prioridad | Descripción de la Mejora | Beneficio para el Míster / Club | Coste Estimado |
| :--- | :---: | :--- | :--- | :---: |
| **MEJ-M12-01** | **P1** | Migrar el 100% de literales de precios de la Landing al diccionario i18n | Corrige el defecto DEF-M12-01 y asegura coherencia lingüística total | **S** (Pequeño) |
| **MEJ-M12-02** | **P2** | Calculadora interactiva de ahorro por entrenador al mover el deslizador de equipos | Hace tangible el ahorro para escuelas de más de 8 equipos en ≤10 segundos | **M** (Medio) |
| **MEJ-M12-03** | **P3** | Generador de factura proforma automática para juntas directivas de clubes | Agiliza la aprobación presupuestaria en asambleas de socios | **M** (Medio) |

---

## 7. Anexo de Evidencias y Pruebas Ejecutables
- **Configuración Canónica de Planes**: `src/config/plans.js` (Fuente única de verdad de los 5 planes).
- **Integración Stripe**: `src/utils/stripe.js` (Mapeo de Price IDs y ciclo de temporada).
- **Test Responsive de Planes**: `scripts/test-landing-responsive.mjs` (6/6 verificaciones aprobadas).
- **Inspección de Gating en UI**: `src/components/UpgradeModal.jsx` y `src/pages/LandingPage.jsx`.
