"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Fingerprint, MapPin, Activity, Wifi, RefreshCcw, Server } from "lucide-react";

const MOCK_DEVICES = [
  {
    id: "DEV001",
    name: "Main Entrance A",
    branch: "FitStop Downtown",
    ip: "192.168.1.101",
    status: "Online",
    model: "ZKTeco F22",
    sync: "2 mins ago",
  },
  {
    id: "DEV002",
    name: "Back Validtor",
    branch: "FitStop Downtown",
    ip: "192.168.1.102",
    status: "Online",
    model: "eSSL uFace",
    sync: "5 mins ago",
  },
  {
    id: "DEV003",
    name: "Turnstile 1",
    branch: "Iron Gym East",
    ip: "10.0.0.45",
    status: "Offline",
    model: "ZKTeco K40",
    sync: "15 hours ago",
  },
];

export default function DeviceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deviceId = params?.deviceId as string | undefined;

  const device = useMemo(
    () => MOCK_DEVICES.find((d) => d.id === deviceId),
    [deviceId]
  );

  if (!device) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/admin/devices")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Devices
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Device not found</CardTitle>
            <CardDescription>
              We couldn&apos;t find details for this device. Please return to the list and try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

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
                <MapPin className="h-3 w-3" /> {device.branch}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={device.status === "Online" ? "success" : "destructive"}
            className="text-xs px-3 py-1"
          >
            {device.status}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">IP Address</p>
            <p className="font-mono text-sm">{device.ip}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Model</p>
            <p className="font-medium">{device.model}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last Sync</p>
            <p className="font-medium">{device.sync}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection</CardTitle>
            <Wifi className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
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
