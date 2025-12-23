"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Check, Filter, X, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import type { Notification, NotificationType, NotificationPriority } from "@/lib/types";

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

      const response = await notificationsApi.list(params);
      setNotifications(response.data);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Failed to load notifications";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

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
    <Button variant="ghost" size="sm" className="relative">
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Notifications</DialogTitle>
              <DialogDescription>
                Stay updated with your latest activities and alerts.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {showFilters && (
          <Card className="border-dashed">
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={filters.type}
                    onValueChange={(value) => setFilters({ ...filters, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
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
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={filters.priority}
                    onValueChange={(value) => setFilters({ ...filters, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All priorities</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
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
                <div className="flex justify-end mt-2">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Separator />

        <ScrollArea className="flex-1 max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading notifications...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium">No notifications</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters ? "Try adjusting your filters" : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDeleteNotification}
                  onClick={onNotificationClick}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
