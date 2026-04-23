-- BlindTinder MVP PostgreSQL schema
-- Core flow: auth -> profile/preferences -> discovery -> swipes -> matches -> messages

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE disability_tag AS ENUM (
    'visual',
    'hearing',
    'mobility',
    'speech',
    'neurodivergent',
    'chronic-illness',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE swipe_action AS ENUM ('like', 'pass');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  age integer NOT NULL CHECK (age BETWEEN 18 AND 120),
  city text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  accessibility_needs text NOT NULL DEFAULT '',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_disabilities (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  disability disability_tag NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, disability)
);

CREATE TABLE IF NOT EXISTS preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  min_preferred_age integer NOT NULL DEFAULT 18 CHECK (min_preferred_age BETWEEN 18 AND 120),
  max_preferred_age integer NOT NULL DEFAULT 99 CHECK (max_preferred_age BETWEEN 18 AND 120),
  preferred_city text,
  same_city_only boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (min_preferred_age <= max_preferred_age)
);

CREATE TABLE IF NOT EXISTS swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action swipe_action NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_user_id, to_user_id),
  CHECK (from_user_id <> to_user_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_at timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a_id <> user_b_id),
  CHECK (user_a_id < user_b_id),
  UNIQUE (user_a_id, user_b_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_disabilities_disability ON user_disabilities (disability);
CREATE INDEX IF NOT EXISTS idx_preferences_city ON preferences (preferred_city);
CREATE INDEX IF NOT EXISTS idx_swipes_from_user_id ON swipes (from_user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_to_user_id ON swipes (to_user_id);
CREATE INDEX IF NOT EXISTS idx_swipes_action ON swipes (action);
CREATE INDEX IF NOT EXISTS idx_matches_user_a_id ON matches (user_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_b_id ON matches (user_b_id);
CREATE INDEX IF NOT EXISTS idx_messages_match_id_created_at ON messages (match_id, created_at);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_preferences_updated_at ON preferences;
CREATE TRIGGER trg_preferences_updated_at
BEFORE UPDATE ON preferences
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();