# 🔥 Firebase Backend Setup Instructions

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. **Project name**: `studentverse-v1`
4. Disable Google Analytics (optional for now)
5. Click "Create Project"

## Step 2: Register Your App

### For Android:
1. In Firebase Console, click the Android icon
2. **Android package name**: `com.studentverse.app`
   - Find this in `app.json` under `"package"`
3. Download `google-services.json`
4. Place it in `android/app/` directory

### For iOS (if testing on iOS):
1. Click the iOS icon
2. **iOS bundle ID**: `com.studentverse.app`
3. Download `GoogleService-Info.plist`
4. Place it in `ios/` directory

## Step 3: Get Firebase Configuration

1. In Firebase Console → Project Settings → General
2. Scroll to "Your apps" section
3. Click "Web app" icon (</>) to add web app
4. Register app name: `StudentVerse Web`
5. Copy the `firebaseConfig` object

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and replace with your actual Firebase values:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=studentverse-v1.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=studentverse-v1
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=studentverse-v1.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

## Step 5: Enable Firebase Services

### Enable Authentication:
1. Firebase Console → Authentication → Get Started
2. Click "Email/Password" → Enable → Save

### Enable Firestore Database:
1. Firebase Console → Firestore Database → Create Database
2. Start in **Test mode** (we'll add security rules later)
3. Choose location: **asia-south1** (Mumbai, India)
4. Click "Enable"

### Enable Firebase Storage:
1. Firebase Console → Storage → Get Started
2. Start in **Test mode**
3. Choose location: **asia-south1**
4. Click "Done"

## Step 6: Test Firebase Connection

Run the app:
```bash
npx expo start
```

Check the console for:
- ✅ Firebase initialized
- ✅ Auth ready
- ✅ Firestore ready
- ✅ Storage ready

## ✅ Checklist

- [ ] Firebase project created
- [ ] Android app registered (google-services.json added)
- [ ] iOS app registered (if needed)
- [ ] `.env` file configured with real values
- [ ] Authentication enabled
- [ ] Firestore enabled
- [ ] Storage enabled
- [ ] App runs without Firebase errors

## 🚨 Common Issues

**Issue**: "Default Firebase app not initialized"
- **Fix**: Check `.env` file exists and has correct values
- Restart Expo: `npx expo start --clear`

**Issue**: "Permission denied" in Firestore
- **Fix**: Make sure Firestore is in **Test mode** for now

**Issue**: Firebase not connecting
- **Fix**: Verify API key is correct
- Check `google-services.json` is in correct location

## Next Steps

Once Firebase is working:
1. ✅ Test signup/login flow
2. ✅ Create first user
3. ✅ Verify user data in Firestore
4. ✅ Move to Day 2: Authentication UI
