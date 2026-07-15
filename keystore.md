# Keystore — TN HappyKids Android App

> **WARNING:** Keep this file secure. Never commit to public repositories.
> This file is for internal reference only (Codemagic CI/CD, team access).

## Keystore File

| Property | Value |
|----------|-------|
| **File** | `tnhappykids-upload-key.jks` |
| **Location** | Project root `./tnhappykids-upload-key.jks` |
| **Type** | JKS (Java KeyStore) |
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

### 1. Base64 Encode Keystore
```bash
certutil -encode .\tnhappykids-upload-key.jks keystore-base64.txt
type keystore-base64.txt  # copy the content (excluding BEGIN/END lines)
```

### 2. Set Environment Variables in Codemagic

Go to **Codemagic Dashboard** → Team → Environment variables → Add:

#### Android Signing

**Group:** `android_signing`

| Variable | Value |
|----------|-------|
| `CM_KEYSTORE` | (see base64 content below — copy everything including BEGIN/END lines) |
| `CM_KEYSTORE_PASSWORD` | `android` |
| `CM_KEY_ALIAS` | `upload` |
| `CM_KEY_PASSWORD` | `android` |

#### Google OAuth (injected into app via `EXPO_PUBLIC_*`)

**Group:** `google_oauth`

| Variable | Value |
|----------|-------|
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | `1007921293882-eu3ij3714kggfqo9qlf7vjru4v4roaol.apps.googleusercontent.com` |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | `1007921293882-hoeftpiglonoqr50go781nom220dqmpf.apps.googleusercontent.com` |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | _(leave empty for now, set when deploying iOS)_ |

These `EXPO_PUBLIC_*` variables will be picked up automatically by Expo at build time and injected into the app bundle.

> **Important:** Make sure Codemagic workflow is configured to read `EXPO_PUBLIC_*` env vars. Expo SDK 49+ reads these automatically during `eas build`. For Codemagic, ensure the build step runs `npx expo export` or `eas build` with these variables present.

### CM_KEYSTORE Base64 Content

Copy the entire block below (including `-----BEGIN CERTIFICATE-----` and `-----END CERTIFICATE-----`) into the `CM_KEYSTORE` environment variable value in Codemagic:

```
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
wl7E4ulVyRemkEVp/g==
```

### 3. Codemagic Pre-build Script

Ensure `codemagic.yaml` or workflow includes Android signing step (usually auto-detected when these env vars are present).

## EAS Build Setup

If using EAS Build instead of Codemagic, upload the keystore via:

```bash
eas credentials --platform android
```

Choose option to upload an existing keystore and provide the file path.
