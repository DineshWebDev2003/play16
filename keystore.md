# Keystore — TN HappyKids Android App

> **WARNING:** Keep this file secure. Never commit to public repositories.
> This file is for internal reference only (Codemagic CI/CD, team access).

## Keystore File

| Property | Value |
|----------|-------|
| **File** | `tnhappykids-upload-key.p12` |
| **Location** | Project root `./tnhappykids-upload-key.p12` |
| **Type** | PKCS12 (recommended for Android Gradle Plugin) |
| **Created** | 15-Jul-2026 |
| **Validity** | 10,000 days (until 30-Nov-2053) |

## Credentials

| Credential | Value |
|------------|-------|
| **Store Password** | `android` |
| **Key Alias** | `upload` |
| **Key Password** | `android` |

## Certificate Details

- **CN:** TN HappyKids, OU: Development, O: TN HappyKids, L: Erode, ST: Tamil Nadu, C: IN
- **Algorithm:** RSA 2048-bit, SHA256withRSA

### SHA Fingerprints

| Type | Fingerprint |
|------|-------------|
| **SHA1** | `CB:1B:AD:F4:CD:31:F3:1F:17:CF:6A:7A:5F:71:20:62:90:D9:12:93` |
| **SHA256** | `32:A3:83:ED:03:E4:59:24:A5:4E:F5:D5:A9:49:1D:09:62:14:32:D1:51:07:10:7E:2B:2A:5B:BC:0D:27:95:7C` |

> The SHA1 fingerprint above must be added to **Firebase Console** → Project settings → Android app `com.tnhappykids.throneapp` for Google OAuth sign-in to work on Android.

## Codemagic CI/CD Setup

### 1. Server Setup (one-time)

The keystore is served via a secure API endpoint on the Laravel backend.

#### A. Deploy backend code

Push the latest code to deploy the `KeystoreController` and updated routes.

#### B. Upload keystore to server

Copy `tnhappykids-upload-key.p12` to the server at:
```
storage/app/keystore/tnhappykids-upload-key.p12
```

#### C. Add env var on server

Add to `school-backend/.env` on the server:
```
KEYSTORE_ACCESS_TOKEN=tnhappykids-keystore-GRcjDoUAtegTqFmLuNJx
```

### 2. Set Environment Variables in Codemagic

Go to **Codemagic Dashboard** → Team → Environment variables → Add:

**Group:** `signing`

| Variable | Value |
|----------|-------|
| `CM_KEYSTORE_URL` | `https://play1.tnhappykids.in/api/keystore/android` |
| `CM_KEYSTORE_ACCESS_TOKEN` | `tnhappykids-keystore-GRcjDoUAtegTqFmLuNJx` |
| `CM_KEYSTORE_PASSWORD` | `android` |
| `CM_KEY_ALIAS` | `upload` |
| `CM_KEY_PASSWORD` | `android` |

#### Google OAuth (injected into app via `EXPO_PUBLIC_*`)

| Variable | Value |
|----------|-------|
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | `1007921293882-eu3ij3714kggfqo9qlf7vjru4v4roaol.apps.googleusercontent.com` |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | `1007921293882-hoeftpiglonoqr50go781nom220dqmpf.apps.googleusercontent.com` |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | _(leave empty for now, set when deploying iOS)_ |

These `EXPO_PUBLIC_*` variables will be picked up automatically by Expo at build time and injected into the app bundle.

> **Important:** Make sure Codemagic workflow is configured to read `EXPO_PUBLIC_*` env vars. Expo SDK 49+ reads these automatically during `eas build`. For Codemagic, ensure the build step runs `npx expo export` or `eas build` with these variables present.

### 3. Codemagic Pre-build Script

Ensure `codemagic.yaml` or workflow includes Android signing step (usually auto-detected when these env vars are present).

## EAS Build Setup

If using EAS Build instead of Codemagic, upload the keystore via:

```bash
eas credentials --platform android
```

Choose option to upload an existing keystore and provide the file path.
