# Información y Credenciales de Firma de la APK (Míster 11)

> [!IMPORTANT]
> **Guarda este documento en un lugar seguro.** El archivo del almacén de llaves (`mister11.keystore`) y sus contraseñas son fundamentales para compilar futuras actualizaciones de la aplicación Android. Si se pierde el archivo o las contraseñas se olvidan, no será posible actualizar la aplicación instalada en los dispositivos sin desinstalarla primero (perdiendo los datos del usuario).

---

## 🔑 Credenciales del Almacén de Llaves (Keystore)

| Parámetro | Valor / Ubicación | Notas |
| :--- | :--- | :--- |
| **Archivo Keystore** | [`android/app/mister11.keystore`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/android/app/mister11.keystore) | Ubicación física dentro del proyecto Android. |
| **Alias de la Llave** | `mister11` | Nombre asignado a la clave privada dentro del almacén. |
| **Contraseña del Almacén** | `Mister11_2026` | Contraseña para abrir el archivo `.keystore`. |
| **Contraseña de la Llave** | `Mister11_2026` | Contraseña específica para la clave privada del alias. |
| **Validez de la Clave** | `10000 días` (~27 años) | Fecha de expiración de la firma. |
| **Algoritmo de Cifrado** | `RSA` (2048 bits) | Algoritmo estándar para firmas Android. |

---

## 🔒 Huellas Digitales del Certificado (Fingerprints)

Estas huellas son útiles para configurar servicios externos (como Google Sign-In, Firebase App Check o APIs de mapas) que requieran registrar las claves de firma de producción:

* **SHA-256 Digest**:  
  `6e70fcd6f76bdc4a6efe52a8fb169fa81b9c7f0c063761ab8f3157f62de16d24`
* **SHA-1 Digest**:  
  `950ea6dd984a537cd6a2d1966356ac32e6330ec8`
* **MD5 Digest**:  
  `3e8f0291b1e36b99b2a91a75ee464579`

---

## 🛠️ Comandos Útiles

### 1. Generar un APK Firmado en Modo Release
Ejecuta el siguiente comando desde la raíz del proyecto para compilar y firmar automáticamente el APK:
```powershell
# En Windows (usando la terminal PowerShell)
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"; cd android; .\gradlew assembleRelease
```
El archivo firmado se generará en:  
[`android/app/build/outputs/apk/release/mister11.apk`](file:///c:/Users/jhojan/Desktop/MISTER%2011/mister11-web/android/app/build/outputs/apk/release/mister11.apk)

### 2. Verificar la Firma del APK
Para comprobar que el APK está correctamente firmado y ver qué huellas digitales tiene aplicadas:
```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"; & "C:\Users\jhojan\AppData\Local\Android\Sdk\build-tools\35.0.0\apksigner.bat" verify --verbose --print-certs "android/app/build/outputs/apk/release/mister11.apk"
```

### 3. Inspeccionar el Contenido del Keystore
Para visualizar el alias y las huellas directamente desde el archivo `mister11.keystore`:
```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -list -v -keystore android/app/mister11.keystore -alias mister11 -storepass Mister11_2026
```
