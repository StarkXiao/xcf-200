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

export interface ArchiveLetter extends LetterListItem {
  senderId: string;
  isPublic: boolean;
}

export interface ArchiveFilterEmotion extends Emotion {
  archiveCount: number;
}

export interface ArchiveFilterRecipientType {
  key: string;
  label: string;
  icon: string;
  count: number;
}

export interface ArchiveFilters {
  emotions: ArchiveFilterEmotion[];
  recipientTypes: ArchiveFilterRecipientType[];
  timePeriods: string[];
  totalLetters: number;
}

export interface ArchiveTimelinePeriod {
  key: string;
  label: string;
  order: number;
  count: number;
  letters: ArchiveLetter[];
}

export interface ArchiveQueryParams {
  page?: number;
  limit?: number;
  emotion?: string | string[];
  recipientType?: string | string[];
  timePeriod?: string;
  keyword?: string;
  sort?: 'latest' | 'popular' | 'oldest';
  scope?: 'public' | 'user' | 'favorites';
  userId?: string;
}

export interface UserEmotionStat {
  name: string;
  count: number;
  color: string;
  icon: string;
  percentage: number;
}

export interface UserRecipientStat {
  key: string;
  label: string;
  icon: string;
  count: number;
  percentage: number;
}

export interface UserMonthlyTimeline {
  month: string;
  count: number;
}

export interface UserPersonaTag {
  icon: string;
  label: string;
  desc: string;
}

export interface UserArchiveStats {
  overview: {
    totalLetters: number;
    publicLetters: number;
    privateLetters: number;
    favoriteLetters: number;
    totalLikes: number;
    totalReplies: number;
    avgEmotionsPerLetter: number;
    replyRate: number;
    lettersWithReplies: number;
  };
  topEmotions: UserEmotionStat[];
  emotionStats: Record<string, number>;
  recipientStats: UserRecipientStat[];
  monthlyTimeline: UserMonthlyTimeline[];
  timePeriodStats: Record<string, number>;
  mostUsedRecipientType: { key: string; count: number } | null;
  personaTags: UserPersonaTag[];
  joinDate: string;
}

export interface TracebackEmotionDetail {
  name: string;
  color: string;
  icon: string;
  relatedCount: number;
}

export interface TracebackLetter extends ArchiveLetter {
  sharedEmotions?: number;
}

export interface LetterTraceback {
  currentLetter: ArchiveLetter;
  emotionDetail: TracebackEmotionDetail[];
  sameEmotionLetters: TracebackLetter[];
  sameRecipientLetters: ArchiveLetter[];
  sameSenderLetters: ArchiveLetter[];
  samePeriodLetters: ArchiveLetter[];
  periodInfo: { key: string; label: string; order: number; count: number };
  recipientInfo: { key: string; label: string; icon: string; totalCount: number };
}

export interface MatchDetail {
  rule: string;
  score: number;
  reason: string;
}

export interface ReplyTask {
  id: string;
  letterId: string;
  title: string;
  content: string;
  emotions: string[];
  recipientType: string;
  recipient: string;
  senderName: string;
  isAnonymous: boolean;
  repliesCount: number;
  createdAt: string;
  matchScore: number;
  matchDetails: MatchDetail[];
  matchMaxScore: number;
  replyDeadline: string | null;
  rewardStars: number;
}

export interface MatchRule {
  key: string;
  label: string;
  weight: number;
}

export interface AnonymousIdentity {
  anonymousId: string;
  anonymousName: string;
}

export interface ReplyReview {
  rating: number;
  tags: string[];
  comment: string;
  reviewerId: string | null;
  createdAt: string;
}

export interface StrangerReply extends Reply {
  isStrangerReply: boolean;
  replierId: string | null;
  anonymousId: string;
  review: ReplyReview | null;
}

export interface ReplyReviewTags {
  positive: string[];
  negative: string[];
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  relatedId: string | null;
  read: boolean;
  readAt?: string;
  createdAt: string;
}

export interface ReplyLevel {
  min: number;
  name: string;
  icon: string;
}

export interface ReplyLevelProgress {
  current: number;
  next: number | null;
  progress: number;
}

export interface UserReplyStats {
  totalReplies: number;
  receivedReplies: number;
  totalReviews: number;
  averageRating: number;
  level: ReplyLevel;
  nextLevelProgress: ReplyLevelProgress;
}

export interface ReplyProfile {
  userId: string;
  preferredEmotions: string[];
  preferredTypes: string[];
  bio: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReplyPoolFilters {
  emotion?: string;
  recipientType?: string;
  needReply?: boolean;
  limit?: number;
  userId?: string;
}

export interface SubmitReplyData {
  letterId: string;
  content: string;
  emotion?: string;
  anonymousName?: string;
  replierId?: string;
}

export interface SubmitReviewData {
  replyId: string;
  rating: number;
  tags?: string[];
  comment?: string;
  reviewerId?: string;
}

export interface EmotionAnalysisItem {
  name: string;
  color: string;
  icon: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

export interface EmotionAnalysisData {
  dominantEmotion: { name: string; color: string; icon: string; percentage: number } | null;
  emotionDistribution: EmotionAnalysisItem[];
  totalRecords: number;
  recentEmotion: string | null;
  emotionBalance: number;
}

export interface WritingTemplate {
  id: string;
  emotion: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  prompts: string[];
  opening: string;
  closing: string;
  tips: string[];
}

export interface EmotionRecord {
  id: string;
  userId: string;
  emotion: string;
  intensity: number;
  note: string;
  createdAt: string;
}

export interface EmotionPhaseRecord {
  period: string;
  label: string;
  startDate: string;
  endDate: string;
  dominantEmotion: string;
  dominantEmotionColor: string;
  dominantEmotionIcon: string;
  recordCount: number;
  emotionDistribution: { name: string; color: string; icon: string; count: number }[];
  averageIntensity: number;
}

export interface EmotionTimelineData {
  phases: EmotionPhaseRecord[];
  totalRecords: number;
  currentPhase: EmotionPhaseRecord | null;
}

export interface RecommendedLetter {
  id: string;
  title: string;
  content: string;
  senderName: string;
  emotions: string[];
  likes: number;
  repliesCount: number;
  createdAt: string;
  recipientType: string;
  matchReason: string;
}

export interface ActivityPrize {
  rank: number;
  title: string;
  honor: string;
  description: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  theme: string;
  coverImage: string;
  status: 'upcoming' | 'active' | 'voting' | 'settled';
  registrationStart: string;
  registrationEnd: string;
  submissionStart: string;
  submissionEnd: string;
  votingStart: string;
  votingEnd: string;
  settlementDate: string;
  createdAt: string;
  createdBy: string;
  participantCount: number;
  workCount: number;
  totalLikes: number;
  prizes: ActivityPrize[];
  rules: string[];
  currentStage?: string;
  stageLabel?: string;
}

export interface Registration {
  id: string;
  activityId: string;
  userId: string;
  username: string;
  userAvatar: string;
  status: 'pending' | 'approved' | 'rejected';
  applyReason: string;
  reviewer?: string;
  reviewComment?: string;
  reviewedAt?: string;
  submittedWorks: number;
  createdAt: string;
}

export interface Work {
  id: string;
  activityId: string;
  registrationId: string;
  userId: string;
  username: string;
  userAvatar: string;
  title: string;
  content: string;
  emotions: string[];
  wordCount: number;
  status: 'pending' | 'published' | 'rejected';
  likes: number;
  views: number;
  rank: number | null;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface WorkLike {
  id: string;
  workId: string;
  userId: string;
  createdAt: string;
}

export interface Honor {
  id: string;
  userId: string;
  activityId: string;
  activityTitle: string;
  honorTitle: string;
  rank: number | null;
  rankTitle: string;
  workId: string | null;
  workTitle: string | null;
  description: string;
  badge: string;
  awardedAt: string;
}

export interface ActivityStats {
  totalParticipants: number;
  totalWorks: number;
  totalLikes: number;
  topWorks: Work[];
  myWorks?: Work[];
  myRegistration?: Registration;
}

export interface RankingItem {
  rank: number;
  workId: string;
  title: string;
  username: string;
  userAvatar: string;
  likes: number;
  views: number;
  isAnonymous: boolean;
}

export interface SubmitWorkData {
  activityId: string;
  title: string;
  content: string;
  emotions: string[];
  isAnonymous: boolean;
}

export type ScheduledStatus = 'pending' | 'delivered' | 'cancelled' | 'resent';

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export interface ReminderSettings {
  before24h: boolean;
  before1h: boolean;
  onTime: boolean;
}

export interface RescheduleHistoryItem {
  from: string;
  to: string;
  reason: string;
  changedAt: string;
}

export interface ScheduledLetter {
  id: string;
  letterId: string;
  senderId: string;
  title: string;
  recipient: string;
  recipientType: string;
  scheduledDeliverAt: string;
  originalDeliverAt: string;
  status: ScheduledStatus;
  reminderSettings: ReminderSettings;
  resentCount: number;
  versionCount: number;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancelReason?: string;
  resentFrom?: string;
  resentTo?: string;
  rescheduleHistory?: RescheduleHistoryItem[];
  currentStatus?: ScheduledStatus;
  timeRemaining?: TimeRemaining;
  letter?: Letter;
}

export interface LetterVersion {
  id: string;
  letterId: string;
  version: number;
  title: string;
  content: string;
  recipient: string;
  recipientType: string;
  emotions: string[];
  isPublic: boolean;
  isAnonymous: boolean;
  versionNote: string;
  createdAt: string;
  createdBy: string;
}

export interface CreateScheduledLetterData {
  senderId: string;
  senderName?: string;
  recipient: string;
  recipientType?: string;
  title: string;
  content: string;
  emotions?: string[];
  isPublic?: boolean;
  isAnonymous?: boolean;
  scheduledDeliverAt: string;
  reminderSettings?: ReminderSettings;
  versionNote?: string;
}

export interface FutureMailboxStats {
  total: number;
  pending: number;
  delivered: number;
  cancelled: number;
  resent: number;
  totalVersions: number;
  upcoming: {
    id: string;
    title: string;
    recipient: string;
    scheduledDeliverAt: string;
    timeRemaining: TimeRemaining;
  }[];
}

export interface RecipientRelation {
  id: string;
  userId: string;
  name: string;
  groupId: string;
  avatar: string;
  note: string;
  letterCount: number;
  lastWrittenAt: string;
  createdAt: string;
}

export interface RecipientGroup {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  createdAt: string;
}

export interface RecipientEmotionPreference {
  recipientId: string;
  emotion: string;
  count: number;
  lastUsedAt: string;
}

export interface FestivalSuggestion {
  id: string;
  festivalName: string;
  festivalDate: string;
  icon: string;
  recipientGroups: string[];
  suggestion: string;
  recommendedEmotions: string[];
  daysUntil: number;
  isUrgent: boolean;
}

export interface RelationNetworkStats {
  totalRecipients: number;
  totalGroups: number;
  topRecipients: (RecipientRelation & { group?: RecipientGroup })[];
  recentRecipients: RecipientRelation[];
  emotionPreferences: RecipientEmotionPreference[];
  festivalSuggestions: FestivalSuggestion[];
  groupDistribution: { group: RecipientGroup; count: number }[];
  writingFrequency: { period: string; count: number }[];
}
