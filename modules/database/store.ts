/**
 * In-Memory Data Store
 * 
 * This is a development-only store that simulates a database.
 * Replace with actual database connection in production.
 */

import type {
  User,
  Member,
  Branch,
  MembershipPlan,
  AttendanceRecord,
  Payment,
  Lead,
  Expense,
  Device,
  WorkoutPlan,
  DietPlan,
  Staff,
  GymClass,
  AuditLog,
  BroadcastMessage,
  SystemSettings,
  Notification,
} from "@/lib/types";

// ============================================
// Store Interface
// ============================================

export interface DataStore {
  users: User[];
  members: Member[];
  branches: Branch[];
  settings: SystemSettings;
  plans: MembershipPlan[];
  attendance: AttendanceRecord[];
  payments: Payment[];
  leads: Lead[];
  expenses: Expense[];
  devices: Device[];
  workoutPlans: WorkoutPlan[];
  dietPlans: DietPlan[];
  staff: Staff[];
  classes: GymClass[];
  auditLogs: AuditLog[];
  communications: BroadcastMessage[];
  notifications: Notification[];
  otps: Map<string, string>;
  passwords: Map<string, string>;
}

// ============================================
// Initial Seed Data
// ============================================

const seedUsers: User[] = [
  {
    id: "USR_001",
    name: "Super Admin",
    email: "admin@smartfit.com",
    role: "super_admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "USR_002",
    name: "John Manager",
    email: "john@downtown.gym",
    phone: "+1234567890",
    role: "branch_admin",
    branchId: "BRN_001",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "USR_003",
    name: "Alex Johnson",
    email: "alex@example.com",
    phone: "+1555000001",
    role: "member",
    branchId: "BRN_001",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
];

const seedBranches: Branch[] = [
  {
    id: "BRN_001",
    name: "Downtown Branch",
    address: "123 Main Street",
    city: "New York",
    state: "NY",
    phone: "+1234567890",
    email: "downtown@smartfit.com",
    status: "active",
    memberCount: 892,
    deviceCount: 0,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
  {
    id: "BRN_002",
    name: "Uptown Fitness",
    address: "456 Park Avenue",
    city: "New York",
    state: "NY",
    phone: "+1234567891",
    email: "uptown@smartfit.com",
    status: "active",
    memberCount: 654,
    deviceCount: 0,
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
];

const seedMembers: Member[] = [
  {
    id: "MEM_001",
    name: "Alex Johnson",
    email: "alex@example.com",
    phone: "+1555000001",
    dateOfBirth: "1990-05-15",
    address: "123 Oak Street, NY",
    plan: "Gold Premium",
    status: "Active",
    expiryDate: "2025-12-01",
    lastVisit: new Date().toISOString(),
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    branchId: "BRN_001",
    workoutPlanId: "WKT_001",
    dietPlanId: "DIT_001",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
  {
    id: "MEM_002",
    name: "Maria Garcia",
    email: "maria@example.com",
    phone: "+1555000002",
    dateOfBirth: "1988-08-22",
    address: "456 Pine Street, NY",
    plan: "Silver Monthly",
    status: "Expired",
    expiryDate: "2024-11-20",
    lastVisit: "2024-11-15T09:30:00Z",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    branchId: "BRN_001",
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
  {
    id: "MEM_003",
    name: "Steve Smith",
    email: "steve@example.com",
    phone: "+1555000003",
    dateOfBirth: "1995-03-10",
    plan: "Standard",
    status: "Active",
    expiryDate: "2025-01-15",
    lastVisit: "2024-12-08T14:00:00Z",
    branchId: "BRN_001",
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
  },
];

const seedSettings: SystemSettings = {
  siteName: "SmartFit Management",
  supportEmail: "support@smartfit.com",
  currency: "INR",
  timezone: "Asia/Kolkata",
  dateFormat: "dd/MM/yyyy",
  emailNotifications: true,
  smsNotifications: false,
  maintenanceMode: false,
  primaryColor: "#3A86FF",
  secondaryColor: "#0A2540",
  minPasswordLength: 8,
  sessionTimeoutMinutes: 30,
  allowedIpRange: "",
  publicApiBaseUrl: "https://api.smartfit.saashost.com",
  webhookUrl: "",
  apiRateLimitEnabled: false,
  apiRateLimitWindowSeconds: 60,
  apiRateLimitMaxRequests: 60,
};

const seedPlans: MembershipPlan[] = [
  {
    id: "PLN_001",
    name: "Standard",
    description: "Basic gym access",
    durationDays: 30,
    price: 1999,
    currency: "INR",
    features: ["Gym access", "Locker room"],
    isActive: true,
  },
  {
    id: "PLN_002",
    name: "Silver Monthly",
    description: "Standard access with classes",
    durationDays: 30,
    price: 3499,
    currency: "INR",
    features: ["Gym access", "Locker room", "Group classes", "Sauna"],
    isActive: true,
  },
  {
    id: "PLN_003",
    name: "Quarterly Flex",
    description: "3-month flexible membership",
    durationDays: 90,
    price: 8999,
    currency: "INR",
    features: ["Gym access", "Locker room", "Group classes"],
    isActive: true,
  },
  {
    id: "PLN_004",
    name: "Gold Premium",
    description: "Full access with personal training",
    durationDays: 365,
    price: 24999,
    currency: "INR",
    features: ["Gym access", "Locker room", "Group classes", "Sauna", "Personal trainer", "Diet consultation"],
    isActive: true,
  },
];

const seedDevices: Device[] = [];

const seedWorkoutPlans: WorkoutPlan[] = [
  {
    id: "WKT_001",
    name: "Beginner Full Body",
    description: "Perfect for beginners starting their fitness journey",
    difficulty: "beginner",
    durationWeeks: 8,
    exercises: [
      { name: "Squats", sets: 3, reps: "12", restSeconds: 60, notes: "Focus on form" },
      { name: "Push-ups", sets: 3, reps: "10", restSeconds: 60 },
      { name: "Lunges", sets: 3, reps: "10 each leg", restSeconds: 60 },
    ],
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "WKT_002",
    name: "Strength Split",
    description: "4-day split for building strength",
    difficulty: "intermediate",
    durationWeeks: 12,
    exercises: [
      { name: "Bench Press", sets: 4, reps: "8", restSeconds: 90 },
      { name: "Deadlift", sets: 4, reps: "6", restSeconds: 120 },
    ],
    createdAt: "2024-01-01T00:00:00Z",
  },
];

const seedDietPlans: DietPlan[] = [
  {
    id: "DIT_001",
    name: "Fat Loss Basics",
    description: "Calorie deficit diet for fat loss",
    caloriesPerDay: 1800,
    meals: [
      { name: "Breakfast", time: "8:00 AM", items: ["Oatmeal", "Eggs", "Fruits"], calories: 400 },
      { name: "Lunch", time: "1:00 PM", items: ["Grilled chicken", "Brown rice", "Vegetables"], calories: 500 },
    ],
    createdAt: "2024-01-01T00:00:00Z",
  },
];

const seedStaff: Staff[] = [
  {
    id: "STF_001",
    name: "Mike Trainer",
    email: "mike@smartfit.com",
    phone: "+1555100001",
    role: "trainer",
    branchId: "BRN_001",
    branchName: "Downtown Branch",
    salary: 35000,
    joiningDate: "2024-01-15",
    status: "active",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mike",
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "STF_002",
    name: "Sarah Receptionist",
    email: "sarah@smartfit.com",
    phone: "+1555100002",
    role: "receptionist",
    branchId: "BRN_001",
    branchName: "Downtown Branch",
    salary: 25000,
    joiningDate: "2024-02-01",
    status: "active",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
];

const seedClasses: GymClass[] = [
  {
    id: "CLS_001",
    name: "Morning Yoga",
    type: "yoga",
    description: "Start your day with relaxing yoga",
    trainerId: "STF_001",
    trainerName: "Mike Trainer",
    branchId: "BRN_001",
    capacity: 20,
    enrolled: 15,
    schedule: [
      { dayOfWeek: 1, startTime: "07:00", endTime: "08:00" },
      { dayOfWeek: 3, startTime: "07:00", endTime: "08:00" },
      { dayOfWeek: 5, startTime: "07:00", endTime: "08:00" },
    ],
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "CLS_002",
    name: "HIIT Blast",
    type: "hiit",
    description: "High intensity interval training",
    trainerId: "STF_001",
    trainerName: "Mike Trainer",
    branchId: "BRN_001",
    capacity: 15,
    enrolled: 12,
    schedule: [
      { dayOfWeek: 2, startTime: "18:00", endTime: "19:00" },
      { dayOfWeek: 4, startTime: "18:00", endTime: "19:00" },
    ],
    status: "active",
    createdAt: "2024-01-01T00:00:00Z",
  },
];

const seedExpenses: Expense[] = [
  {
    id: "EXP_001",
    branchId: "BRN_001",
    category: "utilities",
    amount: 15000,
    currency: "INR",
    description: "Electricity bill - December",
    date: "2024-12-01",
    createdBy: "USR_002",
    createdAt: "2024-12-01T00:00:00Z",
  },
  {
    id: "EXP_002",
    branchId: "BRN_001",
    category: "maintenance",
    amount: 5000,
    currency: "INR",
    description: "Treadmill repair",
    date: "2024-12-05",
    createdBy: "USR_002",
    createdAt: "2024-12-05T00:00:00Z",
  },
];

// ============================================
// Global Store Instance
// ============================================

class Database {
  private static instance: Database;
  private store: DataStore;

  private constructor() {
    this.store = {
      users: [...seedUsers],
      members: [...seedMembers],
      branches: [...seedBranches],
      settings: { ...seedSettings },
      plans: [...seedPlans],
      attendance: [],
      payments: [],
      leads: [],
      expenses: [...seedExpenses],
      devices: [...seedDevices],
      workoutPlans: [...seedWorkoutPlans],
      dietPlans: [...seedDietPlans],
      staff: [...seedStaff],
      classes: [...seedClasses],
      auditLogs: [],
      communications: [],
      notifications: [],
      otps: new Map(),
      passwords: new Map([
        ["admin@smartfit.com", "admin123"],
        ["john@downtown.gym", "branch123"],
      ]),
    };
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getStore(): DataStore {
    return this.store;
  }

  // Reset to seed data (useful for testing)
  public reset(): void {
    this.store.users = [...seedUsers];
    this.store.members = [...seedMembers];
    this.store.branches = [...seedBranches];
    this.store.settings = { ...seedSettings };
    this.store.plans = [...seedPlans];
    this.store.attendance = [];
    this.store.payments = [];
    this.store.leads = [];
    this.store.expenses = [...seedExpenses];
    this.store.devices = [...seedDevices];
    this.store.workoutPlans = [...seedWorkoutPlans];
    this.store.dietPlans = [...seedDietPlans];
    this.store.staff = [...seedStaff];
    this.store.classes = [...seedClasses];
    this.store.auditLogs = [];
    this.store.communications = [];
    this.store.notifications = [];
    this.store.otps.clear();
  }
}

export const db = Database.getInstance();
export const getStore = () => db.getStore();
