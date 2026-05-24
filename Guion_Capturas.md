# 🎬 Guión de Capturas para Míster 11

Este guión detalla las pantallas y flujos clave que debes capturar para montar tus videos promocionales y tutoriales. Al tratarse de una app orientada a entrenadores, es fundamental que las capturas muestren **datos realistas y completos** (nombres de jugadores, fotos, estadísticas, etc.) para dar un aspecto "Premium".

---

## 1. Video Promocional (Impacto y Venta)
*Objetivo: Mostrar la app en su máximo esplendor, destacando el diseño Android-First y las funciones "Wow" (IA, Prevención, Pizarra).*

### Tomas necesarias:
- **Toma 1 (El Dashboard):** Captura general del `Dashboard` con un equipo cargado. Que se vea el resumen de jugadores, próximo partido, y el widget de alertas de salud activo en color cálido.
- **Toma 2 (Pizarra Táctica):** Una captura de la `PizarraTactica` con varios jugadores distribuidos en una formación (ej. 4-3-3), flechas de movimiento dibujadas y balones.
- **Toma 3 (IA Generadora):** Captura de la pantalla `IAGeneradora`. Haz una captura justo en el momento en el que se pulsa "Generar Ejercicio" y otra cuando el resultado aparece renderizado en formato Markdown con sus tags de colores.
- **Toma 4 (Ficha del Jugador - Prevención):** Entra a `MiEquipo`, abre el modal lateral de un jugador estrella y haz una captura de la nueva pestaña **PLANES**, mostrando su racha de ejercicios diarios cumplidos y sus gráficos de radar.
- **Toma 5 (Exportación Profesional):** Captura de la vista de generación del PDF, o incluso muestra cómo el PDF final se ve en la pantalla de un móvil.

---

## 2. Video Tutorial: "Primeros Pasos en Míster 11"
*Objetivo: Enseñar al usuario nuevo cómo arrancar a usar la app.*

### Tomas necesarias (Paso a Paso):
1. **Login/Registro:** Captura de la pantalla de bienvenida (`Login.jsx`).
2. **Crear Equipo:** Captura del `AdminPanel` en la pestaña de Equipos, justo escribiendo el nombre de un equipo nuevo.
3. **Añadir Jugadores:** Vista de `MiEquipo` vacía -> clic en "Nuevo Jugador" -> Captura del formulario de creación.
4. **Perfil Completado:** La lista de `MiEquipo` ya llena con 11-15 jugadores (mostrando el escudo y las iniciales/fotos).
5. **Configurar un Partido:** Ir a `Partidos`, añadir un nuevo encuentro y capturar la vista de "Alineación" o "Convocatoria".

---

## 3. Video Guía: "Módulo de Salud, Prevención e IA"
*Objetivo: Explicar la funcionalidad avanzada (Feature Spotlight).*

### Tomas necesarias:
1. **Tests de Bienestar:** Captura en la pestaña `SALUD` de un jugador, mostrando el registro del test RPE y la carga aguda/crónica.
2. **Alertas en el Dashboard:** Captura de la tarjeta roja/amarilla en el menú de inicio que avisa de "Jugador en riesgo de lesión".
3. **Biblioteca de Ejercicios:** Captura del `AdminPanel` > `Ejercicios`, mostrando el grid con los ejercicios predefinidos y los tags de colores (Prevención, Fortalecimiento, etc.).
4. **La Magia de la IA:** 
   - Pantalla de `IAGeneradora` con el modo "Prevención / Recuperación" seleccionado.
   - Textarea relleno con un caso real: *"Jugador con sobrecarga isquiotibial izquierdo"*.
   - Captura del plan terapéutico generado por Llama-3.3.
5. **Asignación:** Modal de `AssignPlanModal` asignando ese mismo plan al jugador afectado.

---

### 💡 Consejos de Producción para las Capturas:
*   **Datos de prueba (Mock Data):** Antes de grabar, tómate 10 minutos para rellenar la app con nombres reales (ej. "Lamine Yamal", "Pedri", etc.) e imágenes. Una app con datos genéricos ("Jugador 1") vende mucho menos.
*   **Dimensiones:** Si el enfoque es "Android First", usa la herramienta de desarrollador de Google Chrome (F12) y selecciona la vista de dispositivo **"Pixel 7" o "Samsung Galaxy S20"** para tomar las capturas con las proporciones perfectas de móvil.
*   **Contraste:** Asegúrate de que no haya cursores de ratón en la pantalla cuando tomes las capturas.
