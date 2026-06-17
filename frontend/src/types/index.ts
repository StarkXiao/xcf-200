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

export type ReplySource = 'human' | 'ai_generated' | 'ai_fallback' | 'stranger';

export interface ReplyQualityFeedback {
  rating: number;
  helpful: boolean;
  tags: string[];
  comment?: string;
  userId?: string;
  createdAt: string;
}

export interface Reply {
  id: string;
  letterId: string;
  fromParallel: string;
  senderName: string;
  content: string;
  emotion: string;
  createdAt: string;
  parentReplyId?: string | null;
  replierId?: string | null;
  likes?: number;
  isFeatured?: boolean;
  featuredAt?: string | null;
  featuredBy?: string | null;
  chainOrder?: number;
  emotionChain?: string[];
  subReplies?: Reply[];
  source?: ReplySource;
  qualityScore?: number;
  candidateId?: string;
  feedback?: ReplyQualityFeedback | null;
  isStrangerReply?: boolean;
  anonymousId?: string;
  review?: ReplyReview | null;
  reportCount?: number;
  reviewStatus?: 'normal' | 'pending_review' | 'warned' | 'hidden' | 'removed';
  isHidden?: boolean;
  hiddenReason?: string;
  hiddenAt?: string;
  hiddenBy?: string;
  isRemoved?: boolean;
  removedReason?: string;
  removedAt?: string;
  removedBy?: string;
  warnings?: ReportWarning[];
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
  views?: number;
  createdAt: string;
  deliverAt: string;
  replies: Reply[];
  reportCount?: number;
  reviewStatus?: 'normal' | 'pending_review' | 'warned' | 'hidden' | 'removed';
  isHidden?: boolean;
  hiddenReason?: string;
  hiddenAt?: string;
  hiddenBy?: string;
  isRemoved?: boolean;
  removedReason?: string;
  removedAt?: string;
  removedBy?: string;
  warnings?: ReportWarning[];
  updatedAt?: string;
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
  views?: number;
  repliesCount: number;
  createdAt: string;
  reportCount?: number;
  reviewStatus?: 'normal' | 'pending_review' | 'warned' | 'hidden' | 'removed';
  isHidden?: boolean;
  isRemoved?: boolean;
}

export interface Emotion {
  id: string;
  name: string;
  color: string;
  icon: string;
  count: number;
}

export interface FavoriteGroup {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  createdAt: string;
  isDefault?: boolean;
}

export interface FavoriteReminder {
  id: string;
  userId: string;
  letterId: string;
  remindAt: string;
  note?: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface Favorite {
  id: string;
  userId: string;
  letterId: string;
  groupId: string | null;
  createdAt: string;
  favoritedAt: string;
}

export interface FavoriteStats {
  totalFavorites: number;
  totalGroups: number;
  totalReminders: number;
  pendingReminders: number;
  completedReminders: number;
  groupDistribution: { groupId: string; groupName: string; count: number }[];
  emotionDistribution: Record<string, number>;
  monthlyCollection: { month: string; count: number }[];
  weeklyReviewCount: number;
  lastReviewAt: string | null;
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

export type AchievementCategory = 'writing' | 'replying' | 'sharing' | 'emotion';

export type AchievementTaskStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface AchievementTask {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  icon: string;
  targetValue: number;
  currentValue: number;
  status: AchievementTaskStatus;
  rewardStars: number;
  rewardBadgeId: string | null;
  order: number;
  prerequisiteTaskIds: string[];
  createdAt: string;
  completedAt?: string;
}

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  color: string;
  earnedAt?: string;
  isEarned: boolean;
  relatedTaskId: string | null;
}

export interface AchievementLevel {
  level: number;
  title: string;
  icon: string;
  minStars: number;
  maxStars: number;
  color: string;
}

export interface AchievementUserProgress {
  userId: string;
  totalStars: number;
  level: AchievementLevel;
  nextLevel: AchievementLevel | null;
  levelProgress: number;
  completedTasks: number;
  totalTasks: number;
  earnedBadges: number;
  totalBadges: number;
  categoryStats: {
    writing: { completed: number; total: number; stars: number };
    replying: { completed: number; total: number; stars: number };
    sharing: { completed: number; total: number; stars: number };
    emotion: { completed: number; total: number; stars: number };
  };
}

export interface AchievementCenterData {
  userProgress: AchievementUserProgress;
  tasks: AchievementTask[];
  badges: AchievementBadge[];
  levels: AchievementLevel[];
}

export type RiskLevel = 'safe' | 'mild' | 'moderate' | 'severe';

export interface ParallelMatchRule {
  key: string;
  label: string;
  weight: number;
  description: string;
}

export interface MatchDimension {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  icon: string;
  color: string;
}

export interface ParallelMatchResult {
  userId: string;
  username: string;
  avatar: string;
  bio: string;
  matchScore: number;
  matchDimensions: MatchDimension[];
  commonEmotions: string[];
  commonRecipientTypes: string[];
  recentLetterTitle: string | null;
  recentLetterId: string | null;
  activityLevel: 'active' | 'moderate' | 'quiet';
  interactionHint: string;
}

export interface ParallelTopic {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  emotions: string[];
  recipientTypes: string[];
  relatedThemes?: string[];
  activityLevels?: string[];
  letterCount: number;
  participantCount: number;
  relevanceScore: number;
  relevanceReason: string;
  matchDetails?: {
    emotion: { score: number; overlap: string[] };
    recipientType: { score: number; overlap: string[] };
    theme: { score: number; overlap: string[] };
    behavior: { score: number; activityMatched: boolean; letterVolumeMatched: boolean };
  };
  sampleLetters: { id: string; title: string; senderName: string }[];
}

export interface ParallelMatchStats {
  totalUsers: number;
  matchedUsers: number;
  totalTopics: number;
  topMatchScore: number;
  averageMatchScore: number;
  emotionCoverage: number;
  dimensionAverages: { key: string; label: string; average: number }[];
}

export interface ParallelMatchData {
  recommendations: ParallelMatchResult[];
  topics: ParallelTopic[];
  stats: ParallelMatchStats;
  matchRules: ParallelMatchRule[];
}

export interface ParallelMatchInteraction {
  id: string;
  fromUserId: string;
  toUserId: string;
  type: 'wave' | 'resonate' | 'invite';
  message: string;
  createdAt: string;
}

export interface SubmitInteractionData {
  fromUserId: string;
  toUserId: string;
  type: 'wave' | 'resonate' | 'invite';
  message?: string;
}

export interface RiskLevelInfo {
  key: string;
  level: number;
  label: string;
  color: string;
  description: string;
}

export interface RiskDetail {
  category: string;
  score: number;
  keywords: string[];
}

export interface ContentAnalysisResult {
  level: RiskLevel;
  score: number;
  details: RiskDetail[];
  categories: string[];
  levelInfo: RiskLevelInfo;
}

export interface ContentRating {
  id: string;
  targetId: string;
  targetType: string;
  riskLevel: RiskLevel;
  riskScore: number;
  riskCategories: string[];
  details: RiskDetail[];
  autoAnalyzed: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'escalated';

export interface ReplyReviewTask {
  id: string;
  letterId: string;
  replyId: string;
  riskLevel: RiskLevel;
  status: ReviewStatus;
  reviewerId?: string;
  reviewReason?: string;
  reviewedAt?: string;
  createdAt: string;
  letterTitle: string;
  replyContent: string;
  replyEmotion: string;
}

export interface GuardianSubmitReviewData {
  reviewId: string;
  decision: 'approved' | 'rejected' | 'escalated';
  reason?: string;
  reviewerId: string;
}

export type InterventionType = 'system_tip' | 'peer_care' | 'resource_push' | 'human_intervention' | 'emergency';
export type InterventionStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';
export type InterventionPriority = 'high' | 'medium' | 'low';

export interface InterventionTypeInfo {
  key: string;
  label: string;
  icon: string;
  description: string;
}

export interface InterventionRecord {
  id: string;
  type: string;
  content: string;
  operator: string;
  createdAt: string;
}

export interface Intervention {
  id: string;
  targetId: string;
  targetType: string;
  letterId?: string;
  riskLevel: RiskLevel;
  riskScore?: number;
  type: InterventionType;
  status: InterventionStatus;
  priority: InterventionPriority;
  source?: string;
  escalatedBy?: string;
  records: InterventionRecord[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface AddInterventionRecordData {
  type: string;
  content: string;
  operatorId: string;
  status?: InterventionStatus;
  newType?: InterventionType;
}

export interface GuardianProfile {
  userId: string;
  totalReviews: number;
  approvedCount: number;
  rejectedCount: number;
  escalatedCount: number;
  totalInterventions: number;
  level: string;
  levelIcon: string;
  joinedAt?: string;
  lastActiveAt?: string;
  isGuardian?: boolean;
  nextLevelMin?: number;
  levelProgress?: number;
}

export interface GuardianRankingItem {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  totalReviews: number;
  totalInterventions: number;
  level: string;
  levelIcon: string;
  score: number;
}

export interface GuardianStationStats {
  contentRatings: {
    total: number;
    byLevel: Record<RiskLevel, number>;
  };
  reviews: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    escalated: number;
  };
  interventions: {
    total: number;
    pending: number;
    in_progress: number;
    resolved: number;
    closed: number;
    highPriority: number;
  };
  guardians: {
    total: number;
    activeToday: number;
  };
}

export interface DraftVersion {
  id: string;
  draftId: string;
  version: number;
  snapshot: DraftContentSnapshot;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface DraftContentSnapshot {
  recipient: string;
  recipientType: string;
  title: string;
  content: string;
  emotions: string[];
  isPublic: boolean;
  isAnonymous: boolean;
  deliverySpeed: 'standard' | 'express' | 'instant';
  scheduledDelivery: boolean;
  scheduledDate: string;
  scheduledTime: string;
}

export interface Draft {
  id: string;
  senderId: string;
  recipient: string;
  recipientType: string;
  title: string;
  content: string;
  emotions: string[];
  isPublic: boolean;
  isAnonymous: boolean;
  deliverySpeed: 'standard' | 'express' | 'instant';
  scheduledDelivery: boolean;
  scheduledDate: string;
  scheduledTime: string;
  autoSavedAt: string | null;
  versionCount: number;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
}

export interface DraftCreateData {
  senderId: string;
  recipient?: string;
  recipientType?: string;
  title?: string;
  content?: string;
  emotions?: string[];
  isPublic?: boolean;
  isAnonymous?: boolean;
  deliverySpeed?: 'standard' | 'express' | 'instant';
  scheduledDelivery?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
}

export interface DraftUpdateData {
  recipient?: string;
  recipientType?: string;
  title?: string;
  content?: string;
  emotions?: string[];
  isPublic?: boolean;
  isAnonymous?: boolean;
  deliverySpeed?: 'standard' | 'express' | 'instant';
  scheduledDelivery?: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  note?: string;
}

export interface DraftSubmitData {
  scheduledDeliveryAt?: string;
}

export interface DraftValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  warnings: string[];
  scheduledCheck?: {
    isPast: boolean;
    needsAdjustment: boolean;
    suggestedDate?: string;
    suggestedTime?: string;
  };
}

export interface DraftStats {
  total: number;
  autoSaved: number;
  scheduled: number;
  wordTotal: number;
  versionsTotal: number;
  lastDraftAt: string | null;
}

export interface EmotionChainItem {
  replyId: string;
  senderName: string;
  emotion: string;
  createdAt: string;
  order: number;
}

export interface EmotionChainData {
  chainId: string;
  letterId: string;
  rootReplyId: string;
  emotions: EmotionChainItem[];
  dominantEmotion: string;
  totalLength: number;
}

export interface SubmitRelayReplyData {
  parentReplyId: string;
  senderName?: string;
  content: string;
  emotion: string;
  replierId?: string;
}

export interface CollaborationStats {
  totalReplies: number;
  totalRelayReplies: number;
  featuredReplies: number;
  uniqueParticipants: number;
  longestEmotionChain: number;
  emotionDistribution: Record<string, number>;
}

export interface LetterCollaborationData {
  stats: CollaborationStats;
  emotionChains: EmotionChainData[];
  featuredReplies: Reply[];
}

export type InteractionType = 'like' | 'reply' | 'favorite' | 'view';

export interface Interaction {
  id: string;
  type: InteractionType;
  letterId: string;
  letterTitle: string;
  letterEmotions: string[];
  createdAt: string;
  icon: string;
  description: string;
  count?: number;
  replyId?: string;
  replyContent?: string;
  replySender?: string;
  replyEmotion?: string;
  favoriteId?: string;
  viewCount?: number;
  totalViews?: number;
}

export interface InteractionTypeStats {
  total: number;
  like: number;
  reply: number;
  favorite: number;
  view: number;
}

export interface InteractionEmotionStat {
  id: string;
  name: string;
  color: string;
  icon: string;
  count: number;
}

export interface InteractionQueryParams {
  type?: InteractionType;
  timeRange?: 'today' | 'week' | 'month' | 'year';
  emotion?: string;
  sort?: 'latest' | 'oldest';
}

export type ReplyCandidateStatus = 'pending' | 'selected' | 'rejected' | 'timeout';
export type ReplyPoolStatus = 'waiting_human' | 'human_replied' | 'ai_selected' | 'timeout_fallback' | 'closed';

export interface ReplyCandidate {
  id: string;
  letterId: string;
  candidateIndex: number;
  fromParallel: string;
  senderName: string;
  content: string;
  emotion: string;
  qualityScore: number;
  status: ReplyCandidateStatus;
  source: 'ai_generated' | 'human_suggested';
  selectedAt?: string;
  createdAt: string;
}

export interface ReplyCandidatePool {
  id: string;
  letterId: string;
  timeoutAt: string;
  status: ReplyPoolStatus;
  selectedCandidateId: string | null;
  fallbackAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReplyCandidatePoolData {
  pool: ReplyCandidatePool;
  candidates: ReplyCandidate[];
  remainingTime: number;
  hasHumanReply: boolean;
}

export interface SelectCandidateData {
  letterId: string;
  candidateId: string;
  userId?: string;
}

export interface SubmitFeedbackData {
  replyId: string;
  rating: number;
  helpful: boolean;
  tags: string[];
  comment?: string;
  userId?: string;
}

export type SkillCategory = 'scribing' | 'resonance' | 'chronos' | 'warden';
export type SkillBranch = null | 'path_a' | 'path_b';
export type SkillRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type SkillEffectType = 'buff' | 'debuff' | 'utility' | 'heal' | 'damage';
export type CombatTrigger = 'write_letter' | 'reply' | 'favorite' | 'browse';

export interface SkillEffect {
  type: SkillEffectType;
  target: string;
  value: number;
  scalePerLevel: number;
  description: string;
}

export interface SkillBranchOption {
  id: SkillBranch;
  name: string;
  description: string;
  icon: string;
  effectModifier: Partial<SkillEffect>;
  auraCostModifier?: number;
  cooldownModifier?: number;
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  icon: string;
  color: string;
  rarity: SkillRarity;
  maxLevel: number;
  baseAuraCost: number;
  baseCooldown: number;
  unlockLevel: number;
  prerequisites: string[];
  effects: SkillEffect[];
  branches?: SkillBranchOption[];
  branchUnlockLevel?: number;
  combatTrigger: CombatTrigger[];
  categoryLabel: string;
}

export interface UserSkillProgress {
  skillId: string;
  level: number;
  selectedBranch: SkillBranch;
  unlockedAt: string;
  upgradedAt: string;
  totalUsed: number;
}

export interface UserAuraState {
  current: number;
  max: number;
  regenRate: number;
  lastRegenAt: string;
}

export interface CooldownState {
  skillId: string;
  endsAt: string;
  remaining: number;
}

export interface GrowthWritingFrequency {
  monthlyData: { month: string; count: number }[];
  weeklyData: { week: string; count: number }[];
  averagePerWeek: number;
  averagePerMonth: number;
  currentStreak: number;
  longestStreak: number;
  peakMonth: { month: string; count: number } | null;
  totalWritingDays: number;
  hourlyDistribution: { hour: number; label: string; count: number }[];
}

export interface GrowthEmotionProfile {
  topEmotions: { name: string; color: string; icon: string; count: number; percentage: number }[];
  emotionTimeline: { period: string; label: string; emotions: { name: string; color: string; icon: string; count: number }[] }[];
  currentDominantEmotion: { name: string; color: string; icon: string; percentage: number } | null;
  emotionBalance: number;
  emotionShift: { from: string; to: string; fromIcon: string; toIcon: string; description: string } | null;
}

export interface GrowthRecipientProfile {
  topRecipients: { name: string; type: string; typeLabel: string; typeIcon: string; count: number; percentage: number; lastWrittenAt: string }[];
  typeDistribution: { key: string; label: string; icon: string; count: number; percentage: number }[];
  recentShift: string | null;
}

export interface GrowthPhase {
  period: string;
  label: string;
  description: string;
  letterCount: number;
  dominantEmotion: string;
  dominantEmotionIcon: string;
  dominantRecipientType: string;
  startDate: string;
  endDate: string;
}

export interface GrowthStageTrends {
  phases: GrowthPhase[];
  currentPhase: { label: string; description: string; since: string } | null;
  trendDirection: 'rising' | 'stable' | 'declining';
  trendDescription: string;
}

export interface GrowthMilestone {
  date: string;
  type: string;
  description: string;
  icon: string;
}

export interface GrowthProfileData {
  writingFrequency: GrowthWritingFrequency;
  emotionProfile: GrowthEmotionProfile;
  recipientProfile: GrowthRecipientProfile;
  stageTrends: GrowthStageTrends;
  milestones: GrowthMilestone[];
  joinDate: string;
  accountAgeDays: number;
}

export interface SkillCategoryInfo {
  key: SkillCategory;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface SkillNode {
  skill: Skill;
  progress: UserSkillProgress | null;
  isUnlocked: boolean;
  canUpgrade: boolean;
  upgradeCost: number;
  branchOptions?: SkillBranchOption[];
  hasSelectedBranch: boolean;
}

export interface SkillTreeData {
  categories: SkillCategoryInfo[];
  skills: Skill[];
  userProgress: UserSkillProgress[];
  aura: UserAuraState;
  totalSkillPoints: number;
  availableSkillPoints: number;
  userLevel: number;
  starProgress: {
    current: number;
    next: number;
    points: number;
  };
}

export interface CombatButtonData {
  skillId: string;
  skillName: string;
  icon: string;
  color: string;
  auraCost: number;
  effectiveAuraCost: number;
  cooldown: number;
  effectiveCooldown: number;
  level: number;
  selectedBranch: SkillBranch;
  isOnCooldown: boolean;
  cooldownRemaining: number;
  hasEnoughAura: boolean;
  effects: SkillEffect[];
  trigger: CombatTrigger;
  description: string;
}

export interface SkillUpgradeRequest {
  skillId: string;
  userId: string;
}

export interface SkillBranchSelectRequest {
  skillId: string;
  userId: string;
  branch: SkillBranch;
}

export interface SkillUseRequest {
  skillId: string;
  userId: string;
  trigger: CombatTrigger;
  targetId?: string;
}

export interface SkillUseResult {
  success: boolean;
  skillId: string;
  effects: SkillEffect[];
  auraSpent: number;
  auraRemaining: number;
  cooldownEndsAt: string;
  message: string;
}

export interface UserSkillOverview {
  userId: string;
  aura: UserAuraState;
  totalUnlocked: number;
  totalMaxLeveled: number;
  activeBranches: number;
  skillPointProgress: {
    current: number;
    next: number;
    points: number;
  };
  categoryBreakdown: Record<SkillCategory, { unlocked: number; total: number; totalLevels: number }>;
}

export interface PlazaTopic {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  letterCount: number;
  isDefault: boolean;
  sortOrder: number;
  isHot: boolean;
  relatedEmotions?: string[];
  relatedActivityId?: string;
}

export type FeaturedItemType = 'letter' | 'activity' | 'topic';

export interface PlazaFeatured {
  id: string;
  type: FeaturedItemType;
  targetId: string;
  title: string;
  description: string;
  coverImage: string;
  tag: string;
  tagColor: string;
  sortOrder: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  target?: any;
}

export interface HotRankingItem {
  rank: number;
  letterId: string;
  title: string;
  senderName: string;
  emotions: string[];
  likes: number;
  repliesCount: number;
  views: number;
  createdAt: string;
  heatScore: number;
}

export type HotRankingType = 'daily' | 'weekly' | 'monthly' | 'all';

export interface PlazaOverviewData {
  topics: PlazaTopic[];
  featured: PlazaFeatured[];
  activities: Activity[];
  hotRanking: HotRankingItem[];
  stats: {
    totalLetters: number;
    totalTopics: number;
    activeActivities: number;
    featuredCount: number;
  };
}

export type ReportType =
  | 'spam'
  | 'harassment'
  | 'inappropriate'
  | 'violence'
  | 'self_harm'
  | 'privacy'
  | 'plagiarism'
  | 'other';

export type ReportTargetType = 'letter' | 'reply';

export type ReportStatus = 'pending' | 'processing' | 'resolved' | 'rejected';

export type ReportResultType =
  | 'content_removed'
  | 'content_hidden'
  | 'user_warned'
  | 'user_banned'
  | 'no_violation'
  | 'other';

export interface ReportTypeInfo {
  key: ReportType;
  label: string;
  icon: string;
  description: string;
}

export interface Report {
  id: string;
  targetId: string;
  targetType: ReportTargetType;
  reportType: ReportType;
  reportTypeLabel: string;
  reason: string;
  reporterId: string | null;
  reporterName: string;
  status: ReportStatus;
  statusLabel?: string;
  handlerId: string | null;
  handlerName: string | null;
  result: string | null;
  resultType: ReportResultType | null;
  resultLabel?: string | null;
  handledAt: string | null;
  createdAt: string;
  updatedAt: string;
  targetTitle?: string;
  targetContent?: string;
  targetUserId?: string | null;
  targetUserName?: string;
  letterId?: string | null;
}

export interface SubmitReportData {
  targetId: string;
  targetType: ReportTargetType;
  reportType: ReportType;
  reason?: string;
  reporterId?: string;
  reporterName?: string;
}

export interface HandleReportData {
  resultType?: ReportResultType;
  result?: string;
  handlerId: string;
  handlerName?: string;
  action: 'warning' | 'hide' | 'remove' | 'reject';
}

export interface ReportCheckResult {
  hasReported: boolean;
  reportCount: number;
  reviewStatus: 'normal' | 'pending_review' | 'resolved' | 'rejected';
  targetId: string;
  targetType: ReportTargetType;
}

export interface ReportStats {
  total: number;
  pending: number;
  processing: number;
  resolved: number;
  rejected: number;
  byType: Record<ReportType, number>;
  byTargetType: {
    letter: number;
    reply: number;
  };
  todayCount: number;
}

export interface ReportWarning {
  id: string;
  reason: string;
  warnedBy: string;
  warnedAt: string;
}
