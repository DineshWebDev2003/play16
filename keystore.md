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

The build script (`codemagic.yaml`) supports two methods to get the keystore:

1. **Env var (CM_KEYSTORE)** — base64-decoded at build time (use when backend not deployed yet)
2. **Backend API** — downloaded via curl from Laravel API (use when `play1.tnhappykids.in` is live)

The script tries backend first, falls back to env var if backend is unavailable or not configured.

### Method 1: Env Var (current — server not live)

Set `CM_KEYSTORE` in Codemagic to the single-line PKCS12 base64 below.

### Method 2: Backend API (future — when server is live)

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

### Set Environment Variables in Codemagic

Go to **Codemagic Dashboard** → Team → Environment variables → Add.

**Group:** `signing`

| Variable | Value | Required |
|----------|-------|----------|
| `CM_KEYSTORE` | (see base64 below — single line) | Yes (fallback) |
| `CM_KEYSTORE_PASSWORD` | `android` | Yes |
| `CM_KEY_ALIAS` | `upload` | Yes |
| `CM_KEY_PASSWORD` | `android` | Yes |
| `CM_KEYSTORE_URL` | `https://play1.tnhappykids.in/api/keystore/android` | Optional (when server live) |
| `CM_KEYSTORE_ACCESS_TOKEN` | `tnhappykids-keystore-GRcjDoUAtegTqFmLuNJx` | Optional (when server live) |

### CM_KEYSTORE Base64 (PKCS12)

Single line — copy entirely:

```
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
```

### Google OAuth (injected into app via `EXPO_PUBLIC_*`)

| Variable | Value |
|----------|-------|
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | `1007921293882-eu3ij3714kggfqo9qlf7vjru4v4roaol.apps.googleusercontent.com` |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | `1007921293882-hoeftpiglonoqr50go781nom220dqmpf.apps.googleusercontent.com` |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | _(leave empty for now, set when deploying iOS)_ |

These `EXPO_PUBLIC_*` variables will be picked up automatically by Expo at build time and injected into the app bundle.

> **Important:** Make sure Codemagic workflow is configured to read `EXPO_PUBLIC_*` env vars. Expo SDK 49+ reads these automatically during `eas build`. For Codemagic, ensure the build step runs `npx expo export` or `eas build` with these variables present.

## EAS Build Setup

If using EAS Build instead of Codemagic, upload the keystore via:

```bash
eas credentials --platform android
```

Choose option to upload an existing keystore and provide the file path.
