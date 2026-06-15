export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  createdAt: string;
  sentLetters: number;
  receivedLetters: number;
}

export interface Reply {
  id: string;
  letterId: string;
  fromParallel: string;
  senderName: string;
  content: string;
  emotion: string;
  createdAt: string;
}

export interface Letter {
  id: string;
  senderId: string;
  senderName: string;
  recipient: string;
  recipientType: 'future' | 'past' | 'parallel' | 'unknown';
  title: string;
  content: string;
  emotions: string[];
  isPublic: boolean;
  isAnonymous: boolean;
  likes: number;
  createdAt: string;
  deliverAt: string;
  replies: Reply[];
}

export interface LetterListItem {
  id: string;
  senderName: string;
  recipient: string;
  recipientType: string;
  title: string;
  content: string;
  emotions: string[];
  likes: number;
  repliesCount: number;
  createdAt: string;
}

export interface Emotion {
  id: string;
  name: string;
  color: string;
  icon: string;
  count: number;
}

export interface Favorite {
  id: string;
  userId: string;
  letterId: string;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface LetterFormData {
  recipient: string;
  recipientType: string;
  title: string;
  content: string;
  emotions: string[];
  isPublic: boolean;
  isAnonymous: boolean;
}

export interface UserStats {
  totalLetters: number;
  totalLikes: number;
  totalReplies: number;
  totalFavorites: number;
  emotionStats: Record<string, number>;
}
