#!/bin/bash
set -e
export KEYSTORE_PATH=/tmp/keystore.keystore
export KEYSTORE_PASSWORD=$CM_KEYSTORE_PASSWORD
export KEY_ALIAS=$CM_KEY_ALIAS
export KEY_PASSWORD=$CM_KEY_PASSWORD

echo "$CM_KEYSTORE" > /tmp/keystore.b64
python3 -c "import base64; open('/tmp/keystore.keystore','wb').write(base64.b64decode(open('/tmp/keystore.b64').read()))"

python3 -c "
with open('android/app/build.gradle','r') as f:
    c = f.read()
b = '''        release {
            storeFile file(System.getenv('KEYSTORE_PATH'))
            storePassword System.getenv('KEYSTORE_PASSWORD')
            keyAlias System.getenv('KEY_ALIAS')
            keyPassword System.getenv('KEY_PASSWORD')
        }
'''
c = c.replace('signingConfigs {\n        debug {','signingConfigs {\n' + b + '        debug {')
c = c.replace('signingConfig signingConfigs.debug','signingConfig signingConfigs.release',1)
open('android/app/build.gradle','w').write(c)
print('Signing configured')
"
