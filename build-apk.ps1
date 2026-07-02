# ═══════════════════════════════════════════════════════════════════
#  build-apk.ps1  —  Script automatizado de compilación APK Míster11
#  Versión: 1.1.7+
#
#  FLUJO COMPLETO:
#    1. Validar variables de entorno críticas (.env)
#    2. npm run build          → Rebuild del bundle web
#    3. npx cap sync android   → Sincronizar assets al proyecto Android
#    4. gradlew assembleRelease → Compilar y firmar APK
#    5. Copiar APK a la raíz
#    6. node upload-apk.mjs   → Subir a Firebase Storage + actualizar Firestore
#    7. git add / commit / push → Trigger de deploy en Vercel
#
#  USO:
#    .\build-apk.ps1
#    .\build-apk.ps1 -SkipUpload       (omite subida a Firebase)
#    .\build-apk.ps1 -SkipGit          (omite git push)
#    .\build-apk.ps1 -SkipUpload -SkipGit  (solo compila el APK)
# ═══════════════════════════════════════════════════════════════════

param(
    [switch]$SkipUpload = $false,
    [switch]$SkipGit    = $false
)

$ErrorActionPreference = 'Stop'

# ── Colores de salida ────────────────────────────────────────────────────────
function Write-Step   { param($msg) Write-Host "`n🔵 $msg" -ForegroundColor Cyan }
function Write-OK     { param($msg) Write-Host "   ✅ $msg" -ForegroundColor Green }
function Write-Warn   { param($msg) Write-Host "   ⚠️  $msg" -ForegroundColor Yellow }
function Write-Fail   { param($msg) Write-Host "`n❌ $msg" -ForegroundColor Red; exit 1 }

# ── Paths ────────────────────────────────────────────────────────────────────
$RootDir    = $PSScriptRoot
$ApkOutput  = "$RootDir\android\app\build\outputs\apk\release\mister11.apk"
$ApkDest    = "$RootDir\Mister11.apk"
$JavaHome   = "C:\Program Files\Android\Android Studio\jbr"

# ═══════════════════════════════════════════════════════════════════
# BANNER
# ═══════════════════════════════════════════════════════════════════
Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host   "║      🏆  Míster11 — Build APK Automatizado         ║" -ForegroundColor Magenta
Write-Host   "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

# ═══════════════════════════════════════════════════════════════════
# PASO 0: Validar entorno
# ═══════════════════════════════════════════════════════════════════
Write-Step "PASO 0: Validando entorno..."

# Verificar .env
if (-not (Test-Path "$RootDir\.env")) {
    Write-Fail "No se encontró el archivo .env. Crea uno basándote en .env.example"
}
$envContent = Get-Content "$RootDir\.env" -Raw
$requiredVars = @(
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET'
)
foreach ($var in $requiredVars) {
    if ($envContent -notmatch $var) {
        Write-Fail "Variable de entorno faltante en .env: $var"
    }
}
Write-OK ".env validado con las variables críticas presentes."

# Verificar Java
if (-not (Test-Path $JavaHome)) {
    Write-Fail "JAVA_HOME no encontrado en: $JavaHome`n   Instala Android Studio o ajusta la ruta en build-apk.ps1"
}
Write-OK "JAVA_HOME encontrado."

# Verificar Keystore
if (-not (Test-Path "$RootDir\android\app\mister11.keystore")) {
    Write-Fail "Keystore no encontrado: android/app/mister11.keystore"
}
Write-OK "Keystore verificado."

# Leer versión del package.json
$pkgJson    = Get-Content "$RootDir\package.json" -Raw | ConvertFrom-Json
$appVersion = $pkgJson.version
Write-OK "Versión detectada: v$appVersion"

# ═══════════════════════════════════════════════════════════════════
# PASO 1: npm run build
# ═══════════════════════════════════════════════════════════════════
Write-Step "PASO 1: Compilando bundle web (npm run build)..."
Set-Location $RootDir
$buildStart = Get-Date
npm run build
if ($LASTEXITCODE -ne 0) { Write-Fail "npm run build falló." }
$buildTime = [math]::Round(((Get-Date) - $buildStart).TotalSeconds, 1)
Write-OK "Bundle web compilado en ${buildTime}s."

# ═══════════════════════════════════════════════════════════════════
# PASO 2: npx cap sync android
# ═══════════════════════════════════════════════════════════════════
Write-Step "PASO 2: Sincronizando assets al proyecto Android (cap sync)..."
npx cap sync android
if ($LASTEXITCODE -ne 0) { Write-Fail "cap sync android falló." }
Write-OK "Assets sincronizados a android/app/src/main/assets/public/"

# ═══════════════════════════════════════════════════════════════════
# PASO 3: Compilar APK con Gradle
# ═══════════════════════════════════════════════════════════════════
Write-Step "PASO 3: Compilando APK release con Gradle..."
$env:JAVA_HOME = $JavaHome
Set-Location "$RootDir\android"
$gradleStart = Get-Date
.\gradlew assembleRelease
if ($LASTEXITCODE -ne 0) {
    Set-Location $RootDir
    Write-Fail "gradlew assembleRelease falló."
}
$gradleTime = [math]::Round(((Get-Date) - $gradleStart).TotalSeconds, 0)
Set-Location $RootDir
Write-OK "APK compilado y firmado en ${gradleTime}s."

# ═══════════════════════════════════════════════════════════════════
# PASO 4: Copiar APK a la raíz
# ═══════════════════════════════════════════════════════════════════
Write-Step "PASO 4: Copiando APK a la raíz del proyecto..."
if (-not (Test-Path $ApkOutput)) {
    Write-Fail "APK no encontrado en: $ApkOutput"
}
Copy-Item $ApkOutput -Destination $ApkDest -Force
$apkSizeMB = [math]::Round((Get-Item $ApkDest).Length / 1MB, 1)
Write-OK "APK copiado: Mister11.apk ($apkSizeMB MB)"

# ═══════════════════════════════════════════════════════════════════
# PASO 5: Subir APK a Firebase Storage + Actualizar Firestore
# ═══════════════════════════════════════════════════════════════════
if (-not $SkipUpload) {
    Write-Step "PASO 5: Subiendo APK a Firebase Storage..."
    node "$RootDir\upload-apk.mjs"
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "La subida a Firebase falló. El APK está disponible localmente."
        Write-Warn "Puedes subirlo manualmente con: node upload-apk.mjs"
    } else {
        Write-OK "APK subido a Firebase Storage y Firestore actualizado."
    }
} else {
    Write-Warn "PASO 5 omitido (-SkipUpload)."
}

# ═══════════════════════════════════════════════════════════════════
# PASO 6: Git commit + push → Deploy automático en Vercel
# ═══════════════════════════════════════════════════════════════════
if (-not $SkipGit) {
    Write-Step "PASO 6: Commit y push a GitHub (Vercel deploy)..."
    Set-Location $RootDir
    git add -A
    $commitMsg = "chore: release v$appVersion — build automatizado con build-apk.ps1"
    git commit -m $commitMsg 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "No hay cambios pendientes para commit (working tree limpio)."
    }
    git push origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "git push falló. Verifica tu conexión y credenciales."
    } else {
        Write-OK "Push a origin/main completado. Vercel iniciará el deploy automáticamente."
    }
} else {
    Write-Warn "PASO 6 omitido (-SkipGit)."
}

# ═══════════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ═══════════════════════════════════════════════════════════════════
Write-Host "`n╔════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host   "║  ✅ BUILD COMPLETADO — Míster11 v$appVersion$((' ' * (20 - $appVersion.Length)))║" -ForegroundColor Green
Write-Host   "╠════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host   "║  APK local:  Mister11.apk ($apkSizeMB MB)$((' ' * (18 - "$apkSizeMB MB".Length)))║" -ForegroundColor Green
if (-not $SkipUpload) {
Write-Host   "║  Firebase:   Storage + Firestore actualizados      ║" -ForegroundColor Green
}
if (-not $SkipGit) {
Write-Host   "║  Vercel:     Deploy en curso (rama main)           ║" -ForegroundColor Green
}
Write-Host   "╚════════════════════════════════════════════════════╝`n" -ForegroundColor Green
