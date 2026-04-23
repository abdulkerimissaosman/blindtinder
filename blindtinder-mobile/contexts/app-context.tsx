import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  createSwipe,
  getDiscovery,
  getMe,
  getMatches,
  getMatchMessages as backendGetMatchMessages,
  isBackendConfigured,
  postAuth,
  sendMatchMessage,
  updateMe,
} from '@/lib/backend';
import {
  connectRealtime,
  disconnectRealtime,
  joinMatchRoom,
  onMatchCreated,
  onMessageCreated,
} from '@/lib/realtime';

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
  avatarUrl: string;
  disabilities: DisabilityTag[];
  accessibilityNeeds: string;
  minPreferredAge: number;
  maxPreferredAge: number;
  preferredCity: string;
  sameCityOnly: boolean;
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
  age: string;
  city: string;
  bio: string;
  avatarUrl: string;
  accessibilityNeeds: string;
  minPreferredAge: string;
  maxPreferredAge: string;
  preferredCity: string;
  sameCityOnly: boolean;
  disabilities: DisabilityTag[];
};

type ProfileInput = Pick<
  UserProfile,
  | 'fullName'
  | 'age'
  | 'city'
  | 'bio'
  | 'avatarUrl'
  | 'disabilities'
  | 'accessibilityNeeds'
  | 'minPreferredAge'
  | 'maxPreferredAge'
  | 'preferredCity'
  | 'sameCityOnly'
>;

type AppContextValue = {
  isBootstrapping: boolean;
  currentUser: UserProfile | null;
  users: UserProfile[];
  swipes: SwipeRecord[];
  matches: Match[];
  login: (payload: AuthInput) => Promise<{ ok: boolean; error?: string }>;
  register: (payload: RegisterInput) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateCurrentUserProfile: (payload: ProfileInput) => Promise<void> | void;
  getDiscoveryUsers: () => Promise<UserProfile[]> | UserProfile[];
  swipe: (toUserId: string, action: SwipeAction) => Promise<{ newMatchId?: string }> | { newMatchId?: string };
  getCurrentUserMatches: () => Promise<Match[]> | Match[];
  getMatchMessages: (matchId: string) => Promise<Message[]> | Message[];
  getUserById: (id: string) => UserProfile | undefined;
  sendMessage: (matchId: string, text: string) => Promise<void> | void;
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
    avatarUrl: '',
    disabilities: ['hearing'],
    accessibilityNeeds: 'Prefer text chat before calls.',
    minPreferredAge: 24,
    maxPreferredAge: 35,
    preferredCity: 'Cairo',
    sameCityOnly: false,
  },
  {
    id: 'u2',
    email: 'youssef@example.com',
    password: 'password123',
    fullName: 'Youssef Karim',
    age: 29,
    city: 'Cairo',
    bio: 'Wheelchair user, software engineer, and board game fan.',
    avatarUrl: '',
    disabilities: ['mobility'],
    accessibilityNeeds: 'Accessible meet-up locations only.',
    minPreferredAge: 23,
    maxPreferredAge: 34,
    preferredCity: 'Cairo',
    sameCityOnly: false,
  },
  {
    id: 'u3',
    email: 'mona@example.com',
    password: 'password123',
    fullName: 'Mona Hany',
    age: 27,
    city: 'Giza',
    bio: 'Designer and cat mom. Looking for meaningful connections.',
    avatarUrl: '',
    disabilities: ['visual'],
    accessibilityNeeds: 'Needs high-contrast visual content.',
    minPreferredAge: 25,
    maxPreferredAge: 36,
    preferredCity: 'Giza',
    sameCityOnly: false,
  },
];

const AppContext = createContext<AppContextValue | null>(null);
const SESSION_TOKEN_STORAGE_KEY = 'blindtinder.sessionToken';

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function mergeMessageIntoMatch(match: Match, message: Message): Match {
  if (match.messages.some((item) => item.id === message.id)) {
    return match;
  }

  return {
    ...match,
    messages: [...match.messages, message],
  };
}

function normalizeUserProfile(user: Partial<UserProfile> & { id: string; email: string; fullName: string }): UserProfile {
  return {
    id: user.id,
    email: user.email,
    password: user.password ?? '',
    fullName: user.fullName,
    age: typeof user.age === 'number' ? user.age : 25,
    city: user.city ?? '',
    bio: user.bio ?? '',
    avatarUrl: user.avatarUrl ?? '',
    disabilities: Array.isArray(user.disabilities) ? user.disabilities : ['other'],
    accessibilityNeeds: user.accessibilityNeeds ?? '',
    minPreferredAge: typeof user.minPreferredAge === 'number' ? user.minPreferredAge : 22,
    maxPreferredAge: typeof user.maxPreferredAge === 'number' ? user.maxPreferredAge : 35,
    preferredCity: user.preferredCity ?? '',
    sameCityOnly: typeof user.sameCityOnly === 'boolean' ? user.sameCityOnly : false,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [swipes, setSwipes] = useState<SwipeRecord[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId]
  );

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        let token: string | null = null;
        try {
          token = await AsyncStorage.getItem(SESSION_TOKEN_STORAGE_KEY);
        } catch (storageError) {
          // AsyncStorage native module not available in this environment
          console.warn('AsyncStorage unavailable, using in-memory only:', storageError);
          token = null;
        }

        if (!token) {
          return;
        }

        const user = normalizeUserProfile(await getMe<UserProfile>(token));
        if (!active) {
          return;
        }

        setSessionToken(token);
        setUsers((prev) => {
          const others = prev.filter((item) => item.id !== user.id);
          return [...others, user];
        });
        setCurrentUserId(user.id);
      } catch {
        try {
          await AsyncStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
        } catch (storageError) {
          // AsyncStorage removal failed, continue anyway
          console.warn('AsyncStorage removeItem failed:', storageError);
        }
        if (!active) {
          return;
        }
        setSessionToken(null);
        setCurrentUserId(null);
      } finally {
        if (active) {
          setIsBootstrapping(false);
        }
      }
    };

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionToken || !currentUserId) {
      disconnectRealtime();
      return;
    }

    const socket = connectRealtime(sessionToken);

    const stopMatchCreated = onMatchCreated(({ match }) => {
      setMatches((prev) => {
        if (prev.some((item) => item.id === match.id)) {
          return prev;
        }

        return [
          {
            ...match,
            messages: [],
          },
          ...prev,
        ];
      });
    });

    const stopMessageCreated = onMessageCreated(({ matchId, message }) => {
      setMatches((prev) =>
        prev.map((match) => (match.id === matchId ? mergeMessageIntoMatch(match, message) : match))
      );
    });

    socket.on('connect_error', (error) => {
      console.warn('Realtime connection error:', error.message);
    });

    return () => {
      stopMatchCreated();
      stopMessageCreated();
      socket.off('connect_error');
      disconnectRealtime();
    };
  }, [currentUserId, sessionToken]);

  useEffect(() => {
    if (!sessionToken || !currentUserId || matches.length === 0) {
      return;
    }

    for (const match of matches) {
      joinMatchRoom(match.id);
    }
  }, [currentUserId, matches, sessionToken]);

  const login = async ({ email, password }: AuthInput) => {
    if (isBackendConfigured()) {
      try {
        const response = await postAuth<UserProfile>('/auth/login', { email, password });
        const token = response.token ?? response.data?.token ?? null;
        const user = response.user ?? response.data?.user ?? null;

        if (!token || !user) {
          return { ok: false, error: 'Invalid login response from server.' };
        }

        try {
          await AsyncStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
        } catch (storageError) {
          console.warn('AsyncStorage setItem failed:', storageError);
        }
        setSessionToken(token);
        const normalizedUser = normalizeUserProfile(user);

        setUsers((prev) => {
          const others = prev.filter((item) => item.id !== normalizedUser.id);
          return [...others, normalizedUser];
        });
        setCurrentUserId(normalizedUser.id);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Login failed.' };
      }
    }

    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!found) {
      return { ok: false, error: 'No account found for this email.' };
    }
    if (found.password !== password) {
      return { ok: false, error: 'Incorrect password.' };
    }
    try {
      await AsyncStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    } catch (storageError) {
      console.warn('AsyncStorage removeItem failed:', storageError);
    }
    setCurrentUserId(found.id);
    setSessionToken(null);
    return { ok: true };
  };

  const register = async (payload: RegisterInput) => {
    if (isBackendConfigured()) {
      try {
        const response = await postAuth<UserProfile>('/auth/register', payload);
        const token = response.token ?? response.data?.token ?? null;
        const user = response.user ?? response.data?.user ?? null;

        if (!token || !user) {
          return { ok: false, error: 'Invalid register response from server.' };
        }

        try {
          await AsyncStorage.setItem(SESSION_TOKEN_STORAGE_KEY, token);
        } catch (storageError) {
          console.warn('AsyncStorage setItem failed:', storageError);
        }
        setSessionToken(token);
        const normalizedUser = normalizeUserProfile(user);

        setUsers((prev) => {
          const others = prev.filter((item) => item.id !== normalizedUser.id);
          return [...others, normalizedUser];
        });
        setCurrentUserId(normalizedUser.id);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Registration failed.' };
      }
    }

    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (exists) {
      return { ok: false, error: 'Email is already registered.' };
    }

    const newUser: UserProfile = {
      id: makeId('u'),
      email: payload.email.trim(),
      password,
      fullName: payload.fullName.trim() || 'New User',
      age: Number(payload.age) || 25,
      city: payload.city.trim(),
      bio: payload.bio.trim(),
      avatarUrl: payload.avatarUrl.trim(),
      disabilities: payload.disabilities.length ? payload.disabilities : ['other'],
      accessibilityNeeds: payload.accessibilityNeeds.trim(),
      minPreferredAge: Number(payload.minPreferredAge) || 22,
      maxPreferredAge: Number(payload.maxPreferredAge) || 35,
      preferredCity: payload.preferredCity.trim(),
      sameCityOnly: payload.sameCityOnly,
    };

    try {
      await AsyncStorage.removeItem(SESSION_TOKEN_STORAGE_KEY);
    } catch (storageError) {
      console.warn('AsyncStorage removeItem failed:', storageError);
    }
    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    setSessionToken(null);
    return { ok: true };
  };

  const logout = () => {
    void AsyncStorage.removeItem(SESSION_TOKEN_STORAGE_KEY).catch((error) => {
      console.warn('AsyncStorage removeItem failed during logout:', error);
    });
    setCurrentUserId(null);
    setSessionToken(null);
  };

  const updateCurrentUserProfile = async (payload: ProfileInput) => {
    if (!currentUserId) return;

    if (sessionToken) {
      try {
        const updated = await updateMe<UserProfile>(sessionToken, payload);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === currentUserId
              ? {
                  ...u,
                  ...updated,
                }
              : u
          )
        );
        return;
      } catch {
        // Fall back to local state if the backend is unavailable.
      }
    }

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

  const getCurrentUserMatches = async () => {
    if (!currentUserId) return [];

    if (sessionToken) {
      try {
        const nextMatches = await getMatches<Match>(sessionToken);
        setMatches(nextMatches);
        return nextMatches;
      } catch {
        // Fall back to local state.
      }
    }

    return matches.filter((m) => m.userIds.includes(currentUserId));
  };

  const getMatchMessages = async (matchId: string) => {
    const localMatch = matches.find((match) => match.id === matchId);

    if (sessionToken) {
      try {
        const messages = await backendGetMatchMessages<Message>(sessionToken, matchId);
        if (localMatch) {
          setMatches((prev) =>
            prev.map((match) =>
              match.id === matchId
                ? {
                    ...match,
                    messages,
                  }
                : match
            )
          );
        }
        return messages;
      } catch {
        // Fall back to local state.
      }
    }

    return localMatch?.messages ?? [];
  };

  const hasMatchBetween = (a: string, b: string) => {
    const [x, y] = normalizePair(a, b);
    return matches.some((m) => {
      const [m1, m2] = normalizePair(m.userIds[0], m.userIds[1]);
      return m1 === x && m2 === y;
    });
  };

  const getDiscoveryUsers = async () => {
    if (!currentUser) return [];

    if (sessionToken) {
      try {
        const remoteUsers = await getDiscovery<UserProfile>(sessionToken);
        return remoteUsers.map((user) => normalizeUserProfile(user));
      } catch {
        // Fall back to local state.
      }
    }

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

  const swipe = async (toUserId: string, action: SwipeAction) => {
    if (!currentUserId) return {};

    if (sessionToken) {
      try {
        return await createSwipe<{ newMatchId?: string }>(sessionToken, {
          toUserId,
          action,
        });
      } catch {
        // Fall back to local state.
      }
    }

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

  const sendMessage = async (matchId: string, text: string) => {
    if (!currentUserId || !text.trim()) return;

    if (sessionToken) {
      try {
        const savedMessage = await sendMatchMessage<Message>(sessionToken, matchId, { text });
        setMatches((prev) =>
          prev.map((match) => (match.id === matchId ? mergeMessageIntoMatch(match, savedMessage) : match))
        );
        return;
      } catch {
        // Fall back to local state.
      }
    }

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
    isBootstrapping,
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
    getMatchMessages,
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
