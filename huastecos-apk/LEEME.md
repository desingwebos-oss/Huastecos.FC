# Huastecos FC – App Android (APK)

Tu mismo `index.html` empaquetado con Capacitor. Backend: tu Google Apps Script (sin cambios).
Offline: la app abre con los datos guardados en el teléfono (localStorage) y sincroniza con Sheets cuando hay internet.

## Opción A – Sin instalar nada (GitHub Actions)  ✅ la más fácil
1. Crea un repo en github.com (privado está bien) y sube TODO el contenido de esta carpeta.
2. Ve a la pestaña **Actions** → "Build APK Huastecos FC" → **Run workflow** (también corre solo al hacer push).
3. Al terminar (~5 min) entra a la ejecución y descarga **HuastecosFC-apk** → dentro está `app-debug.apk`.
4. Pásalo al celular (WhatsApp, Drive, cable) y ábrelo. Acepta "Instalar apps desconocidas".

## Opción B – En tu PC (Node 20 + JDK 21 + Android SDK / Android Studio)
    npm install
    npx cap add android
    npx capacitor-assets generate --android
    npx cap sync android
    cd android && ./gradlew assembleDebug        (Windows: gradlew.bat assembleDebug)
APK: android/app/build/outputs/apk/debug/app-debug.apk

## Cada vez que cambies el HTML
Edita `www/index.html` → push (Opción A) o `npx cap sync android` y recompila (Opción B).

## Para publicar en Play Store
Necesitas un APK/AAB firmado (release). Genera un keystore y usa `./gradlew bundleRelease`.
