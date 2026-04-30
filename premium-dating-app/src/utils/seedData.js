import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const MOCK_USERS = [
  {
    name: 'Sarah', age: 26, gender: 'Female',
    bio: 'Love audiobooks, jazz music, and long walks. Looking for someone to share good vibes with. I am visually impaired and rely on a screen reader.',
    disability: 'Visual Impairment',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80',
    profileComplete: true, likes: [], passes: []
  },
  {
    name: 'David', age: 29, gender: 'Male',
    bio: 'Software engineer by day, amateur chef by night. I use a wheelchair and my favorite place is a fully accessible kitchen!',
    disability: 'Mobility Impairment',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80',
    profileComplete: true, likes: [], passes: []
  },
  {
    name: 'Elena', age: 24, gender: 'Female',
    bio: 'Deaf artist passionate about visual expression. Fluent in ASL. Lets go to an art gallery together.',
    disability: 'Deaf / Hard of Hearing',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&q=80',
    profileComplete: true, likes: [], passes: []
  },
  {
    name: 'Marcus', age: 31, gender: 'Male',
    bio: 'Neurodivergent thinker, bookworm, and cat dad. I appreciate clear communication and deep conversations over coffee.',
    disability: 'Neurodivergent',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80',
    profileComplete: true, likes: [], passes: []
  },
  {
    name: 'Aisha', age: 27, gender: 'Female',
    bio: 'Music producer and traveler. I have a chronic illness that limits my energy sometimes, so cozy movie nights are my favorite dates.',
    disability: 'Chronic Illness',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&q=80',
    profileComplete: true, likes: [], passes: []
  }
];

export const seedDatabase = async () => {
  try {
    for (const user of MOCK_USERS) {
      await addDoc(collection(db, 'users'), user);
    }
    alert('Dummy data seeded successfully! Go to Home to see candidates.');
  } catch (err) {
    alert('Error seeding data: ' + err.message);
  }
};
