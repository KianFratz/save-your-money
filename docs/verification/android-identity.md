# Android identity and update probe (issue #2)

## Build identity

- Expo project: `@kianfratz/save-your-money`, ID `6bbb39a4-48be-43bd-bb86-1542c8e9909e`. The `kianfratz` account has owner access.
- Visible app name: `Save Your Money`.
- Android package: `com.kianfratz.saveyourmoney`.
- Preview builds use an APK, EAS-managed signing credentials, and the EAS remote Android version counter. EAS Update is disabled in app config.
- Candidate device-check pair: [version code 4](https://expo.dev/accounts/kianfratz/projects/save-your-money/builds/47d82856-b463-4737-bfc0-170746ac0b40) followed by [version code 5](https://expo.dev/accounts/kianfratz/projects/save-your-money/builds/7ed0beaf-501e-4ff3-a206-ba64acf8c613). Both builds use EAS build credentials `sRTrSdw4rI`. Neither APK is an accepted upgrade baseline until the private credential backups and phone check are complete.
- The signing certificate's SHA-256 fingerprint and two byte-verified credential-backup locations are recorded privately outside the repository. OneDrive cloud sync is not yet confirmed.

## Realme 8i check

1. Download both APKs to a private location and install version code 4 on the Realme 8i. Do not uninstall between steps.
2. Open **Home**, scroll to **APK update probe**, enter a distinctive value, and tap **Save value**. Record the displayed **Saved value**. Force-close and reopen the app to confirm it is persisted.
3. Install version code 5 over the existing app. Android should offer an update to the same installation. Do not clear app data.
4. Open the app and confirm that the saved value is unchanged. Force-close and reopen once more. Confirm there is only one **Save Your Money** installation.

The on-device result must be recorded before claiming the two-APK update and state-preservation acceptance criteria are met.
