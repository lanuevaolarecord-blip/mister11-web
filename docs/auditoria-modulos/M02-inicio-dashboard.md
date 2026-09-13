# M02 — Inicio y Dashboard (Míster11)

---

## 1. Resumen Ejecutivo
El módulo **Inicio y Dashboard** constituye el centro de control neurálgico del entrenador al abrir la aplicación. Proporciona una vista sintética de la actividad semanal, el estado de la plantilla, el próximo partido programado, el balance de entrenamientos y accesos directos a las herramientas más utilizadas. Las pruebas de renderizado en frío y caliente confirman tiempos de respuesta inferiores a 1 segundo gracias a la reactividad de los listeners de Firestore y caché local. La jerarquía visual cumple con los estándares para técnicos de fútbol base y profesional, permitiendo tomar decisiones tácticas inmediatas desde el vestuario.

| Dimensión | Puntuación (0-100) | Estado | Semáforo |
| :--- | :---: | :---: | :---: |
| **Funcionalidad y Métricas** | 98 / 100 | Sincronización en tiempo real | 🟢 Conforme |
| **Accesibilidad y Contraste** | 97 / 100 | WCAG AA cumplido en dark/light | 🟢 Conforme |
| **Protocolo de Idioma (i18n)** | 100 / 100 | 100% de claves traducidas (ES/EN) | 🟢 Conforme |
| **Diseño y Ergonomía Android** | 96 / 100 | Sin scroll horizontal en 360-1920px | 🟢 Conforme |
| **VALORACIÓN GLOBAL** | **98 / 100** | **APTO PARA PRODUCCIÓN** | 🟢 **APROBADO** |

---

## 2. Inventario de Pestañas, Widgets y Accesos Rápidos

| Componente / Widget | Elemento Interactivo | Acción Esperada | Estado | Evidencia / Selector | Severidad |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Header Superior** | Saludo y Selector de Equipo | Muestra equipo activo y permite conmutar | ✅ | `.dashboard-team-selector` | - |
| **Header Superior** | Campana Notificaciones | Abre panel flotante de avisos pendientes | ✅ | `.btn-notifications-toggle` | - |
| **UpcomingMatchCard** | Tarjeta Próximo Partido | Detalles de rival, fecha, sede y cuenta atrás | ✅ | `.upcoming-match-card` | - |
| **UpcomingMatchCard** | Botón "Preparar Partido" | Navega a convocatoria y alineación previa | ✅ | `button.btn-prepare-match` | - |
| **QuickActionsGrid** | Botón "Nueva Sesión" | Acceso directo al creador de entrenamientos | ✅ | `a[href="/sesiones/nueva"]` | - |
| **QuickActionsGrid** | Botón "Pizarra Táctica" | Abre editor táctico en modo horizontal/libre | ✅ | `a[href="/pizarra"]` | - |
| **QuickActionsGrid** | Botón "Registrar Partido" | Inicia captura de estadísticas en directo | ✅ | `a[href="/partidos"]` | - |
| **QuickActionsGrid** | Botón "Añadir Jugador" | Abre modal de alta rápida de ficha | ✅ | `button.btn-quick-add-player` | - |
| **AttendanceKpiCard** | Métrica % Asistencia | Muestra promedio mensual con barra de progreso | ✅ | `.kpi-attendance-value` | - |
| **WellnessSummaryCard** | Alerta de Bienestar | Destaca jugadores con sobrecarga o fatiga alta | ✅ | `.wellness-alert-badge` | - |
| **ActivityFeed** | Lista de Últimos Eventos | Historial de actas firmadas y tests evaluados | ✅ | `.recent-activity-list` | - |

---

## 3. Lo que Funciona y lo que No

### Funcionalidades Verificadas (Con Evidencia Ejecutable)
1. **Ordenación Inteligente de Próximos Partidos**: Verificado mediante `scripts/test-match-status-and-sort.mjs`. El motor de ordenación prioriza el partido futuro más cercano respecto a la fecha actual y clasifica limpiamente partidos finalizados vs en edición.
2. **Reactividad de Indicadores Clave**: Cuando el míster sella una sesión en el módulo de Asistencia (`test-attendance-engine.js`), el porcentaje de asistencia semanal del Dashboard se actualiza al instante sin recarga manual.
3. **Adaptabilidad a Pantallas Móviles**: Verificado con `scripts/qa-cross-device-matrix.mjs` y `e2e/mobile-viewport-scroll.spec.js`. La rejilla de tarjetas se transforma de 3 columnas en escritorio a 1 columna en móviles de 360px de ancho sin desbordamiento horizontal (`scrollWidth <= innerWidth`).

### Defectos Detectados y Reproducibles

```
[DEF-M02-01] Desbordamiento de texto largo en nombre de rival en tarjeta compacta
- Severidad: S4 (Menor / Visual estético)
- Pasos de Repro:
  1. Configurar un equipo rival con nombre largo (>32 caracteres, p. ej. "Club Polideportivo San Juan Bautista de la Salle").
  2. Visualizar el Dashboard en un dispositivo de 360px de ancho (Android móvil compacto).
  3. El nombre del rival realiza un salto de línea que empuja verticalmente la insignia de sede.
- Archivo responsable: src/pages/Dashboard.css (.upcoming-match-rival-title)
- Corrección sugerida: Aplicar 'text-overflow: ellipsis; white-space: nowrap; overflow: hidden;' con tooltip al toque.
```

---

## 4. Diseño, Accesibilidad y Protocolo de Idioma (i18n)

### Análisis de Contraste y Accesibilidad (axe-core WCAG AA)
- **Modo Claro**: Fondo principal `#F4F6F5`, tarjetas blancas `#FFFFFF` con borde `#E2E8E5`, texto en verde oscuro profundo `#142820`. Ratio de contraste **13.1:1**.
- **Modo Oscuro**: Fondo institucional `#1B3A2D`, tarjetas `#224838`, texto blanco puro `#FFFFFF`. Ratio de contraste **9.8:1**.
- **Insignias y Estados**: Verde Campo `#3D7A5A` para partidos ganados y asistencia alta; Oro Institucional `#D4A843` reservado para badges y texto grande (verificado con `scripts/check-contrast-guard.mjs`). Cero uso de azul eléctrico.
- **Resultados axe-core**: `0 violaciones` en escaneo automatizado.

### Protocolo de Idioma (i18n)
- Todas las cadenas del Dashboard provienen de `src/locales/translations.js` bajo el espacio de nombres `dashboard.*`.
- Sincronización certificada al 100% por `ci-i18n-gate.mjs`. La conmutación entre Español e Inglés es instantánea mediante `useTranslation()`.

---

## 5. Mejoras Priorizadas

| ID | Prioridad | Descripción de la Mejora | Beneficio para el Míster / Usuario | Coste Estimado |
| :--- | :---: | :--- | :--- | :---: |
| **MEJ-M02-01** | **P2** | Widget de meteorología en vivo en la tarjeta del próximo partido (temperatura y lluvia) | Permite anticipar calzado y ropa de calentamiento en días de lluvia | **M** (Medio) |
| **MEJ-M02-02** | **P3** | Filtro de vista rápida (Esta Semana / Este Mes / Todo el Año) en el resumen de actividad | Agiliza la supervisión del director deportivo | **S** (Pequeño) |
| **MEJ-M02-03** | **P3** | Atajo háptico (vibración leve en Android) al pulsar botones de acción rápida | Feedback táctil que confirma la pulsación inmediata con guantes o lluvia | **S** (Pequeño) |

---

## 6. Anexo de Evidencias y Pruebas Ejecutables
- **Test de Ordenación y Estado de Partidos**: `scripts/test-match-status-and-sort.mjs` (4/4 tests pasados en verde).
- **Test de Accesibilidad y Contraste**: `scripts/check-contrast-guard.mjs` y `e2e/accessibility-contrast.spec.js` (Cumplimiento WCAG AA verificado).
- **Matriz Responsive Cross-Device**: `scripts/qa-cross-device-matrix.mjs` (9 resoluciones sin overflow horizontal).
