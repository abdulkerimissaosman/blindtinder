# BlindTinder Mobile - Agent Handoff Context

## Project Goal
Build a one-day MVP mobile app (Expo React Native) for a Tinder-like social platform focused on disabled users.

## Current Stack
- Framework: Expo + React Native + Expo Router
- Language: TypeScript
- State: Local in-memory context (temporary until backend integration)
- Backend status: Not connected yet (friend building PostgreSQL backend)

## What Is Already Implemented
- Auth screens: login + register
- Profile editing: disability tags, accessibility needs, matching preferences
- Discovery flow: like/pass cards
- Match creation: mutual like => match record
- Chat: messages inside a match
- Route groups: auth and main app tabs

## Important Test Login
- Email: sara@example.com
- Password: password123

## Key Files
- contexts/app-context.tsx
- app/_layout.tsx
- app/index.tsx
- app/(auth)/login.tsx
- app/(auth)/register.tsx
- app/(main)/(tabs)/discover.tsx
- app/(main)/(tabs)/matches.tsx
- app/(main)/(tabs)/profile.tsx
- app/(main)/chat/[matchId].tsx

## Run Commands
1. cd blindtinder-mobile
2. npx expo start
3. Scan QR with Expo Go

## Next High-Priority Work
1. Replace in-memory context with API calls.
2. Add API client layer and auth token persistence.
3. Connect discovery, swipe, matches, and chat endpoints.
4. Add loading/error states for network calls.
5. Add basic accessibility audit and polish.

## Backend Contract Needed (Minimum)
- POST /auth/register
- POST /auth/login
- GET /profile/me
- PUT /profile/me
- GET /preferences/me
- PUT /preferences/me
- GET /discovery
- POST /swipes
- GET /matches
- GET /matches/:id/messages
- POST /matches/:id/messages

## Copy-Paste Prompt For New IDE Session
I am continuing work on the BlindTinder mobile MVP in Expo Router. Please read AGENT_CONTEXT.md first, then inspect app/_layout.tsx and contexts/app-context.tsx, and continue by replacing local in-memory state with real API integration while preserving existing screens and routes.
