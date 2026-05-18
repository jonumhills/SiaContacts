# SiaContacts

A privacy-first, local-first mobile address book app built with Expo (React Native) that stores all contact data in the user's own Sia bucket via the `react-native-sia` SDK.

Replaces Google Contacts and iCloud Contacts as the sync backend — your contacts stay on Sia, not on a corporate server.

## Features

- Create, edit, and delete contacts
- Contact list with search
- Group management
- vCard (.vcf) import and export — migrate from Google Contacts in under two minutes
- Multi-device sync via Sia Storage
- Offline-first — all reads served locally from SQLite
- Dark mode
- No system contacts database access — zero `READ_CONTACTS` exposure
- No analytics, no telemetry

## Tech Stack

- [Expo SDK 54](https://expo.dev) (React Native)
- [Expo Router](https://expo.github.io/router) for navigation
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) for offline-first local storage
- [react-native-sia](https://github.com/SiaFoundation/react-native-sia) — official Sia Foundation React Native SDK
- [React Native Paper](https://reactnativepaper.com) for UI components
- [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) for App Key storage

## Architecture

All contact reads are served from a local SQLite database — zero network latency. Sia is used as a background sync layer only, uploading dirty records after each save via packed JSON uploads and a manifest-based protocol.

```
Expo UI  →  expo-sqlite (local)  →  react-native-sia  →  sia.storage  →  Sia Network
```

## Getting Started

### Prerequisites

- Node.js 18+
- [EAS CLI](https://docs.expo.dev/eas/): `npm install -g eas-cli`
- A [sia.storage](https://sia.storage) account (free, no SiaCoins required)

### Install

```bash
npm install
```

### Run (Expo Go / web)

```bash
npm start
```

### Build for Android / iOS

```bash
eas build --profile development --platform android
```

`react-native-sia` requires a native build — it cannot run in Expo Go.

## Connecting to Sia

On first launch, tap **Connect to Sia Storage** and follow the in-app guide to link your `sia.storage` account. A Demo Mode is available to explore the app without connecting.

## vCard Migration

Export your contacts from Google Contacts as a `.vcf` file, then use the **Import** button in the app. All standard vCard 3.0 and 4.0 fields are supported.

## License

MIT
