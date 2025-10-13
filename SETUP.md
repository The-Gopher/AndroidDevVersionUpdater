# Quick Setup Guide

This guide will help you get AndroidDevVersionUpdater up and running in minutes.

## Step 1: Set Up Your API Server

You have two options:

### Option A: Use the Example Server (Quick Test)

1. Install Python 3 (if not already installed)
2. Navigate to the project directory
3. Run the example server:
   ```bash
   python example_server.py
   ```
4. The server will start on `http://0.0.0.0:8000/streams`
5. Find your computer's IP address:
   - **Linux/Mac**: `ifconfig | grep "inet "`
   - **Windows**: `ipconfig`

### Option B: Create Your Own API Endpoint

Create a JSON endpoint that returns:

```json
{
  "streams": [
    {
      "streamName": "Your App Name",
      "bundleId": "com.yourcompany.yourapp",
      "builds": [
        {
          "version": "1.0.0",
          "versionCode": 100,
          "downloadUrl": "https://your-server.com/app-1.0.0.apk",
          "releaseDate": "2025-10-13T10:00:00Z"
        }
      ]
    }
  ]
}
```

**Important:** The API endpoint must be accessible from your Android device (not `localhost`).

## Step 2: Generate a QR Code

Generate a QR code containing your API URL.

### Online Tool (Easiest)
1. Go to https://www.qr-code-generator.com/
2. Enter your API URL (e.g., `http://192.168.1.100:8000/streams`)
3. Download the QR code image

### Command Line (Linux/Mac)
```bash
# Install qrencode
sudo apt-get install qrencode  # Ubuntu/Debian
brew install qrencode          # macOS

# Generate QR code
qrencode -o api-qr.png "http://YOUR_IP:8000/streams"
```

### Python Script
```python
import qrcode

url = "http://192.168.1.100:8000/streams"
qr = qrcode.QRCode(version=1, box_size=10, border=5)
qr.add_data(url)
qr.make(fit=True)
img = qr.make_image(fill_color="black", back_color="white")
img.save("api-qr.png")
```

## Step 3: Build the Android App

### Using Android Studio (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/The-Gopher/AndroidDevVersionUpdater.git
   ```

2. Open Android Studio

3. Select "Open an Existing Project"

4. Navigate to the cloned directory and select it

5. Wait for Gradle sync to complete

6. Connect your Android device or start an emulator

7. Click the "Run" button (▶️) or press Shift+F10

### Using Command Line

```bash
# Build debug APK
./gradlew assembleDebug

# Install on connected device
./gradlew installDebug

# Or do both
./gradlew build installDebug
```

The APK will be located at: `app/build/outputs/apk/debug/app-debug.apk`

## Step 4: Configure the App

1. Launch the app on your device
2. You'll see a "Scan QR Code" prompt
3. Tap "Scan QR Code" button
4. Grant camera permission when prompted
5. Point your camera at the QR code you generated
6. The app will automatically configure and load streams

## Step 5: Test the App

The app will now:
- Display all development streams from your API
- Show which apps are installed and their versions
- Indicate which apps need updates
- Allow you to install/update apps with one tap

## Troubleshooting

### Issue: "No URL configured" appears after scanning

**Solution:** Ensure the QR code contains a valid URL that starts with `http://` or `https://`

### Issue: "Error loading streams"

**Possible causes:**
1. Your API server is not running
2. The URL is not accessible from your device
3. Your device is on a different network

**Solutions:**
- Verify the server is running: `curl YOUR_API_URL`
- Ensure your device is on the same network as your server
- Try accessing the URL in your device's browser first

### Issue: Camera permission denied

**Solution:** Go to Settings → Apps → Dev Version Updater → Permissions → Enable Camera

### Issue: Cannot install APK

**Possible causes:**
1. "Install from unknown sources" is disabled
2. Download URL is not accessible
3. APK file is corrupted

**Solutions:**
- Go to Settings → Security → Enable "Install unknown apps" for this app
- Verify the download URL is accessible
- Check the APK file is valid

### Issue: App crashes on launch

**Solutions:**
- Clear app data: Settings → Apps → Dev Version Updater → Storage → Clear Data
- Reinstall the app
- Check Android version (requires Android 8.0 or higher)

## Network Configuration Tips

### For Local Testing

If your server is on your computer:

1. **Ensure they're on the same WiFi network**
   - Computer and Android device must be on the same network
   - Some guest networks isolate devices - use a regular network

2. **Check firewall settings**
   ```bash
   # Linux: Allow port 8000
   sudo ufw allow 8000
   
   # macOS: System Preferences → Security & Privacy → Firewall → Firewall Options
   # Add Python/your server app
   ```

3. **Test connectivity**
   ```bash
   # From your Android device's browser, visit:
   http://YOUR_COMPUTER_IP:8000/streams
   ```

### For Production

1. **Use HTTPS**: Required for Android 9+
2. **Valid SSL certificate**: From Let's Encrypt or other CA
3. **Proper CORS headers**: If using web-based API
4. **Firewall rules**: Allow traffic on your chosen port

## Advanced Configuration

### Changing Check Interval

Edit `MainActivity.kt`:

```kotlin
val versionCheckRequest = PeriodicWorkRequestBuilder<VersionCheckWorker>(
    15, TimeUnit.MINUTES  // Change this value
)
```

Minimum interval: 15 minutes (Android limitation)

### Custom Notification Icon

Replace `app/src/main/res/drawable/ic_launcher_foreground.xml` with your own icon.

### API Authentication

Add headers in `NetworkModule.kt`:

```kotlin
val client = OkHttpClient.Builder()
    .addInterceptor { chain ->
        val request = chain.request().newBuilder()
            .addHeader("Authorization", "Bearer YOUR_TOKEN")
            .build()
        chain.proceed(request)
    }
    .build()
```

## Next Steps

1. **Customize the app**: Change colors, icons, app name
2. **Add more features**: Filter streams, search, sort options
3. **Set up CI/CD**: Automate builds with GitHub Actions
4. **Deploy your API**: Host on cloud services like AWS, Google Cloud, or Heroku

## Support

- **Documentation**: [README.md](README.md)
- **Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
- **Issues**: [GitHub Issues](https://github.com/The-Gopher/AndroidDevVersionUpdater/issues)
