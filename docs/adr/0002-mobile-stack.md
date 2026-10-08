# 0002. Mobile stack: Expo SDK 57 + React Native

- Status: Accepted
- Date: 2026-10-07

## Context

Android app for daily use, published on Google Play later. The author knows React and TypeScript; a past job
posting asked for Play Store experience.

## Options considered

- Capacitor (used in Mi Peso): web view, weaker native feel and weaker signal for mobile roles
- Flutter / Kotlin: new language, no reuse of React skills or shared TypeScript
- **Expo + React Native**: TypeScript end to end, Expo Router, EAS Build for Play Store

## Decision

Expo SDK 57 (React Native 0.86, React 19.2), Expo Router, development builds (not Expo Go).

## Consequences

- Native modules allowed through development builds
- Expo SDK upgrades roughly every few months; upgrade in one PR per SDK
