# App Flow Diagram

This document provides visual representations of how the app works.

## User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                        FIRST TIME USER                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  Install App    │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │   Open App      │
                     └────────┬────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │  "No URL Configured"    │
                │   [Scan QR Code]        │
                └────────┬────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  Grant Camera   │
                │   Permission    │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │   Scan QR Code  │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │   API URL Saved │
                └────────┬────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │    Fetch Streams from API     │
         └───────────────┬───────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Display List of Dev Streams  │
         │  with Update Status           │
         └───────────────┬───────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐    ┌──────────┐    ┌──────────┐
   │ Install │    │  Update  │    │ Up to    │
   │         │    │          │    │  Date    │
   └────┬────┘    └────┬─────┘    └──────────┘
        │              │
        │              │
        └──────┬───────┘
               │
               ▼
      ┌─────────────────┐
      │  Download APK   │
      └────────┬────────┘
               │
               ▼
      ┌─────────────────┐
      │  Install Prompt │
      └────────┬────────┘
               │
               ▼
      ┌─────────────────┐
      │  App Installed  │
      └─────────────────┘
```

## Background Worker Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    BACKGROUND WORKER                            │
└─────────────────────────────────────────────────────────────────┘

Every 15 minutes (while device is connected & online):

    ┌──────────────────────────┐
    │  WorkManager Triggered   │
    └────────────┬─────────────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │  Fetch Latest Streams    │
    └────────────┬─────────────┘
                 │
                 ▼
    ┌──────────────────────────┐
    │  For Each Stream:        │
    │  - Get installed version │
    │  - Get latest version    │
    │  - Compare version codes │
    └────────────┬─────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   ┌─────────┐      ┌──────────┐
   │  Update │      │    No    │
   │Available│      │  Update  │
   └────┬────┘      └──────────┘
        │
        ▼
   ┌─────────────────────┐
   │ Send Notification   │
   │ "New version        │
   │  available for X"   │
   └─────────┬───────────┘
             │
             ▼
   ┌─────────────────────┐
   │  User Taps          │
   │  Notification       │
   └─────────┬───────────┘
             │
             ▼
   ┌─────────────────────┐
   │  App Opens to       │
   │  Main Screen        │
   └─────────────────────┘
```

## State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                       UI STATE MACHINE                          │
└─────────────────────────────────────────────────────────────────┘

    ┌────────────────┐
    │   App Launch   │
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │ Check API URL  │
    └────────┬───────┘
             │
     ┌───────┴────────┐
     │                │
     ▼                ▼
┌─────────┐    ┌──────────────┐
│URL Exists│    │ No URL       │
└────┬────┘    │ (First Time) │
     │         └──────┬───────┘
     │                │
     │         ┌──────┴────────┐
     │         │               │
     │         ▼               ▼
     │    ┌─────────┐    ┌──────────┐
     │    │  Scan   │    │   Exit   │
     │    │QR Code  │    │   App    │
     │    └────┬────┘    └──────────┘
     │         │
     │         ▼
     │    ┌─────────┐
     │    │Save URL │
     │    └────┬────┘
     │         │
     └─────────┴─────────┐
                         │
                         ▼
              ┌──────────────────┐
              │  LOADING STATE   │
              └─────────┬────────┘
                        │
              ┌─────────┴─────────┐
              │  Fetch Streams    │
              └─────────┬─────────┘
                        │
           ┌────────────┼────────────┐
           │            │            │
           ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ SUCCESS  │ │  ERROR   │ │ NO URL   │
    │  STATE   │ │  STATE   │ │  STATE   │
    └────┬─────┘ └────┬─────┘ └────┬─────┘
         │            │            │
         │            │            │
         ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Display  │ │ Display  │ │ Display  │
    │ Streams  │ │  Error   │ │ Scan QR  │
    │          │ │ +Retry   │ │  Prompt  │
    └────┬─────┘ └────┬─────┘ └──────────┘
         │            │
         │            │
    ┌────┴────────────┴─────┐
    │                       │
    ▼                       ▼
┌─────────┐          ┌──────────┐
│ User    │          │  Auto    │
│ Pulls   │          │ Refresh  │
│ Refresh │          │(URL Save)│
└────┬────┘          └────┬─────┘
     │                    │
     └────────┬───────────┘
              │
              ▼
      ┌───────────────┐
      │Back to LOADING│
      └───────────────┘
```

## Download Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       DOWNLOAD & INSTALL                        │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │ User Taps        │
    │ Install/Update   │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Set Download     │
    │ State            │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Button shows     │
    │ "Downloading..." │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ OkHttp Downloads │
    │ APK File         │
    └────────┬─────────┘
             │
       ┌─────┴─────┐
       │           │
       ▼           ▼
  ┌─────────┐ ┌────────┐
  │ Success │ │  Error │
  └────┬────┘ └───┬────┘
       │          │
       │          ▼
       │     ┌────────────┐
       │     │Show Error  │
       │     │Dialog      │
       │     └────────────┘
       │
       ▼
  ┌─────────────────┐
  │ Save to Cache   │
  │ Directory       │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Create Install  │
  │ Intent with     │
  │ FileProvider URI│
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Android System  │
  │ Shows Install   │
  │ Prompt          │
  └────────┬────────┘
           │
       ┌───┴────┐
       │        │
       ▼        ▼
  ┌─────────┐ ┌─────────┐
  │ Install │ │ Cancel  │
  └────┬────┘ └─────────┘
       │
       ▼
  ┌─────────────────┐
  │ App Installed/  │
  │ Updated         │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ User Returns to │
  │ Updater App     │
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐
  │ Status Updates  │
  │ to "Up to Date" │
  └─────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                               │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   UI Layer   │
│              │
│  MainScreen  │ ◄─── User Interactions
│  (Composable)│
└──────┬───────┘
       │ Collects StateFlow
       │
       ▼
┌──────────────┐
│  ViewModel   │
│              │
│ MainViewModel│ ◄─── Manages UI State
└──────┬───────┘
       │ Calls Use Case
       │
       ▼
┌──────────────┐
│ Domain Layer │
│              │
│GetStreamsUse │ ◄─── Business Logic
│    Case      │      (Version Compare)
└──────┬───────┘
       │ Calls Repository
       │
       ▼
┌──────────────┐
│  Data Layer  │
│              │
│StreamRepo    │ ◄─── Data Access
│   sitory     │
└──────┬───────┘
       │
   ┌───┴────┐
   │        │
   ▼        ▼
┌──────┐ ┌──────┐
│ API  │ │ PM*  │
│Service│ │      │
└──────┘ └──────┘
   │        │
   │        └─── *PackageManager
   │             (Installed Versions)
   │
   ▼
┌──────────────┐
│   Network    │
│              │
│ REST API     │
│  Server      │
└──────────────┘

Data flows back up through the same layers:
API → Repository → Use Case → ViewModel → UI
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                   COMPONENT INTERACTION                         │
└─────────────────────────────────────────────────────────────────┘

MainActivity
    │
    ├─► Schedules WorkManager
    │       │
    │       └─► VersionCheckWorker
    │               │
    │               ├─► StreamRepository
    │               │
    │               └─► NotificationHelper
    │
    └─► Hosts Compose UI
            │
            └─► MainScreen
                    │
                    ├─► MainViewModel
                    │       │
                    │       ├─► GetStreamsWithStatusUseCase
                    │       │       │
                    │       │       └─► StreamRepository
                    │       │
                    │       ├─► StreamRepository
                    │       │
                    │       └─► ApkDownloader
                    │
                    └─► QRCodeScanner
                            │
                            └─► CameraX + ML Kit

All components receive dependencies via Hilt:
- Application Context
- OkHttpClient
- Repositories
- Use Cases
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ERROR HANDLING                              │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ User Action  │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  Try Block   │
    └──────┬───────┘
           │
      ┌────┴─────┐
      │          │
      ▼          ▼
 ┌─────────┐ ┌──────────┐
 │Success  │ │Exception │
 └────┬────┘ └────┬─────┘
      │           │
      │           ▼
      │      ┌──────────────┐
      │      │ Catch Block  │
      │      └────┬─────────┘
      │           │
      │           ▼
      │      ┌──────────────┐
      │      │Return Result │
      │      │  .failure()  │
      │      └────┬─────────┘
      │           │
      └───────────┘
           │
           ▼
    ┌──────────────┐
    │  ViewModel   │
    │  Receives    │
    │  Result      │
    └──────┬───────┘
           │
      ┌────┴─────┐
      │          │
      ▼          ▼
 ┌─────────┐ ┌──────────┐
 │.isSuccess│ │.isFailure│
 └────┬────┘ └────┬─────┘
      │           │
      ▼           ▼
 ┌─────────┐ ┌──────────┐
 │Update   │ │Update    │
 │UI State │ │UI State  │
 │Success  │ │Error     │
 └────┬────┘ └────┬─────┘
      │           │
      └───────┬───┘
              │
              ▼
        ┌──────────┐
        │ UI Shows │
        │ Content  │
        │ or Error │
        └──────────┘
```

## Permission Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMERA PERMISSION                            │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │ User Taps        │
    │ "Scan QR Code"   │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────┐
    │ Check Permission │
    │ Status           │
    └────────┬─────────┘
             │
      ┌──────┴──────┐
      │             │
      ▼             ▼
 ┌─────────┐  ┌──────────┐
 │Granted  │  │ Not      │
 │         │  │ Granted  │
 └────┬────┘  └────┬─────┘
      │            │
      │            ▼
      │       ┌──────────────┐
      │       │Show Request  │
      │       │Rationale     │
      │       └────┬─────────┘
      │            │
      │            ▼
      │       ┌──────────────┐
      │       │User Taps     │
      │       │"Grant        │
      │       │Permission"   │
      │       └────┬─────────┘
      │            │
      │            ▼
      │       ┌──────────────┐
      │       │System Dialog │
      │       └────┬─────────┘
      │            │
      │       ┌────┴─────┐
      │       │          │
      │       ▼          ▼
      │   ┌───────┐  ┌───────┐
      │   │Allow  │  │Deny   │
      │   └───┬───┘  └───┬───┘
      │       │          │
      └───────┤          ▼
              │     ┌──────────┐
              │     │Show Error│
              │     │Message   │
              │     └──────────┘
              │
              ▼
      ┌───────────────┐
      │ Open Camera   │
      │ Show Scanner  │
      └───────────────┘
```

---

These diagrams provide a visual understanding of how the AndroidDevVersionUpdater app works at different levels, from user interaction to data flow to error handling.
