# 🎯 Míster11 - AI & Developer Skill Guide

Este archivo es una guía operativa y técnica diseñada específicamente para que cualquier **Inteligencia Artificial (IA)** o desarrollador comprenda instantáneamente las reglas de gobernanza, la arquitectura, los esquemas de código y las pautas visuales de **Míster11**.

---

## 🧭 1. Reglas de Gobernanza y Desarrollo Obligatorias

Cualquier agente que modifique este repositorio DEBE seguir estas reglas sin excepción:

1. **Enfoque de Dispositivo (Android First)**:
   * Toda la interfaz web debe estar optimizada para dispositivos Android táctiles (móviles y tablets en horizontal/vertical).
   * Los elementos interactivos (botones, inputs, toggles) deben tener un tamaño de pulsación mínimo de **48x48 píxeles** (`min-width: 48px; min-height: 48px;`).
   * No usar márgenes o posiciones absolutas que colisionen con las barras del sistema. Usar las variables de safe-area CSS: `padding-top: env(safe-area-inset-top);` y `padding-bottom: env(safe-area-inset-bottom);`.

2. **Estética Limpia Sin Fotografías**:
   * Queda estrictamente prohibido usar imágenes de stock, fotografías de personas o campos de fútbol reales de fondo.
   * La estética visual debe ser 100% limpia y profesional, basada en **vectores, colores planos/degradados sutiles e iconos estilizados** (usando la librería Lucide React).

3. **Sistema de Gamificación (Diseño por Niveles)**:
   * **Básico**: Más espacio en blanco, explicaciones sencillas y guías paso a paso.
   * **Intermedio**: Inclusión gradual de métricas, estadísticas de fatiga y lenguaje técnico de fútbol.
   * **Avanzado**: Alta densidad de datos, diagramas compactos y análisis estratégico detallado.

4. **Botones y Tarjetas (Cards)**:
   * **Botones Primarios**: Fondo Azul Institucional (`#1B3A2D`), texto en Blanco y en Mayúsculas (`text-transform: uppercase`), bordes redondeados suavemente (`border-radius: 8px`), peso de fuente grueso (`font-weight: bold`).
   * **Botones de Éxito**: Fondo Verde Campo (`#4CAF7D`) con texto en blanco, reservado para confirmaciones, guardar cambios y niveles completados.
   * **Tarjetas**: Fondo blanco o gris muy claro, con bordes de `12px` o `16px` y sombras sumamente sutiles (`box-shadow: 0 4px 15px rgba(27, 58, 45, 0.03)`).

5. **Regla de Estructura**:
   * Nunca realizar cambios destructivos o modificaciones automáticas en la arquitectura de la información, el esquema de colores institucional o la jerarquía de navegación sin presentar primero una propuesta al usuario y obtener su confirmación explícita.
   * Cada modificación debe ser reportada en español profesional en un **Log de Cambios** conciso al final del turno.

---

## 📁 2. Estructura del Repositorio

Familiarízate con la ubicación de las piezas clave antes de programar:

* **`/src/hooks/usePlan.js`**: Hook centralizado que maneja el plan activo del usuario, límites de la base de datos Firestore, simulación de periodo de prueba de 7 días y la lista blanca de correos de desarrolladores.
* **`/src/pages/Dashboard.jsx`**: Pantalla principal con la bienvenida, banner de suscripción/desarrollador reactivo, estadísticas de plantilla e indicadores de partidos/sesiones rápidas.
* **`/src/pages/PizarraTactica.jsx`**: Lienzo interactivo Fabric.js para el diseño de alineaciones, tácticas y jugadas de pizarrón.
* **`/src/pages/AdminPanel.jsx`**: Centro de control del perfil del míster, escudo del club, alternancia de Modo Oscuro y monitoreo de cuotas/límites del plan.
* **`/src/pages/MiEquipo.jsx`**: Altas, bajas, badges de posiciones de jugadores y asignación de dorsales.
* **`/src/pages/Sesiones.jsx`**: Planificación de entrenamientos con desglose de ejercicios y exportador de informes en formato PDF.
* **`/src/pages/IAGeneradora.jsx`**: Generador inteligente de sesiones de entrenamiento utilizando modelos de IA.
* **`/src/context/AuthContext.js`**: Estado global de la sesión del usuario (incluye soporte para inicio de sesión real de Firebase y Modo Invitado local).

---

## 🛠️ 3. Lógica de Negocio y Patrones Críticos

### 3.1 Lista Blanca de Desarrolladores Permanentemente PRO
Las siguientes cuentas de Google tienen acceso de por vida ilimitado forzado en el frontend:
* `mister11.app@gmail.com`
* `lanuevaolarecord@gmail.com`
* `jhocao111294@gmail.com`

Cualquier cambio en la lógica del plan en `usePlan.js` debe respetar esta whitelist:
```javascript
export const DEVELOPER_EMAILS = [
  'mister11.app@gmail.com',
  'lanuevaolarecord@gmail.com',
  'jhocao111294@gmail.com'
];
const isDeveloper = user && user.email && DEVELOPER_EMAILS.includes(user.email.toLowerCase());
const isPro = isDeveloper || (simulatedPlan === 'pro' && !isTrialExpired) || isRealPro;
```

### 3.2 Persistencia de la Pizarra Táctica
Para evitar condiciones de carrera (race conditions) entre el estado local y la base de datos Firestore durante cargas lentas de internet móvil en la cancha:
1. Al cargar la pizarra, prioriza siempre el estado local de `localStorage` para garantizar la fluidez visual del entrenador.
2. Adjunta los escuchas de cambio de Fabric.js (`onChange`) únicamente **después** de que el canvas haya sido completamente hidratado.
3. Realiza la sincronización hacia Firestore de forma asíncrona mediante un sistema de auto-salvado no bloqueante.

---

## 💻 4. Comandos Clave del Proyecto

Ejecuta estos comandos en la terminal de Powershell desde la raíz de `mister11-web`:

* **Iniciar Servidor de Desarrollo**:
  `npm run dev`
* **Compilar para Producción (Verificación de Errores)**:
  `npm run build`
* **Sincronizar Cambios Web con la App Android (Capacitor)**:
  `npx cap sync`
* **Abrir Proyecto en Android Studio**:
  `npx cap open android`

---

## 🌐 5. Configuración de Red y Producción
* **Dominio Oficial**: `https://mister11.app` (Desplegado automáticamente desde la rama `main` en Vercel).
* **Base de Datos**: Google Cloud Firestore (Modo producción con reglas de acceso en `firestore.rules`).
