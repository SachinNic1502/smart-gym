"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { devicesApi, ApiError } from "@/lib/api/client";
import type { Device } from "@/lib/types";
import type { BadgeProps } from "@/components/ui/badge";
import { useDevice } from "@/hooks/use-devices";
import { Activity, ArrowLeft, Fingerprint, MapPin, RefreshCcw, Server, Wifi } from "lucide-react";

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deviceId = params?.deviceId as string | undefined;

  const { device, loading, error } = useDevice(deviceId || "");

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => router.push("/admin/devices")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Devices
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Loading device...</CardTitle>
            <CardDescription>Please wait while we fetch the latest device details.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error || !device) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => router.push("/admin/devices")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Devices
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Device not found</CardTitle>
            <CardDescription>
              {error || "We couldn&apos;t find details for this device. Please return to the list and try again."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const statusLabel = device.status.charAt(0).toUpperCase() + device.status.slice(1);

  const statusVariant: BadgeProps["variant"] =
    device.status === "online"
      ? "success"
      : device.status === "offline"
      ? "destructive"
      : "warning";

  const connectionLabel =
    device.connectionType === "cloud"
      ? "Cloud"
      : "LAN (Local Network)";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => router.push("/admin/devices")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Devices
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Fingerprint className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>{device.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-3 w-3" /> {device.branchName}
              </CardDescription>
            </div>
          </div>
          <Badge variant={statusVariant} className="text-xs px-3 py-1">
            {statusLabel}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Device ID</p>
            <p className="font-mono text-sm">{device.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Model / Firmware</p>
            <p className="font-medium">{device.model ?? device.firmwareVersion ?? device.type}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Sync</p>
            <p className="font-medium">
              {device.lastPing ? new Date(device.lastPing).toLocaleString() : "Not synced yet"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection</CardTitle>
            <Wifi className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Connection type</p>
              <p className="font-medium">{connectionLabel}</p>
            </div>
            {device.connectionType === "cloud" ? (
              <div>
                <p className="text-xs text-muted-foreground">Cloud URL</p>
                <p className="break-all">
                  {device.cloudUrl || "Not configured"}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground">LAN IP Address</p>
                <p className="font-mono text-sm">
                  {device.ipAddress || "Not configured"}
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Connectivity metrics and latency graphs will appear here when backend metrics are connected.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Commands</CardTitle>
            <Server className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Sync Users</span>
                <span className="text-xs text-muted-foreground">Success • 2 mins ago</span>
              </li>
              <li className="flex justify-between">
                <span>Restart Device</span>
                <span className="text-xs text-muted-foreground">Queued • 5 mins ago</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" variant="outline">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Trigger Manual Sync
            </Button>
            <Button className="w-full" variant="outline">
              Restart Device
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
