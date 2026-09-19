# Cómo Contribuir al Sistema de Aprendizaje Continuo de Míster11

Esta guía establece los pasos obligatorios para que tanto **Antigravity** (agente IA) como los desarrolladores humanos agreguen nuevas lecciones aprendidas, patrones de error y soluciones a la base de conocimiento central.

---

## 1. Cuando se Diagnostica o Corrige un Nuevo Error/Bug

1. **Documentar el problema en [LECCIONES_APRENDIDAS.md](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/docs/LECCIONES_APRENDIDAS.md):**
   ```markdown
   ### [ID del bug]: [Nombre descriptivo del problema]
   - **Problema:** [Descripción técnica exacta del comportamiento erróneo]
   - **Solución:** [Explicación de la arquitectura o código que lo corrigió]
   - **Patrón:** [Patrón de diseño o principio aplicable]
   - **Lección:** [Regla o directriz para evitar que se repita]
   ```

2. **Añadir el patrón a [errorPatterns.js](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/errorPatterns.js):**
   - Definir `description`, `symptom`, `solution`, `example` y `prevention`.

3. **Si la solución es reutilizable, añadir el patrón a [solutionPatterns.js](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/solutionPatterns.js):**
   - Definir `description`, `template` de código limpio y `useCases`.

4. **Validar la base de conocimiento:**
   ```bash
   npm run update-knowledge
   ```

---

## 2. Al Implementar una Funcionalidad Nueva

1. **Consulta inicial obligatoria:**
   ```bash
   npm run before-implement
   ```
2. **Consultar [LECCIONES_APRENDIDAS.md](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/docs/LECCIONES_APRENDIDAS.md)** para verificar si existen módulos previos con características parecidas.
3. **Aplicar los patrones de solución pertinentes** de [solutionPatterns.js](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/solutionPatterns.js).
4. **Verificar que no se incurre en ningún patrón de error** de [errorPatterns.js](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/src/utils/errorPatterns.js).
5. **Seguir la checklist paso a paso** en [CHECKLIST_IMPLEMENTACION.md](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/docs/CHECKLIST_IMPLEMENTACION.md).

---

## 3. Comandos Rápidos del Sistema

| Comando | Acción |
| :--- | :--- |
| `npm run before-implement` | Muestra en consola la lista de errores a evitar y patrones disponibles |
| `npm run learn-from-errors` | Escanea el código en busca de posibles anti-patrones |
| `npm run update-knowledge` | Valida la integridad de la base de conocimiento |
