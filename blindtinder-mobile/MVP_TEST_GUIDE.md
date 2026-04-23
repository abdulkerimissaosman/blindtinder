# BlindTinder One-Sitting MVP - Test & Run Guide

## Quick Start (Development)

### Prerequisites
- Node.js 18+ installed
- npm or yarn
- PostgreSQL running with credentials from `blindtinder-backend/.env`
- Expo Go app on your phone (Android/iOS)

### Step 1: Start the Backend
```bash
cd blindtinder-backend
npm install  # if not already done
npm run dev
# Backend runs on http://localhost:3000
```

### Step 2: Start the Mobile App
```bash
cd blindtinder-mobile
npm install  # if not already done
npx expo start
# Scan QR code with Expo Go (or press 'w' for web)
```

### Step 3: Database Setup (One-time)
From `blindtinder-backend` folder:
```bash
npm run seed  # Creates test users: sara@, youssef@, mona@
```

## One-Sitting MVP Test Path

**Duration: ~5 minutes for full flow**

### Test 1: Register New User
1. Open app → tap "Create a new account"
2. Enter:
   - Full name: "Test User"
   - Email: "testuser@example.com"
   - Password: "testpass123"
3. Tap "Create and continue"
4. **Expected:** Redirected to Profile tab, app is logged in

### Test 2: Edit Profile (Optional)
1. On Profile tab, fill optional fields:
   - City: "Cairo"
   - Bio: "Testing MVP"
   - Select a disability tag
2. Tap "Save profile"
3. **Expected:** "Profile saved" message appears

### Test 3: Discover & Swipe
1. Tap Discover tab (heart icon)
2. **Expected:** First candidate card shows (e.g., Youssef Karim, 29, Cairo)
3. Tap "Like" button
4. **Expected:** Card moves to next candidate
5. Tap "Like" or "Pass" on 1-2 more cards
6. **Expected:** No crashes, loading state appears briefly

### Test 4: Create a Match (Mutual Like)
**Option A (Quickest):**
1. Tap Matches tab (people icon)
2. **Expected:** "No matches yet" message
   - Reason: Sara (test user) hasn't liked you back
   - To create a match, restart app and log in as sara@example.com (password123)
   - Then like your test user back

**Option B (Using Seeded Users):**
1. Restart app
2. Log in as: sara@example.com / password123
3. Go to Discover, Like Youssef
4. Log out (Profile tab → Log out)
5. Log back in as: youssef@example.com / password123
6. Go to Discover, Like Sara back
7. Tap Matches tab → **Expected:** Match appears
8. Tap on match card

### Test 5: Chat in Match
1. Open a match (from Matches tab)
2. **Expected:** Chat screen loads with match name
3. Type a message: "Hello!"
4. Tap "Send"
5. **Expected:** Message appears in chat, "Sending..." state appears briefly
6. Type another message and send
7. **Expected:** Message loads in history

### Test 6: Session Persistence
1. Close app completely
2. Reopen app
3. **Expected:** App loads and stays logged in (no redirect to login)
4. You can immediately see Discover tab
5. Clear LocalStorage to test logout flow

## Test Accounts (Pre-seeded)

Use these after running `npm run seed`:

| Email | Password | Name | City |
|-------|----------|------|------|
| sara@example.com | password123 | Sara Ali | Cairo |
| youssef@example.com | password123 | Youssef Karim | Cairo |
| mona@example.com | password123 | Mona Hany | Giza |

## Known Issues / Limitations

1. **AsyncStorage version mismatch**: May get warning about @react-native-async-storage/async-storage version. Functionality works despite this.
2. **No real-time chat**: Messages load on fetch, not auto-updated. Reload chat to see new messages from other user.
3. **No unread indicators**: Matches don't show unread badge.
4. **Mobile-only MVP**: No web version yet.
5. **No password reset**: Use test accounts to bypass.
6. **No image/media**: Text bio only.

## Common Issues & Fixes

### "API request failed"
- Check backend is running: `npm run dev` in blindtinder-backend
- Check .env has `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000`
- Check firewall allows localhost:3000

### "Database error" on swap
- Run `npm run seed` again to repopulate test users
- Make sure PostgreSQL is running

### Session not persisting
- Clear Expo cache: `npx expo start -c`
- Or manually clear phone's AsyncStorage in Expo settings

### No candidates in Discover
- Try logging in as different user
- Users only see candidates they haven't swiped on yet

## Architecture Quick Ref

- **Frontend**: React Native + Expo Router, TypeScript, context-based state
- **Backend**: Express.js, Node.js, PostgreSQL
- **Auth**: JWT tokens, stored in AsyncStorage, restored on app start
- **Database**: PostgreSQL with UUID PKs, soft match creation on mutual like
- **Communication**: REST API, JSON payloads

## Files for Next Session

If continuing work, prioritize:
1. [blindtinder-mobile/AGENT_CONTEXT.md](AGENT_CONTEXT.md) - Full mobile state
2. [blindtinder-backend](../blindtinder-backend) - Backend structure
3. [blindtinder-mobile/app/_layout.tsx](app/_layout.tsx) - Root app layout
4. [blindtinder-mobile/contexts/app-context.tsx](contexts/app-context.tsx) - State management

## Summary

✅ **One-Sitting MVP Complete**
- Auth (register, login, persistent session) working
- Discover/swipe flow working
- Match creation on mutual like working
- Chat with basic loading states working
- All core endpoints tested and validated
- Mobile/backend contract locked in

🚀 **Ready for handoff or further development**
