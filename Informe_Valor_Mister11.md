# 📊 Informe de Valor y Sistema de Pagos: Míster 11

**Fecha:** Mayo 2026
**Rol:** Consultor de Negocio y Administrador de Sistemas
**Aplicación:** Míster 11 (App de Gestión Deportiva)

---

## 1. Estado Actual del Sistema de Pagos y Planes 🛠️

Tras analizar el código fuente (`usePlan.js` y componentes relacionados), este es el estado actual de la monetización en la aplicación:

### Estructura de Planes Actual
Actualmente, el sistema reconoce tres niveles a nivel de base de datos y dos a nivel de límites front-end:
*   **FREE (Gratis):** Limitado a 1 Equipo, 15 Jugadores, 10 Sesiones de entrenamiento y sin exportación a PDF.
*   **PRO:** Equipos ilimitados (100 como límite técnico), 1000 jugadores, sesiones infinitas y acceso total a la exportación de PDFs (Pizarra, Alineaciones).
*   *Excepción (Developer Mode):* Existen tres correos (los tuyos) que tienen pase vitalicio y permisos totales sin importar la fecha.

### Lógica del Trial (Período de Prueba)
El sistema utiliza actualmente un modelo de **7 días de prueba gratuita (Trial)**. 
*   **Mecanismo:** Cuando un usuario entra por primera vez, se guarda un sello de tiempo (timestamp) en el `localStorage` del navegador/móvil.
*   **Estado:** Durante esos 7 días, el usuario opera bajo los límites del plan PRO. Pasados los 7 días, se bloquea el acceso a funciones premium.

### Puntos Débiles (Áreas Críticas de Mejora)
1.  **Vulnerabilidad del Trial (Client-Side):** El período de prueba de 7 días se guarda en `localStorage`. Esto significa que si un usuario borra los datos de la app, desinstala y vuelve a instalar, o usa una ventana de incógnito, **tendrá otros 7 días gratis eternamente**. *Solución: El inicio del trial debe registrarse en la base de datos (Firestore) al momento de registrar el usuario.*
2.  **Ausencia de Pasarela Automática:** Actualmente, el sistema lee si eres PRO revisando `dbProExpiration` en Firebase, pero la app no tiene integrado el SDK de **Stripe, RevenueCat o PayPal** para que el usuario ponga su tarjeta y se actualice solo. (Requiere integración backend/webhooks).
3.  **Límites Expuestos en Frontend:** Los límites (ej. `PLAYERS: 15`) están definidos en JavaScript puro. Un usuario con conocimientos técnicos avanzados podría manipular el código web para saltarse el límite. *Solución: Las Security Rules de Firebase deben bloquear la inserción del jugador #16 si el usuario es Free.*

---

## 2. Valoración de Mercado y Ventaja Competitiva (Value Proposition) 💎

Como analista de mercado, he evaluado aplicaciones del nicho *SportsTech* (como *TacticalPad*, *Easy2Coach* o *CoachNow*). **Míster 11 tiene un valor agregado superior por tres razones fundamentales:**

### A. La Integración del "Todo en Uno" (Ecosistema)
Normalmente, un entrenador paga:
*   $10/mes por una app de Pizarra Táctica.
*   $15/mes por un software de control de cargas físicas y bienestar (RPE).
*   $20/mes (o usa ChatGPT de pago) para generar ejercicios.
*   **Valor de Míster 11:** Combina Táctica, Salud/Prevención e IA en una sola interfaz fluida. El entrenador ahorra dinero y, sobre todo, **tiempo**.

### B. El Módulo de IA y Prevención (El "Game-Changer")
El diferencial más agresivo de Míster 11 es su **IA Generadora con modo Clínico**.
Ninguna app de bajo coste permite a un entrenador amateur introducir *"Mi central tiene sobrecarga en el isquio"* y obtener un plan de fisioterapia preventiva en segundos, conectarlo a la ficha del jugador y medir si lo ha cumplido en el Dashboard. Esto eleva a Míster 11 de ser un "cuaderno digital" a ser un **Asistente Técnico de Alto Rendimiento**.

### C. Experiencia "Android-First" a pie de campo
El diseño pensado para usarse con una mano (botones de 48dp, gestos táctiles) resuelve el mayor problema del entrenador: nadie quiere sacar un ordenador portátil bajo la lluvia en un campo de césped artificial.

---

## 3. Estrategia de Precios Recomendada (Pricing) 💰

Basado en el valor entregado y los costes del servidor (Firebase + API de IA Groq), se sugiere el siguiente modelo *Freemium*:

### 🥉 Plan BASE (Gratis)
*Para enganchar al entrenador de categorías inferiores.*
*   1 Equipo.
*   Máximo 15-20 Jugadores.
*   Pizarra táctica básica (sin guardado múltiple ni animación).
*   **Sin acceso** a la IA Generadora.

### 🥇 Plan MÍSTER PRO ($7.99 USD / Mes o $79.99 / Año)
*El plan principal para el entrenador moderno.*
*   Equipos ilimitados.
*   **Uso ilimitado de IA Generadora** (Táctica y Salud).
*   Módulo completo de Prevención y Test de Bienestar (RPE).
*   Exportación de informes a PDF.
*   Gestión de asistencia y estadísticas completas.

### 🏆 Plan CLUB / INSTITUCIONAL ($39.99 USD / Mes)
*Venta B2B (Directa a las escuelas de fútbol).*
*   1 Cuenta Master (Director Deportivo) + 10 Subcuentas (Entrenadores).
*   Dashboard global de lesiones del club.
*   Base de datos centralizada de ejercicios del club.

---

## 4. Hoja de Ruta para solucionar los pagos (Próximos Pasos)

1.  **Migrar el Trial a Firebase:** Modificar la función de registro para que, al crear un usuario en Firebase Auth, se guarde en su documento: `trialStartDate: timestamp` y `plan: 'trial'`.
2.  **Integrar RevenueCat o Stripe:** 
    *   Si el foco es la app de móvil Android, **RevenueCat** es la mejor opción porque gestiona las suscripciones de Google Play Store de forma perfecta y actualiza Firestore automáticamente.
    *   Si el foco es web, **Stripe Checkout** con un webhook hacia Firebase Functions.
3.  **Proteger la API de IA:** Asegurarse de que el botón "Generar Ejercicio" valide en backend si el usuario es PRO, ya que cada petición a la IA cuesta dinero (tokens) y los usuarios Free podrían saturarlo.

---
*Fin del Informe. Este documento puede ser utilizado como base para un Pitch Deck (presentación a inversores) o para reestructurar la lógica de negocio de la aplicación.*
