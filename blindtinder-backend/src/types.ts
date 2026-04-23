export type DisabilityTag =
  | 'visual'
  | 'hearing'
  | 'mobility'
  | 'speech'
  | 'neurodivergent'
  | 'chronic-illness'
  | 'other';

export type SwipeAction = 'like' | 'pass';

export type ApiUser = {
  id: string;
  email: string;
  fullName: string;
  age: number;
  city: string;
  bio: string;
  disabilities: DisabilityTag[];
  accessibilityNeeds: string;
  minPreferredAge: number;
  maxPreferredAge: number;
};

export type AuthenticatedRequest = {
  userId: string;
};

export type MatchRecord = {
  id: string;
  userIds: [string, string];
  createdAt: string;
  messages: MessageRecord[];
};

export type MessageRecord = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
};