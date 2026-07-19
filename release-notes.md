# 📋 Release Notes — Míster 11

## v1.1.11 — Compilación de Producción Google Play Store

**Fecha de compilación:** 2026-07-17  
**Estado:** ✅ Lista para producción en Google Play Store  
**versionCode:** 30  
**versionName:** 1.1.11  
**ApplicationID:** `com.mister11.app`  

---

## 📦 Artefactos Generados

| Artefacto | Ruta | Tamaño | Estado |
|-----------|------|--------|--------|
| **AAB (Google Play)** | `android/app/build/outputs/bundle/release/app-release.aab` | 38.5 MB | ✅ |
| **APK (distribución directa)** | `Mister11.apk` | 37.1 MB | ✅ |
| **Keystore** | `android/app/mister11.keystore` | 2.684 bytes | ✅ |

---

## 🔑 Configuración de Firma

| Campo | Valor |
|-------|-------|
| Keystore | `android/app/mister11.keystore` |
| Alias | `mister11` |
| storePassword | `Mister11_2026` |
| keyPassword | `Mister11_2026` |
| v1Signing | ✅ habilitado |
| v2Signing | ✅ habilitado |

> ⚠️ **Copia de seguridad del keystore:** Guardada en Google Drive cifrado.  
> Sin el keystore no se pueden publicar actualizaciones en Google Play.

---

## 🎨 Assets de Play Store

| Asset | Ruta | Estado |
|-------|------|--------|
| Icono app (512×512) | `public/icon-512.png` | ✅ |
| Banner funciones (1024×500) | `assets/play-store/banner-1024x500.png` | ✅ |
| Iconos Android (todas densidades) | `android/app/src/main/res/mipmap-*/` | ✅ 87 archivos |
| Splash screens (portrait + landscape) | `android/app/src/main/res/drawable-*/` | ✅ |
| Capturas de pantalla (1080×1920) | `assets/play-store/screenshots/` | ⏳ Pendiente captura manual |

---

## 🚀 Cambios desde v1.1.9 (versionCode 29)

### Nuevas Funcionalidades
- **Monetización Fase 1:** Reglas de seguridad en Firestore que limitan a 15 jugadores en plan `free`
- **Sincronización de `playerCount`:** El campo en Firestore se actualiza automáticamente al añadir/eliminar jugadores
- **Pantalla de cortesía Stripe:** Spinner y mensaje persistente al retornar de la pasarela de pago

### Correcciones de UI/UX
- **Modales tácticos premium:** Glassmorphism con `backdrop-filter`, bordes suaves y sombras elegantes
- **Botones flotantes en Portrait:** Clases absolutas `.btn-portrait-floating-left/right` con z-index correcto para modo vertical
- **Z-Index en pantalla completa:** Los menús desplegables ya no quedan ocultos detrás del canvas

### Infraestructura
- **Reglas de Storage restauradas:** `mister11.apk` protegido solo para emails de developers autorizados
- **Firestore `config/global` actualizado:** `latestApkVersion: "1.1.11"` y URL de descarga del APK
- **Capacitor sync:** 8 plugins nativos sincronizados (`@capacitor-firebase/authentication`, `browser`, `filesystem`, `keyboard`, `local-notifications`, `screen-orientation`, `share`, `status-bar`)

---

## ✅ Checklist de Lanzamiento

### Pre-lanzamiento
- [x] `versionCode` actualizado a 30
- [x] `versionName` actualizada a "1.1.11"
- [x] Web compilada con Vite (2.649 módulos)
- [x] Capacitor sincronizado con 8 plugins
- [x] AAB firmado generado (`bundleRelease`)
- [x] APK firmado generado (`assembleRelease`)
- [x] Iconos regenerados (87 archivos, todas las densidades)
- [x] Banner Play Store generado (1024×500)
- [x] Ficha ASO preparada (nombre, descripción corta, descripción larga, palabras clave)
- [x] Reglas de Firebase Storage restauradas (seguras)
- [x] Firestore `config/global` actualizado con nueva versión

### Pendiente (manual)
- [ ] Capturas de pantalla en emulador (6 imágenes 1080×1920)
- [ ] Subir AAB a Google Play Console
- [ ] Completar ficha ASO en Play Console
- [ ] Publicar en Google Play (revisión ~3-7 días hábiles)

---

## 📊 Historial de Versiones

| versión | versionCode | Fecha | Estado |
|---------|-------------|-------|--------|
| 1.1.11 | 30 | 2026-07-17 | ✅ AAB generado |
| 1.1.9 | 29 | anterior | APK (distribución directa) |

---

## 🔧 Stack Técnico

| Tecnología | Versión |
|-----------|---------|
| Vite | 8.0.10 |
| React | 18.x |
| Capacitor | 8.x |
| Firebase | 12.x |
| Gradle | 8.14.3 |
| Android compileSdk | 35 |
| Android minSdk | 22 |
| JAVA_HOME | `C:\Program Files\Android\Android Studio\jbr` |
