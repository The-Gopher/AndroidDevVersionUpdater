# User Guide

Welcome to AndroidDevVersionUpdater! This guide will help you understand and use the app effectively.

## What Does This App Do?

AndroidDevVersionUpdater helps you manage multiple development versions of Android apps. Instead of manually checking for updates and downloading APKs, this app:

- Automatically checks for new versions
- Notifies you when updates are available
- Lets you install updates with one tap
- Works with any number of apps

## First Time Setup

### Step 1: Install the App

Install AndroidDevVersionUpdater on your Android device (requires Android 8.0 or higher).

### Step 2: Scan the QR Code

When you first open the app, you'll see this screen:

```
┌─────────────────────────────────────┐
│  Dev Version Updater                │
├─────────────────────────────────────┤
│                                     │
│         [QR Code Icon]              │
│                                     │
│      No URL configured              │
│   Scan a QR code to get started     │
│                                     │
│      [Scan QR Code Button]          │
│                                     │
└─────────────────────────────────────┘
```

**What to do:**
1. Get a QR code from your development team (or generate one yourself)
2. Tap "Scan QR Code"
3. Grant camera permission when prompted
4. Point your camera at the QR code

**What the QR code contains:**
The QR code contains a URL to your organization's API that provides information about available development builds.

### Step 3: View Your Apps

After scanning, you'll see a list of all available development apps:

```
┌─────────────────────────────────────┐
│  Dev Version Updater      [QR] [↻]  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ MyApp Development           │   │
│  │ com.example.myapp.dev       │   │
│  │                             │   │
│  │ Installed: 2.0.5-dev  [Update  │
│  │ Latest: 2.1.0-dev      Available]│
│  │                             │   │
│  │       [Update Button]        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ AnotherApp Beta             │   │
│  │ com.example.anotherapp      │   │
│  │                             │   │
│  │ Latest: 1.5.0-beta2  [Not     │
│  │                      Installed]│
│  │                             │   │
│  │       [Install Button]       │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

## Using the App

### Main Screen Elements

**Top Bar:**
- **QR Code icon** - Rescan QR code to change API URL
- **Refresh icon** - Manually check for updates

**Stream Cards:**
Each card shows:
- **App name** - The development stream name
- **Bundle ID** - The Android package name
- **Version info** - Installed and latest versions
- **Status badge** - Update status (see below)
- **Action button** - Install or Update

### Status Badges

**🟢 Up to Date**
- You have the latest version installed
- No action needed

**🔵 Update Available**
- A newer version is available
- Tap "Update" to install it

**🟡 Not Installed**
- This app is not installed on your device
- Tap "Install" to install it

### Installing or Updating an App

1. Find the app in the list
2. Tap the "Install" or "Update" button
3. Wait for the download (progress shown on button)
4. Android will show an installation prompt
5. Tap "Install" in the system prompt
6. The app will be installed/updated

**Note:** You may need to enable "Install from unknown sources" for this app in your device settings.

## Notifications

### What You'll Get Notified About

The app checks for updates every 15 minutes in the background. When a new version is available, you'll receive a notification:

```
┌─────────────────────────────────────┐
│ 🔔 Dev Version Updater              │
│                                     │
│ New version available for MyApp     │
│ Tap to update                       │
└─────────────────────────────────────┘
```

**Tapping the notification** opens the app, where you can install the update.

### Managing Notifications

To disable notifications:
1. Long-press on a notification
2. Tap the settings icon
3. Turn off notifications for "Version Updates" channel

**Note:** Disabling notifications won't stop background checks, you just won't be notified.

## Common Actions

### Refresh the List

To manually check for updates:
1. Tap the refresh icon (↻) in the top-right corner
2. The list will reload with latest information

### Change API URL

To scan a new QR code:
1. Tap the QR code icon in the top-right corner
2. Scan the new QR code
3. The app will reload with new streams

### Install Multiple Apps

You can install multiple apps one after another:
1. Tap "Install" on the first app
2. Complete the installation
3. Return to the app
4. Tap "Install" on the next app
5. Repeat as needed

## Troubleshooting

### Problem: Can't Scan QR Code

**Camera permission denied:**
1. Go to Settings → Apps → Dev Version Updater
2. Tap Permissions → Camera
3. Select "Allow"

**QR code won't scan:**
- Ensure good lighting
- Hold the phone steady
- Try moving closer or farther from the QR code
- Make sure the QR code is not damaged or distorted

### Problem: "Error loading streams"

This means the app can't connect to the API.

**Possible causes:**
- No internet connection
- API server is down
- API URL is incorrect

**What to do:**
1. Check your internet connection
2. Try refreshing (tap ↻)
3. Contact your development team if the problem persists
4. Rescan the QR code if you think it might be incorrect

### Problem: Downloads Fail

**No internet connection:**
- Check your WiFi or mobile data

**Download URL is wrong:**
- Contact your development team

**Insufficient storage:**
- Free up space on your device

### Problem: Can't Install APK

**"Install blocked" message:**

Your device doesn't allow installation from this app yet.

**To fix:**
1. When you see the error, tap "Settings"
2. Enable "Allow from this source"
3. Return to the app and try again

**Alternative method:**
1. Go to Settings → Apps → Special app access
2. Find "Install unknown apps"
3. Select "Dev Version Updater"
4. Enable "Allow from this source"

### Problem: App Won't Open After Install

The installed app might be a development build that requires additional setup (like VPN or special account).

**What to do:**
- Contact your development team for instructions
- Check if you need to be on a specific network
- Verify you're using the correct account

## Advanced Features

### Understanding Version Codes

Version codes are numbers that increase with each release:
- Version name: `2.1.0-dev` (human-readable)
- Version code: `210` (for comparison)

The app uses version codes to determine if an update is newer than what you have installed.

### Background Checks

The app checks for updates every 15 minutes (this is the minimum Android allows).

**Battery impact:**
- Minimal - checks only run when device is connected and online
- Uses WorkManager which respects battery optimization

**To see when the last check occurred:**
- Pull down to refresh - if nothing changes, the last check was recent

### Multiple Development Streams

You might see multiple cards for the same app:
- `MyApp Development` - bleeding edge, updated frequently
- `MyApp Staging` - more stable, updated weekly
- `MyApp Beta` - pre-release, updated monthly

These are different versions with different bundle IDs - you can have them installed simultaneously.

## Tips & Best Practices

### Daily Usage

1. **Open the app once per day** to check for updates (or rely on notifications)
2. **Update regularly** to get the latest features and bug fixes
3. **Keep notifications enabled** to stay informed

### Before Important Testing

1. **Tap refresh** to ensure you have the latest list
2. **Update all apps** that show "Update Available"
3. **Verify versions** after installing

### Working Offline

The app requires internet to:
- Fetch the list of streams
- Download APK files

But you can:
- View previously loaded streams
- See installed versions

### Sharing with Team

To help teammates set up:
1. Take a screenshot of the QR code
2. Share it via chat/email
3. They can scan from another screen

**Note:** Don't share QR codes containing sensitive URLs publicly!

## Privacy & Security

### What Data Is Stored

**On your device:**
- API URL (locally, in encrypted storage)
- No personal information
- No usage analytics

**Network requests:**
- App fetches stream lists from your organization's API
- Downloads APK files from URLs in the API response
- No data is sent to third parties

### Permissions Explained

**Camera:**
- Required for scanning QR codes
- Only used when you tap "Scan QR Code"
- Never used in background

**Internet:**
- Required for fetching stream lists
- Required for downloading APK files

**Install Packages:**
- Required to install downloaded APKs
- Only used when you tap "Install" or "Update"

**Notifications:**
- Optional - for update alerts
- Can be disabled in settings

## Getting Help

### Contact Your Development Team

For issues with:
- API URL or QR code
- Specific app installations
- Network or VPN requirements
- Account permissions

### Report App Issues

For issues with the updater app itself:
- Check [GitHub Issues](https://github.com/The-Gopher/AndroidDevVersionUpdater/issues)
- Report bugs with:
  - Android version
  - Device model
  - Steps to reproduce
  - Screenshots if possible

## Glossary

**APK** - Android Package, the file format for Android apps

**Bundle ID** - Unique identifier for an Android app (e.g., com.example.app)

**Development Stream** - A channel of builds for a specific version or environment

**Version Code** - Numeric version for comparison (e.g., 123)

**Version Name** - Human-readable version (e.g., 1.2.3)

**Build** - A compiled version of an app at a specific point in time

**QR Code** - Scannable barcode containing the API URL

---

**Enjoy automatic version management!** 🚀
