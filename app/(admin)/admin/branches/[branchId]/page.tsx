"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, MapPin, Activity, DollarSign, Fingerprint } from "lucide-react";
import { useBranch } from "@/hooks/use-branches";
import { useDevices } from "@/hooks/use-devices";

export default function BranchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = params?.branchId as string | undefined;
  const { branch, loading, error } = useBranch(branchId || "");
  const {
    devices,
    loading: devicesLoading,
    error: devicesError,
  } = useDevices(branchId ? { branchId } : undefined);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => router.push("/admin/branches")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Branches
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Loading branch...</CardTitle>
            <CardDescription>Please wait while we fetch the latest branch details.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => router.push("/admin/branches")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Branches
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Branch not found</CardTitle>
            <CardDescription>
              We couldn&apos;t find details for this branch. Please return to the list and try again.
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
        onClick={() => router.push("/admin/branches")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Branches
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {branch.name}
            <Badge
              variant={branch.status === "active" ? "success" : "warning"}
              className="text-xs px-3 py-1"
            >
              {branch.status === "active" ? "Active" : branch.status}
            </Badge>
          </h2>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4" /> {branch.address}, {branch.city}, {branch.state}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Branch ID: <span className="font-medium">{branch.id}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branch.memberCount}</div>
            <p className="text-xs text-muted-foreground">Total members in this branch</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (YTD)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {/* TODO: Replace with real revenue when payments are wired */}
              0
            </div>
            <p className="text-xs text-muted-foreground">Revenue (placeholder)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Activity</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Check-ins</p>
                <p className="text-xl font-semibold">0</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground text-right">Devices Online</p>
                <p className="text-xl font-semibold text-right">{branch.deviceCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Key Members (sample)</CardTitle>
            <CardDescription>Recently active or high-value members at this branch.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["Alex Johnson", "Maria Garcia", "Steve Smith"].map((name) => (
                <div key={name} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">Gold Plan • Attended 4x this week</p>
                  </div>
                  <Badge variant="outline" className="text-xs">Active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Devices at this Branch</CardTitle>
            <CardDescription>Overview of biometric devices installed here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {devicesError && (
                <p className="text-xs text-red-500">Failed to load devices for this branch.</p>
              )}
              {devicesLoading ? (
                <p className="text-xs text-muted-foreground">Loading devices...</p>
              ) : devices.length === 0 ? (
                <p className="text-xs text-muted-foreground">No devices found for this branch.</p>
              ) : (
                devices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Fingerprint className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{device.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Last sync{" "}
                          {device.lastPing
                            ? new Date(device.lastPing).toLocaleString()
                            : "not yet synced"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        device.status === "online"
                          ? "success"
                          : device.status === "offline"
                          ? "destructive"
                          : "warning"
                      }
                      className="text-xs"
                    >
                      {device.status === "online"
                        ? "Online"
                        : device.status === "offline"
                        ? "Offline"
                        : "Maintenance"}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
