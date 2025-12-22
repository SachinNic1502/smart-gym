"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { notificationsApi, ApiError } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast-provider";
import { useAuth } from "@/hooks/use-auth";
import type { Notification } from "@/lib/types";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await notificationsApi.list({ page: "1", pageSize: "20" });
      setNotifications(response.data);
    } catch (e) {
      // Create a more user-friendly error or silence "No session" errors if they happen during race conditions
      const message = e instanceof ApiError ? e.message : "Failed to load notifications";
      if (message !== "No session found") {
        console.error("Failed to load notifications:", message);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const response = await notificationsApi.getUnreadCount();
      setUnreadCount(response.unreadCount);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Unknown error";
      if (message !== "No session found") {
        console.error("Failed to load unread count:", e);
      }
    }
  }, [user]);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (notification.status === "unread") {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification?.status === "unread") {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n =>
          n.id === id
            ? { ...n, status: "read" as const, readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to mark as read";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }, [toast, user]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    try {
      await notificationsApi.markAsRead(undefined, true);
      setNotifications(prev =>
        prev.map(n => ({ ...n, status: "read" as const, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      toast({ title: "Success", description: "All notifications marked as read", variant: "success" });
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to mark all as read";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  }, [toast, user]);

  const refreshNotifications = useCallback(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [loadNotifications, loadUnreadCount, user]);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();

      // Set up polling for new notifications
      const interval = setInterval(() => {
        loadUnreadCount();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    } else {
      // Clear notifications when logged out
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [loadNotifications, loadUnreadCount, user]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook for showing real-time notification toasts
export function useNotificationToasts() {
  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);
  const { addNotification } = useNotifications();

  const showToast = useCallback((notification: Notification) => {
    // Add to notification center
    addNotification(notification);

    // Show toast for high priority or urgent notifications
    if (notification.priority === "high" || notification.priority === "urgent") {
      setActiveToasts(prev => [...prev, notification]);

      // Auto-remove after duration
      setTimeout(() => {
        setActiveToasts(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    }
  }, [addNotification]);

  const removeToast = useCallback((id: string) => {
    setActiveToasts(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    activeToasts,
    showToast,
    removeToast,
  };
}
