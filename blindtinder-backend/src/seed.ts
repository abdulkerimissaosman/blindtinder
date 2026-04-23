import 'dotenv/config';

import { pool } from './db.js';
import { createUser, emailExists } from './repository.js';

async function main() {
  const users = [
    {
      email: 'sara@example.com',
      password: 'password123',
      fullName: 'Sara Ali',
      age: 26,
      city: 'Cairo',
      bio: 'Love poetry, coffee, and long conversations about life.',
      disabilities: ['hearing' as const],
      accessibilityNeeds: 'Prefer text chat before calls.',
      minPreferredAge: 24,
      maxPreferredAge: 35,
    },
    {
      email: 'youssef@example.com',
      password: 'password123',
      fullName: 'Youssef Karim',
      age: 29,
      city: 'Cairo',
      bio: 'Wheelchair user, software engineer, and board game fan.',
      disabilities: ['mobility' as const],
      accessibilityNeeds: 'Accessible meet-up locations only.',
      minPreferredAge: 23,
      maxPreferredAge: 34,
    },
    {
      email: 'mona@example.com',
      password: 'password123',
      fullName: 'Mona Hany',
      age: 27,
      city: 'Giza',
      bio: 'Designer and cat mom. Looking for meaningful connections.',
      disabilities: ['visual' as const],
      accessibilityNeeds: 'Needs high-contrast visual content.',
      minPreferredAge: 25,
      maxPreferredAge: 36,
    },
    {
      email: 'omar@example.com',
      password: 'password123',
      fullName: 'Omar Nabil',
      age: 30,
      city: 'Cairo',
      bio: 'Podcast lover, football fan, and weekend traveler.',
      disabilities: ['speech' as const],
      accessibilityNeeds: 'Prefers text-first communication.',
      minPreferredAge: 24,
      maxPreferredAge: 38,
    },
    {
      email: 'nour@example.com',
      password: 'password123',
      fullName: 'Nour Salem',
      age: 25,
      city: 'Alexandria',
      bio: 'Bookworm, painter, and sunset walker by the sea.',
      disabilities: ['neurodivergent' as const],
      accessibilityNeeds: 'Likes clear plans and low-noise meetups.',
      minPreferredAge: 23,
      maxPreferredAge: 34,
    },
  ];

  for (const user of users) {
    if (!(await emailExists(user.email))) {
      await createUser(user);
    }
  }

  console.log('Seed complete');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });