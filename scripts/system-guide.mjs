#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { extname, isAbsolute, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { pathToFileURL } from 'node:url';

import {
  ANDROID_PACKAGE_NAME,
  BUILD_MENU_OPTIONS,
  COMMANDS,
  DEFAULT_ADB_EXECUTABLE,
  DEVELOPMENT_MENU_OPTIONS,
  MAIN_MENU_OPTIONS,
  MINIMUM_NODE_VERSION,
  PROJECT_PACKAGE_NAME,
  PREVIEW_UPDATE_CHECKPOINTS,
  QUALITY_CHECK_COMMANDS,
  RELEASE_CHECKLIST_PATH,
  RELEASE_CHECKPOINTS,
} from './system-guide/constants.mjs';

const DEPENDENCY_MARKER_PATH = 'node_modules/expo/package.json';

export function formatCommand(commandDefinition) {
  return [commandDefinition.command, ...commandDefinition.args]
    .map((argument) => {
      if (!/\s/.test(argument)) {
        return argument;
      }

      return `'${argument.replaceAll("'", "'\\''")}'`;
    })
    .join(' ');
}

export function toWindowsAdbPath(path) {
  const windowsMountMatch = path.match(/^\/mnt\/([a-zA-Z])\/(.+)$/);
  if (!windowsMountMatch) {
    return undefined;
  }

  const [, driveLetter, remainder] = windowsMountMatch;
  return `${driveLetter.toUpperCase()}:\\${remainder.replaceAll('/', '\\')}`;
}

export function createAdbInstallCommand(adbExecutable, apkPath) {
  const usesWindowsAdb = adbExecutable.toLowerCase().endsWith('.exe');
  const installPath = usesWindowsAdb ? toWindowsAdbPath(apkPath) : apkPath;

  if (!installPath) {
    return undefined;
  }

  return {
    command: adbExecutable,
    args: ['install', '-r', installPath],
    description:
      'Replace the existing Save Your Money package while retaining its application data.',
    requiresDependencies: false,
  };
}

export function isNodeVersionSupported(version, minimumVersion = MINIMUM_NODE_VERSION) {
  const versionParts = version.split('.').map((part) => Number.parseInt(part, 10));
  const currentVersion = {
    major: versionParts[0] ?? 0,
    minor: versionParts[1] ?? 0,
    patch: versionParts[2] ?? 0,
  };

  for (const key of ['major', 'minor', 'patch']) {
    if (currentVersion[key] > minimumVersion[key]) {
      return true;
    }

    if (currentVersion[key] < minimumVersion[key]) {
      return false;
    }
  }

  return true;
}

export function hasExpectedPackageName(packageJson) {
  return (
    typeof packageJson === 'object' &&
    packageJson !== null &&
    'name' in packageJson &&
    packageJson.name === PROJECT_PACKAGE_NAME
  );
}

export async function validateProjectRoot(projectRoot) {
  try {
    const packageJsonText = await readFile(join(projectRoot, 'package.json'), 'utf8');
    const packageJson = JSON.parse(packageJsonText);

    if (!hasExpectedPackageName(packageJson)) {
      return {
        valid: false,
        reason: `package.json must identify the project as "${PROJECT_PACKAGE_NAME}".`,
      };
    }

    return { valid: true };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);

    return {
      valid: false,
      reason: `package.json could not be read: ${detail}`,
    };
  }
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function printOptions(options) {
  for (const option of options) {
    console.log(`  ${option.id}. ${option.label}`);
  }
}

async function askForMenuChoice(readline, title, options) {
  console.log(`\n${title}`);
  printOptions(options);

  return (await readline.question('\nChoose an option: ')).trim();
}

async function askForConfirmation(readline, prompt) {
  const answer = (await readline.question(`${prompt} [y/N]: `)).trim().toLowerCase();
  return answer === 'y' || answer === 'yes';
}

function getExecutableName(command) {
  if (process.platform !== 'win32') {
    return command;
  }

  if (command === 'npm' || command === 'npx') {
    return `${command}.cmd`;
  }

  return command;
}

export function interruptChildProcess(
  child,
  usesProcessGroup = process.platform !== 'win32',
  sendSignal = process.kill,
) {
  if (usesProcessGroup && child.pid) {
    sendSignal(-child.pid, 'SIGINT');
    return;
  }

  child.kill('SIGINT');
}

async function runChildCommand(commandDefinition, projectRoot, readline) {
  readline.pause();

  const result = await new Promise((resolve) => {
    const usesProcessGroup = process.platform !== 'win32';
    const child = spawn(getExecutableName(commandDefinition.command), [...commandDefinition.args], {
      cwd: projectRoot,
      detached: usesProcessGroup,
      shell: false,
      stdio: 'inherit',
    });

    const stopChild = () => {
      try {
        interruptChildProcess(child, usesProcessGroup);
      } catch {
        // The child may finish between receiving Ctrl+C and forwarding the signal.
      }
    };
    process.on('SIGINT', stopChild);

    child.once('error', (error) => {
      process.removeListener('SIGINT', stopChild);
      resolve({ status: 'failed', detail: error.message });
    });

    child.once('exit', (code, signal) => {
      process.removeListener('SIGINT', stopChild);

      if (signal) {
        resolve({ status: 'interrupted', detail: signal });
        return;
      }

      if (code === 0) {
        resolve({ status: 'passed' });
        return;
      }

      resolve({ status: 'failed', detail: `exit code ${code ?? 'unknown'}` });
    });
  });

  readline.resume();
  return result;
}

async function ensureCommandCanRun(commandDefinition, projectRoot) {
  const projectStatus = await validateProjectRoot(projectRoot);
  if (!projectStatus.valid) {
    console.log(`\nCannot run commands here: ${projectStatus.reason}`);
    console.log(`Change to the ${PROJECT_PACKAGE_NAME} project root and try again.`);
    return false;
  }

  if (!isNodeVersionSupported(process.versions.node)) {
    console.log(
      `\nNode.js ${process.versions.node} is unsupported. Install Node.js ${MINIMUM_NODE_VERSION.major}.${MINIMUM_NODE_VERSION.minor} or newer.`,
    );
    return false;
  }

  if (
    commandDefinition.requiresDependencies &&
    !(await pathExists(join(projectRoot, DEPENDENCY_MARKER_PATH)))
  ) {
    console.log('\nProject dependencies are missing. Run the first-time setup workflow first.');
    return false;
  }

  return true;
}

async function offerCommand(commandDefinition, projectRoot, readline) {
  if (!(await ensureCommandCanRun(commandDefinition, projectRoot))) {
    return { status: 'blocked' };
  }

  console.log(`\n${commandDefinition.description}`);
  console.log(`Command: ${formatCommand(commandDefinition)}`);

  if (!(await askForConfirmation(readline, 'Run this command?'))) {
    console.log('Skipped.');
    return { status: 'skipped' };
  }

  const result = await runChildCommand(commandDefinition, projectRoot, readline);

  if (result.status === 'passed') {
    console.log('\nCommand completed successfully.');
  } else if (result.status === 'interrupted') {
    console.log('\nCommand stopped. Returning to the guide.');
  } else {
    console.log(`\nCommand failed (${result.detail}).`);
  }

  return result;
}

async function showPrerequisites(projectRoot) {
  const projectStatus = await validateProjectRoot(projectRoot);
  const nodeSupported = isNodeVersionSupported(process.versions.node);
  const dependenciesInstalled = await pathExists(join(projectRoot, DEPENDENCY_MARKER_PATH));

  console.log('\nPrerequisite report');
  console.log(`  ${projectStatus.valid ? 'PASS' : 'FAIL'}  Save Your Money project root`);
  console.log(
    `  ${nodeSupported ? 'PASS' : 'FAIL'}  Node.js ${process.versions.node} (minimum ${MINIMUM_NODE_VERSION.major}.${MINIMUM_NODE_VERSION.minor})`,
  );
  console.log(`  ${dependenciesInstalled ? 'PASS' : 'FAIL'}  Project dependencies`);
  console.log('  MANUAL  Expo Go installed on the Android phone');
  console.log('  MANUAL  Computer and phone connected to the same local network');

  if (!projectStatus.valid) {
    console.log(`\nProject root problem: ${projectStatus.reason}`);
  }

  if (!nodeSupported) {
    console.log(
      `Install Node.js ${MINIMUM_NODE_VERSION.major}.${MINIMUM_NODE_VERSION.minor} or newer before continuing.`,
    );
  }

  if (!dependenciesInstalled) {
    console.log('Choose first-time setup to install the locked dependencies with npm ci.');
  }
}

async function runFirstTimeSetup(projectRoot, readline) {
  console.log('\nFirst-time setup');
  console.log('This project has no backend, Docker service, or required environment file.');
  console.log('After installing dependencies, install Expo Go on the Android phone.');

  await offerCommand(COMMANDS.installDependencies, projectRoot, readline);
}

async function runDailyDevelopment(projectRoot, readline) {
  console.log('\nUse LAN mode while the computer and Android phone share a network.');
  console.log('Open Expo Go and scan the QR code printed by Expo.');

  const choice = await askForMenuChoice(
    readline,
    'Daily Android development',
    DEVELOPMENT_MENU_OPTIONS,
  );

  if (choice === '1') {
    await offerCommand(COMMANDS.startLan, projectRoot, readline);
  } else if (choice === '2') {
    await offerCommand(COMMANDS.startTunnel, projectRoot, readline);
  } else if (choice !== '3') {
    console.log('Unknown option. Returning to the main menu.');
  }
}

async function runQualityChecks(projectRoot, readline) {
  console.log('\nQuality gate');
  console.log('Every check is offered even when an earlier check fails.');

  const results = [];
  for (const check of QUALITY_CHECK_COMMANDS) {
    const result = await offerCommand(check.command, projectRoot, readline);
    results.push({ label: check.label, ...result });
  }

  console.log('\nQuality summary');
  for (const result of results) {
    const detail = result.detail ? ` (${result.detail})` : '';
    console.log(`  ${result.status.toUpperCase().padEnd(11)} ${result.label}${detail}`);
  }

  return results;
}

function createAdbCommand(adbExecutable, args, description) {
  return {
    command: adbExecutable,
    args,
    description,
    requiresDependencies: false,
  };
}

async function getAdbExecutable() {
  if (await pathExists(DEFAULT_ADB_EXECUTABLE)) {
    return DEFAULT_ADB_EXECUTABLE;
  }

  return 'adb';
}

function normalizeInputPath(inputPath, projectRoot) {
  const unquotedPath = inputPath.trim().replace(/^(?:'(.+)'|"(.+)")$/, '$1$2');
  return isAbsolute(unquotedPath) ? unquotedPath : resolve(projectRoot, unquotedPath);
}

async function installPreviewApk(projectRoot, readline) {
  console.log('\nInstall a signed preview APK on the physical phone');
  console.log('Official guidance: https://docs.expo.dev/build-reference/apk/');
  console.log('Android documents that adb install -r keeps the existing application data.');
  console.log('Do not uninstall Save Your Money and do not clear its storage.');

  if (
    !(await askForConfirmation(
      readline,
      'Have you backed up important app data, or confirmed there is no data you need to preserve?',
    ))
  ) {
    console.log('Update stopped. Protect important data before continuing.');
    return { status: 'blocked' };
  }

  const enteredPath = await readline.question(
    '\nPath to the downloaded APK (for example /mnt/c/Users/Admin/Downloads/app.apk): ',
  );
  const apkPath = normalizeInputPath(enteredPath, projectRoot);

  if (extname(apkPath).toLowerCase() !== '.apk' || !(await pathExists(apkPath))) {
    console.log(`\nAPK not found: ${apkPath}`);
    console.log('Download the finished preview artifact from the EAS build page and try again.');
    return { status: 'blocked' };
  }

  const adbExecutable = await getAdbExecutable();
  const installCommand = createAdbInstallCommand(adbExecutable, apkPath);

  if (!installCommand) {
    console.log('\nThe Windows adb executable cannot read this WSL-only APK path.');
    console.log('Move the APK under /mnt/c, such as the Windows Downloads folder, and try again.');
    return { status: 'blocked' };
  }

  console.log('\nConnect the phone by USB, enable USB debugging, and approve the phone prompt.');
  const devicesResult = await offerCommand(
    createAdbCommand(
      adbExecutable,
      ['devices', '-l'],
      'List connected Android devices and their authorization state.',
    ),
    projectRoot,
    readline,
  );

  if (devicesResult.status !== 'passed') {
    console.log('Update stopped because the ADB device check did not complete.');
    return devicesResult;
  }

  if (
    !(await askForConfirmation(
      readline,
      'Does exactly one intended phone appear above with the state "device"?',
    ))
  ) {
    console.log('Update stopped. Fix the USB connection or authorization and try again.');
    return { status: 'blocked' };
  }

  console.log('\nRecord the current versionCode, dataDir, and firstInstallTime shown below.');
  const beforeInspectionResult = await offerCommand(
    createAdbCommand(
      adbExecutable,
      ['shell', 'dumpsys', 'package', ANDROID_PACKAGE_NAME],
      'Inspect the currently installed Save Your Money package before updating it.',
    ),
    projectRoot,
    readline,
  );

  if (beforeInspectionResult.status !== 'passed') {
    console.log('Update stopped because the installed-package baseline was not recorded.');
    return beforeInspectionResult;
  }

  const installResult = await offerCommand(installCommand, projectRoot, readline);
  if (installResult.status !== 'passed') {
    console.log('The APK was not installed. The existing app has not been intentionally removed.');
    return installResult;
  }

  console.log(
    '\nVerify that versionCode increased while dataDir and firstInstallTime stayed the same.',
  );
  const afterInspectionResult = await offerCommand(
    createAdbCommand(
      adbExecutable,
      ['shell', 'dumpsys', 'package', ANDROID_PACKAGE_NAME],
      'Inspect the installed Save Your Money package after the update.',
    ),
    projectRoot,
    readline,
  );

  const launchResult = await offerCommand(
    createAdbCommand(
      adbExecutable,
      ['shell', 'am', 'start', '-W', '-n', `${ANDROID_PACKAGE_NAME}/.MainActivity`],
      'Cold-launch the updated application and wait for Android to report the result.',
    ),
    projectRoot,
    readline,
  );

  if (afterInspectionResult.status !== 'passed' || launchResult.status !== 'passed') {
    console.log('\nThe APK was installed, but the post-install verification is incomplete.');
    console.log('Run the install-existing-APK workflow again and complete the verification steps.');
    return { status: 'verification-incomplete' };
  }

  console.log(
    '\nOpen the app and confirm that the expected data and latest interface are present.',
  );
  console.log('Do not expose private financial data in terminal output, screenshots, or logs.');

  if (
    !(await askForConfirmation(readline, 'Does the updated app look correct and retain its data?'))
  ) {
    console.log(
      'Verification is incomplete. Stop entering new data and follow the recovery checklist.',
    );
    return { status: 'verification-incomplete' };
  }

  console.log('\nPreview APK update completed and manually verified.');

  return { status: 'passed' };
}

async function buildAndInstallPreview(projectRoot, readline) {
  console.log('\nSigned preview update workflow');
  for (const checkpoint of PREVIEW_UPDATE_CHECKPOINTS) {
    console.log(`  - ${checkpoint}`);
  }

  const gitStatusResult = await offerCommand(COMMANDS.gitStatus, projectRoot, readline);
  if (gitStatusResult.status !== 'passed') {
    console.log('Build stopped because the source status was not inspected.');
    return;
  }

  if (
    !(await askForConfirmation(readline, 'Is the intended source committed and ready to build?'))
  ) {
    console.log('Build stopped. Commit or preserve the intended source before continuing.');
    return;
  }

  console.log('\nFirst, run the complete quality gate. Every check must pass.');
  const qualityResults = await runQualityChecks(projectRoot, readline);
  if (!qualityResults.every((result) => result.status === 'passed')) {
    console.log('\nBuild stopped because every quality check did not pass.');
    return;
  }

  const buildResult = await offerCommand(COMMANDS.buildPreview, projectRoot, readline);
  if (buildResult.status !== 'passed') {
    console.log(
      'Installation was not started because the EAS build did not complete successfully.',
    );
    return;
  }

  console.log('\nDownload the finished .apk from the EAS build link printed above.');
  console.log('Save it in the Windows Downloads folder so Windows adb can read it from WSL.');

  if (!(await askForConfirmation(readline, 'Has the finished APK been downloaded?'))) {
    console.log(
      'Return to this menu and choose the install-existing-APK option after downloading it.',
    );
    return;
  }

  await installPreviewApk(projectRoot, readline);
}

async function runAndroidBuild(projectRoot, readline) {
  console.log('\nEAS Android builds require an Expo account, network access, and EAS credentials.');
  console.log(
    'The development profile uses Metro; the preview profile is a standalone signed APK.',
  );

  const choice = await askForMenuChoice(readline, 'Android APK builds', BUILD_MENU_OPTIONS);

  if (choice === '1') {
    await offerCommand(COMMANDS.buildDevelopment, projectRoot, readline);
  } else if (choice === '2') {
    await buildAndInstallPreview(projectRoot, readline);
  } else if (choice === '3') {
    await installPreviewApk(projectRoot, readline);
  } else if (choice !== '4') {
    console.log('Unknown option. Returning to the main menu.');
  }
}

function showReleaseGuidance(projectRoot) {
  console.log('\nRelease and recovery');
  console.log('The repository checklist is the detailed source of truth. Major checkpoints:');

  for (const checkpoint of RELEASE_CHECKPOINTS) {
    console.log(`  - ${checkpoint}`);
  }

  console.log(`\nChecklist: ${join(projectRoot, RELEASE_CHECKLIST_PATH)}`);
  console.log('Production/store builds are intentionally outside this guide.');
}

export async function runSystemGuide({
  input = process.stdin,
  output = process.stdout,
  projectRoot = process.cwd(),
} = {}) {
  const readline = createInterface({ input, output });

  console.log('\nSave Your Money system guide');
  console.log('Android-first setup, development, verification, and release guidance.');

  try {
    let running = true;
    while (running) {
      const choice = await askForMenuChoice(readline, 'Main menu', MAIN_MENU_OPTIONS);

      switch (choice) {
        case '1':
          await showPrerequisites(projectRoot);
          break;
        case '2':
          await runFirstTimeSetup(projectRoot, readline);
          break;
        case '3':
          await runDailyDevelopment(projectRoot, readline);
          break;
        case '4':
          await runQualityChecks(projectRoot, readline);
          break;
        case '5':
          await runAndroidBuild(projectRoot, readline);
          break;
        case '6':
          showReleaseGuidance(projectRoot);
          break;
        case '7':
          running = false;
          break;
        default:
          console.log('Unknown option. Choose a number from 1 to 7.');
      }
    }
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ERR_USE_AFTER_CLOSE')) {
      throw error;
    }

    console.log('\nInput closed.');
  } finally {
    readline.close();
  }

  console.log('\nGuide closed.');
}

const invokedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : undefined;
if (invokedPath === import.meta.url) {
  runSystemGuide().catch((error) => {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`\nThe guide stopped unexpectedly: ${detail}`);
    process.exitCode = 1;
  });
}
