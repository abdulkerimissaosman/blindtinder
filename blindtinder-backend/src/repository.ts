import { pool } from './db.js';
import { ApiUser, DisabilityTag, MatchRecord, MessageRecord, SwipeAction } from './types.js';
import { comparePassword, hashPassword } from './utils/password.js';

export type RegisterPayload = {
  email: string;
  password: string;
  fullName: string;
  age?: number;
  city?: string;
  bio?: string;
  accessibilityNeeds?: string;
  disabilities?: DisabilityTag[];
  minPreferredAge?: number;
  maxPreferredAge?: number;
};

export type UpdateProfilePayload = Partial<{
  fullName: string;
  age: number;
  city: string;
  bio: string;
  accessibilityNeeds: string;
  disabilities: DisabilityTag[];
  minPreferredAge: number;
  maxPreferredAge: number;
  preferredCity: string | null;
  sameCityOnly: boolean;
}>;

export type PreferencePayload = {
  minPreferredAge: number;
  maxPreferredAge: number;
  preferredCity?: string | null;
  sameCityOnly?: boolean;
};

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  age: number;
  city: string;
  bio: string;
  accessibility_needs: string;
  created_at: Date;
  updated_at: Date;
};

type PreferencesRow = {
  user_id: string;
  min_preferred_age: number;
  max_preferred_age: number;
  preferred_city: string | null;
  same_city_only: boolean;
  updated_at: Date;
};

type MatchRow = {
  id: string;
  user_a_id: string;
  user_b_id: string;
  matched_at: Date;
};

type MessageRow = {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: Date;
};

type DiscoveryRow = UserRow & {
  min_preferred_age: number | null;
  max_preferred_age: number | null;
  preferred_city: string | null;
  same_city_only: boolean | null;
  disabilities: DisabilityTag[] | null;
};

function mapUserRow(row: UserRow, disabilities: DisabilityTag[], preferences?: PreferencesRow): ApiUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    age: row.age,
    city: row.city,
    bio: row.bio,
    disabilities,
    accessibilityNeeds: row.accessibility_needs,
    minPreferredAge: preferences?.min_preferred_age ?? 18,
    maxPreferredAge: preferences?.max_preferred_age ?? 99,
  };
}

async function getDisabilitiesForUser(userId: string) {
  const { rows } = await pool.query<{ disability: DisabilityTag }>(
    'SELECT disability FROM user_disabilities WHERE user_id = $1 ORDER BY disability',
    [userId]
  );
  return rows.map((row) => row.disability);
}

async function getPreferencesForUser(userId: string) {
  const { rows } = await pool.query<PreferencesRow>(
    'SELECT * FROM preferences WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  return rows[0] ?? null;
}

export async function getUserAuthRecordByEmail(email: string) {
  const { rows } = await pool.query<UserRow>(
    'SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1',
    [email]
  );
  return rows[0] ?? null;
}

export async function getUserPasswordHashById(userId: string) {
  const { rows } = await pool.query<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1 LIMIT 1',
    [userId]
  );
  return rows[0]?.password_hash ?? null;
}

export async function getUserProfile(userId: string) {
  const { rows } = await pool.query<UserRow>('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId]);
  const row = rows[0];
  if (!row) return null;
  const disabilities = await getDisabilitiesForUser(userId);
  const preferences = await getPreferencesForUser(userId);
  return mapUserRow(row, disabilities, preferences ?? undefined);
}

export async function getUserProfileByEmail(email: string) {
  const record = await getUserAuthRecordByEmail(email);
  if (!record) return null;
  return getUserProfile(record.id);
}

async function savePreferences(userId: string, payload: PreferencePayload) {
  await pool.query(
    `
      INSERT INTO preferences (user_id, min_preferred_age, max_preferred_age, preferred_city, same_city_only)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id)
      DO UPDATE SET
        min_preferred_age = EXCLUDED.min_preferred_age,
        max_preferred_age = EXCLUDED.max_preferred_age,
        preferred_city = EXCLUDED.preferred_city,
        same_city_only = EXCLUDED.same_city_only,
        updated_at = now()
    `,
    [
      userId,
      payload.minPreferredAge,
      payload.maxPreferredAge,
      payload.preferredCity ?? null,
      payload.sameCityOnly ?? false,
    ]
  );
}

async function saveDisabilities(userId: string, disabilities: DisabilityTag[]) {
  await pool.query('DELETE FROM user_disabilities WHERE user_id = $1', [userId]);
  for (const disability of disabilities) {
    await pool.query('INSERT INTO user_disabilities (user_id, disability) VALUES ($1, $2)', [
      userId,
      disability,
    ]);
  }
}

export async function createUser(payload: RegisterPayload) {
  const hashedPassword = await hashPassword(payload.password);
  const age = payload.age ?? 25;
  const city = payload.city ?? '';
  const bio = payload.bio ?? '';
  const accessibilityNeeds = payload.accessibilityNeeds ?? '';
  const disabilities = (payload.disabilities?.length ? payload.disabilities : ['other']) as DisabilityTag[];
  const minPreferredAge = payload.minPreferredAge ?? 22;
  const maxPreferredAge = payload.maxPreferredAge ?? 35;

  const { rows } = await pool.query<UserRow>(
    `
      INSERT INTO users (email, password_hash, full_name, age, city, bio, accessibility_needs)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [payload.email.trim(), hashedPassword, payload.fullName.trim(), age, city, bio, accessibilityNeeds]
  );

  const user = rows[0];
  await saveDisabilities(user.id, disabilities);
  await savePreferences(user.id, { minPreferredAge, maxPreferredAge, preferredCity: city, sameCityOnly: false });

  return getUserProfile(user.id);
}

export async function verifyPassword(userId: string, password: string) {
  const hash = await getUserPasswordHashById(userId);
  if (!hash) return false;
  return comparePassword(password, hash);
}

export async function updateUserProfile(userId: string, payload: UpdateProfilePayload) {
  const current = await getUserProfile(userId);
  if (!current) return null;

  const merged = {
    fullName: payload.fullName ?? current.fullName,
    age: payload.age ?? current.age,
    city: payload.city ?? current.city,
    bio: payload.bio ?? current.bio,
    accessibilityNeeds: payload.accessibilityNeeds ?? current.accessibilityNeeds,
    disabilities: payload.disabilities ?? current.disabilities,
    minPreferredAge: payload.minPreferredAge ?? current.minPreferredAge,
    maxPreferredAge: payload.maxPreferredAge ?? current.maxPreferredAge,
    preferredCity: payload.preferredCity ?? current.city,
    sameCityOnly: payload.sameCityOnly ?? false,
  };

  await pool.query(
    `
      UPDATE users
      SET full_name = $2,
          age = $3,
          city = $4,
          bio = $5,
          accessibility_needs = $6
      WHERE id = $1
    `,
    [userId, merged.fullName, merged.age, merged.city, merged.bio, merged.accessibilityNeeds]
  );

  await saveDisabilities(userId, merged.disabilities);
  await savePreferences(userId, {
    minPreferredAge: merged.minPreferredAge,
    maxPreferredAge: merged.maxPreferredAge,
    preferredCity: merged.preferredCity,
    sameCityOnly: merged.sameCityOnly,
  });

  return getUserProfile(userId);
}

export async function getPreferences(userId: string) {
  return getPreferencesForUser(userId);
}

export async function updatePreferences(userId: string, payload: PreferencePayload) {
  await savePreferences(userId, payload);
  return getPreferencesForUser(userId);
}

export async function getDiscoveryUsers(userId: string) {
  const current = await getUserProfile(userId);
  if (!current) return [];

  const { rows } = await pool.query<DiscoveryRow>(
    `
      SELECT
        u.*,
        p.min_preferred_age,
        p.max_preferred_age,
        p.preferred_city,
        p.same_city_only,
        COALESCE(array_agg(ud.disability) FILTER (WHERE ud.disability IS NOT NULL), '{}'::disability_tag[]) AS disabilities
      FROM users u
      LEFT JOIN preferences p ON p.user_id = u.id
      LEFT JOIN user_disabilities ud ON ud.user_id = u.id
      WHERE u.id <> $1
        AND NOT EXISTS (
          SELECT 1
          FROM swipes s
          WHERE s.from_user_id = $1
            AND s.to_user_id = u.id
        )
        AND NOT EXISTS (
          SELECT 1
          FROM matches m
          WHERE (m.user_a_id = LEAST($1, u.id) AND m.user_b_id = GREATEST($1, u.id))
        )
      GROUP BY u.id, p.user_id, p.min_preferred_age, p.max_preferred_age, p.preferred_city, p.same_city_only
      ORDER BY u.created_at DESC
    `,
    [userId]
  );

  return rows
    .filter((row) => {
      const minAge = current.minPreferredAge;
      const maxAge = current.maxPreferredAge;
      const withinAge = row.age >= minAge && row.age <= maxAge;
      const sameCity = !current.city || row.city.toLowerCase() === current.city.toLowerCase();
      return withinAge && sameCity;
    })
    .map((row) => mapUserRow(row, row.disabilities ?? [], {
      user_id: row.id,
      min_preferred_age: row.min_preferred_age ?? current.minPreferredAge,
      max_preferred_age: row.max_preferred_age ?? current.maxPreferredAge,
      preferred_city: row.preferred_city,
      same_city_only: row.same_city_only ?? false,
      updated_at: new Date(),
    }));
}

async function ensureMatch(userAId: string, userBId: string) {
  const [a, b] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];
  const { rows } = await pool.query<MatchRow>(
    `
      INSERT INTO matches (user_a_id, user_b_id)
      VALUES ($1, $2)
      ON CONFLICT (user_a_id, user_b_id) DO NOTHING
      RETURNING *
    `,
    [a, b]
  );

  if (rows[0]) {
    return rows[0];
  }

  const existing = await pool.query<MatchRow>(
    'SELECT * FROM matches WHERE user_a_id = $1 AND user_b_id = $2 LIMIT 1',
    [a, b]
  );
  return existing.rows[0] ?? null;
}

export async function createSwipe(userId: string, toUserId: string, action: SwipeAction) {
  await pool.query(
    `
      INSERT INTO swipes (from_user_id, to_user_id, action)
      VALUES ($1, $2, $3)
      ON CONFLICT (from_user_id, to_user_id)
      DO UPDATE SET action = EXCLUDED.action, created_at = now()
    `,
    [userId, toUserId, action]
  );

  if (action !== 'like') {
    return { newMatchId: null };
  }

  const reciprocal = await pool.query(
    `
      SELECT 1
      FROM swipes
      WHERE from_user_id = $1
        AND to_user_id = $2
        AND action = 'like'
      LIMIT 1
    `,
    [toUserId, userId]
  );

  if (!reciprocal.rows.length) {
    return { newMatchId: null };
  }

  const match = await ensureMatch(userId, toUserId);
  return { newMatchId: match?.id ?? null };
}

export async function getMatchesForUser(userId: string) {
  const { rows } = await pool.query<MatchRow>(
    `
      SELECT *
      FROM matches
      WHERE user_a_id = $1 OR user_b_id = $1
      ORDER BY matched_at DESC
    `,
    [userId]
  );

  const matches: MatchRecord[] = [];
  for (const row of rows) {
    const messages = await getMessagesForMatch(row.id);
    matches.push({
      id: row.id,
      userIds: [row.user_a_id, row.user_b_id],
      createdAt: row.matched_at.toISOString(),
      messages,
    });
  }

  return matches;
}

export async function getMatchById(matchId: string) {
  const { rows } = await pool.query<MatchRow>('SELECT * FROM matches WHERE id = $1 LIMIT 1', [matchId]);
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    userIds: [row.user_a_id, row.user_b_id] as [string, string],
    createdAt: row.matched_at.toISOString(),
  };
}

export async function getMessagesForMatch(matchId: string) {
  const { rows } = await pool.query<MessageRow>(
    `
      SELECT *
      FROM messages
      WHERE match_id = $1
      ORDER BY created_at ASC
    `,
    [matchId]
  );

  return rows.map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    text: row.body,
    createdAt: row.created_at.toISOString(),
  })) satisfies MessageRecord[];
}

export async function addMessageToMatch(matchId: string, senderId: string, text: string) {
  const { rows } = await pool.query<MessageRow>(
    `
      INSERT INTO messages (match_id, sender_id, body)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [matchId, senderId, text]
  );

  const row = rows[0];
  return {
    id: row.id,
    senderId: row.sender_id,
    text: row.body,
    createdAt: row.created_at.toISOString(),
  } satisfies MessageRecord;
}

export async function userIsInMatch(userId: string, matchId: string) {
  const match = await getMatchById(matchId);
  return Boolean(match && match.userIds.includes(userId));
}

export async function emailExists(email: string) {
  const record = await getUserAuthRecordByEmail(email);
  return Boolean(record);
}
