// ============================================
// API Client for Frontend
// ============================================

import type {
  User,
  Member,
  Branch,
  Device,
  Payment,
  PaymentMethod,
  MembershipPlan,
  AuditLog,
  SystemSettings,
  BroadcastMessage,
  MessageChannel,
  Lead,
  Staff,
  GymClass,
  WorkoutPlan,
  DietPlan,
  Expense,
  AttendanceRecord,
  Notification,
  DietLog,
} from "@/lib/types";

const API_BASE = "/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.error || "An error occurred",
      response.status,
      data
    );
  }

  return data.data as T;
}

// ============================================
// Auth API
// ============================================

export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: User; redirectUrl: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  memberLogin: (phone: string, otp?: string) =>
    request<{ user?: User; redirectUrl?: string; message?: string; devOtp?: string }>(
      "/auth/member-login",
      {
        method: "POST",
        body: JSON.stringify({ phone, otp }),
      }
    ),

  logout: () =>
    request<{ redirectUrl: string }>("/auth/logout", { method: "POST" }),

  getSession: () =>
    request<{ user: User }>("/auth/session"),
};

// ============================================
// Members API
// ============================================

export const membersApi = {
  list: (params?: Record<string, string | number | undefined>) => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) cleanParams[key] = String(value);
      });
    }
    const query = Object.keys(cleanParams).length ? `?${new URLSearchParams(cleanParams)}` : "";
    return request<{ data: Member[]; total: number }>(`/members${query}`);
  },

  get: (id: string) => request<Member>(`/members/${id}`),

  create: (data: Partial<Member> & { planId?: string }) =>
    request<Member>("/members", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Member>) =>
    request<Member>(`/members/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ id: string }>(`/members/${id}`, { method: "DELETE" }),

  getPrograms: (id: string) =>
    request<{ memberId: string; memberName: string; workoutPlan: unknown; dietPlan: unknown }>(`/members/${id}/programs`),

  assignPrograms: (memberId: string, payload: { workoutPlanId?: string; dietPlanId?: string }) =>
    request<void>(`/members/${memberId}/programs`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// ============================================
// Branches API
// ============================================

export const branchesApi = {
  list: (params?: Record<string, string | undefined>) => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) cleanParams[key] = value;
      });
    }
    const query = Object.keys(cleanParams).length ? `?${new URLSearchParams(cleanParams)}` : "";
    return request<{ data: Branch[]; total: number }>(`/branches${query}`);
  },

  get: (id: string) => request<Branch>(`/branches/${id}`),

  create: (data: Partial<Branch>) =>
    request<Branch>("/branches", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Branch>) =>
    request<Branch>(`/branches/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ id: string }>(`/branches/${id}`, { method: "DELETE" }),

  getMembers: (id: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return request<{ branch: { id: string; name: string }; data: Member[]; total: number }>(`/branches/${id}/members${query}`);
  },

  getAlerts: (id: string, params?: Record<string, string | number | undefined>) => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) cleanParams[key] = String(value);
      });
    }
    const query = Object.keys(cleanParams).length ? `?${new URLSearchParams(cleanParams)}` : "";
    return request<{
      branchId: string;
      windowDays: number;
      expiringSoon: Array<{ id: string; name: string; days: number }>;
      birthdaysThisWeek: Array<{ id: string; name: string; days: number }>;
    }>(`/branches/${id}/alerts${query}`);
  },
};

// ============================================
// Attendance API
// ============================================

export const attendanceApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return request<{ data: AttendanceRecord[]; total: number }>(`/attendance${query}`);
  },

  checkIn: (data: { memberId: string; branchId: string; method: string; deviceId?: string }) =>
    request<unknown>("/attendance", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================
// Payments API
// ============================================

export const paymentsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return request<{
      data: Payment[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
      summary: {
        totalAmount: number;
        completedCount: number;
        pendingCount: number;
      };
    }>(`/payments${query}`);
  },

  create: (data: { memberId: string; branchId: string; planId: string; amount: number; method: PaymentMethod; description?: string; skipMemberUpdate?: boolean }) =>
    request<unknown>("/payments", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================
// Communications API
// ============================================

export const communicationsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return request<{
      data: BroadcastMessage[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/communications${query}`);
  },

  create: (data: {
    title: string;
    content: string;
    channel: MessageChannel;
    status?: "sent" | "scheduled" | "draft";
    recipientCount?: number;
  }) =>
    request<BroadcastMessage>("/communications", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================
// Member Profile API (for logged-in members)
// ============================================

export const meApi = {
  getProfile: () => request<Member>("/me"),
  updateProfile: (data: Partial<Member>) =>
    request<Member>("/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<void>("/me/password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMyPrograms: () => request<{ workoutPlan: WorkoutPlan; dietPlan: DietPlan }>("/me/programs"),
  getDietLogs: (date?: string) => {
    const query = date ? `?date=${date}` : "";
    return request<{ date: string; caloriesConsumed: number; waterConsumed: number; logs: DietLog[] }>(`/me/diet-logs${query}`);
  },
  logDietEntry: (data: { type: "food" | "water"; calories?: number; waterMl?: number; label?: string; date?: string }) =>
    request<{ date: string; caloriesConsumed: number; waterConsumed: number; logs: DietLog[] }>("/me/diet-logs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================
// Notifications API
// ============================================

export const notificationsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return request<{ data: Notification[]; total: number; page: number; pageSize: number; totalPages: number }>(`/notifications${query}`);
  },
  create: (data: Omit<Notification, "id" | "createdAt" | "status">) =>
    request<Notification>("/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  markAsRead: (notificationId?: string, markAll?: boolean) =>
    request<{ message: string; count?: number }>("/notifications/mark-read", {
      method: "POST",
      body: JSON.stringify({ notificationId, markAll }),
    }),
  getUnreadCount: () => request<{ unreadCount: number }>("/notifications/unread-count"),
};

// ============================================
// Expense API
// ============================================

export const expensesApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return request<{
      data: Expense[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/expenses${query}`);
  },

  create: (data: Partial<Expense>) =>
    request<Expense>("/expenses", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================
// Leads API
// ============================================

export const leadsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return request<{ data: Lead[]; total: number; stats: unknown }>(`/leads${query}`);
  },

  get: (id: string) => request<Lead>(`/leads/${id}`),

  create: (data: Partial<Lead>) =>
    request<Lead>("/leads", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Lead>) =>
    request<Lead>(`/leads/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ id: string }>(`/leads/${id}`, { method: "DELETE" }),
};

// ============================================
// Staff API
// ============================================

export const staffApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return request<{ data: Staff[]; total: number; page: number; pageSize: number; totalPages: number }>(`/staff${query}`);
  },
  create: (data: Omit<Staff, "id" | "createdAt">) =>
    request<Staff>("/staff", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================
// Classes API
// ============================================

export const classesApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return request<{ data: GymClass[]; total: number; page: number; pageSize: number; totalPages: number }>(`/classes${query}`);
  },

  create: (data: Partial<GymClass>) =>
    request<GymClass>("/classes", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ============================================
// Audit Logs API
// ============================================

export const auditLogsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return request<{
      data: AuditLog[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/audit-logs${query}`);
  },
};

// ============================================
// Dashboard API
// ============================================

export const dashboardApi = {
  getStats: (role?: string, branchId?: string) => {
    const params: Record<string, string> = {};
    if (role) params.role = role;
    if (branchId) params.branchId = branchId;
    const query = Object.keys(params).length ? `?${new URLSearchParams(params)}` : "";
    return request<unknown>(`/dashboard/stats${query}`);
  },
};

// ============================================
// Plans API
// ============================================

export const plansApi = {
  getMembershipPlans: () =>
    request<{ data: MembershipPlan[]; total: number }>("/plans?type=membership"),

  getWorkoutPlans: () => request<{ data: WorkoutPlan[]; total: number }>("/plans?type=workout"),
  getDietPlans: () => request<{ data: DietPlan[]; total: number }>("/plans?type=diet"),
  createWorkoutPlan: (payload: Omit<WorkoutPlan, "id" | "createdAt">) =>
    request<WorkoutPlan>("/plans", {
      method: "POST",
      body: JSON.stringify({ type: "workout", ...payload }),
    }),
  createDietPlan: (payload: Omit<DietPlan, "id" | "createdAt">) =>
    request<DietPlan>("/plans", {
      method: "POST",
      body: JSON.stringify({ type: "diet", ...payload }),
    }),
};

// ============================================
// Admin Plans API (Super Admin only)
// ============================================

export const adminPlansApi = {
  list: (params?: { activeOnly?: boolean }) => {
    const query = params ? `?${new URLSearchParams({
      activeOnly: String(Boolean(params.activeOnly)),
    })}` : "";
    return request<{ data: MembershipPlan[]; total: number }>(`/admin/plans${query}`);
  },

  create: (data: {
    name: string;
    description: string;
    durationDays: number;
    price: number;
    currency?: string;
    features?: string[];
    isActive?: boolean;
  }) =>
    request<MembershipPlan>("/admin/plans", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Omit<MembershipPlan, "id">>) =>
    request<MembershipPlan>(`/admin/plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ id: string }>(`/admin/plans/${id}`, {
      method: "DELETE",
    }),
};

// ============================================
// Devices API
// ============================================

export const devicesApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return request<{ data: Device[]; total: number; stats: unknown }>(`/devices${query}`);
  },

  get: (id: string) => request<Device>(`/devices/${id}`),

  create: (data: Partial<Device>) =>
    request<Device>("/devices", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Device>) =>
    request<Device>(`/devices/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ id: string }>(`/devices/${id}`, { method: "DELETE" }),
};

// ============================================
// Admin Users API (Super Admin only)
// ============================================

export const adminUsersApi = {
  list: () => request<{ data: User[]; total: number }>("/admin/users"),

  createBranchAdmin: (data: { name: string; email: string; phone?: string; branchId: string; password: string }) =>
    request<User>("/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateAdmin: (
    id: string,
    data: { name?: string; email?: string; phone?: string; branchId?: string; password?: string },
  ) =>
    request<User>(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ============================================
// Settings API
// ============================================

export const settingsApi = {
  get: () => request<SystemSettings>("/settings"),

  update: (data: Partial<SystemSettings>) =>
    request<SystemSettings>("/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export { ApiError };
