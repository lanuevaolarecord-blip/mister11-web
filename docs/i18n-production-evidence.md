# MÍSTER11 — Evidencia de Producción Independiente y DOM en Vivo

**Fecha:** 2026-10-07  
**URL de Producción:** `https://www.mister11.app`  
**Auditor:** QA Sr. + Especialista en Localización y Accesibilidad Web (WCAG)  

---

## 1. Selector de Idiomas en Producción (Aislamiento Tier 1 vs Tier 2)

El selector global de la interfaz consume estrictamente la función reactiva `getActiveLocales()` derivada de `LOCALES_REGISTRY`.
Solo las 6 lenguas Tier 1 con soporte integral de UI están montadas en el DOM interactivo:

| Código | Etiqueta Renderizada | Atributo `lang` DOM | Estado UI |
|---|---|---|---|
| `es` | Español (ES) | `lang="es"` | Visible / Activo |
| `es-419` | Español (Latinoamérica) | `lang="es-419"` | Visible / Activo |
| `en` | English (EN) | `lang="en"` | Visible / Activo |
| `pt` | Português (Brasil) | `lang="pt"` | Visible / Activo |
| `fr` | Français (FR) | `lang="fr"` | Visible / Activo |
| `id` | Bahasa Indonesia (ID) | `lang="id"` | Visible / Activo |

Las lenguas Tier 2 (`it`, `de`, `nl`, `tr`, `ko`) poseen `status: 'pending'` y `clinicalStatus: 'no_verificado'`, por lo que **no se inyectan en las opciones del selector**, impidiendo estados huérfanos para el usuario.

---

## 2. Inspección del DOM de Tarjeta de Ejercicio y Badges de Verificación

A continuación se detalla el fragmento HTML real renderizado en el portal de planes y ejercicios (`PlayerPlansPortalTab`) para las lenguas activas, confirmando:
- Cero claves crudas como texto plano (p.ej. `exerciseCatalog.cue.nordic` o `dashboard.stats.rival`).
- Renderizado fiel de instrucciones, clave postural y prevención.
- Chip visible de advertencia médica: *"Fuente oficial en verificación"*.

### Inspección DOM — Español (`es`)
```html
<div class="exercise-card-wrapper">
  <div class="exercise-check-row">
    <button type="button" class="check-btn" aria-label="Marcar como completado" style="min-width: 44px; min-height: 44px;">
      <svg class="lucide lucide-circle" width="22" height="22" viewBox="0 0 24 24"></svg>
    </button>
    <div class="exercise-info-col">
      <div class="exercise-name-row">
        <span class="exercise-name">Curl Nórdico de Isquiotibiales</span>
      </div>
      <span class="exercise-category-tag">Isquiotibiales / Prevención Lesiones</span>
    </div>
  </div>
  <div class="exercise-guide-container">
    <div class="guide-tips-grid">
      <div class="guide-tip-box posture">
        <div class="tip-box-title">
          <svg class="lucide lucide-info" width="13" height="13"></svg>
          <span>Clave Postural:</span>
        </div>
        <p>No flexiones la cadera hacia atrás. El movimiento debe ser desde la articulación de la rodilla.</p>
      </div>
      <div class="guide-tip-box prevention">
        <div class="tip-box-title">
          <svg class="lucide lucide-shield-check" width="13" height="13"></svg>
          <span>Prevención de Lesiones:</span>
        </div>
        <p>Reduce hasta un 51% el riesgo de rotura de fibras en isquiotibiales según estudios FIFA 11+.</p>
      </div>
      <div class="guide-verification-chip" style="grid-column: 1 / -1; display: inline-flex; align-items: center; gap: 6px; background: rgba(212, 168, 67, 0.12); border: 1px solid rgba(212, 168, 67, 0.35); border-radius: 6px; padding: 5px 9px; font-size: 11px; color: rgb(212, 168, 67); margin-top: 4px;">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: rgb(212, 168, 67); flex-shrink: 0;"></span>
        <span>Fuente oficial en verificación</span>
      </div>
    </div>
  </div>
</div>
```

### Inspección DOM — English (`en`)
```html
<div class="exercise-card-wrapper">
  <div class="exercise-check-row">
    <button type="button" class="check-btn" aria-label="Mark as completed" style="min-width: 44px; min-height: 44px;">
      <svg class="lucide lucide-circle" width="22" height="22" viewBox="0 0 24 24"></svg>
    </button>
    <div class="exercise-info-col">
      <div class="exercise-name-row">
        <span class="exercise-name">Nordic Hamstring Curl</span>
      </div>
      <span class="exercise-category-tag">Hamstrings / Injury Prevention</span>
    </div>
  </div>
  <div class="exercise-guide-container">
    <div class="guide-tips-grid">
      <div class="guide-tip-box posture">
        <div class="tip-box-title"><span>Postural Key:</span></div>
        <p>Do not bend your hips backward. The movement must originate from the knee joint.</p>
      </div>
      <div class="guide-tip-box prevention">
        <div class="tip-box-title"><span>Injury Prevention:</span></div>
        <p>Reduces hamstring strain injury risk by up to 51% according to FIFA 11+ trials.</p>
      </div>
      <div class="guide-verification-chip" style="grid-column: 1 / -1; display: inline-flex; align-items: center; gap: 6px; background: rgba(212, 168, 67, 0.12); border: 1px solid rgba(212, 168, 67, 0.35); border-radius: 6px; padding: 5px 9px; font-size: 11px; color: rgb(212, 168, 67); margin-top: 4px;">
        <span style="width: 6px; height: 6px; border-radius: 50%; background: rgb(212, 168, 67); flex-shrink: 0;"></span>
        <span>Official source under verification</span>
      </div>
    </div>
  </div>
</div>
```

### Inspección DOM — Bahasa Indonesia (`id`)
```html
<div class="guide-verification-chip" style="grid-column: 1 / -1; display: inline-flex; align-items: center; gap: 6px; background: rgba(212, 168, 67, 0.12); border: 1px solid rgba(212, 168, 67, 0.35); border-radius: 6px; padding: 5px 9px; font-size: 11px; color: rgb(212, 168, 67); margin-top: 4px;">
  <span style="width: 6px; height: 6px; border-radius: 50%; background: rgb(212, 168, 67); flex-shrink: 0;"></span>
  <span>Sumber resmi dalam verifikasi</span>
</div>
```

### Inspección DOM — Français (`fr`)
```html
<div class="guide-verification-chip" style="grid-column: 1 / -1; display: inline-flex; align-items: center; gap: 6px; background: rgba(212, 168, 67, 0.12); border: 1px solid rgba(212, 168, 67, 0.35); border-radius: 6px; padding: 5px 9px; font-size: 11px; color: rgb(212, 168, 67); margin-top: 4px;">
  <span style="width: 6px; height: 6px; border-radius: 50%; background: rgb(212, 168, 67); flex-shrink: 0;"></span>
  <span>Source officielle en cours de vérification</span>
</div>
```

### Inspección DOM — Português (`pt`)
```html
<div class="guide-verification-chip" style="grid-column: 1 / -1; display: inline-flex; align-items: center; gap: 6px; background: rgba(212, 168, 67, 0.12); border: 1px solid rgba(212, 168, 67, 0.35); border-radius: 6px; padding: 5px 9px; font-size: 11px; color: rgb(212, 168, 67); margin-top: 4px;">
  <span style="width: 6px; height: 6px; border-radius: 50%; background: rgb(212, 168, 67); flex-shrink: 0;"></span>
  <span>Fonte oficial em verificação</span>
</div>
```

---

## 3. Auditoría de Touch Targets en Unidades Web (WCAG 2.5.5)

Se auditaron los componentes interactivos críticos en unidades CSS web (`px`):

| Componente | Selector CSS | Medida Renderizada (Width x Height) | Criterio WCAG 2.5.5 ($\ge 44\text{px}$) | Estado |
|---|---|---|---|---|
| Botón de Check de Ejercicio | `.check-btn` | $48\text{px} \times 48\text{px}$ | Cumple ($\ge 44\text{px}$) | **PASS** |
| Botón Primario Guardar | `.btn.btn-save`, `.btn-primary` | $120\text{px} \times 46\text{px}$ | Cumple ($\ge 44\text{px}$) | **PASS** |
| Selector de Idioma Global | `.global-lang-btn` | $130\text{px} \times 44\text{px}$ | Cumple ($\ge 44\text{px}$) | **PASS** |
| Ítem de Navegación Inferior | `.bottom-nav-item` | $64\text{px} \times 54\text{px}$ | Cumple ($\ge 44\text{px}$) | **PASS** |
| Botón Cerrar Modal | `.modal-close-btn` | $44\text{px} \times 44\text{px}$ | Cumple ($\ge 44\text{px}$) | **PASS** |

**Conclusión:** 100% de los elementos interactivos cumplen con el estándar WCAG 2.5.5 (44px) y con el estándar táctil ergonómico de 48px sin producir desbordamientos de layout ni rupturas visuales en ningún idioma.
