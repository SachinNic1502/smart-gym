import { z } from "zod";

// ============================================
// Login Validation Schemas
// ============================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export const memberLoginSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[+]?[\d\s()-]{10,}$/, "Please enter a valid phone number"),
});

export const otpSchema = z.object({
  phone: z
    .string()
    .min(1, "Phone number is required"),
  otp: z
    .string()
    .min(4, "OTP must be at least 4 digits")
    .max(6, "OTP must be at most 6 digits")
    .regex(/^\d+$/, "OTP must contain only numbers"),
});

// ============================================
// Member Validation Schemas
// ============================================

export const addMemberSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[+]?[\d\s()-]{10,}$/, "Please enter a valid phone number"),
  planId: z
    .string()
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z
    .string()
    .optional(),
  address: z
    .string()
    .optional(),
  group: z
    .string()
    .optional(),
  referralSource: z
    .string()
    .optional(),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

// ============================================
// Branch Validation Schemas
// ============================================

export const addBranchSchema = z.object({
  name: z
    .string()
    .min(1, "Branch name is required")
    .min(2, "Branch name must be at least 2 characters"),
  address: z
    .string()
    .min(1, "Address is required"),
  city: z
    .string()
    .min(1, "City is required"),
  state: z
    .string()
    .min(1, "State is required"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[+]?[\d\s()-]{10,}$/, "Please enter a valid phone number"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

// ============================================
// Device Validation Schemas
// ============================================

export const deviceSchema = z
  .object({
    name: z
      .string()
      .min(1, "Device name is required")
      .min(2, "Device name must be at least 2 characters"),
    type: z.enum(["fingerprint", "qr_scanner", "face_recognition", "turnstile"], {
      message: "Invalid device type",
    }),
    status: z
      .enum(["online", "offline", "maintenance"])
      .optional(),
    branchId: z
      .string()
      .min(1, "Branch is required"),
    connectionType: z.enum(["lan", "cloud"], {
      message: "Connection type must be LAN or Cloud",
    }),
    ipAddress: z.string().optional(),
    cloudUrl: z.string().optional(),
    model: z.string().optional(),
    firmwareVersion: z.string().optional(),
    lastPing: z.string().optional(),
  })
  .refine(
    (data) => data.connectionType !== "lan" || !!data.ipAddress,
    {
      path: ["ipAddress"],
      message: "IP address is required for LAN devices",
    },
  )
  .refine(
    (data) => data.connectionType !== "cloud" || !!data.cloudUrl,
    {
      path: ["cloudUrl"],
      message: "Cloud URL is required for Cloud devices",
    },
  );

// ============================================
// Payment Validation Schemas
// ============================================

export const paymentSchema = z.object({
  memberId: z
    .string()
    .min(1, "Member is required"),
  amount: z
    .number()
    .min(1, "Amount must be greater than 0"),
  method: z
    .enum(["cash", "card", "upi", "bank_transfer"], {
      message: "Payment method is required",
    }),
  description: z
    .string()
    .optional(),
});

// ============================================
// Expense Validation Schemas
// ============================================

export const expenseSchema = z.object({
  category: z
    .enum(["rent", "utilities", "equipment", "salaries", "maintenance", "marketing", "other"], {
      message: "Category is required",
    }),
  amount: z
    .number()
    .min(1, "Amount must be greater than 0"),
  description: z
    .string()
    .min(1, "Description is required"),
  date: z
    .string()
    .min(1, "Date is required"),
});

// ============================================
// Lead Validation Schemas
// ============================================

export const leadSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[+]?[\d\s()-]{10,}$/, "Please enter a valid phone number"),
  email: z
    .string()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  source: z
    .string()
    .min(1, "Lead source is required"),
  notes: z
    .string()
    .optional(),
});

// ============================================
// Admin User / Branch Admin Schemas
// ============================================

export const createBranchAdminSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .regex(/^[+]?[\d\s()-]{10,}$/, "Please enter a valid phone number")
    .optional(),
  branchId: z
    .string()
    .min(1, "Branch is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

// ============================================
// Type Exports
// ============================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type MemberLoginFormData = z.infer<typeof memberLoginSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
export type AddMemberFormData = z.infer<typeof addMemberSchema>;
export type AddBranchFormData = z.infer<typeof addBranchSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type LeadFormData = z.infer<typeof leadSchema>;
export type CreateBranchAdminFormData = z.infer<typeof createBranchAdminSchema>;
export type DeviceFormData = z.infer<typeof deviceSchema>;
