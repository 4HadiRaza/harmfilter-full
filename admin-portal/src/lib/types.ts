// ─── Firestore Document Interfaces ─────────────────────────────────────────
// These match the existing Firestore schema used by the Flutter app.
// Do NOT change field names — they must stay in sync.

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  website?: string;
  points: number;
  joinedAt: Date;
  lastActivityDate?: Date;
  quizProgress?: Record<string, QuizResult>;
  banned?: boolean;
  bannedAt?: Date;
  bannedBy?: string;
}

export interface QuizResult {
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  awardedPoints: number;
  completedAt?: Date;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  label: "normal" | "offensive" | "hateful";
  fusedScore: number;
  textScore: number;
  imageScore?: number;
  explanation: string;
  problematicSpans: string[];
  suggestions: string[];
  language: string;
  createdAt: Date;
}

export interface Report {
  id: string;
  postId: string;
  postContent?: string;
  currentFlag: string;
  reportedAs: string;
  reportedBy: string;
  reportedAt: Date;
  status: "pending" | "resolved" | "dismissed";
  resolvedAt?: Date;
  resolvedBy?: string;
  dismissedAt?: Date;
}

export interface DailyAnalytics {
  date: string; // YYYY-MM-DD
  totalAnalyzed: number;
  safeCount: number;
  offensiveCount: number;
  hatefulCount: number;
  warningsIssued: number;
}

export interface PlatformDailyAnalytics {
  date: string;
  totalPosts: number;
  normalCount: number;
  offensiveCount: number;
  hatefulCount: number;
}

export interface AuditLog {
  id: string;
  action:
    | "override_label"
    | "delete_post"
    | "ban_user"
    | "unban_user"
    | "dismiss_report"
    | "reset_points"
    | "bulk_resolve";
  adminUid: string;
  adminEmail?: string;
  targetId: string; // postId or userId
  targetType: "post" | "user" | "report";
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface ConsensusReport {
  postId: string;
  postText: string;
  currentLabel: string;
  suggestedLabel: string;
  reportCount: number;
  reports: Report[];
}

// ─── Dashboard Types ───────────────────────────────────────────────────────

export interface DashboardStats {
  totalPosts: number;
  totalUsers: number;
  pendingReports: number;
  hatefulToday: number;
  todayBreakdown: {
    normal: number;
    offensive: number;
    hateful: number;
  };
}

export interface ChartDataPoint {
  date: string;
  value: number;
  normal?: number;
  offensive?: number;
  hateful?: number;
}

// ─── Pagination ────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  lastDoc?: string;
}
