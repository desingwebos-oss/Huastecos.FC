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

---------------------------------------------------------------
# 🍎 VERSIÓN iPHONE

## Opción 1 – PWA (GRATIS, sin cuenta Apple, la recomendada)
1. Sube este proyecto a GitHub. En Settings → Pages → Source: **GitHub Actions**.
2. Corre el workflow **"Publicar PWA"** (Actions → Run workflow). Te da una URL https://TU-USUARIO.github.io/TU-REPO/
3. En el iPhone abre esa URL **en Safari** → botón Compartir → **Agregar a pantalla de inicio**.
4. Queda como app con icono, pantalla completa y funciona offline. Mismo Apps Script de backend.
(En Android también sirve: Chrome → Instalar app.)

## Opción 2 – App nativa iOS (.ipa)
Apple exige firma. Dos caminos:
- **Sin cuenta de pago (sideload):** corre el workflow **"Build IPA iOS (sin firmar)"**, descarga el .ipa y
  fírmalo/instálalo con **Sideloadly** o **AltStore** usando tu Apple ID gratis (la app caduca cada 7 días).
- **Cuenta Apple Developer ($99 USD/año):** en un Mac: `npm install && npx cap add ios && npx cap sync ios && npx cap open ios`,
  en Xcode elige tu Team y publica por TestFlight / App Store.
