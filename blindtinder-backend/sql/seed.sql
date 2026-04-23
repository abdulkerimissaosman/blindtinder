INSERT INTO users (id, email, password_hash, full_name, age, city, bio, accessibility_needs)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'sara@example.com', '$2a$10$0e9VjD0rXq4N0w1mZP4v4O1C1tJXr2tQ8lF6F3mYw0W3n0S5i6V5y', 'Sara Ali', 26, 'Cairo', 'Love poetry, coffee, and long conversations about life.', 'Prefer text chat before calls.'),
  ('22222222-2222-2222-2222-222222222222', 'youssef@example.com', '$2a$10$0e9VjD0rXq4N0w1mZP4v4O1C1tJXr2tQ8lF6F3mYw0W3n0S5i6V5y', 'Youssef Karim', 29, 'Cairo', 'Wheelchair user, software engineer, and board game fan.', 'Accessible meet-up locations only.'),
  ('33333333-3333-3333-3333-333333333333', 'mona@example.com', '$2a$10$0e9VjD0rXq4N0w1mZP4v4O1C1tJXr2tQ8lF6F3mYw0W3n0S5i6V5y', 'Mona Hany', 27, 'Giza', 'Designer and cat mom. Looking for meaningful connections.', 'Needs high-contrast visual content.')
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_disabilities (user_id, disability)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'hearing'),
  ('22222222-2222-2222-2222-222222222222', 'mobility'),
  ('33333333-3333-3333-3333-333333333333', 'visual')
ON CONFLICT DO NOTHING;

INSERT INTO preferences (user_id, min_preferred_age, max_preferred_age, preferred_city, same_city_only)
VALUES
  ('11111111-1111-1111-1111-111111111111', 24, 35, 'Cairo', true),
  ('22222222-2222-2222-2222-222222222222', 23, 34, 'Cairo', true),
  ('33333333-3333-3333-3333-333333333333', 25, 36, 'Giza', false)
ON CONFLICT (user_id) DO NOTHING;