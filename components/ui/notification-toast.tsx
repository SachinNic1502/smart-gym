"use client";

import { useEffect, useState } from "react";
import { X, Bell, Calendar, CreditCard, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  duration?: number;
  onClick?: (notification: Notification) => void;
}

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "member_check_in":
    case "member_check_out":
      return <Calendar className="h-4 w-4" />;
    case "payment_received":
      return <CreditCard className="h-4 w-4 text-green-600" />;
    case "payment_overdue":
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    case "membership_expiring":
    case "membership_expired":
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    case "expense_approved":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "expense_rejected":
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getPriorityStyles = (priority: Notification["priority"]) => {
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

export function NotificationToast({ notification, onClose, duration = 5000, onClick }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);

    // Auto-dismiss after duration
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [duration, onClose]);

  const handleClick = () => {
    onClick?.(notification);
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out",
        getPriorityStyles(notification.priority),
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium truncate">
                {notification.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {notification.message}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <button
              className="text-xs text-primary hover:underline"
              onClick={handleClick}
            >
              View details
            </button>
            <span className="text-xs text-muted-foreground capitalize">
              {notification.priority}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Container for managing multiple toasts
interface NotificationToastContainerProps {
  toasts: Notification[];
  onRemove: (id: string) => void;
  onToastClick?: (notification: Notification) => void;
}

export function NotificationToastContainer({ toasts, onRemove, onToastClick }: NotificationToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast, index) => (
        <div key={toast.id} className="pointer-events-auto" style={{ zIndex: 1000 - index }}>
          <NotificationToast
            notification={toast}
            onClose={() => onRemove(toast.id)}
            onClick={onToastClick}
            duration={5000}
          />
        </div>
      ))}
    </div>
  );
}
