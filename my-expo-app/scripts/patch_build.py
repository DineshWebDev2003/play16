import sys, os

path = os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'build.gradle')

with open(path, 'r') as f:
    content = f.read()

content = content.replace(
    '        }\n    }\n    buildTypes {',
    '        }\n        release {\n            storeFile file(System.getenv("KEYSTORE_PATH") ?: "/tmp/keystore.jks")\n            storePassword System.getenv("CM_KEYSTORE_PASSWORD")\n            keyAlias System.getenv("CM_KEY_ALIAS")\n            keyPassword System.getenv("CM_KEY_PASSWORD")\n        }\n    }\n    buildTypes {'
)

content = content.replace(
    '        release {\n            // Caution! In production, you need to generate your own keystore file.\n            // see https://reactnative.dev/docs/signed-apk-android.\n            signingConfig signingConfigs.debug',
    '        release {\n            signingConfig signingConfigs.release'
)

with open(path, 'w') as f:
    f.write(content)
print('build.gradle patched successfully')
