import { pool } from './db.js';
import { comparePassword, hashPassword } from './utils/password.js';
function mapUserRow(row, disabilities, preferences) {
    return {
        id: row.id,
        email: row.email,
        fullName: row.full_name,
        age: row.age,
        city: row.city,
        bio: row.bio,
        avatarUrl: row.avatar_url,
        disabilities,
        accessibilityNeeds: row.accessibility_needs,
        minPreferredAge: preferences?.min_preferred_age ?? 18,
        maxPreferredAge: preferences?.max_preferred_age ?? 99,
        preferredCity: preferences?.preferred_city ?? null,
        sameCityOnly: preferences?.same_city_only ?? false,
    };
}
async function getDisabilitiesForUser(userId) {
    const { rows } = await pool.query('SELECT disability FROM user_disabilities WHERE user_id = $1 ORDER BY disability', [userId]);
    return rows.map((row) => row.disability);
}
async function getPreferencesForUser(userId) {
    const { rows } = await pool.query('SELECT * FROM preferences WHERE user_id = $1 LIMIT 1', [userId]);
    return rows[0] ?? null;
}
export async function getUserAuthRecordByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM users WHERE lower(email) = lower($1) LIMIT 1', [email]);
    return rows[0] ?? null;
}
export async function getUserPasswordHashById(userId) {
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1 LIMIT 1', [userId]);
    return rows[0]?.password_hash ?? null;
}
export async function getUserProfile(userId) {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [userId]);
    const row = rows[0];
    if (!row)
        return null;
    const disabilities = await getDisabilitiesForUser(userId);
    const preferences = await getPreferencesForUser(userId);
    return mapUserRow(row, disabilities, preferences ?? undefined);
}
export async function getUserProfileByEmail(email) {
    const record = await getUserAuthRecordByEmail(email);
    if (!record)
        return null;
    return getUserProfile(record.id);
}
async function savePreferences(userId, payload) {
    await pool.query(`
      INSERT INTO preferences (user_id, min_preferred_age, max_preferred_age, preferred_city, same_city_only)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id)
      DO UPDATE SET
        min_preferred_age = EXCLUDED.min_preferred_age,
        max_preferred_age = EXCLUDED.max_preferred_age,
        preferred_city = EXCLUDED.preferred_city,
        same_city_only = EXCLUDED.same_city_only,
        updated_at = now()
    `, [
        userId,
        payload.minPreferredAge,
        payload.maxPreferredAge,
        payload.preferredCity ?? null,
        payload.sameCityOnly ?? false,
    ]);
}
async function saveDisabilities(userId, disabilities) {
    await pool.query('DELETE FROM user_disabilities WHERE user_id = $1', [userId]);
    for (const disability of disabilities) {
        await pool.query('INSERT INTO user_disabilities (user_id, disability) VALUES ($1, $2)', [
            userId,
            disability,
        ]);
    }
}
export async function createUser(payload) {
    const hashedPassword = await hashPassword(payload.password);
    const age = payload.age ?? 25;
    const city = payload.city ?? '';
    const bio = payload.bio ?? '';
    const accessibilityNeeds = payload.accessibilityNeeds ?? '';
    const avatarUrl = payload.avatarUrl ?? null;
    const disabilities = (payload.disabilities?.length ? payload.disabilities : ['other']);
    const minPreferredAge = payload.minPreferredAge ?? 22;
    const maxPreferredAge = payload.maxPreferredAge ?? 35;
    const preferredCity = payload.preferredCity ?? city;
    const sameCityOnly = payload.sameCityOnly ?? false;
    const { rows } = await pool.query(`
      INSERT INTO users (email, password_hash, full_name, age, city, bio, accessibility_needs, avatar_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [payload.email.trim(), hashedPassword, payload.fullName.trim(), age, city, bio, accessibilityNeeds, avatarUrl]);
    const user = rows[0];
    await saveDisabilities(user.id, disabilities);
    await savePreferences(user.id, { minPreferredAge, maxPreferredAge, preferredCity, sameCityOnly });
    return getUserProfile(user.id);
}
export async function verifyPassword(userId, password) {
    const hash = await getUserPasswordHashById(userId);
    if (!hash)
        return false;
    return comparePassword(password, hash);
}
export async function updateUserProfile(userId, payload) {
    const current = await getUserProfile(userId);
    if (!current)
        return null;
    const merged = {
        fullName: payload.fullName ?? current.fullName,
        age: payload.age ?? current.age,
        city: payload.city ?? current.city,
        bio: payload.bio ?? current.bio,
        avatarUrl: payload.avatarUrl ?? current.avatarUrl,
        accessibilityNeeds: payload.accessibilityNeeds ?? current.accessibilityNeeds,
        disabilities: payload.disabilities ?? current.disabilities,
        minPreferredAge: payload.minPreferredAge ?? current.minPreferredAge,
        maxPreferredAge: payload.maxPreferredAge ?? current.maxPreferredAge,
        preferredCity: payload.preferredCity ?? current.city,
        sameCityOnly: payload.sameCityOnly ?? false,
    };
    await pool.query(`
      UPDATE users
      SET full_name = $2,
          age = $3,
          city = $4,
          bio = $5,
          accessibility_needs = $6,
          avatar_url = $7
      WHERE id = $1
    `, [userId, merged.fullName, merged.age, merged.city, merged.bio, merged.accessibilityNeeds, merged.avatarUrl]);
    await saveDisabilities(userId, merged.disabilities);
    await savePreferences(userId, {
        minPreferredAge: merged.minPreferredAge,
        maxPreferredAge: merged.maxPreferredAge,
        preferredCity: merged.preferredCity,
        sameCityOnly: merged.sameCityOnly,
    });
    return getUserProfile(userId);
}
export async function getPreferences(userId) {
    return getPreferencesForUser(userId);
}
export async function updatePreferences(userId, payload) {
    await savePreferences(userId, payload);
    return getPreferencesForUser(userId);
}
export async function getDiscoveryUsers(userId) {
    const current = await getUserProfile(userId);
    if (!current)
        return [];
    const { rows } = await pool.query(`
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
    `, [userId]);
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
async function ensureMatch(userAId, userBId) {
    const [a, b] = userAId < userBId ? [userAId, userBId] : [userBId, userAId];
    const { rows } = await pool.query(`
      INSERT INTO matches (user_a_id, user_b_id)
      VALUES ($1, $2)
      ON CONFLICT (user_a_id, user_b_id) DO NOTHING
      RETURNING *
    `, [a, b]);
    if (rows[0]) {
        return rows[0];
    }
    const existing = await pool.query('SELECT * FROM matches WHERE user_a_id = $1 AND user_b_id = $2 LIMIT 1', [a, b]);
    return existing.rows[0] ?? null;
}
export async function createSwipe(userId, toUserId, action) {
    await pool.query(`
      INSERT INTO swipes (from_user_id, to_user_id, action)
      VALUES ($1, $2, $3)
      ON CONFLICT (from_user_id, to_user_id)
      DO UPDATE SET action = EXCLUDED.action, created_at = now()
    `, [userId, toUserId, action]);
    if (action !== 'like') {
        return { newMatchId: null };
    }
    const reciprocal = await pool.query(`
      SELECT 1
      FROM swipes
      WHERE from_user_id = $1
        AND to_user_id = $2
        AND action = 'like'
      LIMIT 1
    `, [toUserId, userId]);
    if (!reciprocal.rows.length) {
        return { newMatchId: null };
    }
    const match = await ensureMatch(userId, toUserId);
    return { newMatchId: match?.id ?? null };
}
export async function getMatchesForUser(userId) {
    const { rows } = await pool.query(`
      SELECT *
      FROM matches
      WHERE user_a_id = $1 OR user_b_id = $1
      ORDER BY matched_at DESC
    `, [userId]);
    const matches = [];
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
export async function getMatchById(matchId) {
    const { rows } = await pool.query('SELECT * FROM matches WHERE id = $1 LIMIT 1', [matchId]);
    const row = rows[0];
    if (!row)
        return null;
    return {
        id: row.id,
        userIds: [row.user_a_id, row.user_b_id],
        createdAt: row.matched_at.toISOString(),
    };
}
export async function getMessagesForMatch(matchId) {
    const { rows } = await pool.query(`
      SELECT *
      FROM messages
      WHERE match_id = $1
      ORDER BY created_at ASC
    `, [matchId]);
    return rows.map((row) => ({
        id: row.id,
        senderId: row.sender_id,
        text: row.body,
        createdAt: row.created_at.toISOString(),
    }));
}
export async function addMessageToMatch(matchId, senderId, text) {
    const { rows } = await pool.query(`
      INSERT INTO messages (match_id, sender_id, body)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [matchId, senderId, text]);
    const row = rows[0];
    return {
        id: row.id,
        senderId: row.sender_id,
        text: row.body,
        createdAt: row.created_at.toISOString(),
    };
}
export async function userIsInMatch(userId, matchId) {
    const match = await getMatchById(matchId);
    return Boolean(match && match.userIds.includes(userId));
}
export async function emailExists(email) {
    const record = await getUserAuthRecordByEmail(email);
    return Boolean(record);
}
