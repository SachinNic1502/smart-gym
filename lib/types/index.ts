// ============================================
// User & Authentication Types
// ============================================

export type UserRole = "super_admin" | "branch_admin" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  branchId?: string; // For branch_admin and member
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ============================================
// Branch Types
// ============================================

export type BranchStatus = "active" | "inactive" | "suspended";

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  status: BranchStatus;
  memberCount: number;
  deviceCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Member Types
// ============================================

export type MemberStatus = "Active" | "Expired" | "Frozen" | "Cancelled";

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  address?: string;
  plan: string;
  status: MemberStatus;
  expiryDate: string;
  lastVisit?: string;
  image?: string;
  branchId: string;
  workoutPlanId?: string;
  dietPlanId?: string;
  referralSource?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberPrograms {
  workoutPlan: string;
  dietPlan: string;
}

// ============================================
// Attendance Types
// ============================================

export type AttendanceMethod = "Fingerprint" | "QR Code" | "Manual" | "Face ID";
export type AttendanceStatus = "success" | "failed" | "pending";

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  branchId: string;
  checkInTime: string;
  checkOutTime?: string;
  method: AttendanceMethod;
  status: AttendanceStatus;
  deviceId?: string;
}

// ============================================
// Payment & Billing Types
// ============================================

export type PaymentStatus = "completed" | "pending" | "failed" | "refunded";
export type PaymentMethod = "cash" | "card" | "upi" | "bank_transfer";

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  branchId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  description: string;
  invoiceNumber?: string;
  createdAt: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  price: number;
  currency: string;
  features: string[];
  isActive: boolean;
}

// ============================================
// Workout & Diet Plan Types
// ============================================

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  durationWeeks: number;
  exercises: WorkoutExercise[];
  createdAt: string;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
}

export interface DietPlan {
  id: string;
  name: string;
  description: string;
  caloriesPerDay: number;
  meals: DietMeal[];
  createdAt: string;
}

export interface DietMeal {
  name: string;
  time: string;
  items: string[];
  calories: number;
}

// ============================================
// Device Types
// ============================================

export type DeviceStatus = "online" | "offline" | "maintenance";
export type DeviceType = "fingerprint" | "qr_scanner" | "face_recognition" | "turnstile";
export type DeviceConnectionType = "lan" | "cloud";

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  branchId: string;
  branchName: string;
  lastPing?: string;
  firmwareVersion?: string;
  model?: string;
  connectionType?: DeviceConnectionType;
  ipAddress?: string;
  cloudUrl?: string;
  createdAt: string;
}

// ============================================
// Communication Types
// ============================================

export type MessageChannel = "sms" | "email" | "push" | "whatsapp";

export interface BroadcastMessage {
  id: string;
  title: string;
  content: string;
  channel: MessageChannel;
  recipientCount: number;
  sentAt: string;
  status: "sent" | "scheduled" | "draft";
}

// ============================================
// Expense Types
// ============================================

export type ExpenseCategory = 
  | "rent"
  | "utilities"
  | "equipment"
  | "salaries"
  | "maintenance"
  | "marketing"
  | "other";

export interface Expense {
  id: string;
  branchId: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  description: string;
  date: string;
  createdBy: string;
  createdAt: string;
}

// ============================================
// Lead Types
// ============================================

export type LeadStatus = "new" | "contacted" | "interested" | "converted" | "lost";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  status: LeadStatus;
  notes?: string;
  branchId: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Audit Log Types
// ============================================

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

// ============================================
// Dashboard Stats Types
// ============================================

export interface DashboardStat {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ElementType;
  color?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// Form Types
// ============================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface MemberLoginFormData {
  phone: string;
  otp?: string;
}

export interface AddMemberFormData {
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  group?: string;
  referralSource?: string;
  notes?: string;
}

// ============================================
// Staff/Team Types
// ============================================

export type StaffRole = "manager" | "trainer" | "receptionist" | "cleaner" | "other";

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  branchId: string;
  branchName?: string;
  salary?: number;
  joiningDate: string;
  status: "active" | "inactive";
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Class/Schedule Types
// ============================================

export type ClassType = "yoga" | "zumba" | "spinning" | "hiit" | "strength" | "cardio" | "pilates" | "other";

export interface GymClass {
  id: string;
  name: string;
  type: ClassType;
  description?: string;
  trainerId: string;
  trainerName: string;
  branchId: string;
  capacity: number;
  enrolled: number;
  schedule: ClassSchedule[];
  status: "active" | "cancelled" | "completed";
  createdAt: string;
}

export interface ClassSchedule {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface ClassEnrollment {
  id: string;
  classId: string;
  memberId: string;
  memberName: string;
  enrolledAt: string;
  status: "enrolled" | "attended" | "missed" | "cancelled";
}

// ============================================
// Settings Types
// ============================================

export interface BranchSettings {
  branchId: string;
  openingTime: string;
  closingTime: string;
  maxCapacity: number;
  autoCheckout: boolean;
  autoCheckoutTime: string;
  notifyOnExpiry: boolean;
  expiryNotifyDays: number;
  allowGuestEntry: boolean;
  requirePhotoId: boolean;
}

export interface SystemSettings {
  siteName: string;
  supportEmail: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  maintenanceMode: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  minPasswordLength?: number;
  sessionTimeoutMinutes?: number;
  allowedIpRange?: string;
  publicApiBaseUrl?: string;
  webhookUrl?: string;
}

// ============================================
// Report Types
// ============================================

export type ReportType = "revenue" | "attendance" | "membership" | "expense" | "growth";
export type ReportPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  period: ReportPeriod;
  branchId?: string;
  data: Record<string, unknown>;
  generatedAt: string;
  generatedBy: string;
}

// ============================================
// Notification Types
// ============================================

export type NotificationType = "info" | "warning" | "success" | "error";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: string;
}
