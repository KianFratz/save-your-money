# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies (Node.js 22.13 or newer)

   ```bash
   npm ci
   ```

2. Start the app in Expo Go

   ```bash
   npm run go
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

For a physical Android phone connected through USB, enable USB debugging and run:

```bash
adb reverse tcp:8081 tcp:8081
npm run go -- --localhost
```

Keep Metro running, then press `a` or open Expo Go on the phone. Saved JavaScript, TypeScript, and UI changes refresh without rebuilding the app.

## Interactive system guide

Run the Android-first guide from the project root:

```bash
npm run guide
```

The guide checks local prerequisites and offers both automated and manual Fast Refresh setup for a
physical Android phone. It installs a separate **Save Your Money Dev** app so daily code changes can
refresh through Metro without replacing the standalone app or sharing its data. The same guide also
covers quality checks and a signed preview workflow that can install an APK without intentionally
clearing existing app data. Every executable command is shown before confirmation.

For daily development after the development APK is installed, run the guide and choose **Daily
Android development → Start Fast Refresh on LAN**, or run:

```bash
npm run dev
```

Keep Metro running and open **Save Your Money Dev** on the phone. Ordinary JavaScript, TypeScript,
style, route, and component changes refresh without another EAS build. Rebuild the development APK
after native dependency, app configuration, plugin, permission, icon, or Expo SDK changes.

## Quality checks

Run these commands from the project root. They run locally without a phone or network service and exit with a nonzero status when a check fails.

```bash
npm run typecheck      # strict TypeScript check
npm run lint           # ESLint, with warnings treated as failures
npm run format:check   # Prettier check
npm test               # Jest and React Native Testing Library
npm run test:guide     # interactive system-guide safety rules
```

Use `npm run format` to apply Prettier formatting. To run one test file during development, use `npm test -- --runTestsByPath __tests__/shell-routes.test.tsx`.

The routed tests use `expo-router/testing-library` with React Native Testing Library 14. SDK 58's React 19.3 test renderer is asynchronous, so render and event helpers must be awaited before assertions.

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
