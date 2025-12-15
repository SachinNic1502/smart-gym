"use client";

import { Bell, Calendar, CreditCard, User, Dumbbell, Apple, MessageSquare, AlertTriangle, CheckCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "member_check_in":
    case "member_check_out":
      return <Calendar className="h-4 w-4" />;
    case "payment_received":
    case "payment_overdue":
      return <CreditCard className="h-4 w-4" />;
    case "membership_expiring":
    case "membership_expired":
      return <AlertTriangle className="h-4 w-4" />;
    case "class_reminder":
    case "class_cancelled":
      return <Calendar className="h-4 w-4" />;
    case "workout_assigned":
      return <Dumbbell className="h-4 w-4" />;
    case "diet_assigned":
      return <Apple className="h-4 w-4" />;
    case "staff_message":
    case "system_announcement":
    case "branch_update":
      return <MessageSquare className="h-4 w-4" />;
    case "lead_assigned":
      return <User className="h-4 w-4" />;
    case "expense_approved":
      return <CheckCircle className="h-4 w-4" />;
    case "expense_rejected":
      return <X className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: Notification["priority"]) => {
  switch (priority) {
    case "urgent":
      return "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950";
    case "high":
      return "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950";
    case "medium":
      return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950";
    case "low":
      return "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950";
    default:
      return "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950";
  }
};

const getPriorityBadgeColor = (priority: Notification["priority"]) => {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "medium":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "low":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

export function NotificationItem({ notification, onMarkAsRead, onDelete, onClick }: NotificationItemProps) {
  const isUnread = notification.status === "unread";
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead(notification.id);
    }
    onClick?.(notification);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        getPriorityColor(notification.priority),
        isUnread && "border-l-4 border-l-primary"
      )}
      onClick={handleClick}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "mt-1 rounded-full p-2",
            isUnread ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}>
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  "text-sm font-medium truncate",
                  isUnread && "font-semibold"
                )}>
                  {notification.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {timeAgo}
                  </span>
                  <Badge variant="secondary" className={getPriorityBadgeColor(notification.priority)}>
                    {notification.priority}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {isUnread && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(notification.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
