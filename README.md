# AndroidDevVersionUpdater

An Android application that helps you quickly update your installed development versions.

## Features

- **QR Code Configuration**: Scan a QR code to configure the API URL endpoint
- **Stream Management**: View all development streams with their bundle IDs
- **Version Tracking**: Compare installed versions with the latest available builds
- **Smart Updates**: Identify which apps need updates, are up-to-date, or not installed
- **One-Tap Install/Update**: Download and install APKs directly from the app
- **Push Notifications**: Receive notifications when new versions are available
- **Background Checks**: Automatic periodic checks for new versions every 15 minutes

## Screenshots

*(Screenshots to be added after building the app)*

## How It Works

1. **Configure URL**: Scan a QR code containing your API endpoint URL
2. **View Streams**: The app fetches all available development streams
3. **Check Status**: Each stream shows:
   - Current installed version (if any)
   - Latest available version
   - Update status badge
4. **Install/Update**: Tap the button to download and install the latest version
5. **Background Monitoring**: The app periodically checks for updates and notifies you

## API Format

The app expects a JSON response from the configured URL in the following format:

```json
{
  "streams": [
    {
      "streamName": "My App Dev",
      "bundleId": "com.example.myapp",
      "builds": [
        {
          "version": "1.2.3",
          "versionCode": 123,
          "downloadUrl": "https://example.com/builds/myapp-1.2.3.apk",
          "releaseDate": "2025-10-13T10:00:00Z"
        }
      ]
    }
  ]
}
```

### Fields Description

- `streamName`: Display name of the development stream
- `bundleId`: Android package name (e.g., com.example.app)
- `builds`: Array of available builds
  - `version`: Version name (e.g., "1.2.3")
  - `versionCode`: Integer version code for comparison
  - `downloadUrl`: Direct URL to download the APK file
  - `releaseDate`: (Optional) ISO 8601 timestamp of the build

## Technical Details

### Architecture

- **MVVM Pattern**: ViewModels manage UI state
- **Repository Pattern**: Data access abstraction
- **Use Cases**: Business logic encapsulation
- **Dependency Injection**: Hilt for DI

### Technology Stack

- **Language**: Kotlin
- **UI**: Jetpack Compose with Material 3
- **Networking**: Retrofit + OkHttp
- **QR Scanner**: ML Kit + CameraX
- **Background Tasks**: WorkManager
- **Data Storage**: DataStore (Preferences)
- **Dependency Injection**: Hilt

### Permissions

The app requires the following permissions:

- `INTERNET`: To fetch stream data and download APKs
- `CAMERA`: To scan QR codes
- `REQUEST_INSTALL_PACKAGES`: To install downloaded APKs
- `POST_NOTIFICATIONS`: To show update notifications (Android 13+)

## Building the App

### Prerequisites

- Android Studio Hedgehog or later
- JDK 17
- Android SDK 34
- Gradle 8.2+

### Build Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/The-Gopher/AndroidDevVersionUpdater.git
   cd AndroidDevVersionUpdater
   ```

2. Open the project in Android Studio

3. Sync Gradle files

4. Build and run:
   ```bash
   ./gradlew assembleDebug
   ```

## Usage

### Setting Up Your Server

Create a JSON endpoint that returns the format described above. Example using a simple HTTP server:

```python
# example_server.py
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        response = {
            "streams": [
                {
                    "streamName": "Test App",
                    "bundleId": "com.example.test",
                    "builds": [
                        {
                            "version": "1.0.0",
                            "versionCode": 1,
                            "downloadUrl": "https://example.com/test-1.0.0.apk"
                        }
                    ]
                }
            ]
        }
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())

HTTPServer(('', 8000), Handler).serve_forever()
```

### Generating QR Codes

Use any QR code generator with your API URL:
- Online: https://www.qr-code-generator.com/
- CLI: `qrencode -o qr.png "https://your-api-url.com/streams"`

## Project Structure

```
app/src/main/java/com/thegopher/androiddevversionupdater/
├── data/
│   ├── model/          # Data models
│   ├── remote/         # API service
│   └── repository/     # Data repositories
├── di/                 # Dependency injection modules
├── domain/             # Use cases
├── ui/
│   ├── components/     # Reusable UI components
│   ├── screens/        # Screen composables
│   └── theme/          # App theme
├── util/               # Utility classes
├── worker/             # Background workers
├── DevVersionUpdaterApp.kt
└── MainActivity.kt
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues or questions, please open an issue on GitHub.
