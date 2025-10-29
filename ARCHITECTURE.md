# Architecture Documentation

## Overview

AndroidDevVersionUpdater follows a clean architecture pattern with clear separation of concerns across multiple layers.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │   MainScreen     │  │  QRCodeScanner   │  Jetpack        │
│  │   (Composable)   │  │   (Composable)   │  Compose        │
│  └────────┬─────────┘  └────────┬─────────┘                │
│           │                      │                           │
│  ┌────────▼──────────────────────▼─────────┐                │
│  │        MainViewModel                    │  ViewModel      │
│  └────────┬────────────────────────────────┘                │
└───────────┼─────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────┐
│                      Domain Layer                            │
│  ┌──────────────────────────────────────────────┐           │
│  │     GetStreamsWithStatusUseCase              │  Use Case  │
│  │  - Fetches streams                           │            │
│  │  - Compares versions                         │            │
│  │  - Determines update status                  │            │
│  └────────┬─────────────────────────────────────┘           │
└───────────┼─────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────┐
│                       Data Layer                             │
│  ┌──────────────────────────────────────────────┐           │
│  │         StreamRepository                     │ Repository │
│  │  - API URL management (DataStore)            │            │
│  │  - Fetch streams from API                    │            │
│  │  - Check installed app versions              │            │
│  └────────┬─────────────────────────┬───────────┘           │
│           │                          │                        │
│  ┌────────▼──────────┐    ┌─────────▼─────────┐            │
│  │    ApiService     │    │   PackageManager  │            │
│  │   (Retrofit)      │    │   (Android SDK)   │            │
│  └───────────────────┘    └───────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### UI Layer

#### MainActivity
- Entry point of the application
- Schedules periodic version checks via WorkManager
- Hosts the Compose UI

#### MainScreen (Composable)
- Displays list of development streams
- Shows update status for each stream
- Provides refresh and QR scan actions
- Handles user interactions

#### QRCodeScanner (Composable)
- Manages camera permissions
- Uses CameraX and ML Kit for QR code scanning
- Returns scanned URL to caller

#### MainViewModel
- Manages UI state (Loading, Success, Error, NoUrlConfigured)
- Coordinates download and installation
- Handles QR scanner visibility
- Observes API URL changes

### Domain Layer

#### GetStreamsWithStatusUseCase
- **Input**: None (uses repository internally)
- **Output**: `Result<List<StreamWithStatus>>`
- **Logic**:
  1. Fetches streams from repository
  2. For each stream, gets installed version from PackageManager
  3. Compares installed version with latest build
  4. Creates `StreamWithStatus` with comparison results

#### StreamWithStatus
Data class containing:
- Original stream data
- Installed version (if any)
- Latest available build
- Boolean flags for update availability and installation status

### Data Layer

#### StreamRepository
**Responsibilities:**
- Store and retrieve API URL (DataStore Preferences)
- Fetch streams from configured API endpoint
- Query installed app versions via PackageManager
- Compare version codes

**Key Methods:**
- `saveApiUrl(url: String)`: Stores API URL
- `getApiUrl(): Flow<String?>`: Observes API URL changes
- `fetchStreams(): Result<List<DevStream>>`: Fetches from API
- `getInstalledVersion(packageName): String?`: Gets version name
- `getInstalledVersionCode(packageName): Long?`: Gets version code
- `isPackageInstalled(packageName): Boolean`: Checks installation

#### ApiService (Retrofit)
- Defines REST API endpoints
- Single endpoint: `GET .` (uses base URL)
- Returns `StreamsResponse`

### Utility Components

#### ApkDownloader
- Downloads APK files from URLs
- Saves to app cache directory
- Triggers installation via FileProvider

#### NotificationHelper
- Creates notification channel
- Shows notifications for new versions
- Opens app when notification is tapped

### Background Processing

#### VersionCheckWorker (WorkManager)
- Runs every 15 minutes (minimum interval)
- Requires network connectivity
- Checks all streams for updates
- Sends notifications for new versions

## Data Flow

### 1. Initial Load Flow
```
User opens app
    → MainActivity creates Compose UI
    → MainViewModel checks for API URL
    → If no URL: Show "Scan QR Code" screen
    → If URL exists: Trigger refresh
```

### 2. QR Code Scan Flow
```
User taps QR Scanner button
    → MainViewModel sets showQrScanner = true
    → QRCodeScanner shows camera
    → User scans QR code
    → URL extracted from QR code
    → StreamRepository.saveApiUrl(url)
    → MainViewModel detects URL change
    → Automatically triggers refresh
```

### 3. Fetch Streams Flow
```
User triggers refresh (or automatic on URL change)
    → MainViewModel.refreshStreams()
    → GetStreamsWithStatusUseCase.invoke()
    → StreamRepository.fetchStreams()
    → ApiService.getStreams() (Retrofit)
    → For each stream:
        → StreamRepository.getInstalledVersionCode()
        → Compare with latest build's versionCode
    → Return StreamWithStatus list
    → MainViewModel updates UI state
    → MainScreen displays streams
```

### 4. Install/Update Flow
```
User taps Install/Update button
    → MainViewModel.downloadAndInstall()
    → ApkDownloader.downloadAndInstall()
    → Download APK to cache
    → Create installation intent with FileProvider URI
    → Android system shows installation prompt
    → User confirms installation
    → App installed/updated
```

### 5. Background Check Flow
```
WorkManager triggers (every 15 minutes)
    → VersionCheckWorker.doWork()
    → StreamRepository.fetchStreams()
    → For each stream:
        → Compare installed vs latest version
        → If update available:
            → NotificationHelper.showUpdateNotification()
    → User sees notification
    → Taps notification → Opens app
```

## Dependency Injection (Hilt)

### Modules

#### NetworkModule
Provides:
- `OkHttpClient`: Configured with logging interceptor

### Injection Points

1. **StreamRepository** receives:
   - `@ApplicationContext Context`
   - `OkHttpClient`

2. **GetStreamsWithStatusUseCase** receives:
   - `StreamRepository`

3. **MainViewModel** receives:
   - `StreamRepository`
   - `GetStreamsWithStatusUseCase`
   - `ApkDownloader`

4. **ApkDownloader** receives:
   - `@ApplicationContext Context`
   - `OkHttpClient`

5. **NotificationHelper** receives:
   - `@ApplicationContext Context`

6. **VersionCheckWorker** receives:
   - `StreamRepository`
   - `NotificationHelper`

## State Management

### MainViewModel State

```kotlin
sealed interface MainUiState {
    object Loading
    data class Success(val streams: List<StreamWithStatus>)
    data class Error(val message: String)
    object NoUrlConfigured
}

sealed interface DownloadState {
    object Idle
    data class Downloading(val streamName: String)
    data class Error(val message: String)
}
```

State is exposed as `StateFlow` and collected by Composables.

## Threading Model

- **Main Thread**: UI operations (Compose recomposition)
- **IO Dispatcher**: Network calls (Retrofit), file operations
- **WorkManager**: Background version checks

All suspend functions use appropriate dispatchers:
- Repository operations: `Dispatchers.IO`
- ViewModel coroutines: `viewModelScope` (Main dispatcher)
- Worker operations: WorkManager's coroutine context

## Error Handling

Errors are wrapped in `Result<T>` type:
```kotlin
suspend fun fetchStreams(): Result<List<DevStream>>
```

ViewModels convert failures to UI states:
```kotlin
MainUiState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
```

## Testing Strategy

### Unit Tests
- ViewModels: Test state transitions
- Use Cases: Test business logic
- Repositories: Test with mock API service

### Integration Tests
- Repository with real Retrofit and mock server
- WorkManager worker execution

### UI Tests
- Compose UI tests for screens
- Navigation flows
- User interactions

## Security Considerations

1. **APK Download**: Uses HTTPS (enforced by Android 9+)
2. **File Provider**: Scoped file access for APK installation
3. **Permissions**: Runtime permission for camera
4. **Data Storage**: DataStore for secure preferences
5. **Network Security**: OkHttp with certificate pinning (optional)

## Performance Optimizations

1. **Lazy Loading**: Compose recomposes only changed items
2. **Caching**: Downloaded APKs cached in app cache directory
3. **Background Limits**: WorkManager respects system battery optimizations
4. **Efficient Queries**: PackageManager queries only when needed
5. **Flow-based**: Reactive updates with StateFlow avoid unnecessary updates
