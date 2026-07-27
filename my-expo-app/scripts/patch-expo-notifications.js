/**
 * Post-install script that patches expo-notifications to use BigPictureStyle
 * on Android when a notification contains an image.
 *
 * Without this patch, notification images only show in the heads-up popup
 * (as a large icon) but disappear in the notification drawer because
 * BigTextStyle is always used instead of BigPictureStyle.
 */
const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-notifications',
  'android',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'notifications',
  'notifications',
  'presentation',
  'builders',
  'ExpoNotificationBuilder.kt'
);

if (!fs.existsSync(targetFile)) {
  console.log('[notif-patch] Target file not found, skipping patch.');
  process.exit(0);
}

let content = fs.readFileSync(targetFile, 'utf8');

const checks = [
  'BigPictureStyle',
  'imageBitmap',
  'bigPicture(imageBitmap)',
];

const alreadyPatched = checks.every(c => content.includes(c));
if (alreadyPatched) {
  console.log('[notif-patch] Already patched, skipping.');
  process.exit(0);
}

// --- Patch 1: Replace BigTextStyle usage with conditional BigPictureStyle ---
const oldStyleBlock = `    builder.setSubText(content.subText)

    // Sets the text/contentText as the bigText to allow the notification to be expanded and the
    // entire text to be viewed.
    builder.setStyle(NotificationCompat.BigTextStyle().bigText(content.text))`;

const newStyleBlock = `    builder.setSubText(content.subText)

    // Cache the notification image bitmap (if any) so we only download once
    val imageBitmap = if (notificationContent.containsImage()) {
      notificationContent.getImage(context)
    } else {
      null
    }

    if (imageBitmap != null) {
      // BigPictureStyle: shows the image when the notification is expanded in the drawer
      builder.setStyle(
        NotificationCompat.BigPictureStyle()
          .bigPicture(imageBitmap)
          .bigLargeIcon(null)
          .setSummaryText(content.text)
      )
    } else {
      // BigTextStyle: shows the full text when the notification is expanded
      builder.setStyle(NotificationCompat.BigTextStyle().bigText(content.text))
    }`;

if (!content.includes(oldStyleBlock)) {
  console.log('[notif-patch] Could not find style block to patch.');
  process.exit(1);
}
content = content.replace(oldStyleBlock, newStyleBlock);

// --- Patch 2: Replace duplicate getImage call with cached imageBitmap ---
const oldIconBlock = `    if (notificationContent.containsImage()) {
      val bitmap = notificationContent.getImage(context)
      bitmap?.let { builder.setLargeIcon(it) }
    } else {
      builder.setLargeIcon(largeIcon)
    }`;

const newIconBlock = `    if (imageBitmap != null) {
      builder.setLargeIcon(imageBitmap)
    } else {
      builder.setLargeIcon(largeIcon)
    }`;

if (!content.includes(oldIconBlock)) {
  console.log('[notif-patch] Could not find icon block to patch.');
  process.exit(1);
}
content = content.replace(oldIconBlock, newIconBlock);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('[notif-patch] Successfully patched ExpoNotificationBuilder.kt with BigPictureStyle support.');