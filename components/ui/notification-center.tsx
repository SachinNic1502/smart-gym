"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Check, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast-provider";
import { notificationsApi, ApiError } from "@/lib/api/client";
import { NotificationItem } from "@/components/ui/notification-item";
import type { Notification } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

interface NotificationCenterProps {
  trigger?: React.ReactNode;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationCenter({ trigger, onNotificationClick }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    priority: "",
    status: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: "1",
        pageSize: "50",
      };

      if (filters.type) params.type = filters.type;
      if (filters.priority) params.priority = filters.priority;
      if (filters.status) params.status = filters.status;
      // If user is branch_admin, maybe we want to force branchId? 
      // API handles it, but explicit is okay too.
      // if (user?.branchId) params.branchId = user.branchId;

      const response = await notificationsApi.list(params);
      setNotifications(response.data);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to load notifications";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filters, toast, user]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      setUnreadCount(response.unreadCount);
    } catch (e) {
      console.error("Failed to load unread count:", e);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  useEffect(() => {
    loadUnreadCount();
    // Set up polling for new notifications
    const interval = setInterval(loadUnreadCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, status: "read" as const, readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to mark as read";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleMarkAllAsRead = async () => {
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
  };

  const handleDeleteNotification = async (notificationId: string) => {
    // In a real implementation, you would call a delete API
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const deleted = notifications.find(n => n.id === notificationId);
    if (deleted?.status === "unread") {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const clearFilters = () => {
    setFilters({ type: "", priority: "", status: "" });
  };

  const hasActiveFilters = filters.type || filters.priority || filters.status;

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="relative transition-all hover:bg-slate-100 dark:hover:bg-slate-800">
      <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-medium text-white shadow-sm animate-in zoom-in duration-300">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] max-h-[85vh] p-0 gap-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-950">
        <DialogHeader className="p-4 py-3 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Bell className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 dark:text-slate-100">Notifications</DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-medium">
                  {unreadCount > 0 ? `You have ${unreadCount} unread messages` : "No new notifications"}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-full"
                  onClick={handleMarkAllAsRead}
                  title="Mark all as read"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-full transition-colors ${showFilters ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                onClick={() => setShowFilters(!showFilters)}
                title="Filter notifications"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {showFilters && (
          <div className="bg-slate-50 dark:bg-slate-900/30 p-4 border-b border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Type</Label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => setFilters({ ...filters, type: value })}
                >
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="member_check_in">Check In</SelectItem>
                    <SelectItem value="payment_received">Payment</SelectItem>
                    <SelectItem value="class_reminder">Class</SelectItem>
                    <SelectItem value="workout_assigned">Workout</SelectItem>
                    <SelectItem value="system_announcement">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value })}
                >
                  <SelectTrigger className="h-8 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="w-full mt-3 h-7 text-xs text-slate-500 hover:text-slate-900"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        <ScrollArea className="flex-1 min-h-[300px] max-h-[450px] bg-white dark:bg-slate-950">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="h-6 w-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
              <div className="text-xs font-medium text-slate-400">Syncing...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">All caught up!</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                {hasActiveFilters ? "No notifications match your filters." : "You have no new notifications at the moment."}
              </p>
              {hasActiveFilters && (
                <Button variant="link" size="sm" onClick={clearFilters} className="mt-2 text-rose-500">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDeleteNotification}
                  onClick={onNotificationClick}
                />
              ))}
              <div className="p-4 text-center">
                <p className="text-[10px] text-slate-300 uppercase font-bold tracking-widest">End of notifications</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
