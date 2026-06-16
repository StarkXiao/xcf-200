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

export interface UserStats {
  totalLetters: number;
  totalLikes: number;
  totalReplies: number;
  totalFavorites: number;
  emotionStats: Record<string, number>;
}

export type DeliveryStage = 'created' | 'star_port' | 'time_tunnel' | 'parallel_gateway' | 'delivering' | 'delivered' | 'exception';
export type ExceptionType = 'time_anomaly' | 'cosmic_storm' | 'recipient_lost' | 'unknown';
export type CompensationType = 'accelerate' | 'reroute' | 'resend' | 'compensate_letter';

export interface DeliveryStageInfo {
  stage: DeliveryStage;
  label: string;
  description: string;
  icon: string;
  estimatedDuration: number;
  color: string;
}

export interface DeliveryLog {
  id: string;
  stage: DeliveryStage;
  timestamp: string;
  message: string;
  location?: string;
  isException?: boolean;
}

export interface DeliveryException {
  id: string;
  type: ExceptionType;
  stage: DeliveryStage;
  message: string;
  detectedAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolution?: string;
  availableCompensations: CompensationType[];
}

export interface DeliveryTracking {
  letterId: string;
  currentStage: DeliveryStage;
  estimatedArrival: string;
  createdAt: string;
  deliveredAt?: string;
  isDelayed: boolean;
  progress: number;
  logs: DeliveryLog[];
  exceptions: DeliveryException[];
  hasActiveException: boolean;
}

export interface CompensationOption {
  type: CompensationType;
  label: string;
  description: string;
  icon: string;
  cost: number;
}

export interface MailRouteStats {
  totalInTransit: number;
  totalDelivered: number;
  totalExceptions: number;
  totalDelayed: number;
  averageDeliveryTime: number;
  stageDistribution: Record<DeliveryStage, number>;
}

export interface LetterFormData {
  recipient: string;
  recipientType: string;
  title: string;
  content: string;
  emotions: string[];
  isPublic: boolean;
  isAnonymous: boolean;
  deliverySpeed?: 'standard' | 'express' | 'instant';
  scheduledDeliveryAt?: string;
}
