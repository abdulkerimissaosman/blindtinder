# BlindTinder MVP - One-Sitting Implementation

A Tinder-like social matching platform designed specifically for disabled users, built with Expo React Native and Express.js.

**Status:** ✅ **MVP COMPLETE + READY FOR TESTING**

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 15+ running locally
- Expo Go app installed on a mobile device or emulator
- A text editor or VS Code

### Step 1: Backend Setup (First-Time Only)

```bash
cd blindtinder-backend

# Install dependencies
npm install

# Seed database (creates blindtinder db, applies schema, inserts test data)
npm run seed

# Start dev server
npm run dev
```

**Expected output:**
```
BlindTinder backend running on http://localhost:3000
```

### Step 2: Mobile Setup (First-Time Only)

```bash
cd blindtinder-mobile

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

**Expected output:**
```
› Metro waiting on exp://... port 8084
› Android app: https://...
› iOS app: https://...
```

Scan the QR code with Expo Go to launch the app.

### Step 3: Test the Smoke Path

1. **Register a new account:**
   - Email: anything@example.com
   - Password: anything
   - Name: Your name
   - (Optional) Age, city, disability tag

2. **Or login with a seeded test account:**
   - Email: sara@example.com
   - Password: password123

3. **Test the core flow:**
   - Tap "Discover" → See candidate cards
   - Swipe "Like" or "Pass"
   - Tap "Matches" tab
   - (If mutual like exists) Tap a match → Open chat
   - Send a message → See it appear
   - Log out → Reopen app → Still logged in (token persisted)

---

## Test Accounts

All pre-seeded with password: `password123`

| Email | Name | Disability | Location |
|-------|------|-----------|----------|
| sara@example.com | Sara Ali | Visual | Cairo |
| youssef@example.com | Youssef Karim | Mobility | Alexandria |
| mona@example.com | Mona Hany | Hearing | Giza |

---

## Project Structure

```
blindtinder/
├── blindtinder-mobile/          # Expo React Native app
│   ├── app/                     # File-based routing (Expo Router)
│   │   ├── (auth)/              # Auth screens (unprotected)
│   │   └── (main)/              # App screens (protected by redirect)
│   ├── contexts/                # App-wide state (AsyncStorage + session)
│   ├── lib/                     # API client + utilities
│   ├── .env                     # Runtime config (API base URL)
│   └── AGENT_CONTEXT.md         # Technical notes for this project
│
├── blindtinder-backend/         # Express.js API server
│   ├── src/
│   │   ├── routes/              # API endpoints (auth, profile, discovery, swipes, matches)
│   │   ├── middleware/          # Auth token validation
│   │   └── repository.ts        # Data access layer
│   ├── sql/                     # PostgreSQL schema + seed data
│   ├── .env                     # Database connection + secrets
│   └── AGENT_CONTEXT.md         # Technical notes for this project
│
└── README.md (this file)
```

---

## API Documentation

### Authentication Endpoints

```
POST /auth/register
  Body: { email, password, fullName, age?, city?, bio? }
  Response: { token, user: { id, email, fullName, ... } }

POST /auth/login
  Body: { email, password }
  Response: { token, user: { id, email, fullName, ... } }

GET /auth/me
  Headers: Authorization: Bearer <token>
  Response: { id, email, fullName, age, city, bio, ... }
```

### Profile Endpoints

```
GET /profile/me
  Headers: Authorization: Bearer <token>
  Response: user object

PUT /profile/me
  Headers: Authorization: Bearer <token>
  Body: { fullName?, age?, city?, bio?, disabilities?, accessibilityNeeds? }
  Response: updated user object

GET /preferences/me
  Headers: Authorization: Bearer <token>
  Response: { minAge, maxAge, preferredCity }

PUT /preferences/me
  Headers: Authorization: Bearer <token>
  Body: { minAge, maxAge, preferredCity }
  Response: updated preferences object
```

### Discovery & Matching

```
GET /discovery
  Headers: Authorization: Bearer <token>
  Response: [{ id, email, fullName, age, city, bio, disabilities, ... }]

POST /swipes
  Headers: Authorization: Bearer <token>
  Body: { toUserId, action: "like" | "pass" }
  Response: { newMatchId: "uuid" } | { newMatchId: null }

GET /matches
  Headers: Authorization: Bearer <token>
  Response: [{ id, userIds, createdAt, messagesCount }]

GET /matches/:matchId/messages
  Headers: Authorization: Bearer <token>
  Response: [{ id, senderId, text, createdAt }]

POST /matches/:matchId/messages
  Headers: Authorization: Bearer <token>
  Body: { text }
  Response: { id, text, senderId, createdAt }
```

---

## Environment Variables

### blindtinder-backend/.env
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/blindtinder
PORT=3000
JWT_SECRET=your-secret-jwt-key
```

### blindtinder-mobile/.env
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

---

## Common Tasks

### Restart Everything
```bash
# Terminal 1: Backend
cd blindtinder-backend && npm run dev

# Terminal 2: Mobile
cd blindtinder-mobile && npx expo start
```

### Seed Database Again
```bash
cd blindtinder-backend
npm run seed
```

### Build for Production
```bash
cd blindtinder-mobile
eas build --platform android  # or ios
```

### Check Backend is Running
```bash
curl http://localhost:3000/health
# Returns: 200 OK
```

### Debug Mobile App
- Open Expo Go
- Press `j` to open debugger
- Check console for errors
- Check network tab (if using Expo DevTools)

### Database Inspection
```bash
# Connect to database
psql postgresql://postgres:PASSWORD@localhost:5432/blindtinder

# List tables
\dt

# Check users
SELECT email, full_name FROM users;

# Check matches
SELECT * FROM matches;
```

---

## Known Limitations (Out of MVP Scope)

- ❌ No real-time messaging (polling-based OK for MVP)
- ❌ No image upload / avatars
- ❌ No push notifications
- ❌ No password reset flow
- ❌ No user blocking / reporting
- ❌ No analytics

---

## Next Steps (Future Enhancements)

### Phase 2 (Recommended Priority Order)
1. Real-time messaging via Socket.io
2. Unread match indicators
3. User profiles with images
4. Advanced discovery (age range, distance filters)
5. Notification system
6. Admin moderation dashboard

### Phase 3
1. Web app mirror (Next.js)
2. Analytics instrumentation
3. Payment integration (premium features)
4. Accessibility audit + WCAG compliance

---

## Troubleshooting

### Backend won't start
- ❌ **Port 3000 in use**: `lsof -i :3000` → kill process or change PORT env var
- ❌ **Database error**: Check DATABASE_URL in .env, verify Postgres is running
- ❌ **Module not found**: Run `npm install` in blindtinder-backend folder

### Mobile app won't connect to backend
- ❌ **CORS error**: Backend has CORS enabled, but double-check `blindtinder-backend/src/app.ts`
- ❌ **Wrong API URL**: Check .env `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000`
- ❌ **Backend not running**: Verify backend server is listening on port 3000

### Token issues / Not staying logged in
- ❌ **AsyncStorage not persisting**: Clear cache: `npx expo start --clear`
- ❌ **JWT expired**: Log out and log back in (no refresh token yet)
- ❌ **Wrong token format**: Backend expects `Authorization: Bearer <token>`, mobile handle this in lib/api.ts

### Duplicate users in database
- ❌ **Seed ran twice**: Reset via `nsql ... DROP TABLE IF EXISTS ... CASCADE`
- ❌ **Email must be unique**: Try registering with a different email

---

## Testing Checklist

**Smoke Test (Core Flow):**
- [ ] Register new account via mobile
- [ ] See candidate in Discover tab
- [ ] Swipe like → Next candidate loads
- [ ] Swipe pass → Next candidate loads
- [ ] See match in Matches tab (if multiple users tested)
- [ ] Tap match → Chat opens
- [ ] Send message → Appears immediately
- [ ] Close app → Reopen → Still logged in
- [ ] Tap logout → Land on login screen

**Error Handling:**
- [ ] Stop backend → Discover loads error state + retry button
- [ ] Kill internet → Messages show network error
- [ ] Restart backend → Retry button works

**Edge Cases:**
- [ ] Register with same email twice → Error message
- [ ] Login with wrong password → Error message
- [ ] Access /matches without auth token → Redirected to login
- [ ] Message super long text → Doesn't crash

---

## Support

For questions or bugs:
1. Check the AGENT_CONTEXT.md in each folder
2. Review the test guide (blindtinder-mobile/MVP_TEST_GUIDE.md)
3. Check backend logs for API errors
4. Open Expo debugger with `j` key for mobile logs

---

## License

Private project (disabled community platform).

---

**TL;DR:** Run `npm run dev` in backend folder, `npx expo start` in mobile folder, scan QR, test register → discover → swipe → match → chat → logout → relogin. ✅ Done!
