import type {
    User,
    Member,
    Branch,
    MembershipPlan,
    SystemSettings,
    WorkoutPlan,
    DietPlan,
    Staff,
    GymClass,
    Expense,
} from "@/lib/types";

export const seedUsers: User[] = [
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
];

export const seedBranches: Branch[] = [
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
];

export const seedSettings: SystemSettings = {
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
    paymentGatewayProvider: "none",
    whatsappProvider: "none",
    messagingProvider: "none",
    smtpHost: "smtp.example.com",
    smtpPort: 587,
    smtpUser: "",
    smtpPass: "",
    smtpSecure: true,
    apiRateLimitEnabled: false,
    apiRateLimitWindowSeconds: 60,
    apiRateLimitMaxRequests: 60,
};

export const seedPlans: MembershipPlan[] = [
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
];

export const seedWorkoutPlans: WorkoutPlan[] = [
    {
        id: "WKT_001",
        name: "Beginner Full Body",
        description: "Perfect for beginners starting their fitness journey",
        difficulty: "beginner",
        durationWeeks: 8,
        exercises: [
            { name: "Squats", sets: 3, reps: "12", restSeconds: 60, notes: "Focus on form" },
        ],
        createdAt: "2024-01-01T00:00:00Z",
    },
];

export const seedDietPlans: DietPlan[] = [
    {
        id: "DIT_001",
        name: "Fat Loss Basics",
        description: "Calorie deficit diet for fat loss",
        caloriesPerDay: 1800,
        meals: [
            { name: "Breakfast", time: "8:00 AM", items: ["Oatmeal"], calories: 400 },
        ],
        createdAt: "2024-01-01T00:00:00Z",
    },
];
