# File Summary

This document provides a complete overview of all files in the project and their purposes.

## Project Root Files

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation with overview, features, API format, and build instructions |
| `ARCHITECTURE.md` | Detailed architecture documentation with diagrams and data flow explanations |
| `SETUP.md` | Quick setup guide for getting started, including troubleshooting |
| `CONTRIBUTING.md` | Guidelines for contributors |
| `LICENSE` | MIT License |
| `example_api_response.json` | Sample API response for testing |
| `example_server.py` | Python HTTP server for testing the app |
| `.gitignore` | Git ignore rules for Android projects |

## Gradle Build Files

| File | Purpose |
|------|---------|
| `settings.gradle.kts` | Project settings and module declarations |
| `build.gradle.kts` | Root build configuration with plugin versions |
| `gradle.properties` | Gradle configuration properties |
| `app/build.gradle.kts` | App module build configuration with all dependencies |
| `app/proguard-rules.pro` | ProGuard rules for release builds |
| `gradle/wrapper/gradle-wrapper.properties` | Gradle wrapper configuration |
| `gradle/wrapper/gradle-wrapper.jar` | Gradle wrapper executable |
| `gradlew` | Gradle wrapper script for Unix/Linux/Mac |

## Android Manifest & Resources

| File | Purpose |
|------|---------|
| `app/src/main/AndroidManifest.xml` | App manifest with permissions, activities, and providers |
| `app/src/main/res/values/strings.xml` | String resources for localization |
| `app/src/main/res/values/themes.xml` | App theme definition |
| `app/src/main/res/values/ic_launcher_background.xml` | Launcher icon background color |
| `app/src/main/res/drawable/ic_launcher_foreground.xml` | Launcher icon foreground drawable |
| `app/src/main/res/mipmap-*/ic_launcher.xml` | Launcher icons for various densities |
| `app/src/main/res/mipmap-*/ic_launcher_round.xml` | Round launcher icons for various densities |
| `app/src/main/res/xml/file_paths.xml` | FileProvider paths for APK installation |
| `app/src/main/res/xml/backup_rules.xml` | App backup rules |
| `app/src/main/res/xml/data_extraction_rules.xml` | Data extraction rules for Android 12+ |

## Source Code Structure

### Application & Activity
| File | Purpose |
|------|---------|
| `DevVersionUpdaterApp.kt` | Application class with Hilt setup and WorkManager configuration |
| `MainActivity.kt` | Main activity that hosts Compose UI and schedules background checks |

### Data Layer

#### Models
| File | Purpose |
|------|---------|
| `data/model/Models.kt` | Data classes for DevStream, Build, and StreamsResponse |

#### Network
| File | Purpose |
|------|---------|
| `data/remote/ApiService.kt` | Retrofit interface defining API endpoints |

#### Repository
| File | Purpose |
|------|---------|
| `data/repository/StreamRepository.kt` | Repository for fetching streams, managing API URL, and checking installed versions |

### Domain Layer
| File | Purpose |
|------|---------|
| `domain/GetStreamsWithStatusUseCase.kt` | Use case that fetches streams and enriches them with version status |

### Dependency Injection
| File | Purpose |
|------|---------|
| `di/NetworkModule.kt` | Hilt module providing OkHttpClient |

### UI Layer

#### Screens
| File | Purpose |
|------|---------|
| `ui/screens/MainScreen.kt` | Main screen Composable displaying list of streams |
| `ui/screens/MainViewModel.kt` | ViewModel managing UI state and user interactions |

#### Components
| File | Purpose |
|------|---------|
| `ui/components/QRCodeScanner.kt` | QR code scanner Composable using CameraX and ML Kit |

#### Theme
| File | Purpose |
|------|---------|
| `ui/theme/Color.kt` | Color definitions for the app theme |
| `ui/theme/Type.kt` | Typography definitions |
| `ui/theme/Theme.kt` | Main theme Composable with Material 3 setup |

### Utilities
| File | Purpose |
|------|---------|
| `util/ApkDownloader.kt` | Utility for downloading and installing APK files |
| `util/NotificationHelper.kt` | Utility for creating and showing notifications |

### Background Processing
| File | Purpose |
|------|---------|
| `worker/VersionCheckWorker.kt` | WorkManager worker for periodic version checks |

## File Count Summary

- **Kotlin source files**: 19
- **XML resource files**: 25
- **Documentation files**: 5 (README, ARCHITECTURE, SETUP, CONTRIBUTING, FILE_SUMMARY)
- **Configuration files**: 8 (Gradle, properties, gitignore)
- **Example files**: 2 (JSON, Python)
- **Total files**: 59

## Lines of Code

Approximate lines of code by category:

- **Kotlin code**: ~1,500 lines
- **XML resources**: ~300 lines
- **Documentation**: ~1,200 lines
- **Configuration**: ~200 lines
- **Total**: ~3,200 lines

## Dependencies

### Core Android & Jetpack
- androidx.core:core-ktx
- androidx.lifecycle:lifecycle-runtime-ktx
- androidx.activity:activity-compose
- androidx.navigation:navigation-compose

### Jetpack Compose
- androidx.compose.ui:ui
- androidx.compose.material3:material3
- androidx.compose.material:material-icons-extended
- Compose BOM

### Dependency Injection
- com.google.dagger:hilt-android
- androidx.hilt:hilt-navigation-compose
- androidx.hilt:hilt-work

### Networking
- com.squareup.retrofit2:retrofit
- com.squareup.retrofit2:converter-gson
- com.squareup.okhttp3:okhttp
- com.squareup.okhttp3:logging-interceptor

### QR Code & Camera
- com.google.mlkit:barcode-scanning
- androidx.camera:camera-camera2
- androidx.camera:camera-lifecycle
- androidx.camera:camera-view
- com.google.accompanist:accompanist-permissions

### Background Processing
- androidx.work:work-runtime-ktx

### Data Storage
- androidx.datastore:datastore-preferences

### Testing
- junit:junit
- androidx.test.ext:junit
- androidx.test.espresso:espresso-core
- androidx.compose.ui:ui-test-junit4

## Key Features by File

### QR Code Scanning
- `ui/components/QRCodeScanner.kt` - UI component
- `ui/screens/MainViewModel.kt` - State management

### Version Comparison
- `domain/GetStreamsWithStatusUseCase.kt` - Business logic
- `data/repository/StreamRepository.kt` - Data access

### APK Download & Install
- `util/ApkDownloader.kt` - Download and installation
- `app/src/main/res/xml/file_paths.xml` - FileProvider configuration

### Push Notifications
- `util/NotificationHelper.kt` - Notification creation
- `worker/VersionCheckWorker.kt` - Background checks

### Background Processing
- `worker/VersionCheckWorker.kt` - Worker implementation
- `MainActivity.kt` - Worker scheduling
- `DevVersionUpdaterApp.kt` - WorkManager configuration

### Data Persistence
- `data/repository/StreamRepository.kt` - DataStore usage

### UI
- `ui/screens/MainScreen.kt` - Main UI
- `ui/theme/*.kt` - Theming
