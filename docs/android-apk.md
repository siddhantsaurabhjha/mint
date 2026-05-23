# Android APK with Capacitor

## Setup

1. Build the web app:

```bash
npm run build
```

2. Sync the Capacitor Android project:

```bash
npm run cap:sync
```

3. Open the native project:

```bash
npm run cap:open
```

## Push Notifications

- Android uses Firebase Cloud Messaging for background and closed-state delivery.
- Foreground push events are surfaced with local notifications inside the native shell.
- Add `android/app/google-services.json` from your Firebase project.
- Configure one of these env var sets for server-side FCM delivery:
  - `FIREBASE_SERVICE_ACCOUNT_JSON`
  - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

## Runtime Notes

- The app keeps the existing UI and route logic unchanged.
- Native initialization handles status bar styling, splash screen hiding, and push registration.
- If you want the Android shell to load a deployed web build, set `CAPACITOR_SERVER_URL` before syncing.
