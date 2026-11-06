import assert from 'node:assert/strict';
import test from 'node:test';

import createAppConfig from '../../app.config.js';
import { COMMANDS, DEFAULT_ADB_EXECUTABLE, QUALITY_CHECK_COMMANDS } from './constants.mjs';
import {
  createAdbInstallCommand,
  formatCommand,
  hasExpectedPackageName,
  interruptChildProcess,
  isNodeVersionSupported,
  toWindowsAdbPath,
} from '../system-guide.mjs';

test('accepts the Expo SDK 57 minimum Node.js version and newer versions', () => {
  assert.equal(isNodeVersionSupported('22.12.9'), false);
  assert.equal(isNodeVersionSupported('22.13.0'), true);
  assert.equal(isNodeVersionSupported('24.0.0'), true);
});

test('recognizes only the Save Your Money package root', () => {
  assert.equal(hasExpectedPackageName({ name: 'save-your-money' }), true);
  assert.equal(hasExpectedPackageName({ name: 'another-project' }), false);
  assert.equal(hasExpectedPackageName(null), false);
});

test('formats the exact command shown before execution', () => {
  assert.equal(
    formatCommand(COMMANDS.buildPreview),
    'npx eas-cli@latest build --platform android --profile preview',
  );
});

test('converts a Windows-mounted WSL APK path for Windows adb', () => {
  assert.equal(
    toWindowsAdbPath('/mnt/c/Users/Admin/Downloads/Save Your Money.apk'),
    'C:\\Users\\Admin\\Downloads\\Save Your Money.apk',
  );
  assert.equal(toWindowsAdbPath('/tmp/save-your-money.apk', null), undefined);
  assert.equal(
    toWindowsAdbPath('/home/kianfratz/save-your-money/dev.apk', 'Ubuntu'),
    '\\\\wsl.localhost\\Ubuntu\\home\\kianfratz\\save-your-money\\dev.apk',
  );
});

test('uses a separate Android identity for the development build', () => {
  const originalVariant = process.env.APP_VARIANT;
  const baseConfig = {
    name: 'Save Your Money',
    scheme: 'saveyourmoney',
    android: { package: 'com.kianfratz.saveyourmoney' },
  };

  try {
    process.env.APP_VARIANT = 'development';
    const developmentConfig = createAppConfig({ config: baseConfig });
    assert.equal(developmentConfig.name, 'Save Your Money Dev');
    assert.equal(developmentConfig.scheme, 'saveyourmoney-dev');
    assert.equal(developmentConfig.android.package, 'com.kianfratz.saveyourmoney.dev');

    delete process.env.APP_VARIANT;
    const standaloneConfig = createAppConfig({ config: baseConfig });
    assert.equal(standaloneConfig.name, 'Save Your Money');
    assert.equal(standaloneConfig.scheme, 'saveyourmoney');
    assert.equal(standaloneConfig.android.package, 'com.kianfratz.saveyourmoney');
  } finally {
    if (originalVariant === undefined) {
      delete process.env.APP_VARIANT;
    } else {
      process.env.APP_VARIANT = originalVariant;
    }
  }
});

test('creates a data-preserving in-place APK installation command', () => {
  const command = createAdbInstallCommand(
    DEFAULT_ADB_EXECUTABLE,
    '/mnt/c/Users/Admin/Downloads/Save Your Money.apk',
  );

  assert.ok(command);
  assert.deepEqual(command.args, [
    'install',
    '-r',
    'C:\\Users\\Admin\\Downloads\\Save Your Money.apk',
  ]);
  assert.equal(
    formatCommand(command),
    `${DEFAULT_ADB_EXECUTABLE} install -r 'C:\\Users\\Admin\\Downloads\\Save Your Money.apk'`,
  );
});

test('keeps destructive and production commands out of the supported command set', () => {
  const supportedCommands = Object.values(COMMANDS).map(formatCommand);

  assert.equal(
    supportedCommands.some((command) => command.includes('reset-project')),
    false,
  );
  assert.equal(
    supportedCommands.some((command) => command.includes('--profile production')),
    false,
  );
  assert.equal(
    supportedCommands.some((command) => command.includes('uninstall')),
    false,
  );
  assert.equal(
    supportedCommands.some((command) => command.includes('pm clear')),
    false,
  );
});

test('runs the complete quality gate in the documented order', () => {
  assert.deepEqual(
    QUALITY_CHECK_COMMANDS.map(({ command }) => formatCommand(command)),
    ['npm run typecheck', 'npm run lint', 'npm run format:check', 'npm test', 'npm run test:guide'],
  );
});

test('targets the development variant when starting Metro', () => {
  assert.equal(formatCommand(COMMANDS.startDevelopmentLan), 'npm run dev');
  assert.equal(formatCommand(COMMANDS.startDevelopmentTunnel), 'npm run dev -- --tunnel');
  assert.equal(
    formatCommand(COMMANDS.downloadDevelopment),
    'npx eas-cli@latest build:download --platform android --dev-client',
  );
});

test('forwards Ctrl+C to the isolated child process group', () => {
  const signals = [];
  const child = {
    pid: 42,
    kill() {
      assert.fail('The direct child fallback should not run on this platform path.');
    },
  };

  interruptChildProcess(child, true, (processId, signal) => {
    signals.push({ processId, signal });
  });

  assert.deepEqual(signals, [{ processId: -42, signal: 'SIGINT' }]);
});
