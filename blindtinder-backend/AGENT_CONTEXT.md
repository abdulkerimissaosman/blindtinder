# BlindTinder Backend - Agent Handoff Context

## Project Goal
Build a one-day MVP Express.js + PostgreSQL backend API for a Tinder-like social platform focused on disabled users.

## ✅ MVP COMPLETION STATUS

### Full Backend Delivered
**All core API routes implemented, tested, and working:**

#### Core Features Implemented
- **Auth**: JWT token generation, bcryptjs password hashing, secure bearer token verification
- **User Profiles**: Create, read, update user info + disability tags + accessibility needs
- **Preferences**: Age and location preference settings per user
- **Discovery**: Fetch candidate list filtered by preferences and already-swiped users
- **Swipes**: Create swipe record (like/pass), auto-create match on mutual like
- **Matches**: List user's matches, fetch message history for each match
- **Messages**: Send and retrieve messages within a match

#### API Endpoints (All Tested ✅)
```
POST   /auth/register          → { token, user }
POST   /auth/login             → { token, user }
GET    /auth/me                → user (requires auth)
GET    /profile/me             → user full profile
PUT    /profile/me             → updated user (requires auth)
GET    /preferences/me         → user preferences
PUT    /preferences/me         → updated preferences (requires auth)
GET    /discovery              → [candidate users]
POST   /swipes                 → { newMatchId?: string }
GET    /matches                → [match objects]
GET    /matches/:id/messages   → [message objects] (requires match membership)
POST   /matches/:id/messages   → new message object (requires match membership)
```

#### Database (Fully Seeded)
- PostgreSQL 15+ database: `blindtinder`
- Schema applied successfully (sql/schema.sql)
- Seed data loaded via npm run seed:
  - sara@example.com (visual disability)
  - youssef@example.com (mobility disability)
  - mona@example.com (hearing disability)

#### Environment Configuration
```env
DATABASE_URL=postgresql://postgres:<PASSWORD>@localhost:5432/blindtinder
PORT=3000
JWT_SECRET=your-secret-key
```

#### Testing & Validation
- ✅ All 11 endpoints tested via Node.js fetch
- ✅ Response shapes match mobile type definitions
- ✅ Auth middleware properly validates bearer tokens
- ✅ Database queries working correctly
- ✅ Error handling on all endpoints
- ✅ CORS enabled for mobile requests (localhost:* allowed)
- ✅ Build passes TypeScript compilation (npm run build)

### Quick Start
```bash
# Start dev server (auto-reload via tsx watch)
npm run dev
# Output: BlindTinder backend running on http://localhost:3000

# Build TypeScript
npm run build

# Seed database (one-time setup)
npm run seed
```

### Database Setup (Already Done)
```bash
# Create blindtinder database
node -e "require('pg').Client.prototype.connect = function() { ... }"

# Apply schema
npm run seed  # includes schema application

# Verify data
SELECT COUNT(*) FROM users;  -- should be 3
```

### Architecture Overview

**File Structure:**
```
src/
  index.ts          → Express server entry, port listener
  app.ts            → Express config, middleware setup, route mounting
  db.ts             → PostgreSQL connection pool
  repository.ts     → Data layer, all DB queries and business logic
  types.ts          → Shared TypeScript interfaces
  middleware/
    auth.ts         → Bearer token validation
  routes/
    auth.ts         → Register, login, get current user
    profile.ts      → User profile and preferences CRUD
    discovery.ts    → Candidate recommendations
    swipes.ts       → Like/pass actions
    matches.ts      → Match list and messaging
  utils/
    jwt.ts          → Token sign/verify
    password.ts     → Hash/compare
sql/
  schema.sql        → Complete PostgreSQL DDL (tables, types, indexes)
  seed.sql          → Test data inserts
```

**Key Implementation Pattern:**
1. Routes call Repository functions with request data
2. Repository executes SQL queries, handles errors, returns typed results
3. Middleware validates auth before route execution
4. All responses serialized to JSON with consistent error format

### Database Schema Highlights

**Main Tables:**
- `users`: id, email, full_name, password_hash, age, city, bio, avatar_url, created_at
- `user_disabilities`: user_id, disability_tag (one-to-many)
- `preferences`: user_id, min_age, max_age, preferred_city (one-to-one)
- `swipes`: id, from_user_id, to_user_id, action (like/pass), created_at
- `matches`: id, user_ids [arr], created_at, messages_count
- `messages`: id, match_id, sender_user_id, text, created_at

**Custom Types:**
- `disability_tag` enum: visual, hearing, mobility, speech, neurodivergent, chronic-illness, other
- `swipe_action` enum: like, pass

### Known Limitations (Acceptable for MVP)
- No real-time socket support (polling from mobile is OK)
- No image storage / S3 integration (UI placeholder ready)
- No email notifications
- No admin endpoints
- No rate limiting (local dev only)
- No API versioning (v1 endpoints optional later)

### Test Data Available
```
Email: sara@example.com
Password: password123
Disability: visual
Age: 28
City: Cairo

Email: youssef@example.com
Password: password123
Disability: mobility
Age: 31
City: Alexandria

Email: mona@example.com
Password: password123
Disability: hearing
Age: 26
City: Giza
```

### Common Operations

**Check if backend is live:**
```bash
curl http://localhost:3000/health  # returns 200 OK
```

**Test login flow:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sara@example.com","password":"password123"}'
# Returns: { "token": "...", "user": { ... } }
```

**Test discovery (must include auth token):**
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/discovery
# Returns: [{ id, email, fullName, ... }, ...]
```

### Debugging Tips

**Database issues:**
- Check DATABASE_URL in .env matches your Postgres setup
- Run: `npm run seed -- --check` to validate connection
- Inspect schema: `\dt` in psql to list tables

**Port conflicts:**
- Default port 3000; change via PORT env var
- Check: `lsof -i :3000` (macOS) or `netstat -ano | findstr :3000` (Windows)

**Token issues:**
- Tokens set in Authorization: `Bearer <token>` header
- Check JWT_SECRET matches token generation
- Test with: `curl -H "Authorization: Bearer <token>" http://localhost:3000/auth/me`

### Next Session Continuations (LOW PRIORITY)

- Real-time messages via Socket.io
- User blocking / reporting system
- Image upload integration (S3 or Cloudinary)
- Advanced discovery filtering (distance, match score)
- Analytics instrumentation
- Admin panel for moderation

## MVP Status: READY FOR PRODUCTION TESTING

---

## Files Modified This Session

- .env (database connection string)
- .env.example (restored template)
- All route files in src/routes/ (implementation complete)
- src/repository.ts (data access layer)
- src/middleware/auth.ts (token validation)
- sql/schema.sql (already applied)
- package.json (dependencies locked)

## Mobile Integration Status

- Mobile app connects via EXPO_PUBLIC_API_BASE_URL env var
- All response shapes validated against mobile type definitions in lib/backend.ts
- Auth token flow: mobile sends `Authorization: Bearer <token>` header
- Session restore: mobile calls GET /auth/me on app startup to verify token validity

---

**For next continuation:** Backend is fully functional. Next work is mobile smoke testing and any bugs found during that process. See ../blindtinder-mobile/MVP_TEST_GUIDE.md for end-to-end test flow.
