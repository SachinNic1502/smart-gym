/**
 * Services Module
 * 
 * Business logic layer that sits between API routes and repositories.
 */

export { authService, type LoginResult, type OtpResult } from "./auth.service";
export { memberService, type CreateMemberData } from "./member.service";
export { branchService, type CreateBranchData, type BranchWithStats } from "./branch.service";
export { attendanceService, type CheckInData } from "./attendance.service";
export { paymentService, type CreatePaymentData, type PaymentResult, type PaymentListResult } from "./payment.service";
export { leadService, type CreateLeadData, type LeadListResult } from "./lead.service";
export { dashboardService } from "./dashboard.service";
export { deviceService, type CreateDeviceData, type UpdateDeviceData, type DeviceListResult } from "./device.service";
export { auditService, type AuditListResult } from "./audit.service";
export { settingsService } from "./settings.service";
export { dietService } from "./diet.service";
