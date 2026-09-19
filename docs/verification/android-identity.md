# Android identity and update probe (issue #2)

## Build identity

- Expo project: `@kianfratz/save-your-money`, ID `6bbb39a4-48be-43bd-bb86-1542c8e9909e`. The `kianfratz` account has owner access.
- Visible app name: `Save Your Money`.
- Android package: `com.kianfratz.saveyourmoney`.
- Preview builds use an APK, EAS-managed signing credentials, and the EAS remote Android version counter. EAS Update is disabled in app config.
- Signed upgrade baseline: [version code 4](https://expo.dev/accounts/kianfratz/projects/save-your-money/builds/47d82856-b463-4737-bfc0-170746ac0b40), followed by the [version code 5 update](https://expo.dev/accounts/kianfratz/projects/save-your-money/builds/7ed0beaf-501e-4ff3-a206-ba64acf8c613). Both finished EAS builds use build credentials `sRTrSdw4rI`.
- The signing certificate's SHA-256 fingerprint and two byte-verified credential-backup locations are recorded privately outside the repository. OneDrive cloud sync is not yet confirmed.

## Verified on 2026-09-19

- Both downloaded artifacts are installable APKs. SHA-256: code 4 `3a625babd14fd37c21ce79744aa0a18e25d06cf03593cb6098f09b101ac0a625`; code 5 `8414190b36498f788afd5263e415f49bd2b14c41eabd5af4f28c64b693bc2c80`. The pair is archived in the two private recovery locations.
- The generated manifests report the same package and visible app name, version codes 4 and 5, and `expo.modules.updates.ENABLED=false` with no update URL. Both APKs have a v2 signing block and the same certificate fingerprint, matching the private signing record. Both bundles contain the probe screen.
- On the Realme 8i RMX3151 running Android 13, ADB installed code 4. The visible probe value `ISSUE2REALME8I0919` remained after force-closing and reopening. `adb install -r` then installed code 5 without uninstalling. Android reported one `com.kianfratz.saveyourmoney` package at code 5, and the same value remained visible after the upgrade and another force-close/reopen.
- The manifests also request `INTERNET` and `SYSTEM_ALERT_WINDOW`; `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` are limited to SDK 32. These permissions need review before the v1 release.

## Realme 8i check

1. Download both APKs to a private location and install version code 4 on the Realme 8i. Do not uninstall between steps.
2. Open **Home**, scroll to **APK update probe**, enter a distinctive value, and tap **Save value**. Record the displayed **Saved value**. Force-close and reopen the app to confirm it is persisted.
3. Install version code 5 over the existing app. Android should offer an update to the same installation. Do not clear app data.
4. Open the app and confirm that the saved value is unchanged. Force-close and reopen once more. Confirm there is only one **Save Your Money** installation.

These steps can be repeated with the archived APK pair during later native work.
