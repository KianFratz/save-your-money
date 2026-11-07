export const PROJECT_PACKAGE_NAME = 'save-your-money';
export const ANDROID_PACKAGE_NAME = 'com.kianfratz.saveyourmoney';
export const DEVELOPMENT_ANDROID_PACKAGE_NAME = 'com.kianfratz.saveyourmoney.dev';

export const DEFAULT_ADB_EXECUTABLE =
  '/mnt/c/Users/Admin/Downloads/platform-tools-latest-windows/platform-tools/adb.exe';

export const SUPPORTED_NODE_VERSION_MINIMUMS = Object.freeze({
  22: Object.freeze({ major: 22, minor: 13, patch: 0 }),
  24: Object.freeze({ major: 24, minor: 3, patch: 0 }),
});
export const MINIMUM_FUTURE_NODE_MAJOR = 26;
export const SUPPORTED_NODE_VERSION_DESCRIPTION = '22.13+, 24.3+, or a later even-numbered release';

export const RELEASE_CHECKLIST_PATH = 'docs/RELEASE_RECOVERY_CHECKLIST.md';

export const COMMANDS = Object.freeze({
  gitStatus: Object.freeze({
    command: 'git',
    args: Object.freeze(['status', '--short']),
    description: 'Show uncommitted files so you can confirm exactly what EAS will archive.',
    requiresDependencies: false,
  }),
  installDependencies: Object.freeze({
    command: 'npm',
    args: Object.freeze(['ci']),
    description: 'Install the exact dependency versions recorded in package-lock.json.',
    requiresDependencies: false,
  }),
  startDevelopmentLan: Object.freeze({
    command: 'npm',
    args: Object.freeze(['run', 'dev']),
    description:
      'Start Metro for Save Your Money Dev on the local network with Fast Refresh enabled.',
    requiresDependencies: true,
  }),
  startDevelopmentTunnel: Object.freeze({
    command: 'npm',
    args: Object.freeze(['run', 'dev', '--', '--tunnel']),
    description: 'Start Metro for Save Your Money Dev through the slower tunnel fallback.',
    requiresDependencies: true,
  }),
  typecheck: Object.freeze({
    command: 'npm',
    args: Object.freeze(['run', 'typecheck']),
    description: 'Check the strict TypeScript contracts without emitting files.',
    requiresDependencies: true,
  }),
  lint: Object.freeze({
    command: 'npm',
    args: Object.freeze(['run', 'lint']),
    description: 'Run ESLint and treat every warning as a failure.',
    requiresDependencies: true,
  }),
  formatCheck: Object.freeze({
    command: 'npm',
    args: Object.freeze(['run', 'format:check']),
    description: 'Check that source and configuration files match the Prettier format.',
    requiresDependencies: true,
  }),
  test: Object.freeze({
    command: 'npm',
    args: Object.freeze(['test']),
    description: 'Run the Jest application and component tests.',
    requiresDependencies: true,
  }),
  testGuide: Object.freeze({
    command: 'npm',
    args: Object.freeze(['run', 'test:guide']),
    description: 'Run the focused safety tests for this interactive guide.',
    requiresDependencies: true,
  }),
  buildDevelopment: Object.freeze({
    command: 'npx',
    args: Object.freeze([
      'eas-cli@latest',
      'build',
      '--platform',
      'android',
      '--profile',
      'development',
    ]),
    description: 'Request an Android development-client APK from EAS Build.',
    requiresDependencies: true,
  }),
  downloadDevelopment: Object.freeze({
    command: 'npx',
    args: Object.freeze([
      'eas-cli@latest',
      'build:download',
      '--platform',
      'android',
      '--dev-client',
    ]),
    description:
      'Download a finished Android development-client APK; select the build that just completed.',
    requiresDependencies: true,
  }),
  buildPreview: Object.freeze({
    command: 'npx',
    args: Object.freeze([
      'eas-cli@latest',
      'build',
      '--platform',
      'android',
      '--profile',
      'preview',
    ]),
    description: 'Request the signed, standalone Android preview APK from EAS Build.',
    requiresDependencies: true,
  }),
});

export const QUALITY_CHECK_COMMANDS = Object.freeze([
  Object.freeze({ label: 'TypeScript', command: COMMANDS.typecheck }),
  Object.freeze({ label: 'ESLint', command: COMMANDS.lint }),
  Object.freeze({ label: 'Prettier', command: COMMANDS.formatCheck }),
  Object.freeze({ label: 'Application tests', command: COMMANDS.test }),
  Object.freeze({ label: 'System-guide tests', command: COMMANDS.testGuide }),
]);

export const MAIN_MENU_OPTIONS = Object.freeze([
  Object.freeze({ id: '1', label: 'Check prerequisites' }),
  Object.freeze({ id: '2', label: 'First-time setup' }),
  Object.freeze({ id: '3', label: 'Daily Android development' }),
  Object.freeze({ id: '4', label: 'Run quality checks' }),
  Object.freeze({ id: '5', label: 'Build and install an Android APK' }),
  Object.freeze({ id: '6', label: 'Review release and recovery guidance' }),
  Object.freeze({ id: '7', label: 'Exit' }),
]);

export const DEVELOPMENT_MENU_OPTIONS = Object.freeze([
  Object.freeze({ id: '1', label: 'Automated setup and live development' }),
  Object.freeze({ id: '2', label: 'Start Fast Refresh on LAN (already installed)' }),
  Object.freeze({ id: '3', label: 'Start Fast Refresh through a tunnel' }),
  Object.freeze({ id: '4', label: 'Show the complete manual guide' }),
  Object.freeze({ id: '5', label: 'Back to the main menu' }),
]);

export const BUILD_MENU_OPTIONS = Object.freeze([
  Object.freeze({ id: '1', label: 'Set up the development APK for Fast Refresh' }),
  Object.freeze({ id: '2', label: 'Build and install a preview APK on the phone' }),
  Object.freeze({ id: '3', label: 'Install an already-downloaded preview APK' }),
  Object.freeze({ id: '4', label: 'Back to the main menu' }),
]);

export const DEVELOPMENT_WORKFLOW_STAGES = Object.freeze([
  Object.freeze({
    title: '1 of 4 - Understand the two installed apps',
    steps: Object.freeze([
      'Save Your Money is the standalone preview app and keeps your real data.',
      'Save Your Money Dev uses com.kianfratz.saveyourmoney.dev and has separate test data.',
      'Installing or clearing the development app does not replace the standalone preview app.',
    ]),
  }),
  Object.freeze({
    title: '2 of 4 - Create and install the development APK once',
    steps: Object.freeze([
      'Run: npx eas-cli@latest build --platform android --profile development',
      'Run: npx eas-cli@latest build:download --platform android --dev-client',
      'Connect and authorize the phone, then run: adb devices -l',
      'Install without uninstalling: adb install -r PATH_TO_DEVELOPMENT_APK',
      'Open the phone app named Save Your Money Dev.',
    ]),
  }),
  Object.freeze({
    title: '3 of 4 - Use Fast Refresh every day',
    steps: Object.freeze([
      'Put the computer and phone on the same network.',
      'From this project in WSL, run: npm run dev',
      'Open Save Your Money Dev and select the detected server or scan the Metro QR code.',
      'Keep Metro running; saved JavaScript, TypeScript, and UI changes refresh on the phone.',
      'If LAN discovery fails, run: npm run dev -- --tunnel',
    ]),
  }),
  Object.freeze({
    title: '4 of 4 - Know when another APK is required',
    steps: Object.freeze([
      'Do not rebuild for ordinary JavaScript, TypeScript, styles, routes, or component changes.',
      'Rebuild after adding or updating a library with native code.',
      'Rebuild after changing app.json, app.config.js, native plugins, permissions, icons, or the Expo SDK.',
      'The standalone preview app never receives Metro changes; build a new preview APK when testing a release.',
    ]),
  }),
]);

export const DEVELOPMENT_SETUP_CHECKPOINTS = Object.freeze([
  'A separate development package protects the standalone preview app and its data.',
  'The EAS development APK is a one-time native shell that can be reused for daily code changes.',
  'The automated flow builds and downloads only when the development app needs installation or rebuilding.',
  'Metro must remain running while Fast Refresh sends saved code changes to the phone.',
]);

export const PREVIEW_UPDATE_CHECKPOINTS = Object.freeze([
  'Commit the exact source you intend to build so the EAS record identifies it clearly.',
  'Pass every automated quality check before requesting the APK.',
  'Create and verify an external app backup before updating important phone data.',
  'Keep the Android package com.kianfratz.saveyourmoney and the established signing credential.',
  'Use a version code higher than the version already installed on the phone.',
  'Install with adb install -r; never uninstall or clear app data for an in-place update.',
  'Verify the new version, retained data, and a successful launch after installation.',
]);

export const RELEASE_CHECKPOINTS = Object.freeze([
  'Run every automated quality check before creating a candidate.',
  'Verify the package identity, signing credential, and increasing Android version code.',
  'Test the signed APK on the Realme 8i, including airplane mode and accessibility settings.',
  'Create and verify an encrypted external backup before an in-place APK update.',
  'Complete the migration, backup/restore, notification, and in-place update drills that apply.',
  'Record the final APK and signing-credential backup locations privately.',
]);
