import React, { createContext, useContext, useMemo, useState } from 'react';

export type DisabilityTag =
  | 'visual'
  | 'hearing'
  | 'mobility'
  | 'speech'
  | 'neurodivergent'
  | 'chronic-illness'
  | 'other';

export type UserProfile = {
  id: string;
  email: string;
  password: string;
  fullName: string;
  age: number;
  city: string;
  bio: string;
  disabilities: DisabilityTag[];
  accessibilityNeeds: string;
  minPreferredAge: number;
  maxPreferredAge: number;
};

export type SwipeAction = 'like' | 'pass';

export type SwipeRecord = {
  fromUserId: string;
  toUserId: string;
  action: SwipeAction;
  createdAt: string;
};

export type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export type Match = {
  id: string;
  userIds: [string, string];
  messages: Message[];
  createdAt: string;
};

type AuthInput = {
  email: string;
  password: string;
};

type RegisterInput = AuthInput & {
  fullName: string;
};

type ProfileInput = Pick<
  UserProfile,
  | 'fullName'
  | 'age'
  | 'city'
  | 'bio'
  | 'disabilities'
  | 'accessibilityNeeds'
  | 'minPreferredAge'
  | 'maxPreferredAge'
>;

type AppContextValue = {
  currentUser: UserProfile | null;
  users: UserProfile[];
  swipes: SwipeRecord[];
  matches: Match[];
  login: (payload: AuthInput) => { ok: boolean; error?: string };
  register: (payload: RegisterInput) => { ok: boolean; error?: string };
  logout: () => void;
  updateCurrentUserProfile: (payload: ProfileInput) => void;
  getDiscoveryUsers: () => UserProfile[];
  swipe: (toUserId: string, action: SwipeAction) => { newMatchId?: string };
  getCurrentUserMatches: () => Match[];
  getUserById: (id: string) => UserProfile | undefined;
  sendMessage: (matchId: string, text: string) => void;
};

const initialUsers: UserProfile[] = [
  {
    id: 'u1',
    email: 'sara@example.com',
    password: 'password123',
    fullName: 'Sara Ali',
    age: 26,
    city: 'Cairo',
    bio: 'Love poetry, coffee, and long conversations about life.',
    disabilities: ['hearing'],
    accessibilityNeeds: 'Prefer text chat before calls.',
    minPreferredAge: 24,
    maxPreferredAge: 35,
  },
  {
    id: 'u2',
    email: 'youssef@example.com',
    password: 'password123',
    fullName: 'Youssef Karim',
    age: 29,
    city: 'Cairo',
    bio: 'Wheelchair user, software engineer, and board game fan.',
    disabilities: ['mobility'],
    accessibilityNeeds: 'Accessible meet-up locations only.',
    minPreferredAge: 23,
    maxPreferredAge: 34,
  },
  {
    id: 'u3',
    email: 'mona@example.com',
    password: 'password123',
    fullName: 'Mona Hany',
    age: 27,
    city: 'Giza',
    bio: 'Designer and cat mom. Looking for meaningful connections.',
    disabilities: ['visual'],
    accessibilityNeeds: 'Needs high-contrast visual content.',
    minPreferredAge: 25,
    maxPreferredAge: 36,
  },
];

const AppContext = createContext<AppContextValue | null>(null);

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [swipes, setSwipes] = useState<SwipeRecord[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId]
  );

  const login = ({ email, password }: AuthInput) => {
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!found) {
      return { ok: false, error: 'No account found for this email.' };
    }
    if (found.password !== password) {
      return { ok: false, error: 'Incorrect password.' };
    }
    setCurrentUserId(found.id);
    return { ok: true };
  };

  const register = ({ email, password, fullName }: RegisterInput) => {
    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (exists) {
      return { ok: false, error: 'Email is already registered.' };
    }

    const newUser: UserProfile = {
      id: makeId('u'),
      email: email.trim(),
      password,
      fullName: fullName.trim() || 'New User',
      age: 25,
      city: '',
      bio: '',
      disabilities: ['other'],
      accessibilityNeeds: '',
      minPreferredAge: 22,
      maxPreferredAge: 35,
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    return { ok: true };
  };

  const logout = () => {
    setCurrentUserId(null);
  };

  const updateCurrentUserProfile = (payload: ProfileInput) => {
    if (!currentUserId) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === currentUserId
          ? {
              ...u,
              ...payload,
            }
          : u
      )
    );
  };

  const getCurrentUserMatches = () => {
    if (!currentUserId) return [];
    return matches.filter((m) => m.userIds.includes(currentUserId));
  };

  const hasMatchBetween = (a: string, b: string) => {
    const [x, y] = normalizePair(a, b);
    return matches.some((m) => {
      const [m1, m2] = normalizePair(m.userIds[0], m.userIds[1]);
      return m1 === x && m2 === y;
    });
  };

  const getDiscoveryUsers = () => {
    if (!currentUser) return [];

    const alreadySwiped = new Set(
      swipes.filter((s) => s.fromUserId === currentUser.id).map((s) => s.toUserId)
    );

    return users.filter((u) => {
      if (u.id === currentUser.id) return false;
      if (alreadySwiped.has(u.id)) return false;
      if (hasMatchBetween(currentUser.id, u.id)) return false;

      const withinAge = u.age >= currentUser.minPreferredAge && u.age <= currentUser.maxPreferredAge;
      const sameCity = !currentUser.city || u.city.toLowerCase() === currentUser.city.toLowerCase();
      return withinAge && sameCity;
    });
  };

  const swipe = (toUserId: string, action: SwipeAction) => {
    if (!currentUserId) return {};

    const newSwipe: SwipeRecord = {
      fromUserId: currentUserId,
      toUserId,
      action,
      createdAt: new Date().toISOString(),
    };

    setSwipes((prev) => [...prev, newSwipe]);

    if (action !== 'like') {
      return {};
    }

    const reciprocalLike = swipes.find(
      (s) => s.fromUserId === toUserId && s.toUserId === currentUserId && s.action === 'like'
    );

    if (!reciprocalLike || hasMatchBetween(currentUserId, toUserId)) {
      return {};
    }

    const [a, b] = normalizePair(currentUserId, toUserId);
    const newMatch: Match = {
      id: makeId('m'),
      userIds: [a, b],
      messages: [],
      createdAt: new Date().toISOString(),
    };

    setMatches((prev) => [...prev, newMatch]);
    return { newMatchId: newMatch.id };
  };

  const getUserById = (id: string) => users.find((u) => u.id === id);

  const sendMessage = (matchId: string, text: string) => {
    if (!currentUserId || !text.trim()) return;

    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;

        return {
          ...m,
          messages: [
            ...m.messages,
            {
              id: makeId('msg'),
              senderId: currentUserId,
              text: text.trim(),
              createdAt: new Date().toISOString(),
            },
          ],
        };
      })
    );
  };

  const value: AppContextValue = {
    currentUser,
    users,
    swipes,
    matches,
    login,
    register,
    logout,
    updateCurrentUserProfile,
    getDiscoveryUsers,
    swipe,
    getCurrentUserMatches,
    getUserById,
    sendMessage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used inside AppProvider');
  }
  return ctx;
}
