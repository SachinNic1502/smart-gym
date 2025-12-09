"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Wallet, LineChart, MapPin } from "lucide-react";

export default function BranchInsightsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Insights</h2>
          <p className="text-muted-foreground">
            Understand trends in memberships, payments, lead sources, and member traffic for this branch.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-t-4 border-t-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">892</p>
            <p className="text-[11px] text-muted-foreground">+24 vs last month</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-emerald-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Monthly collections</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹3.4L</p>
            <p className="text-[11px] text-muted-foreground">Across all plans</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-blue-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">New leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">48</p>
            <p className="text-[11px] text-muted-foreground">Conversion 42%</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-rose-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Churn risk</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">22</p>
            <p className="text-[11px] text-muted-foreground">Members inactive for 30+ days</p>
          </CardContent>
        </Card>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Current insight numbers use mock sample data for demo purposes. Connect your analytics sources to power
        live insights.
      </p>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Branch performance snapshot for the last 30 days.</span>
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-1 py-0.5">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-7 rounded-full px-3 text-[11px]"
          >
            30 days
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 rounded-full px-3 text-[11px]"
          >
            90 days
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 rounded-full px-3 text-[11px]"
          >
            Custom
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-t-4 border-t-primary/20">
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Memberships</CardTitle>
              <CardDescription>Top 3 trending membership plans.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>From</span>
              <Input type="date" className="h-8 w-32" />
              <span>To</span>
              <Input type="date" className="h-8 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-3">
              <Users className="h-10 w-10 text-primary/40" />
              <p className="text-sm">You will get this data once sufficient membership data is generated.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary/20">
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Payment modes</CardTitle>
              <CardDescription>Top 3 payment modes by amount.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>By</span>
              <select className="h-8 rounded-md border border-input bg-background px-2 text-xs">
                <option value="amount">Amount</option>
                <option value="count">Count</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-3">
              <Wallet className="h-10 w-10 text-primary/40" />
              <p className="text-sm">You will get this data once sufficient payment data is generated.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary/20">
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Lead sources</CardTitle>
              <CardDescription>Top 3 sources bringing members to this branch.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Period</span>
              <Input type="month" className="h-8 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-3">
              <MapPin className="h-10 w-10 text-primary/40" />
              <p className="text-sm">You will get this data once sufficient lead data is generated.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary/20">
          <CardHeader className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Member traffic</CardTitle>
              <CardDescription>Average active member count across the month.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Month</span>
              <Input type="month" className="h-8 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-3">
              <LineChart className="h-10 w-10 text-primary/40" />
              <p className="text-sm">You will get this data once sufficient member traffic data is generated.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
