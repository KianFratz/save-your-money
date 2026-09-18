# Expo SDK 57 platform APIs and constraints

Research date: 2026-09-18

Scope: the Android-first, offline `save-your-money` application, with emphasis on Android 13, Expo Go during early development, EAS development/preview builds for native validation, a SQLite source of truth, local reminders, passphrase-encrypted portable backups, and Android-managed backup as secondary recovery.

Primary sources are the exact Expo SDK 57 references and tagged `sdk-57` source, plus first-party Expo, Android, NIST, and RFC documentation. The installed package versions are `expo-sqlite ~57.0.3`, `expo-notifications ~57.0.19`, `expo-file-system ~57.0.7`, `expo-document-picker ~57.0.2`, and `expo-crypto ~57.0.3`; see the repository's [`package.json`](../../package.json).

## Executive conclusions

1. **SQLite, local notifications, FileSystem, DocumentPicker, and Crypto all run in Expo Go, but native configuration does not.** In particular, SQLCipher is unavailable in Expo Go, remote notifications are unavailable in Expo Go on Android, and config-plugin changes such as notification assets, selective Android backup rules, and SQLite build flags require a rebuilt development/preview binary. Expo describes Expo Go as a fixed native runtime and development builds as the app-specific runtime for native configuration. ([SQLite SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/), [Notifications SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/), [FileSystem SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/), [DocumentPicker SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/), [Crypto SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/), [Expo development-build FAQ](https://docs.expo.dev/develop/development-builds/faq/))
2. **SDK 57 `expo-crypto` does support authenticated encryption.** Its AES API is AES-GCM with 128/192/256-bit keys, generated or imported keys, optional associated authenticated data, a default 12-byte nonce, and a default/recommended 16-byte tag. This corrects older assumptions that `expo-crypto` only hashes and generates randomness. ([Crypto SDK 57 AES API](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/#aes-encryption-and-decryption))
3. **`expo-crypto` still does not solve passphrase-based encryption by itself.** The SDK 57 public surface exports hashes, secure random/UUID operations, and AES-GCM, but no PBKDF2, scrypt, Argon2, HKDF, HMAC, or other password KDF. A separately vetted KDF implementation is required; hashing the passphrase once is not a substitute for a password KDF. ([Crypto SDK 57 API](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/#api), [tagged SDK 57 `Crypto.ts`](https://github.com/expo/expo/blob/sdk-57/packages/expo-crypto/src/Crypto.ts), [RFC 9106 Argon2](https://www.rfc-editor.org/rfc/rfc9106.html))
4. **The best SDK 57 database-backup primitive is `serializeAsync()` (or `backupDatabaseAsync()` for file-to-file backup), not copying the live main database file.** `serializeAsync()` returns SQLite's serialized database bytes as a `Uint8Array`, which can be encrypted directly; the tradeoff is whole-database memory use. Quiesce application writes while capturing the snapshot. `backupDatabaseAsync()` uses SQLite's backup API and is the file-oriented alternative. ([SQLite SDK 57 serialization](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#serializeasyncdatabasename), [SQLite SDK 57 backup API](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#sqlitebackupdatabaseasyncoptions))
5. **For Android export, `expo-document-picker` is the restore/import picker, not a “Save As” API.** Export can use `Directory.pickDirectoryAsync()`, `directory.createFile(name, mimeType)`, then `file.write(bytes)`. Restore can use `DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })`, then immediately read and validate the returned cache copy. Android SAF grants narrow access without broad storage permission, but providers may reject creation/writes and persisted URIs can become invalid if the document moves or is deleted. ([FileSystem SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/), [DocumentPicker SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/), [Android Storage Access Framework](https://developer.android.com/training/data-storage/shared/documents-files))
6. **Android Auto Backup will currently be broad, not SQLite-only.** `android.allowBackup` is absent, so Android's default is `true`; the standard Expo config exposes only that boolean. Selective include/exclude rules require native `fullBackupContent`/`dataExtractionRules` resources and manifest attributes, therefore a local config plugin under CNG (or committed native Android files). ([Expo SDK 57 app config](https://docs.expo.dev/versions/v57.0.0/config/app/#allowbackup), [Android Auto Backup](https://developer.android.com/identity/data/autobackup), [Expo config-plugin mods](https://docs.expo.dev/config-plugins/mods/))
7. **A selective rule should target the `file` domain, path `SQLite`, not Android's `database` domain.** Expo SQLite's Android SDK 57 implementation sets its default directory to `context.filesDir/SQLite`; Android Auto Backup includes `getFilesDir()` by default. This is an inference from the two owning sources. ([Expo SQLite SDK 57 Android source](https://github.com/expo/expo/blob/sdk-57/packages/expo-sqlite/android/src/main/java/expo/modules/sqlite/SQLiteModule.kt), [Android Auto Backup file domains](https://developer.android.com/identity/data/autobackup#Files))

## Environment and build/runtime matrix

Expo SDK 57 uses React Native 0.86 and targets Android SDK 36; the project currently has `expo@~57.0.23` and React Native 0.86.3. Android 13 is within the SDK's supported Android 7+ range, but target-SDK behavior is that of API 36, so Android 12+ backup and exact-alarm rules apply. ([Expo SDK version table](https://docs.expo.dev/versions/v57.0.0/), [Expo SDK 57 release notes](https://expo.dev/changelog/sdk-57), [`package.json`](../../package.json))

| Capability | Expo Go on Android | EAS development build | EAS preview/release APK |
| --- | --- | --- | --- |
| Standard SQLite | Yes | Yes | Yes |
| SQLite config-plugin flags | Fixed to Expo Go's binary; app settings are not applied | Applied when the binary is rebuilt | Applied when the binary is rebuilt |
| SQLCipher | No | Yes, after `useSQLCipher` configuration and rebuild | Yes, after configuration and rebuild |
| Local notifications | Yes | Yes | Yes |
| Remote push notifications | No | Yes with credentials/configuration | Yes with credentials/configuration |
| Notification icon/sounds/native defaults | Cannot test app-specific native assets/config | Yes after rebuild | Yes after rebuild |
| FileSystem / DocumentPicker | Yes | Yes | Yes |
| Crypto hashes/random/AES-GCM | Yes | Yes | Yes |
| This app's Android backup manifest/rules | No; the installed app is Expo Go | Yes after custom native configuration and rebuild | Yes after custom native configuration and rebuild |

The fixed-runtime versus rebuilt-runtime distinction is fundamental: Expo Go contains a predetermined set of native modules, while a development build contains this project's native modules and native configuration. JavaScript-only edits do not require rebuilding, but changing app config, native dependencies, or config plugins does. ([Expo development-build FAQ](https://docs.expo.dev/develop/development-builds/faq/), [development-build rebuild guidance](https://docs.expo.dev/develop/development-builds/introduction/#rebuild-a-development-build))

Data in Expo Go must not be treated as release data. Expo Go and the app-specific development/preview build are separate installed Android applications, hence separate app sandboxes; validate migration, backup, restore, reinstall, and upgrade behavior in app-specific release-mode builds.

## 1. `expo-sqlite`

### Available SDK 57 API

`expo-sqlite` is included in Expo Go and persists its databases across restarts. The principal async APIs are `openDatabaseAsync`, `runAsync`, `getFirstAsync`, `getAllAsync`, `getEachAsync`, `prepareAsync`, `execAsync`, `withTransactionAsync`, `withExclusiveTransactionAsync`, `serializeAsync`, `deserializeDatabaseAsync`, and the top-level `backupDatabaseAsync`. Synchronous counterparts exist, but the reference warns that heavy synchronous operations block the JavaScript thread. ([SQLite SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/))

Use bound parameters (`runAsync`, query helpers, prepared statements, or the tagged-template API) for any values. `execAsync()` does not escape parameters and can introduce SQL injection; manually prepared statements should be finalized in `finally` to avoid resource leaks. ([SQLite SDK 57 basic CRUD](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#basic-crud-operations), [prepared statements](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#prepared-statements))

For multi-step financial invariants, prefer `withExclusiveTransactionAsync(txn => ...)` and execute every query on the supplied `txn`. `withTransactionAsync()` has a documented scope surprise: any query issued on the database while its transaction is active can join that transaction even if it is lexically outside the callback. Exclusive transactions isolate the callback on a separate connection, though competing async writes can fail with `database is locked`; they are unavailable on web. ([SQLite SDK 57 async transactions](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#executing-queries-within-an-async-transaction), [`withExclusiveTransactionAsync`](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#withexclusivetransactionasynctask))

Expo recommends enabling WAL for general performance. Foreign-key enforcement must also be enabled explicitly with `PRAGMA foreign_keys = ON` for each connection. ([SQLite SDK 57 PRAGMA guidance](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#executing-pragma-queries))

### Backup/restore primitives

- `await db.serializeAsync('main')` returns the current database as a `Uint8Array`. This is the simplest input to AES-GCM, and avoids copying a live database file while WAL may be active. ([SQLite SDK 57 `serializeAsync`](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#serializeasyncdatabasename))
- `SQLite.backupDatabaseAsync({ sourceDatabase, destDatabase, ... })` invokes SQLite's backup mechanism between two opened databases. This is useful for a temporary on-disk snapshot when memory pressure makes direct serialization unattractive. ([SQLite SDK 57 `backupDatabaseAsync`](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#sqlitebackupdatabaseasyncoptions))
- `SQLite.deserializeDatabaseAsync(bytes)` creates an in-memory database. It is useful for validating schema version, integrity, row counts, and domain invariants before touching the live database, but it does not by itself overwrite the persistent database. ([SQLite SDK 57 `deserializeDatabaseAsync`](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#sqlitedeserializedatabaseasyncserializeddata-options))
- `SQLite.openDatabaseAsync(name, options, directory)` can open a database in a chosen directory on native platforms. The directory argument is unsupported on web. ([SQLite SDK 57 `openDatabaseAsync`](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#sqliteopendatabaseasyncdatabasename-options-directory))

`serializeAsync` and SDK 57 AES-GCM are whole-buffer APIs. The backup pipeline therefore holds at least the database bytes and encrypted output in memory at the same time. That is an inference from their `Uint8Array`/`BinaryInput` signatures, not a documented hard size limit; benchmark on the Realme 8i and fail gracefully for unexpectedly large databases. ([SQLite SDK 57 `serializeAsync`](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#serializeasyncdatabasename), [Crypto SDK 57 `aesEncryptAsync`](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/#cryptoaesencryptasyncplaintext-key-options))

### Build-time SQLite options

The SQLite config plugin controls native build flags; changes require a new binary. Defaults are FTS enabled and SQLCipher/libSQL/sqlite-vec disabled. The current bare `"expo-sqlite"` plugin entry therefore uses standard unencrypted SQLite with FTS enabled. ([SQLite SDK 57 configuration](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#configuration-in-app-config), [`app.json`](../../app.json))

SQLCipher is supported on Android, iOS, and macOS but not Expo Go. It requires `useSQLCipher: true`, prebuild/rebuild, and `PRAGMA key` immediately after opening the database. It encrypts the live database; it is separate from, and does not replace, a portable passphrase-encrypted backup format. ([SQLite SDK 57 SQLCipher](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#sqlcipher))

For this project's stated threat model, leave SQLCipher off unless at-rest database encryption becomes a product requirement. Enabling it would force development-build testing and creates a separate key lifecycle that must survive normal app use without being embedded in JavaScript.

### Persistence and Android backup location

The SDK 57 Android source defines `defaultDatabaseDirectory` as `context.filesDir/SQLite`. The database is therefore in private internal app storage under Android's Auto Backup `file` domain, not its `database` domain. ([Expo SQLite tagged Android source](https://github.com/expo/expo/blob/sdk-57/packages/expo-sqlite/android/src/main/java/expo/modules/sqlite/SQLiteModule.kt), [Android Auto Backup domains](https://developer.android.com/identity/data/autobackup#XMLSyntax))

## 2. `expo-notifications`

### Expo Go versus built apps

Local notifications remain available in Expo Go. Remote push notifications are unavailable in Expo Go on Android from SDK 53 onward and require a development build; push also requires platform credentials. This app's v1 reminders are local, so their core schedule/cancel flow can be prototyped in Expo Go, but permissions, icons, sounds, launch behavior, reinstall behavior, and release parity must be tested in development and preview builds. ([Notifications SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/), [Expo development-build FAQ](https://docs.expo.dev/develop/development-builds/faq/#remote-push-notifications))

The SDK 57 reference reports a debug-only Android development-build issue when launching from a push notification: splash visuals fail roughly 70% of the time; Expo recommends release-mode validation. It does not occur in release builds. ([Notifications SDK 57 known issue](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/#known-issues))

### Local scheduling and display behavior

Use `scheduleNotificationAsync()` and keep its returned identifier so a recurring-rule edit, skip, or deletion can call `cancelScheduledNotificationAsync(id)`. `getAllScheduledNotificationsAsync()` can reconcile native schedules with the SQLite recurring-rule source of truth. Scheduling does not itself guarantee foreground presentation: in SDK 57 the default is not to show an incoming notification while the app is running unless `setNotificationHandler` returns an appropriate behavior within three seconds; timeout also discards it. ([Notifications SDK 57 scheduling](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/#schedulenotificationasyncrequest), [`setNotificationHandler`](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/#setnotificationhandlerhandler), [SDK 57 foreground behavior](https://docs.expo.dev/push-notifications/receiving-notifications/#foreground-notification-behavior))

On Android, the library automatically adds `RECEIVE_BOOT_COMPLETED` so it can re-establish scheduled notifications after reboot. Treat SQLite as authoritative anyway and reconcile schedules at startup, especially after restore or rule edits. ([Notifications SDK 57 permissions](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/#android))

### Android 13 permission and channels

Android 13 users must opt in to notifications. At least one channel must exist before the OS prompt can appear; Expo specifically requires `setNotificationChannelAsync` before obtaining a push token. For a local-only app, create the reminder channel first, then request/check permission when the user creates the first recurrence. If `canAskAgain` is false, direct the user to system settings rather than repeatedly prompting. ([Notifications SDK 57 Android permissions](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/#android), [Android notification runtime permission](https://developer.android.com/develop/ui/views/notifications/notification-permission))

Android 8+ requires channels. If no channel is specified, Expo creates a `Miscellaneous` fallback, but the docs recommend an explicit informative channel. Once a channel exists, Android permits the app to change only its name and description; importance/sound behavior is effectively user-owned, so use stable channel IDs and do not expect later code changes to overwrite user settings. ([Notifications SDK 57 channels](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/#handling-notification-channels), [`setNotificationChannelAsync`](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/#setnotificationchannelasyncchannelid-channel))

Custom icons, colors, bundled sounds, default channel, and iOS background-remote capability are config-plugin properties that require a new binary. For Android 8+, a custom sound must also be configured on the channel; setting only notification content is insufficient. The current bare plugin entry uses defaults and bundles no custom sound/icon through this plugin. ([Notifications SDK 57 configuration](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/#app-config), [custom sounds](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/#set-custom-notification-sounds), [`app.json`](../../app.json))

### Exact versus ordinary reminders

Expo documents that exact-time notifications on Android 12+ require `SCHEDULE_EXACT_ALARM` in the manifest. Android recommends inexact alarms for most user-specified future actions; on Android 12+ an inexact alarm may be delivered within an hour after the trigger time when no further battery restriction applies, and Doze/battery saver can delay it further. Exact alarms consume more resources and require special access. ([Notifications SDK 57 exact-alarm permission](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/#android), [Android alarm guidance](https://developer.android.com/develop/background-work/services/alarms))

The approved product plan explicitly accepts ordinary inexact reminders, so do not add exact-alarm permission for v1. Product copy and tests should tolerate delayed delivery. Repeating alarms are inexact on Android 4.4+, reinforcing that recurrence state belongs in SQLite rather than being inferred from delivery timestamps. ([Android alarm guidance](https://developer.android.com/develop/background-work/services/alarms#set-repeating))

Background/headless notification tasks are for remote data notifications and require `expo-task-manager`, task registration, and (on iOS) build-time background configuration. They are not necessary merely to display scheduled local reminders. ([Notifications SDK 57 headless notifications](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/#headless-background-notifications))

## 3. File and document access

### Current versus legacy FileSystem API

SDK 57's current API is object-oriented: `File`, `Directory`, and `Paths`. `Paths.document` is intended for files safe from system deletion; `Paths.cache` can be deleted by the OS under storage pressure. Temporary snapshots and picked-file copies belong in cache only while an operation is active; durable internal state belongs in documents or SQLite. ([FileSystem SDK 57 paths](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/#paths))

Many old top-level methods imported from `expo-file-system`—including `readAsStringAsync`, `writeAsStringAsync`, `copyAsync`, `moveAsync`, `getInfoAsync`, `downloadAsync`, and related task factories—are deprecated in SDK 57 and explicitly throw at runtime. Either use the new object API or deliberately import those methods from `expo-file-system/legacy`. ([FileSystem SDK 57 methods](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/#methods))

`expo-file-system` is included in Expo Go. Its config plugin exists, but its two SDK 57 properties are iOS-only (`supportsOpeningDocumentsInPlace` and `enableFileSharing`). Omitting the plugin does not block Android internal storage or SAF access. ([FileSystem SDK 57 configuration](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/#configuration-in-app-config))

### Export on Android

The current API exposes `Directory.pickDirectoryAsync()`, `Directory.createFile(name, mimeType)`, and `File.write(string | Uint8Array)`. On Android the SDK 57 picker implementation uses `ACTION_OPEN_DOCUMENT_TREE` and calls `takePersistableUriPermission`, so access can survive process/device restarts while the provider and document remain valid. ([FileSystem SDK 57 directory/file APIs](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/), [tagged Android picker implementation](https://github.com/expo/expo/blob/sdk-57/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/FilePickerContract.kt), [Android persisted URI grants](https://developer.android.com/training/data-storage/shared/documents-files#persist-permissions))

Recommended export flow:

1. `const directory = await Directory.pickDirectoryAsync()`.
2. `const file = directory.createFile(fileName, 'application/octet-stream')` (or a project-specific backup MIME type if one is registered).
3. `file.write(encryptedBytes)`.
4. Reopen/read the file, decrypt, and validate its header and integrity before marking the backup successful.

The system picker provides narrow access to the user-selected directory; no broad `READ_MEDIA_*` or legacy external-storage permission is needed for this SAF flow. Providers can expose different capabilities, so creation/write errors must be handled. Android 11+ also prevents `ACTION_OPEN_DOCUMENT_TREE` from granting the storage root, Downloads root, `Android/data`, or `Android/obb`; users may need to choose an allowed subdirectory or another document provider. ([Android SAF access](https://developer.android.com/training/data-storage/shared/documents-files#grant-access-directory), [Android document-provider grants](https://developer.android.com/reference/android/provider/DocumentsProvider))

On Android SAF `content://` URIs, `File.open(FileMode.ReadWrite)` is unsupported. Read-only, write-only, append, or truncate modes are available; SAF append is strictly append-only and cannot seek. The simple `File.write(bytes)` API avoids the unsupported `ReadWrite` mode for a one-shot encrypted artifact. ([FileSystem SDK 57 `File.open`](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/#openmode), [SDK 57 `FileMode`](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/#filemode))

Do not treat a saved SAF URI as the only recovery path. Even a persistable grant stops working if the file is moved/deleted, and Android cautions that restored URIs can point nowhere or to a different item on a new device. Ask the user to choose a destination when exporting, validate any remembered directory grant before reuse, and never include such a URI as the only backup record. ([Android persisted-URI caveat](https://developer.android.com/training/data-storage/shared/documents-files#persist-permissions), [Android backup guidance on URIs](https://developer.android.com/identity/data/backup))

### Restore/import on Android

`DocumentPicker.getDocumentAsync()` displays the provider UI and returns `{ canceled, assets }`. It copies the selected document into the app cache by default. Expo says `copyToCacheDirectory: true` is needed when FileSystem must read the document immediately; the copy can be expensive for large files. For the expected small budget database, prefer the reliable cache copy, process it immediately, then delete the temporary copy after validation/restore. ([DocumentPicker SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/), [DocumentPicker with FileSystem](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/#using-with-expo-file-system))

`expo-document-picker` is included in Expo Go. Its config plugin only configures iOS iCloud entitlements; no plugin entry is required for the Android picker. `expo-document-picker` chooses existing documents—it does not expose Android `ACTION_CREATE_DOCUMENT` as a save-destination API—so use FileSystem's directory picker/create-file flow for export. ([DocumentPicker SDK 57 configuration and API](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/))

## 4. `expo-crypto`

### What SDK 57 supports

`expo-crypto` is included in Expo Go and supports Android, iOS, tvOS, and web. SDK 57 exposes:

- `aesEncryptAsync` / `aesDecryptAsync`, using AES-GCM;
- `AESEncryptionKey.generate()` and `.import()` for 128/192/256-bit keys (default 256);
- `AESSealedData`, including `combined()` and `fromCombined()` for IV + ciphertext + authentication tag;
- SHA-1/SHA-256/SHA-384/SHA-512 hashes (plus weaker/platform-specific legacy hashes);
- `getRandomBytes`, `getRandomBytesAsync`, `getRandomValues`, and cryptographic UUID v4. ([Crypto SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/))

AES-GCM defaults are a 12-byte nonce and 16-byte authentication tag. `combined('bytes')` serializes IV + ciphertext + tag; `fromCombined()` defaults to the same lengths. Additional authenticated data is supported, making it possible to authenticate a versioned, non-secret backup header. String binary inputs must be base64-encoded; pass `Uint8Array` for raw database bytes. ([Crypto SDK 57 AES types](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/#interfaces), [`AESSealedData`](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/#aessealeddata))

The sync `getRandomBytes()` API accepts only 0–1024 bytes and the tagged SDK 57 implementation falls back to `Math.random()` during development when native synchronous hooks are unavailable/remote debugging is active. `getRandomBytesAsync()` and native AES key/nonce generation do not use that JavaScript fallback; prefer those for cryptographic salt/nonce generation. ([Crypto SDK 57 random bytes](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/#cryptogetrandombytesbytecount), [tagged SDK 57 source](https://github.com/expo/expo/blob/sdk-57/packages/expo-crypto/src/Crypto.ts))

### Missing password KDF

There is no password KDF in the documented SDK 57 API or tagged export surface. SHA-256 is a fast digest, not a work-factor/memory-hard password KDF. A passphrase-encrypted portable backup therefore needs another implementation that can derive exactly 32 bytes for `AESEncryptionKey.import()` using a unique random salt and stored cost parameters. Argon2id is the modern memory-hard option specified by RFC 9106; PBKDF2 is another standardized possibility, but neither is supplied by `expo-crypto`. ([Crypto SDK 57 API](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/#api), [tagged SDK 57 source](https://github.com/expo/expo/blob/sdk-57/packages/expo-crypto/src/Crypto.ts), [RFC 9106](https://www.rfc-editor.org/rfc/rfc9106.html), [NIST SP 800-132 publication entry](https://csrc.nist.gov/publications/detail/sp/800-132/final))

Whichever KDF is selected must be tested in Expo Go and a release build, calibrated on the Realme 8i for acceptable latency/memory, and encoded into the backup format so parameters can evolve. If it requires custom native code, Expo Go will no longer exercise that KDF and a rebuilt development client becomes mandatory. ([Expo development-build native-code constraints](https://docs.expo.dev/develop/development-builds/faq/))

### Recommended versioned backup envelope

A defensible format is:

```text
magic | format-version | KDF-id | KDF-parameters | salt |
AES-GCM nonce/IV | encrypted SQLite bytes | authentication tag
```

Derive a 256-bit key from the user passphrase and random salt, import it with `AESEncryptionKey.import`, encrypt the `serializeAsync()` bytes with AES-GCM, and authenticate the fixed header as AAD. Never store the passphrase or derived portable-backup key in the artifact. On restore, parse bounded lengths, reject unknown versions/parameters before expensive work, derive the key, authenticate/decrypt, open the bytes as an in-memory SQLite database, then validate schema/invariants before replacing live state. The AES pieces are provided by SDK 57; the KDF and container parsing are application responsibilities. ([Crypto SDK 57 AES API](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/#aes-encryption-and-decryption), [SQLite SDK 57 deserialization](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#sqlitedeserializedatabaseasyncserializeddata-options))

## 5. EAS Build and native configuration

### What each current profile produces

The repository has `expo-dev-client` installed. Its `development` profile sets `developmentClient: true` and internal distribution; its `preview` profile uses internal distribution; and its `production` profile uses default store distribution with auto-increment. ([`package.json`](../../package.json), [`eas.json`](../../eas.json))

- A development profile produces a development-client APK that loads JavaScript from Metro and includes this project's native modules/configuration. ([Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/))
- On Android, `distribution: "internal"` changes the default artifact to a directly installable APK. Therefore the current preview profile already produces the physical-device APK the plan requests. ([EAS internal distribution](https://docs.expo.dev/build/internal-distribution/), [EAS APK guide](https://docs.expo.dev/build-reference/apk/))
- The production profile defaults to an AAB for Google Play; AABs cannot be installed directly on the phone. Use preview/internal distribution or `android.buildType: "apk"` for sideload testing. ([EAS APK guide](https://docs.expo.dev/build-reference/apk/))

When no native directories are committed, EAS Build runs prebuild and applies config plugins. Any SQLite native flag, notification asset/configuration, or Android backup manifest/resource change requires a new binary; EAS Update/Metro cannot alter it. ([EAS Android build process](https://docs.expo.dev/build-reference/android-builds/), [Expo config-plugin introduction](https://docs.expo.dev/config-plugins/introduction/))

### Signing and in-place APK updates

Android requires installed updates to be signed consistently. EAS can manage the keystore and signs the APK/AAB with the keystore associated with the application; export and protect a recoverable copy if long-term sideload updates matter. ([Expo app credentials](https://docs.expo.dev/app-signing/app-credentials/#android), [Expo credential security](https://docs.expo.dev/app-signing/security/#android-build-credentials))

The package ID must remain stable, and `versionCode` should increase for every distributed build. The repo uses EAS remote versioning but only the production profile currently has `autoIncrement: true`; if preview APKs are the user's in-place release channel, add preview version-code management rather than repeatedly producing version code 1. ([EAS app version management](https://docs.expo.dev/build-reference/app-versions/), [EAS `autoIncrement`](https://docs.expo.dev/eas/json/#android-specific-options), [Android versioning](https://developer.android.com/studio/publish/versioning))

### Project-specific plugin status

The current plugin list includes `expo-notifications` and `expo-sqlite`, which is sufficient for their default native setup. It does not include `expo-file-system` or `expo-document-picker`; this is fine for Android because their SDK 57 config-plugin options are iOS-only. `expo-crypto` needs no config plugin. A custom Android-backup plugin is still needed for selective backup rules. ([`app.json`](../../app.json), [Notifications SDK 57 configuration](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/#configuration), [SQLite SDK 57 configuration](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#configuration-in-app-config), [FileSystem SDK 57 configuration](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/#configuration-in-app-config), [DocumentPicker SDK 57 configuration](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/#configuration-in-app-config))

## 6. Android managed backup

### Default behavior and limits

Android Auto Backup is enabled by default for apps targeting Android 6+ unless `android:allowBackup="false"`. It normally includes shared preferences, `getFilesDir()`, the native database directory, and app-specific external files; cache, code cache, and no-backup directories are excluded. Cloud Auto Backup is limited to 25 MB per app user, keeps only the most recent backup, depends on the user's device backup/account/network/idle conditions, may never run on a particular device, and restores during app installation before first launch. Android shuts the app down during file-based Auto Backup to prevent active writes. ([Android Auto Backup](https://developer.android.com/identity/data/autobackup))

The current app does not set `android.allowBackup`, so Expo/Android's default `true` applies. Standard Expo app config exposes this boolean but no properties for file-level include/exclude rules. ([Expo SDK 57 app config `allowBackup`](https://docs.expo.dev/versions/v57.0.0/config/app/#allowbackup), [`app.json`](../../app.json))

Auto Backup is not a user-controlled, portable, inspectable backup and its schedule is not guaranteed. It is suitable only as the plan's secondary recovery mechanism; the verified encrypted artifact remains primary.

### Required selective configuration

Because SDK 57 targets API 36, Android 12+ devices use `android:dataExtractionRules` and a `<data-extraction-rules>` resource. To preserve behavior on Android 11 and older (which SDK 57 still supports), also supply `android:fullBackupContent` and a `<full-backup-content>` resource. Rules can differ for cloud backup and device-to-device transfer. Once any `<include>` is specified, all other normally eligible files are excluded unless separately included. ([Expo SDK target table](https://docs.expo.dev/versions/v57.0.0/), [Android backup include/exclude rules](https://developer.android.com/identity/data/autobackup#include-exclude-android-12))

For SQLite-only secondary recovery, the essential rules are conceptually:

```xml
<!-- Android 12+ / res/xml/data_extraction_rules.xml -->
<data-extraction-rules>
  <cloud-backup disableIfNoEncryptionCapabilities="true">
    <include domain="file" path="SQLite" />
  </cloud-backup>
  <device-transfer>
    <include domain="file" path="SQLite" />
  </device-transfer>
</data-extraction-rules>
```

```xml
<!-- Android 11 and lower / res/xml/backup_rules.xml -->
<full-backup-content>
  <include domain="file" path="SQLite" requireFlags="clientSideEncryption|deviceToDeviceTransfer" />
</full-backup-content>
```

The exact cloud-versus-device-transfer policy is a product decision. `disableIfNoEncryptionCapabilities="true"` on Android 12+ prevents cloud backup when the device cannot provide encrypted backup, while still allowing device-to-device transfer. Android 9+ cloud backup is end-to-end encrypted when the user has a device screen lock. ([Android Auto Backup encryption and rule syntax](https://developer.android.com/identity/data/autobackup))

The path is `file/SQLite`, not `database`, because Expo SQLite uses `context.filesDir/SQLite`. Include the directory rather than only the main `.db` filename so SQLite side files are not accidentally omitted. Android's shutdown-during-backup behavior prevents the application from continuing writes during capture. ([Expo SQLite tagged Android source](https://github.com/expo/expo/blob/sdk-57/packages/expo-sqlite/android/src/main/java/expo/modules/sqlite/SQLiteModule.kt), [Android Auto Backup](https://developer.android.com/identity/data/autobackup))

Do not back up notification/push tokens, cache files, temporary plaintext snapshots, temporary encrypted export files, or remembered external-document URIs. Android explicitly calls out device-specific identifiers such as FCM tokens as data to exclude, and restored URIs can be invalid. Recreate notification schedules from SQLite after startup/restore. ([Android backup exclusions](https://developer.android.com/identity/data/autobackup#include-exclude-android-12), [Android backup data guidance](https://developer.android.com/identity/data/backup))

### Expo integration limitation

The built-in app config can toggle `android.allowBackup` but cannot encode `fullBackupContent`, `dataExtractionRules`, or arbitrary `res/xml` files. Under CNG, add a local config plugin that:

1. uses `withAndroidManifest` to set `android:allowBackup`, `android:fullBackupContent`, and `android:dataExtractionRules` on `<application>`; and
2. generates both XML resources under `android/app/src/main/res/xml` using a custom/dangerous mod (there is no standard arbitrary `res/xml` mod).

Expo's mod documentation identifies `withAndroidManifest` as the supported manifest modifier and dangerous mods as the escape hatch for native files without a standard mod. These mods run during prebuild, so an EAS development/preview rebuild is required. If native directories are committed instead of regenerated, the same manifest/resources can be maintained directly, but CNG guidance prefers config plugins because direct edits are lost on regeneration. ([Expo mods](https://docs.expo.dev/config-plugins/mods/), [dangerous mods](https://docs.expo.dev/config-plugins/dangerous-mods/), [CNG/native customization](https://docs.expo.dev/workflow/customizing/#considerations-when-using-continuous-native-generation))

Setting `allowBackup: false` is not a reliable substitute for selective rules on every Android 12+ vendor: Android documents that some manufacturers disable cloud backup but still permit device-to-device transfer when it is false. Explicit rules are the auditable control. ([Android Auto Backup enable/disable behavior](https://developer.android.com/identity/data/autobackup#EnablingAutoBackup))

### Validation requirements

Validate Android backup only in an app-specific release/preview build, not Expo Go. Test:

- forced backup and restore with Android's documented `bmgr` workflow;
- reinstall restore before first launch;
- schema migration from an older restored database;
- database size near/over 25 MB;
- cloud backup with/without device screen-lock encryption capability;
- device-to-device rules separately from cloud rules;
- recreation of notification schedules from restored recurring rules; and
- absence of cache, external URI, push-token, and temporary backup material.

Android provides a first-party backup/restore testing procedure and notes that normal backup timing is nondeterministic, so forced validation is necessary. ([Android test backup and restore](https://developer.android.com/identity/data/testingbackup))

## Recommended implementation decisions for this repository

1. Use async SQLite APIs, WAL, foreign keys, bound parameters, migrations via `PRAGMA user_version`, and `withExclusiveTransactionAsync` for financial mutations.
2. Create portable backups from `serializeAsync()` bytes while application writes are quiesced. Restore into an in-memory database first, validate, create a pre-restore snapshot, then perform the persistent replacement under an app-level restore lock with recovery for interruption.
3. Use SDK 57 AES-GCM with a 256-bit imported key, 12-byte nonce, 16-byte tag, versioned header as AAD, and a separately implemented, calibrated password KDF with a random per-backup salt.
4. Use `Directory.pickDirectoryAsync` + `createFile` + `write` for Android export; use `DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true })` for restore. Re-read/decrypt/validate after writing before reporting success.
5. Create one stable Android reminder channel before requesting Android 13 notification permission. Schedule ordinary inexact local notifications, persist their identifiers, and reconcile native schedules from SQLite at startup. Do not request exact-alarm permission in v1.
6. Add a local Android-backup config plugin that includes only `file/SQLite` for both modern and legacy rule formats. Keep `android.allowBackup` explicitly `true` once those rules exist.
7. Move routine native validation from Expo Go to the existing EAS development build as soon as backup rules or any non-default native configuration lands. Use the preview APK for release-parity notification, backup/restore, reinstall, and in-place-upgrade tests.
8. Add `autoIncrement: true` (or equivalent explicit version-code management) to the preview profile if preview APKs are distributed as the user's update channel, and preserve/export the Android signing keystore.

## Primary-source index

- [Expo SQLite — SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/)
- [Expo Notifications — SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/)
- [Expo FileSystem — SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/)
- [Expo DocumentPicker — SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/)
- [Expo Crypto — SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/)
- [Expo SDK 57 app config](https://docs.expo.dev/versions/v57.0.0/config/app/)
- [Expo SDK 57 tagged source](https://github.com/expo/expo/tree/sdk-57)
- [Expo SDK 57 release notes](https://expo.dev/changelog/sdk-57)
- [EAS Build documentation](https://docs.expo.dev/build/introduction/)
- [Android Auto Backup](https://developer.android.com/identity/data/autobackup)
- [Android Storage Access Framework](https://developer.android.com/training/data-storage/shared/documents-files)
- [Android alarm scheduling](https://developer.android.com/develop/background-work/services/alarms)
- [RFC 9106: Argon2](https://www.rfc-editor.org/rfc/rfc9106.html)
- [NIST SP 800-132](https://csrc.nist.gov/publications/detail/sp/800-132/final)
