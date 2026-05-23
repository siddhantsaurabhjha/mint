# LASI

Premium private couple app with neon romantic styling, mobile-first layout, PWA support, and Android APK support via Capacitor.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Framer Motion
- next-pwa
- Capacitor Android shell

## App Capabilities

- App Router + Tailwind + Framer Motion
- PWA manifest + service worker base setup
- Glassmorphism bottom nav
- Theme system with auto day/night mode
- Mobile-first layout tuned for Android
- Native Android wrapper with FCM push support

## Run

```bash
npm run dev
```

Build and preview the PWA bundle:

```bash
npm run build
npm run start
```

## Android APK Build

1. Set `CAPACITOR_SERVER_URL` to the deployed Next.js app URL if you want the Android shell to load the hosted app.
	The app still relies on Next API routes for upload and push delivery, so the APK should point at the deployed site.
2. Install Android dependencies and sync the native project:

```bash
npm run cap:sync
```

3. Open Android Studio:

```bash
npm run cap:open
```

4. Build the APK from Android Studio or use the Gradle build in `android/`.

## Firebase Push

- Add your Firebase Android config file to `android/app/google-services.json`.
- Set these environment variables for FCM server delivery:
	- `FIREBASE_SERVICE_ACCOUNT_JSON` or
	- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- Native Android tokens are stored through the existing push subscription API.

## Notes

- Keep UI and routing unchanged when modifying native behavior.
- Update icons in `public/icons` to match final branding.
