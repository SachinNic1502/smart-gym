import { notificationsApi } from "@/lib/api/client";
import { generateId } from "@/modules/database/repositories/base.repository";
import type { Notification, NotificationType, NotificationPriority } from "@/lib/types";

export class NotificationService {
  /**
   * Create and send a notification to a specific user
   */
  static async createNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    priority?: NotificationPriority;
    actionUrl?: string;
    data?: Record<string, any>;
  }): Promise<Notification> {
    const notification = await notificationsApi.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority || "medium",
      read: false,
      actionUrl: data.actionUrl,
      data: data.data,
    });

    return notification;
  }

  /**
   * Predefined notification templates for common events
   */
  static templates = {
    memberCheckIn: (memberName: string, branchName: string) => ({
      type: "member_check_in" as NotificationType,
      title: "Member Checked In",
      message: `${memberName} has checked in at ${branchName}`,
      priority: "low" as NotificationPriority,
    }),

    memberCheckOut: (memberName: string, branchName: string) => ({
      type: "member_check_out" as NotificationType,
      title: "Member Checked Out",
      message: `${memberName} has checked out from ${branchName}`,
      priority: "low" as NotificationPriority,
    }),

    paymentReceived: (memberName: string, amount: string, planName: string) => ({
      type: "payment_received" as NotificationType,
      title: "Payment Received",
      message: `${memberName} paid ${amount} for ${planName}`,
      priority: "medium" as NotificationPriority,
    }),

    paymentOverdue: (memberName: string, amount: string, daysOverdue: number) => ({
      type: "payment_overdue" as NotificationType,
      title: "Payment Overdue",
      message: `${memberName}'s payment of ${amount} is ${daysOverdue} days overdue`,
      priority: "high" as NotificationPriority,
    }),

    membershipExpiring: (memberName: string, daysLeft: number) => ({
      type: "membership_expiring" as NotificationType,
      title: "Membership Expiring Soon",
      message: `${memberName}'s membership expires in ${daysLeft} days`,
      priority: "medium" as NotificationPriority,
    }),

    membershipExpired: (memberName: string) => ({
      type: "membership_expired" as NotificationType,
      title: "Membership Expired",
      message: `${memberName}'s membership has expired`,
      priority: "high" as NotificationPriority,
    }),

    classReminder: (className: string, time: string) => ({
      type: "class_reminder" as NotificationType,
      title: "Class Reminder",
      message: `Your ${className} class starts at ${time}`,
      priority: "medium" as NotificationPriority,
    }),

    classCancelled: (className: string, reason?: string) => ({
      type: "class_cancelled" as NotificationType,
      title: "Class Cancelled",
      message: `${className} has been cancelled${reason ? `: ${reason}` : ""}`,
      priority: "high" as NotificationPriority,
    }),

    workoutAssigned: (memberName: string, trainerName: string) => ({
      type: "workout_assigned" as NotificationType,
      title: "Workout Plan Assigned",
      message: `${trainerName} has assigned a new workout plan to ${memberName}`,
      priority: "medium" as NotificationPriority,
    }),

    dietAssigned: (memberName: string, trainerName: string) => ({
      type: "diet_assigned" as NotificationType,
      title: "Diet Plan Assigned",
      message: `${trainerName} has assigned a new diet plan to ${memberName}`,
      priority: "medium" as NotificationPriority,
    }),

    staffMessage: (senderName: string, subject: string) => ({
      type: "staff_message" as NotificationType,
      title: "New Message",
      message: `${senderName}: ${subject}`,
      priority: "medium" as NotificationPriority,
    }),

    systemAnnouncement: (title: string, message: string) => ({
      type: "system_announcement" as NotificationType,
      title,
      message,
      priority: "high" as NotificationPriority,
    }),

    leadAssigned: (leadName: string, assigneeName: string) => ({
      type: "lead_assigned" as NotificationType,
      title: "New Lead Assigned",
      message: `${leadName} has been assigned to ${assigneeName}`,
      priority: "medium" as NotificationPriority,
    }),

    expenseApproved: (description: string, amount: string) => ({
      type: "expense_approved" as NotificationType,
      title: "Expense Approved",
      message: `Your expense "${description}" for ${amount} has been approved`,
      priority: "medium" as NotificationPriority,
    }),

    expenseRejected: (description: string, reason: string) => ({
      type: "expense_rejected" as NotificationType,
      title: "Expense Rejected",
      message: `Your expense "${description}" was rejected: ${reason}`,
      priority: "high" as NotificationPriority,
    }),
  };

  /**
   * Send a notification using a template
   */
  static async sendTemplateNotification(
    userId: string,
    templateKey: keyof typeof NotificationService.templates,
    templateArgs: any[],
    options?: {
      actionUrl?: string;
      data?: Record<string, any>;
      priority?: NotificationPriority;
    }
  ): Promise<Notification> {
    const template = (this.templates[templateKey] as any)(...templateArgs);
    
    return this.createNotification({
      userId,
      type: template.type,
      title: template.title,
      message: template.message,
      priority: options?.priority || template.priority,
      actionUrl: options?.actionUrl,
      data: options?.data,
    });
  }

  /**
   * Send notifications to multiple users (bulk notification)
   */
  static async sendBulkNotification(
    userIds: string[],
    notificationData: Omit<Notification, "id" | "createdAt" | "userId">
  ): Promise<Notification[]> {
    const promises = userIds.map(userId =>
      this.createNotification({
        userId,
        ...notificationData,
      })
    );

    return Promise.all(promises);
  }

  /**
   * Send notification to all users in a branch
   */
  static async sendBranchNotification(
    branchId: string,
    notificationData: Omit<Notification, "id" | "createdAt" | "userId">,
    userRole?: string
  ): Promise<Notification[]> {
    // In a real implementation, you would fetch users from the branch
    // For now, this is a placeholder that would need to be implemented
    // based on your user management system
    console.log("Sending branch notification:", { branchId, notificationData, userRole });
    return [];
  }
}
