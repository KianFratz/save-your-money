# Accessible offline shell (issue #3)

## Android build

- [Preview APK, version code 8](https://expo.dev/accounts/kianfratz/projects/save-your-money/builds/e79af50a-0f27-4b0e-9711-29d5298c751b), SHA-256 `44c68f037a22f6cee2f1dadbfb3c06cbd10e8dbf0033a3413c2a8166da4b5992`.
- Installed as an update to `com.kianfratz.saveyourmoney` on a Realme 8i RMX3151 running Android 13.
- This APK includes the Android status bar and tab label fixes. The later source change limits the explicit tab label size to Android, so the APK represents the final Android behavior.

## Device checks on 2026-09-20

- With airplane mode enabled, opened Home, Budget, Transactions, Reports, and Settings through the bottom tabs. Each route displayed its own title and descriptive empty state without a sign-in or connection prompt.
- Android's accessibility hierarchy exposed the screen title and state text before the five tab controls. Tab controls had the complete names Home, Budget, Transactions, Reports, and Settings, including when a visual label had been shortened in an earlier build.
- In light and dark modes, the installed version code 8 showed legible screen content, status icons, and all five complete tab labels at the phone's normal `font_scale` of `1.15`.
- At the phone's larger `font_scale` of `1.35`, the version code 7 build kept the heading and state message readable without clipping. Version code 8 changed only status bar styling and Android tab label sizing from that build.
- Restored the phone's original dark mode, `font_scale` of `1.15`, and airplane mode off after the checks.

The automated routed-app and shared-state-component tests cover the five destinations and six presentation states independently of the device checks.
