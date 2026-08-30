# ─── Míster11 ProGuard Rules ────────────────────────────────────────────────
# Capacitor: mantener interfaces JS Bridge intactas
-keep class com.getcapacitor.** { *; }
-keep class com.getcapacitor.plugin.** { *; }
-dontwarn com.getcapacitor.**

# WebView JavaScript Interface: necesario para que JS acceda a métodos nativos
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface

# Firebase Auth + Google Sign-In
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Credentials API (Android Credential Manager)
-keep class androidx.credentials.** { *; }
-dontwarn androidx.credentials.**

# Google Identity
-keep class com.google.android.libraries.identity.googleid.** { *; }
-dontwarn com.google.android.libraries.identity.googleid.**

# Splash screen
-keep class androidx.core.splashscreen.** { *; }

# Mantener anotaciones y reflexión (necesario para Firebase)
-keepattributes Annotation
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses

# Info de líneas para crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Gson (usado en serialización)
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Evitar warnings innecesarios de librerías de terceros
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**

# Facebook SDK (referenciado por capacitor-firebase-authentication pero no incluido)
-dontwarn com.facebook.CallbackManager$Factory
-dontwarn com.facebook.CallbackManager
-dontwarn com.facebook.FacebookCallback
-dontwarn com.facebook.login.LoginManager
-dontwarn com.facebook.login.widget.LoginButton

