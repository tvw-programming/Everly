# Reminders

Expo React Native app for local reminders in three categories:

- **Health** — medications, hydration, appointments
- **Daily routine** — wake-up, meals, chores, habits
- **Communication** — calls, messages, check-ins

Step 1 ships a **reminders dashboard** and a multi-step **add** form (top-right **+**). When a reminder fires on a device, it plays a **local MP3** (bundled demo tones or a file you pick). Text-to-speech is reserved for a later slice (`sound.mode: 'tts'`).

## Run locally

```bash
npm install
npm start
```

Then press `i` / `a` for iOS Simulator / Android emulator, or scan the QR code with **Expo Go**.

### Web UI preview

```bash
npm run web
```

Opens on port **19006**. Web is for browsing the dashboard and form only — **native notifications and timed MP3 playback require a device or simulator**.

## How it works

1. Dashboard lists reminders, filterable by category.
2. **+** opens a 4-step form: Basics → When → Sound → Review.
3. On save, the reminder is stored in AsyncStorage and a local notification is scheduled for the next matching time.
4. When the notification is received, `expo-av` plays the selected MP3 (`playsInSilentModeIOS: true`).

## Project layout

```
app/           # Expo Router screens (dashboard + add modal)
components/    # UI pieces
lib/           # types, storage, schedule, notifications, audio
assets/sounds/ # demo MP3s
```

## Permissions

- **Notifications** — required for timed playback on device
- **Document picker** — optional, for custom MP3 files
