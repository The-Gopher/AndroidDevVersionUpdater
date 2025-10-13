# Quick Start Guide

Get AndroidDevVersionUpdater running in 5 minutes!

## Prerequisites

- Android Studio Hedgehog or later
- JDK 17
- Android device or emulator (Android 8.0+)

## Steps

### 1. Build the App (2 minutes)

```bash
# Clone the repository
git clone https://github.com/The-Gopher/AndroidDevVersionUpdater.git
cd AndroidDevVersionUpdater

# Open in Android Studio
# File → Open → Select the folder

# Wait for Gradle sync

# Build the app
# Build → Make Project (Ctrl+F9 / Cmd+F9)
```

### 2. Set Up Test Server (1 minute)

```bash
# In the project directory
python example_server.py

# Server starts on http://0.0.0.0:8000/streams
# Note your computer's IP address (e.g., 192.168.1.100)
```

### 3. Generate QR Code (30 seconds)

**Option A - Online:**
1. Go to https://www.qr-code-generator.com/
2. Enter: `http://YOUR_IP:8000/streams` (e.g., `http://192.168.1.100:8000/streams`)
3. Download the QR code

**Option B - Command Line:**
```bash
qrencode -o api-qr.png "http://YOUR_IP:8000/streams"
```

### 4. Install and Configure App (1 minute)

1. Connect your Android device
2. In Android Studio, click Run (▶️)
3. App opens on your device
4. Tap "Scan QR Code"
5. Grant camera permission
6. Scan the QR code you generated
7. Done! The app displays test streams

### 5. Try It Out (30 seconds)

- See the list of example streams
- Tap "Update" or "Install" (note: the example URLs won't work for actual installation)
- Tap refresh to reload
- Pull down to refresh

## What's Next?

### For Development

**Customize the App:**
- Change colors in `ui/theme/Color.kt`
- Update app name in `res/values/strings.xml`
- Modify icons in `res/drawable/` and `res/mipmap-*/`

**Build for Production:**
```bash
./gradlew assembleRelease
# APK location: app/build/outputs/apk/release/app-release-unsigned.apk
```

**Sign the APK:**
```bash
# Generate keystore
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-alias

# Add to app/build.gradle.kts:
signingConfigs {
    release {
        storeFile = file("my-release-key.jks")
        storePassword = "your-password"
        keyAlias = "my-alias"
        keyPassword = "your-password"
    }
}
```

### For Production Use

**Set Up Your Real API:**

1. Create an endpoint that returns:
```json
{
  "streams": [
    {
      "streamName": "Your App",
      "bundleId": "com.yourcompany.app",
      "builds": [
        {
          "version": "1.0.0",
          "versionCode": 100,
          "downloadUrl": "https://your-server.com/app-1.0.0.apk"
        }
      ]
    }
  ]
}
```

2. Host the endpoint (examples):
   - **AWS Lambda** + API Gateway
   - **Google Cloud Functions**
   - **Heroku** with Node.js/Python
   - **Your CI/CD** (GitHub Actions, GitLab CI)

3. Generate production QR code with your API URL

4. Distribute the app to your team

## Troubleshooting

### "Could not resolve dependencies"

**Fix:** Ensure you have internet access for Gradle to download dependencies.

### "Unable to scan QR code"

**Fix:** Ensure:
- Camera permission is granted
- QR code is clear and well-lit
- You're on the same network as the test server

### "Error loading streams"

**Fix:** Verify:
- Test server is running
- Your device can reach the server IP
- URL in QR code is correct
- Device is on same WiFi network

### "Cannot install APK"

**Fix:** The example server provides fake download URLs. For real installation:
1. Host actual APK files
2. Update `downloadUrl` in your API response
3. Ensure URLs are accessible from your device

## Common Workflows

### Daily Testing
```bash
# Start server
python example_server.py &

# Run app
./gradlew installDebug

# Or in Android Studio: Run (▶️)
```

### Update Test Data
Edit `example_api_response.json` and restart the server.

### Check Logs
```bash
# View app logs
adb logcat | grep AndroidDevVersionUpdater

# Or in Android Studio: Logcat tab
```

## Resources

- **Full Documentation**: [README.md](README.md)
- **Architecture Details**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Setup Guide**: [SETUP.md](SETUP.md)
- **User Guide**: [USER_GUIDE.md](USER_GUIDE.md)
- **Flow Diagrams**: [FLOW_DIAGRAMS.md](FLOW_DIAGRAMS.md)

## Support

- **Issues**: [GitHub Issues](https://github.com/The-Gopher/AndroidDevVersionUpdater/issues)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)

---

**That's it! You're ready to use AndroidDevVersionUpdater! 🚀**
