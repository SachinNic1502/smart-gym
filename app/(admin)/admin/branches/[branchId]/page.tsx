"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, MapPin, Activity, DollarSign, Fingerprint } from "lucide-react";

const MOCK_BRANCHES = [
  {
    id: "BR001",
    name: "FitStop Downtown",
    location: "New York, NY",
    admin: "John Doe",
    status: "Active",
    members: 892,
    revenueYtd: "₹34,50,000",
    todayCheckins: 145,
    devicesOnline: 5,
  },
  {
    id: "BR002",
    name: "Iron Gym East",
    location: "Brooklyn, NY",
    admin: "Sarah Connor",
    status: "Active",
    members: 650,
    revenueYtd: "₹24,50,000",
    todayCheckins: 102,
    devicesOnline: 3,
  },
  {
    id: "BR003",
    name: "Flex Studio",
    location: "Queens, NY",
    admin: "Mike Tyson",
    status: "Pending",
    members: 0,
    revenueYtd: "₹0",
    todayCheckins: 0,
    devicesOnline: 0,
  },
];

export default function BranchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const branchId = params?.branchId as string | undefined;

  const branch = useMemo(
    () => MOCK_BRANCHES.find((b) => b.id === branchId),
    [branchId]
  );

  if (!branch) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Button variant="ghost" className="flex items-center gap-2" onClick={() => router.push("/admin/branches")}>
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
              variant={branch.status === "Active" ? "success" : "warning"}
              className="text-xs px-3 py-1"
            >
              {branch.status}
            </Badge>
          </h2>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4" /> {branch.location}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Managed by <span className="font-medium">{branch.admin}</span>
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
            <div className="text-2xl font-bold">{branch.members}</div>
            <p className="text-xs text-muted-foreground">Total members in this branch</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (YTD)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branch.revenueYtd}</div>
            <p className="text-xs text-muted-foreground">From memberships and add-ons</p>
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
                <p className="text-xl font-semibold">{branch.todayCheckins}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground text-right">Devices Online</p>
                <p className="text-xl font-semibold text-right">{branch.devicesOnline}</p>
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
              {["Main Entrance A", "Turnstile 1"].map((deviceName, index) => (
                <div key={deviceName} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Fingerprint className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{deviceName}</p>
                      <p className="text-xs text-muted-foreground">Last sync {index === 0 ? "2 mins" : "1 hour"} ago</p>
                    </div>
                  </div>
                  <Badge variant={index === 0 ? "success" : "warning"} className="text-xs">
                    {index === 0 ? "Online" : "Degraded"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
