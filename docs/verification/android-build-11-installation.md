# Android build 11 installation record

Date: 2026-11-06 (Asia/Singapore)

## Outcome

Save Your Money build 11 was built from the current repository commit and installed over build 9 on the connected Realme 8i without uninstalling the application or clearing its data. Android retained the original installation timestamp and application data directory. The updated application then completed a successful cold launch and remained running.

No private financial data was opened or inspected during verification.

## Why build 11 was required

EAS build 10 had completed, but it was created from commit `b912229b25c42144d67b0e7558de4c528ecabb17`. The current design changes were in the later commit `4dadef5de4d74cf2cf0e6fcbf0552cabff6f6136`, so installing build 10 would not have displayed the latest interface.

The installed application was build 9. Expo Go 58.0.5 was also installed, but the project uses Expo SDK 57 and Expo Go has a separate Android data container. A new signed preview APK was therefore the appropriate way to test the latest code while retaining the existing Save Your Money installation.

## 1. Pre-build checks

The working tree was clean and the following checks passed:

```bash
npm run typecheck
npm run lint
npm test -- --runInBand
```

Results:

- TypeScript passed.
- ESLint passed with zero warnings.
- All 3 test suites and all 21 tests passed.

ADB confirmed that the phone was connected and authorized:

```bash
/mnt/c/Users/Admin/Downloads/platform-tools-latest-windows/platform-tools/adb.exe devices -l
```

The target was a Realme RMX3151 running Android 13. Before installation, Android reported:

```text
package: com.kianfratz.saveyourmoney
versionCode: 9
versionName: 1.0.0
dataDir: /data/user/0/com.kianfratz.saveyourmoney
firstInstallTime: 2026-09-19 23:34:20
```

## 2. Create the signed preview APK

The preview profile in `eas.json` produces an internal-distribution APK, uses the remote signing credential, and automatically increments the Android version code.

The build was submitted with:

```bash
/home/kianfratz/.npm/_npx/e25a38a8cc65d08e/node_modules/.bin/eas build \
  --platform android \
  --profile preview \
  --non-interactive \
  --message "Build 11: install current UI over build 9 without clearing data"
```

EAS incremented `versionCode` from 10 to 11 and used the established remote credential `sRTrSdw4rI`.

Build details:

- [EAS build 11](https://expo.dev/accounts/kianfratz/projects/save-your-money/builds/2cd2dfcb-cdc7-4725-be75-ddf886e1f3c7)
- Build ID: `2cd2dfcb-cdc7-4725-be75-ddf886e1f3c7`
- Status: `FINISHED`
- Profile: `preview`
- Distribution: internal APK
- Package: `com.kianfratz.saveyourmoney`
- Expo SDK: 57
- Version name: `1.0.0`
- Version code: `11`
- Git commit: `4dadef5de4d74cf2cf0e6fcbf0552cabff6f6136`

The build moved through `IN_QUEUE`, `IN_PROGRESS`, and `FINISHED`. Only one build was submitted.

## 3. Download and identify the artifact

The finished APK was downloaded to a temporary local path:

```bash
curl --fail --location \
  --output /tmp/save-your-money-preview-v11.apk \
  https://expo.dev/artifacts/eas/OuNk0APM8LXkEWlHMKk0j-ux2jE6LIz-GRN6A3Uclmk.apk
```

The artifact URL is temporary; the EAS build page is the durable build record.

The downloaded file was identified as an Android APK. Its SHA-256 checksum was:

```text
22e38de07187b345e930211229f5bfea7618a6f8b440e9f48a21a6bae2f1d163
```

## 4. Install over build 9

The phone connection and installed package were checked again immediately before installation. Build 11 was then installed using ADB replacement mode:

```bash
/mnt/c/Users/Admin/Downloads/platform-tools-latest-windows/platform-tools/adb.exe install -r \
  '\\wsl.localhost\Ubuntu\tmp\save-your-money-preview-v11.apk'
```

ADB returned:

```text
Performing Streamed Install
Success
```

The `-r` option replaced the existing package while retaining its application data. The application was not uninstalled, `pm clear` was not run, and downgrade mode was not enabled. Android would have rejected the update if its package identity or signing certificate had not matched the installed application.

## 5. Verify the installed application

Android package information was inspected after installation. It reported:

```text
versionCode: 11
versionName: 1.0.0
dataDir: /data/user/0/com.kianfratz.saveyourmoney
firstInstallTime: 2026-09-19 23:34:20
lastUpdateTime: 2026-11-06 23:47:41
```

The unchanged `firstInstallTime` and `dataDir`, together with the successful `adb install -r`, confirm that Android updated the existing installation rather than creating a fresh one.

The main activity was resolved as `com.kianfratz.saveyourmoney/.MainActivity` and launched with:

```bash
/mnt/c/Users/Admin/Downloads/platform-tools-latest-windows/platform-tools/adb.exe shell \
  am start -W -n com.kianfratz.saveyourmoney/.MainActivity
```

The cold launch returned `Status: ok`, completed in 1,946 ms, and the application process remained running afterward.

## Repeatable update checklist

1. Confirm the repository is clean and the intended commit is checked out.
2. Run type checking, linting, and all tests.
3. Confirm the phone is authorized with `adb devices -l`.
4. Record the installed package, version code, data directory, and first-install timestamp.
5. Submit one signed `preview` APK build from the intended commit.
6. Confirm the new version code is higher and the package remains `com.kianfratz.saveyourmoney`.
7. Download the completed APK and record its SHA-256 checksum.
8. Install with `adb install -r`; do not uninstall or clear application data.
9. Verify the new version code, unchanged data directory and first-install timestamp, successful launch, and a running application process.
10. Manually confirm the expected user data is present inside the application without exposing it in logs or documentation.

See also the [release and recovery checklist](../RELEASE_RECOVERY_CHECKLIST.md) and the [Android identity verification](android-identity.md).
