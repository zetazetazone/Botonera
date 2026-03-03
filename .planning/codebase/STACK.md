# Technology Stack

**Analysis Date:** 2026-03-03

## Languages

**Primary:**
- JavaScript (ES6+) - Main application logic, components, utilities
- TypeScript ~5.9.2 - Type checking and development, configured in `tsconfig.json`
- JSX/TSX - React component definitions

**Secondary:**
- Groovy - Android build configuration in `android/app/build.gradle`
- Kotlin - Android SDK integration (via React Native bridge)

## Runtime

**Environment:**
- React Native 0.81.5 - Cross-platform mobile framework
- Node.js - Development and build environment

**Package Manager:**
- npm - Package management
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Expo ~54.0.33 - Managed React Native platform, handles iOS, Android, and web deployment
- Expo Router ~6.0.23 - File-based routing for navigation
- React 19.1.0 - UI component framework
- React DOM 19.1.0 - Web rendering

**Navigation:**
- @react-navigation/native ^7.1.8 - Navigation infrastructure
- @react-navigation/bottom-tabs ^7.4.0 - Bottom tab navigation
- @react-navigation/elements ^2.6.3 - Reusable navigation components

**UI/Graphics:**
- React Native Web ~0.21.0 - Web platform support
- @expo/vector-icons ^15.0.3 - Icon library
- expo-image ~3.0.11 - Advanced image handling
- expo-symbols ~1.0.8 - System symbols

**Animation:**
- react-native-reanimated ~4.1.1 - Gesture and animation library
- react-native-gesture-handler ~2.28.0 - Native gesture recognition
- react-native-worklets 0.5.1 - Worklet execution for animations

**Testing:**
- No test framework detected - ESLint only

**Build/Dev:**
- ESLint ^9.25.0 - Code linting
- eslint-config-expo ~10.0.0 - Expo-specific ESLint configuration
- TypeScript ~5.9.2 - Type checking

## Key Dependencies

**Critical:**
- Expo ecosystem - Enables cross-platform development and simplified deployment. Used for all platform-specific APIs
- React Native ~0.81.5 - Core mobile framework, handles native platform bridges
- react-native-gesture-handler - Required for navigation and touch interactions

**Sensors/Device APIs:**
- expo-av ~16.0.8 - Audio and video playback - Core to soundboard functionality
- expo-haptics ~15.0.8 - Haptic feedback on sound interactions
- expo-file-system ~19.0.21 - Local file storage for audio files
- expo-document-picker ~14.0.8 - File selection from device storage

**Sharing & Intent:**
- expo-share-intent ^5.1.1 - Receive shared files from other apps (critical for shared sounds feature)
- expo-sharing ~14.0.8 - Share audio files to other applications
- expo-web-browser ~15.0.10 - Web browser integration

**Storage:**
- @react-native-async-storage/async-storage 2.2.0 - Persistent key-value storage for sound metadata and app state

**UI System:**
- react-native-safe-area-context ~5.6.0 - Safe area handling for notches/edges
- react-native-screens ~4.16.0 - Native screen management

**Development:**
- expo-dev-client ~6.0.20 - Development client for custom builds
- expo-constants ~18.0.13 - App configuration constants

## Configuration

**Environment:**
- No .env file detected - Configuration is static in code (see `app.json`)
- App configuration: `app.json` contains Expo project settings

**Build:**
- Expo build system - Configured in `app.json` with plugins
- Metro bundler - JavaScript bundler (auto-configured by Expo)
- Android: Uses Expo's Android build via `expo run:android`
- iOS: Uses Expo's iOS build via `expo start --ios`
- Web: Static web output via `expo start --web`

**TypeScript:**
- Configuration: `tsconfig.json`
- Strict mode enabled
- Path aliases: `@/*` maps to project root
- Includes .expo generated types

## Platform Requirements

**Development:**
- Node.js (for running npm scripts)
- npm (for package management)
- Expo CLI (installed via npm)
- Android SDK (for Android development, optional)
- iOS SDK/Xcode (for iOS development, optional)
- Supported platforms: Android, iOS, Web

**Production:**
- Deployment: Expo EAS Build (managed build service)
- Platforms: Android (via Google Play), iOS (via App Store), Web (static hosting)
- Minimum Android API: Configured in `android/app/build.gradle`
- Package: com.anonymous.Botonera (Android)

---

*Stack analysis: 2026-03-03*
