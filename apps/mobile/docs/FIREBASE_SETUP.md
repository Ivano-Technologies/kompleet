# Firebase setup (Kompleet mobile)

Firebase is wired for the **Expo** app so the native Android/iOS config is applied at build time (no manual Gradle edits).

## What’s configured

- **Project:** `kompleet-e3c66`
- **Android package (production):** `com.ivanotechnologies.kompleet`
- **Config file:** `apps/mobile/google-services.json`
- **Expo:** `android.googleServicesFile` and `plugins: ["@react-native-firebase/app"]` in `app.config.ts`
- **Packages:** `@react-native-firebase/app`, `@react-native-firebase/analytics`

The **React Native Firebase** Expo plugin injects the Google Services Gradle plugin and Firebase dependencies into the generated `android/` project when you run `expo prebuild` or EAS Build. You do **not** need to add anything by hand to `build.gradle.kts`.

## Local dev

1. Install dependencies (already done if you ran `pnpm install` in the repo).
2. Run the app:
   - `pnpm start` then choose Android, or
   - `pnpm android` (requires Android emulator or device).

## Building (EAS)

- **Development build:** `eas build --profile development --platform android`
- **Production:** `eas build --profile production --platform android`

The plugin will use `google-services.json` and apply the Firebase SDK (BoM, Analytics, etc.) during the build.

## Adding more Firebase products

1. Enable the product in [Firebase Console](https://console.firebase.google.com) (e.g. Crashlytics, Cloud Messaging).
2. Install the React Native Firebase module, e.g. `pnpm add @react-native-firebase/crashlytics`.
3. The Expo plugin will pull in the required native dependencies; no extra Gradle changes needed.

## Package names

- **Production:** `com.ivanotechnologies.kompleet` (matches the Android app in Firebase).
- **Preview / Dev:** `com.ivano.kompleet.preview` and `com.ivano.kompleet.dev`. To use Firebase in those builds, add matching Android apps in the Firebase project and merge their `google-services.json` into `apps/mobile/google-services.json` (multiple `client` entries).

---

## Firebase Auth and app testing – checklist

### 1. Firebase Console (already done if you added SHA-1)
- [ ] **Authentication** → Sign-in method: enable the providers you need (Email/Password, Google, etc.).
- [ ] **Project settings** → Your apps → Android app: SHA-1 and SHA-256 fingerprints added (needed for Google Sign-In, Phone Auth, etc.).
- [ ] If using **Google Sign-In**: in Google Cloud Console (APIs & Services → Credentials), create an **OAuth 2.0 Client ID** (Android) with the same package name and SHA-1; add the **Web client ID** (optional) to your app if you use one-tap or server auth.

### 2. App code – Firebase Auth
- [ ] Install: `pnpm add @react-native-firebase/auth` (in `apps/mobile`).
- [ ] In app code: import and use `@react-native-firebase/auth` (e.g. `auth().signInWithCredential`, `auth().currentUser`). Do not use the Firebase JS SDK for Auth if you want native Google Sign-In; use React Native Firebase.
- [ ] Wire your UI to sign-in/sign-out and protect routes or Supabase usage with the Firebase ID token if you link Firebase Auth to Supabase (e.g. custom token or token exchange).

### 3. App testing (internal / QA)
- [ ] **Internal testing track (Play Console):** Create an **Internal testing** release, upload the AAB from EAS (`eas build --profile production --platform android`), add testers by email. They install via the Play Console link.
- [ ] **Firebase App Check (optional):** In Firebase Console → App Check, register the Android app (with SHA-1). Enable App Check for Auth (and optionally other APIs) to reduce abuse.
- [ ] **Test accounts:** Create test users in Firebase Auth (or use test phone numbers for Phone Auth) and document them for QA.

### 4. EAS Build – fix “Configure expo-updates” failure
- [ ] Ensure `app.config.ts` has `plugins: ["expo-updates", "@react-native-firebase/app"]` and a fixed `runtimeVersion` (e.g. `"1.0.0"`) for bare workflow.
- [ ] If the build still fails, open the build log URL from the error (expo.dev → your build) and check the “Configure expo-updates” step for the exact error (e.g. missing env or version mismatch).
