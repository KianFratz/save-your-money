export const PROJECT_PACKAGE_NAME = 'save-your-money';
export const ANDROID_PACKAGE_NAME = 'com.kianfratz.saveyourmoney';

export const DEFAULT_ADB_EXECUTABLE =
  '/mnt/c/Users/Admin/Downloads/platform-tools-latest-windows/platform-tools/adb.exe';

export const MINIMUM_NODE_VERSION = Object.freeze({
  major: 22,
  minor: 13,
  patch: 0,
});

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
  startLan: Object.freeze({
    command: 'npm',
    args: Object.freeze(['start']),
    description: 'Start Expo on the local network for Expo Go or a development build.',
    requiresDependencies: true,
  }),
  startTunnel: Object.freeze({
    command: 'npx',
    args: Object.freeze(['expo', 'start', '--tunnel']),
    description: 'Start Expo through the slower tunnel fallback when LAN discovery fails.',
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
  Object.freeze({ id: '1', label: 'Start on LAN (recommended)' }),
  Object.freeze({ id: '2', label: 'Start with the tunnel fallback' }),
  Object.freeze({ id: '3', label: 'Back to the main menu' }),
]);

export const BUILD_MENU_OPTIONS = Object.freeze([
  Object.freeze({ id: '1', label: 'Development APK (uses Metro)' }),
  Object.freeze({ id: '2', label: 'Build and install a preview APK on the phone' }),
  Object.freeze({ id: '3', label: 'Install an already-downloaded preview APK' }),
  Object.freeze({ id: '4', label: 'Back to the main menu' }),
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
