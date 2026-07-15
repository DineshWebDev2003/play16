# TN HappyKids Play App

School management mobile app built with **React Native (Expo)** + **Laravel backend**.  
Connects parents, teachers, and administrators in a single platform for preschool/daycare management.

---

## Architecture Overview

```
┌──────────────────────┐       ┌──────────────────────────┐
│   React Native App   │       │    Laravel 11 Backend     │
│   (Expo SDK 54)      │ HTTP  │    (REST API + Sanctum)   │
│   Android + iOS      │◄─────►│    SQLite Database        │
│                      │       │    Expo Push Notifications│
└──────────────────────┘       └──────────────────────────┘
```

- **Frontend:** Single Expo app — UI changes based on logged-in user's role
- **Backend:** Laravel API with token-based auth (Sanctum)
- **Database:** SQLite (file-based, zero config)
- **Push:** Expo Push Notifications → FCM (Android) / APNs (iOS)

---

## User Roles & Permissions

The app has **4 roles**, each with a dedicated home screen and feature set:

### 1. `master_admin` — Super Admin
Full access across all branches. Can manage everything.

| Feature | Access |
|---------|--------|
| Dashboard (all branches stats) | ✅ |
| User Management (all roles) | ✅ |
| Branch Management (CRUD branches) | ✅ |
| Announcements (all branches) | ✅ |
| Activities / Homework / Attendance | ✅ |
| Fees & Transactions (all) | ✅ |
| Camera Management | ✅ |
| Reports & Backup/Export | ✅ |
| Monster Admin Panel (maintenance mode) | ✅ |

### 2. `admin` — Branch Admin
Manages a single branch. Cannot create other admins or master_admin.

| Feature | Access |
|---------|--------|
| Dashboard (own branch stats) | ✅ |
| User Management (teacher + student only) | ✅ |
| Announcements (own branch) | ✅ |
| Activities / Homework / Attendance | ✅ |
| Fees & Transactions (own branch) | ✅ |
| Student List & Details | ✅ |
| Income/Expense Tracking | ✅ |
| Reports | ✅ |

### 3. `teacher` — Teacher
Access to classroom tools and communication.

| Feature | Access |
|---------|--------|
| Home (attendance summary, announcements) | ✅ |
| Post Homework | ✅ |
| Take Attendance | ✅ |
| Post Activities (with media) | ✅ |
| View Submissions | ✅ |
| Class Schedule (Timetable) | ✅ |
| My Attendance | ✅ |
| Parent Messages | ✅ |
| Notification Settings | ✅ |

### 4. `student` — Parent/Student
View-only access for parents to track their child.

| Feature | Access |
|---------|--------|
| Home (announcements, upcoming fees) | ✅ |
| Activity Feed (with likes/comments) | ✅ |
| Attendance History | ✅ |
| Homework View | ✅ |
| Timetable | ✅ |
| Live Camera View | ✅ |
| My Fees & Payment History | ✅ |
| Emergency Contacts | ✅ |
| Profile & Rewards | ✅ |
| Notification Settings | ✅ |

---

## Authentication Flow

### Option 1: Username/Password
```
User → LoginScreen → POST /api/login → Validate credentials → Issue Sanctum token
                                                                    ↓
                                                            Store token in AsyncStorage
                                                                    ↓
                                                            Set axios default header
                                                                    ↓
                                                            Fetch user data + role
                                                                    ↓
                                                            Render role-specific UI
```

### Option 2: Google OAuth
```
User → LoginScreen → "Sign in with Google" → Google OAuth dialog → Get ID token
                                                                        ↓
                                                              POST /api/auth/google
                                                                        ↓
                                                      Backend verifies token with Google API
                                                                        ↓
                                                      Find user by email in SQLite DB
                                                                        ↓
                                                      Issue Sanctum token (same as above)
```

- **User must exist in the database** with their Gmail set in the `email` field
- Admin sets the Gmail when creating the user via User Management

---

## Backend API Structure

### Authentication (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Username/password login |
| POST | `/api/auth/google` | Google ID token login |
| POST | `/api/logout` | Revoke token (auth required) |
| GET | `/api/me` | Get current user profile |
| POST | `/api/update-push-token` | Save Expo push token |
| POST | `/api/update-notification-settings` | Toggle notification types |

### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (filtered by role/branch) |
| POST | `/api/users` | Create user |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user |

### Announcements
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/announcements` | List announcements |
| POST | `/api/announcements` | Create + send push notification |
| DELETE | `/api/announcements/{id}` | Delete announcement |

### Activities
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activities` | List activities |
| POST | `/api/activities` | Create activity (with media) |
| POST | `/api/activities/{id}/like` | Toggle like |
| POST | `/api/activities/{id}/comment` | Add comment |
| DELETE | `/api/activities/{id}` | Delete activity |

### Finance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List income/expense |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/{id}` | Update transaction |
| POST | `/api/transactions/{id}/approve` | Approve expense request |
| POST | `/api/transactions/{id}/reject` | Reject expense request |
| GET | `/api/fees` | List fees |
| POST | `/api/fees` | Create fee record |
| GET | `/api/fee-structures` | List fee structures |
| POST | `/api/fee-structures` | Create fee structure |

### Others
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/attendance` | List / mark attendance |
| GET/POST | `/api/homework` | List / post homework |
| GET/POST | `/api/timetable` | List / manage timetable |
| GET/POST | `/api/cameras` | List / manage cameras |
| GET/POST | `/api/branches` | Branch CRUD (master_admin only) |
| GET | `/api/reports` | Dashboard reports |
| GET/POST | `/api/backup/*` | Database backup & restore |

---

## Push Notification Flow

```
Admin posts announcement
        │
        ▼
Backend saves to DB + checks title for "test"
        │
        ▼ (if not test)
Builds notification payload:
  • title: "New Announcement: ..."
  • body: announcement content
  • image: public HTTPS URL (if attached)
        │
        ▼
Sends to Expo Push API (https://exp.host/--/api/v2/push/send)
        │
        ▼
Expo routes to:
  • Android → FCM → device (BigPictureStyle with image, importance MAX)
  • iOS → APNs → device (rich notification with image attachment)
```

**Notification payload structure:**
```json
{
  "to": "ExpoPushToken[...]",
  "title": "New Announcement: Sports Day",
  "body": "Join us for annual sports meet...",
  "image": "https://play1.tnhappykids.in/storage/announcements/photo.jpg",
  "data": {
    "screen": "announcements",
    "id": 123,
    "image": "https://play1.tnhappykids.in/storage/announcements/photo.jpg"
  },
  "attachments": [{ "url": "https://...", "type": "image" }],
  "mutableContent": true,
  "priority": "high"
}
```

### Notification Channels (Android)
| Channel | Importance | Used For |
|---------|-----------|----------|
| `default` | MAX | Announcements (supports big picture images) |
| `payments` | HIGH | Payment notifications |
| `activities` | HIGH | Activity/event notifications |

---

## Project Structure

```
new-play-app/
│
├── my-expo-app/                    # React Native Frontend
│   ├── App.tsx                     # Entry point
│   ├── app.json                    # Expo config
│   ├── eas.json                    # EAS Build config
│   ├── google-services.json        # Firebase FCM (Android)
│   ├── .env                        # Google OAuth client IDs
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx         # Global state: auth, user, data, CRUD
│   │   └── ThemeContext.tsx         # Light/dark theme
│   │
│   ├── navigation/
│   │   └── AppNavigator.tsx        # Screen router + push notification handling
│   │
│   ├── screens/
│   │   ├── auth/LoginScreen.tsx    # Username/password + Google Sign-In
│   │   ├── admin/                  # Admin role screens
│   │   ├── teacher/                # Teacher role screens
│   │   ├── student/                # Student/parent role screens
│   │   └── master_admin/           # Super admin screens
│   │
│   ├── services/
│   │   ├── api.ts                  # Axios client + getMediaUrl()
│   │   └── notifications.ts        # Push token registration + channels
│   │
│   ├── components/                 # Shared UI components
│   └── config/
│       └── google.ts               # Google OAuth config from env
│
├── school-backend/                 # Laravel Backend
│   ├── app/Http/Controllers/Api/
│   │   ├── AuthController.php      # Login, Google auth, push token
│   │   ├── UserController.php      # User CRUD
│   │   ├── AnnouncementController.php  # Announcements + push trigger
│   │   ├── ActivityController.php  # Activities + likes + comments
│   │   ├── FeeController.php       # Fees management
│   │   ├── TransactionController.php# Income/expense
│   │   ├── AttendanceController.php# Attendance CRUD
│   │   ├── HomeworkController.php  # Homework posts
│   │   ├── CameraController.php    # Camera management
│   │   └── ... (Branch, Backup, Report, etc.)
│   │
│   ├── app/Services/
│   │   └── ExpoNotificationService.php  # Push notification sender
│   │
│   ├── app/Models/
│   │   └── User.php                # User model with role scopes
│   │
│   ├── routes/api.php              # All API routes
│   ├── database/                   # Migrations + seeders
│   └── config/app.php              # Push image base URL config
│
├── README.md                       # This file
├── keystore.md                     # Android signing credentials (gitignored)
└── tnhappykids-upload-key.jks      # Android keystore (gitignored)
```

---

## Frontend Navigation Flow

```
App Start
    │
    ▼
SplashScreen → Check AsyncStorage for auth_token
    │               │
    │ (no token)    │ (has token)
    ▼               ▼
LoginScreen     fetchData() → Load users, announcements, etc.
    │               │
    │ (success)     ▼
    ▼          Role-based routing:
  Login         ├─ master_admin → SuperAdminHomeScreen
                ├─ admin → AdminHomeScreen
                ├─ teacher → TeacherHomeScreen
                └─ student → StudentHomeScreen
```

Each role home screen has a bottom tab navigator with:
- **Home** tab (role-specific dashboard with stat cards)
- **Quick Action** tab (role-specific actions)
- **Account** tab (profile, settings, logout)

---

## Image Handling

| Feature | Method |
|---------|--------|
| Upload | Base64 via API → Laravel stores in `storage/app/public/` |
| Display in app | `getMediaUrl()` resolves to `http://{IP}:8000/storage/...` |
| Push notifications | `PUSH_IMAGE_BASE_URL` env → HTTPS public URL |
| Storage link | `php artisan storage:link` required |

---

## Environment Variables

### Frontend (`my-expo-app/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID` | For Google Auth | Web client ID from Google Cloud Console |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | For Google Auth | Android client ID |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | For Google Auth | iOS client ID |

### Backend (`school-backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `APP_URL` | Yes | Backend URL (`http://{IP}:8000` for dev) |
| `PUSH_IMAGE_BASE_URL` | For push images | Public HTTPS URL (e.g. `https://play1.tnhappykids.in`) |

---

## Quick Start

### Backend
```bash
cd school-backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve --host=0.0.0.0 --port=8000
```

### Frontend
```bash
cd my-expo-app
npm install
npx expo prebuild --clean
npx eas build --platform android --profile development
```

### Default Test Users
| Username | Password | Role |
|----------|----------|------|
| `master_admin` | `password` | master_admin |
| `admin` | `password` | admin |
| `teacher` | `password` | teacher |
| `student` | `password` | student |
