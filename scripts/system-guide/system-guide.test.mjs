import assert from 'node:assert/strict';
import test from 'node:test';

import { COMMANDS, QUALITY_CHECK_COMMANDS } from './constants.mjs';
import {
  formatCommand,
  hasExpectedPackageName,
  interruptChildProcess,
  isNodeVersionSupported,
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
});

test('runs the complete quality gate in the documented order', () => {
  assert.deepEqual(
    QUALITY_CHECK_COMMANDS.map(({ command }) => formatCommand(command)),
    ['npm run typecheck', 'npm run lint', 'npm run format:check', 'npm test', 'npm run test:guide'],
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
