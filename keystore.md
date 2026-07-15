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
| **SHA1** | `38:73:F7:BB:1E:C7:48:D6:7E:62:21:2C:88:36:5A:4D:3D:2F:C0:64` |
| **SHA256** | `D8:97:D0:94:AA:39:72:02:0E:45:81:F0:07:14:AD:BD:A7:D1:31:6C:A7:B8:57:5C:68:DB:1F:B9:C0:8F:3E:9D` |

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
MIIKxAIBAzCCCm4GCSqGSIb3DQEHAaCCCl8EggpbMIIKVzCCBa4GCSqGSIb3DQEH
AaCCBZ8EggWbMIIFlzCCBZMGCyqGSIb3DQEMCgECoIIFQDCCBTwwZgYJKoZIhvcN
AQUNMFkwOAYJKoZIhvcNAQUMMCsEFIfipxXGVWe5DjxS1UqMizi3R0+zAgInEAIB
IDAMBggqhkiG9w0CCQUAMB0GCWCGSAFlAwQBKgQQYQVB9uOLqeD+gId7+O5QZgSC
BNCyBqRggA1JqwygynJ0CXvs8Q7urUs1YC6PjNJEsk3nSpr+YS9ZQKCXZqsXBvU0
CkvWFMvHkfi81c5Pz+Vj6Td1ogzMm0TR4nbVW/sd9pTsLnhWxcX5tIb6EqbRNk2f
bzTG2K1JgIuSjMG3ir8GapczHzIYagpKDa8cKTF/m+woa8jrGH3Y/3+Q9TsWvNI8
6DyOXfNb2BHqy7GdIldfwoANy0JRJEHIJ5Y637fxblwMjQIttU7IEX2ZAvCg4iXY
pLCa0I0l15dNC/lEcjp2W6cdelNT6li8fgS96f3jGQrkt+6qwkhA0cvwJVpPpX03
PWBJKNSpYGKY9+U4Hg15GAtU+LRRF1ohFumdYOi88fhsbBCNqvUP5M4tZ5/PI8BH
U55NBVEM+XIsCvu+RWYFDZ9wT1QLPZtOMquDOWeZ6B3XQpg1o6CfW43cfJJ6mRnf
Pi7i2TWzNVnylIIcSm6BEbn6IAKLxZ3Cy1D/1Tz3QYMsfFnd+qXhOLoPhZiICoSH
yuzT8OKPHt4BDjOPIoeRtUWHYGXjxTO7rnfpizXH0fISMFh9wzKHGPm0m3tb8L8G
Ezab5k6KefNI4eTr/EGYky9tChVLM8/u62s7P5oRKgsZKNrS0on3P0SmhNIHYsVv
Q3HoIX7dvJv6cFWSLz2LtLjtMALxvT0I3sybwMj9erZrWxP03CQHDllHCTNJUctf
BCreqCZGNuzk/7pi9drfijYSnwh6RSqXEdWyGWtWYVBl8URgSvmlbpCukd5kDzAq
UXQ/8TwVZ2NLfxoO1Hzp3poFzb90CpoNPKASpBDy7jNMis80PHj3NKk3u7hGywwD
akaZSPhVRlHdsOU3wi2+Q+M8FneGGtGYnXZbXINtRZXbOli8JBChbZBA2dpKZ2Yq
gsJzGAU6g0DG21ZTzIrgHgLpMACdcRMjgQk9Zm0+hg8DIkWP+kA+8Pq/C0DWcGZN
vfLy80nCukQDcUMW5Ooa7kmZwTOdnfsVjVFDUDBaVVTI3Mb5YK/D1vlfaYcVEA4P
E1IgfqiL9e7T/ynKNcSKsFbFzH4IZLhs/mMC9uzkoL0Xw9wI3sTw3C7Wx1dSt2x0
CtPWclri/8Gf/9yyBDdH2QMiDzX8G3LP+CVLL5KgJoDTOHfKzVo2pNudMUglON+2
J+JYqhT9rqdEiwCSn49HkHC5lVrDyN0S8Jl38tXSGdVsTtAIaajz1+Zfm8NLAe1L
1NXoEM9VpXPmkW+HW6k4hJUV/VGlQVLLMasYbt3GGYIzo6F6BiIGLmSkhiQEe6FC
AKiuScRilV+CHZZijAHJ1CJuL+Pye0wyozF4d8Pj0BPk4HsrkmEdigu1fVHfrsej
4+qdIQo3SpwsP1ahGoB3MjBh3NcrrT27IRY0qT0nb4a0hOS/VyuD790Ob5hJzXHD
+9SrJfk8xJ/QilJaRrF+8WwRxjml2llhjAdjhi1Fr0Zl8peK20t1e3gAG3T/BIcq
AoZT6EtSZtU/6lDwAdRsVFGLaq3jQKQl5eaH9gJrh1u2emi4cuVtQVl9l5pXBzGV
m4Q5VkwDty208/BNShJJv0sql0ovedf+LgRzVzGmL7GU/GIFugfgC8Oc6VZiNF6b
dgE8G23xXZrcj4WH9X17RfMbfW0ITVe3nM8xIAhPMQvyYzFAMBsGCSqGSIb3DQEJ
FDEOHgwAdQBwAGwAbwBhAGQwIQYJKoZIhvcNAQkVMRQEElRpbWUgMTc4NDExODE3
NjMzMDCCBKEGCSqGSIb3DQEHBqCCBJIwggSOAgEAMIIEhwYJKoZIhvcNAQcBMGYG
CSqGSIb3DQEFDTBZMDgGCSqGSIb3DQEFDDArBBQ9/QS6Lk+sgoJBpepQJTLWTAG+
QgICJxACASAwDAYIKoZIhvcNAgkFADAdBglghkgBZQMEASoEEGDILEnRT/bzWajZ
QAke/7qAggQQD4jlS99O2tTlc0S5cGqEqMiep4UD8F0m//B+YeQvlaSyaFzj66Q5
1S7pWPlVldxpO/hi/4ne8q88z0rFQL+AlWv5JzV+jULQN39vEzAlcgUsAkmEdTYS
o5jzT5POY1OiZ70btS3LgAXWYQBxEPzyZDx5hor8YKNq+UX27poQdnKZBVhcqYBn
CM1qk/nJ3lIN6IOAruEZH6G1fbyAY1SSnevGKjgDBANT0s1shSKyc1YaLwLwUxTQ
GS1zLzl3qZi7SUSTwq4gvqz4jektqk4La/Un04wgXTSyVsJ9STwf2/6gZLbdsXh6
AVbrRzkS0Cy96DvObid0gubn2wx/u1CoP/PjkUogCtBwlopJglfqnEz8r3HcRkxI
bAgf2QaDmerOTTz766ZbYy4Ea+ths7VIIUxswNrpTb1o4P8+Pa0MC7gZNToUbsNh
qWWWxY/sVPjkIzkz9OJNS3H9/yKSXuTWTJvxuSK6P9xA1dc4UIKH620mEr1CtSz3
LPBmYnqg813Zxu6cUa2AExu3zJuCI3AIdwfCnH4X9ItFJyZoFaAd5tW1tv7xs52s
6j1OOCeeLWH5CF5+FttBLFjd6jeePrc6/2Q0fJNjkLZfXhU2iUU5E0FWh89WPWk9
qTbQntuE0tkRaInbk5N1zskAIonptMFHgtUzrkS4pxS1dlmGNusnhoFzU+qxnBow
VeNoe/4en4aQrwSpwsfgxTq1eYjM6bEGers4b6vAKcLLfeeKobTxq8sTq9iFgwDJ
twCAlvHwXEqmHXAMEYJMXv1wk8LvHjIbchPKkiuprXkq6T0hopLlOBq2IFZRpV+c
/cqDI7UT6+Pjf06wXWcJ3elLqNT4Tde0LkULKTxUaq8aDOc9oBKh1JpJnvX7vHg0
P8P95HTY337ogBz/2DgvMWNsBJrnR3Rhwu9X+z/MSp0tNMnnL77qiuZdyZdo5S7X
i0RCD92F60QpKGUd7Q297NBNxxI4oLJLhxgu68HrkDmM4F0Xs1hw2StJas5ET8Uq
KrNsZddz5Zy8fdUtaGc7U/eh5QySNOoYhFMfqCbptbdAezaxYOWUMQ8AGauzy2VN
j0tngJZkLrdqFGtwU1AtnUMsRwgV9N/nQBE6kTrafOpQkPa+0BnC75mEnuAdtGUg
bOvohZPpedA+atohfKfbsVMSkFTzsGRTss7bGDWC1lfipg7G9tOZwBs1w5S4NGtU
kKeARaexbeXDEIC13WEOS5jdi2NHZKpMt28w0tJx13/TV5OLnWO1KVSxwNWkXUxe
ccWA0Vz8TeCP0F2YcWMpQIluWG9v3YLCcMSSVymj8Sw2/nxILXJUZ5JYbnh1SwXh
S43DwBp0TAmqSYbQVtxzrR9kebcAHY0jARSIeB9mTa2v3a6Ji2316fQwTTAxMA0G
CWCGSAFlAwQCAQUABCB4o90/bOny/qZIjIXDD0a3kfXTmP/ZwCdV8xTxa5fo8gQU
hojF8wbXllCb62AeuYbfgwbIuw0CAicQ
```

### 3. Codemagic Pre-build Script

Ensure `codemagic.yaml` or workflow includes Android signing step (usually auto-detected when these env vars are present).

## EAS Build Setup

If using EAS Build instead of Codemagic, upload the keystore via:

```bash
eas credentials --platform android
```

Choose option to upload an existing keystore and provide the file path.
