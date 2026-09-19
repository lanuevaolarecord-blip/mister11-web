# GUÍA DE EVOLUCIÓN CONTINUA DEL CONOCIMIENTO DE INGENIERÍA
## Metodología Multi-Proyecto para la Extracción y Perpetuación de Aprendizajes

> **Premisa Fundamental:**
> *"Cada error de software resuelto es un activo de ingeniería de alto valor, siempre que se extraiga su principio subyacente y se integre al ADN de desarrollo para no repetirlo jamás."*

---

## 1. El Algoritmo Mental de Abstracción (De lo Específico a lo Universal)

Cada vez que se diagnostique, investigue y resuelva un bug complejo en cualquier aplicación:

```
[Bug en Producción o Staging]
               │
               ▼
   1. Identificar Causa Raíz (5 Porqués)
               │
               ▼
   2. Pregunta de Abstracción: 
      "¿Este fallo está atado a esta pantalla o es un patrón que puede repetirse en cualquier app?"
               │
               ├────────────────────────────┬────────────────────────────┐
               ▼                                                         ▼
     [Si es 100% específico de negocio]                 [Si es un patrón de ingeniería]
     Documentar en docs/LECCIONES_APRENDIDAS.md        Abstraer la lección a nivel universal:
                                                       - Título agnóstico de framework
                                                       - Definición precisa del Anti-patrón
                                                       - Patrón de Solución Universal
                                                       - Ejemplo de código reusable
                                                                 │
                                                                 ▼
                                                Actualizar docs/UNIVERSAL_ENGINEERING_LEARNINGS.md
                                                Actualizar src/utils/universalPatterns.js
                                                Actualizar scripts/universal-linter.js
```

---

## 2. Plantilla Estándar para Incorporar una Nueva Lección Universal

Al agregar un nuevo aprendizaje en [UNIVERSAL_ENGINEERING_LEARNINGS.md](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/docs/UNIVERSAL_ENGINEERING_LEARNINGS.md), utiliza la siguiente estructura canónica:

```markdown
### Lección X.Y: [Nombre Descriptivo y Agnóstico de la Lección]
- **Anti-patrón:** [Qué se hacía incorrectamente y qué consecuencia técnica producía: bloqueos de UI, fugas de memoria, race conditions, etc.]
- **Solución Universal:** [La solución arquitectónica recomendada, aplicable en cualquier tecnología o framework moderno.]
- **Caso de Éxito / Origen:** [Referencia al proyecto y módulo donde se descubrió o resolvió el problema.]
```

---

## 3. Protocolo de Inicio para Proyectos Nuevos

Cuando comiences a desarrollar una **nueva aplicación** con Antigravity:

1. **Pega el Meta-Prompt:** Copia el contenido de [prompts/SYSTEM_CONTEXT.md](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/prompts/SYSTEM_CONTEXT.md) en el primer mensaje de la conversación.
2. **Copia los Patrones Base:** Transfiere `src/utils/universalPatterns.js` o adapta sus constantes al nuevo repositorio.
3. **Incorpora el Linter Universal:** Copia `scripts/universal-linter.js` para certificar la calidad del código desde el primer commit.

---

## 4. Auditoría Periódica y Mantenimiento

- **Frecuencia:** Ejecutar periódicamente `node scripts/universal-linter.js` antes de cada versión mayor o entrega de hito.
- **Cero Regresiones:** Ningún código nuevo debe cometer los anti-patrones ya documentados en el sistema de aprendizaje.
