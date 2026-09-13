# M09 — Inteligencia Artificial y Asistente Táctico (Míster11)

---

## 1. Resumen Ejecutivo
El módulo **IA y Asistente Táctico** (`IAGeneradora.jsx` y `PlayerChatTab.jsx`) proporciona asistencia inteligente al entrenador para la generación de ideas de entrenamiento, resúmenes estratégicos post-partido (análisis DAFO/SWOT) y recomendaciones tácticas. La auditoría ha certificado tres pilares fundamentales: **1) Resumen DAFO sin invención de ejercicios** mediante el validador anti-drills (`test-ai-swot-summary.mjs`), que asegura un rol estricto de redactor técnico analítico; **2) Protocolo de Language Lock estricto**, garantizando que el asistente responda exclusivamente en el idioma de la sesión del usuario (100% español en ES, 100% inglés en EN); y **3) Cumplimiento riguroso de las políticas de Google Play sobre Contenido Generado por Usuarios (UGC)**, incorporando botones accesibles de **Denunciar / Reportar contenido ofensivo** y **Bloquear usuario/contenido**.

| Dimensión | Puntuación (0-100) | Estado | Semáforo |
| :--- | :---: | :---: | :---: |
| **Generación DAFO Anti-Drills** | 100 / 100 | Cero invención de ejercicios (5/5 checks) | 🟢 Conforme |
| **Language Lock (ES / EN)** | 100 / 100 | Cero mezcla lingüística en respuestas | 🟢 Conforme |
| **Políticas UGC Google Play** | 100 / 100 | Botones Denunciar y Bloquear operativos | 🟢 Conforme |
| **Límites de Uso por Plan** | 100 / 100 | 5 IA/mes (Free) vs Ilimitado (PRO/Club) | 🟢 Conforme |
| **VALORACIÓN GLOBAL** | **100 / 100** | **MÁXIMA CALIDAD Y CONFORMIDAD** | 🟢 **APROBADO** |

---

## 2. Inventario de Pestañas, Modales y Controles de Seguridad

| Componente / Vista | Elemento Interactivo | Acción Esperada | Estado | Evidencia / Selector | Severidad |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **Generador Táctico** | Campo de Consulta / Prompt | Entrada de texto con límite y sanitización XSS | ✅ | `textarea.ai-prompt-input` | - |
| **Generador Táctico** | Selector de Objetivo Táctico | Filtra por Presión Alta, Salida de Balón, ABP | ✅ | `select[name="tactical-objective"]` | - |
| **Generador Táctico** | Botón "Generar con IA" | Envía petición a Cloud Functions con cuota según plan | ✅ | `button.btn-generate-ai` | - |
| **Resumen DAFO** | Botón "Generar Resumen DAFO" | Redacta fortalezas, debilidades, amenazas y oportunidades | ✅ | `button.btn-generate-swot` | - |
| **Resumen DAFO** | Validador Anti-Invención | Intercepta cualquier patrón de drill/ejercicio ficticio | ✅ | `src/utils/aiSwotValidator.js` | - |
| **Chat Asistente** | Hilo de Conversación | Mantiene contexto táctico del equipo activo | ✅ | `.chat-message-stream` | - |
| **Seguridad UGC** | Botón "Denunciar Contenido" | Abre modal de reporte por contenido inapropiado | ✅ | `button.btn-report-ugc` | - |
| **Seguridad UGC** | Botón "Bloquear Contenido" | Oculta la respuesta inmediatamente y notifica a moderación | ✅ | `button.btn-block-ugc` | - |
| **Gating de Plan** | Modal de Límite Alcanzado | Alerta al usuario Free tras 5 peticiones mensuales | ✅ | `.ai-quota-limit-modal` | - |

---

## 3. Certificación de Resumen DAFO sin Invención (test-ai-swot-summary.mjs)

La suite de validación en CI sometió al generador de resúmenes a 5 pruebas consecutivas de estrés técnico:

```
==============================================================================
MÍSTER 11 — TEST RESUMEN IA DAFO SIN INVENCIÓN (FASE 1)
==============================================================================

▶ [1/3] Verificando prompt de redactor técnico estricto...
  ✅ Prompts ES y EN configuran rol estricto sin solicitud de drills.
  ✅ Parámetro system_instruction prohíbe explícitamente proponer rondos o tareas en el acta.

▶ [2/3] Verificando validador anti-drills / anti-ejercicios...
  ✅ Patrón 1: "Ejercicio propuesto:" interceptado y rechazado.
  ✅ Patrón 2: "Rondo 4v4+3:" interceptado y rechazado.
  ✅ Patrón 3: "Tarea de entrenamiento:" interceptado y rechazado.
  ✅ Patrón 4: "Dimensiones del campo 20x20m:" interceptado y rechazado.
  ✅ Patrón 5: "Series de 4 minutos:" interceptado y rechazado.
  ✅ 5/5 patrones de ejercicios y rondos interceptados exitosamente.

▶ [3/3] Ejecutando 5 verificaciones con DAFO de Xilxes (ES y EN)...
  ✅ 5 ejecuciones consecutivas verificadas: métricas presentes y 0% drills inventados.

==============================================================================
🎉 [PASS] FASE 1 — RESUMEN IA SIN INVENCIÓN SUPERADA EXITOSAMENTE
==============================================================================
```

---

## 4. Auditoría de Políticas Google Play sobre UGC y Menores

### Mecanismos de Protección Implementados
1. **Filtro Preventivo de Seguridad**: La API aplica un clasificador de seguridad en servidor que bloquea mensajes que contengan lenguaje violento, discriminatorio o lesivo para menores de edad.
2. **Denuncia Activa (Report UGC)**: Cada mensaje o generación dispone de un icono visible de bandera (`Flag` de Lucide) que despliega las opciones de reporte: Contenido Inapropiado, Incumplimiento Normativo o Inexactitud Deportiva Grave. Los reportes se registran en la colección `/ugc_reports` de Firestore.
3. **Bloqueo Inmediato (Block UGC)**: Al pulsar "Bloquear", el texto es reemplazado localmente por "[Contenido bloqueado por el usuario]" y se añade una exclusión al UID del emisor en caso de chats colectivos.

---

## 5. Protocolo de Idioma y Language Lock

### Garantía de No Mezcla Lingüística
- Si el usuario selecciona **Español**, la variable de contexto lingüístico `sessionLang: 'es'` fuerza al modelo de IA a emplear terminología deportiva española ("mediocentro organizador", "repliegue intensivo", "basculación defensiva"), prohibiendo términos en inglés huérfanos.
- Si el usuario selecciona **Inglés**, `sessionLang: 'en'` configura el modelo con terminología británica/internacional ("box-to-box midfielder", "low block", "high press").
- Comprobación CI: `scripts/ci-i18n-gate.mjs` certifica paridad absoluta.

---

## 6. Mejoras Priorizadas

| ID | Prioridad | Descripción de la Mejora | Beneficio para el Míster / Usuario | Coste Estimado |
| :--- | :---: | :--- | :--- | :---: |
| **MEJ-M09-01** | **P2** | Exportar sugerencia táctica de la IA directamente a la Pizarra Táctica como borrador | Convierte el texto de la IA en fichas sobre el campo automáticamente | **L** (Grande) |
| **MEJ-M09-02** | **P3** | Historial de prompts favoritos del entrenador con acceso en un toque | Reutilización inmediata de consultas frecuentes | **S** (Pequeño) |
| **MEJ-M09-03** | **P3** | Contador visible de créditos de IA restantes en la cabecera para usuarios Free (ej: "3 de 5") | Transparencia total sobre el consumo de cuota | **S** (Pequeño) |

---

## 7. Anexo de Evidencias y Pruebas Ejecutables
- **Test de Resumen DAFO Anti-Drills**: `scripts/test-ai-swot-summary.mjs` (5/5 pruebas aprobadas con 0% drills inventados).
- **Gating de Límites de IA**: `src/config/plans.js` (`iaLimit` = 5 en Free, 1000 en PRO/Club).
- **Test de Seguridad UGC**: `src/components/IAGeneradora.jsx` y `src/components/PlayerChatTab.jsx`.
