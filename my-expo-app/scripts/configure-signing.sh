#!/bin/bash
set -e

echo "$CM_KEYSTORE" > /tmp/keystore.b64

python3 << 'PYEOF'
import base64, os

with open('/tmp/keystore.b64') as f:
    ks = f.read()
with open('/tmp/keystore.keystore', 'wb') as f:
    f.write(base64.b64decode(ks))

with open('android/key.properties', 'w') as f:
    f.write('storeFile=/tmp/keystore.keystore\n')
    f.write('storePassword=' + os.environ['CM_KEYSTORE_PASSWORD'] + '\n')
    f.write('keyAlias=' + os.environ['CM_KEY_ALIAS'] + '\n')
    f.write('keyPassword=' + os.environ['CM_KEY_PASSWORD'] + '\n')

with open('android/app/build.gradle', 'r') as f:
    c = f.read()

header = '''
def keystorePropertiesFile = rootProject.file('key.properties')
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
'''
c = c.replace('def projectRoot = rootDir', header + 'def projectRoot = rootDir')

release_signing = '''        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
'''
c = c.replace('signingConfigs {\n        debug {', 'signingConfigs {\n' + release_signing + '        debug {')
c = c.replace('signingConfig signingConfigs.debug', 'signingConfig signingConfigs.release', 1)

with open('android/app/build.gradle', 'w') as f:
    f.write(c)

print('Signing configured successfully')
PYEOF
