#!/bin/bash
set -e

echo "$CM_KEYSTORE" > /tmp/keystore.b64
python3 -c "import base64; open('/tmp/keystore.keystore','wb').write(base64.b64decode(open('/tmp/keystore.b64').read()))"

cat > android/key.properties << EOF
storeFile=/tmp/keystore.keystore
storePassword=$CM_KEYSTORE_PASSWORD
keyAlias=$CM_KEY_ALIAS
keyPassword=$CM_KEY_PASSWORD
EOF

python3 -c "
with open('android/app/build.gradle','r') as f:
    c = f.read()
h = '''
def keystorePropertiesFile = rootProject.file('key.properties')
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
'''
c = c.replace('def projectRoot = rootDir', h + 'def projectRoot = rootDir')
b = '''        release {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
'''
c = c.replace('signingConfigs {\n        debug {','signingConfigs {\n' + b + '        debug {')
c = c.replace('signingConfig signingConfigs.debug','signingConfig signingConfigs.release',1)
open('android/app/build.gradle','w').write(c)
print('Signing configured')
"
