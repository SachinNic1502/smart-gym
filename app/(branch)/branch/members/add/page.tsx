"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast-provider";

export default function BranchAddMemberPage() {
  const router = useRouter();
  const toast = useToast();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    toast({
      title: "Member created",
      description: "Member created (mock only). In a real system this would save to backend.",
      variant: "success",
    });
    router.push("/branch/members");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Add Member</h2>
          <p className="text-muted-foreground">
            Capture personal, contact, and basic profile information for a new branch member.
          </p>
        </div>
        <Button variant="outline" type="button" onClick={() => router.push("/branch/members")}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
        <Card className="border-t-4 border-t-primary/20">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="Full name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary/20">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" placeholder="Mobile number" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Optional email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="Street, city" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-primary/20 md:col-span-2">
          <CardHeader>
            <CardTitle>Other Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="group">Group</Label>
              <Input id="group" placeholder="e.g. Morning Batch" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referral">Referral Source</Label>
              <Input id="referral" placeholder="e.g. Instagram, Friend" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" placeholder="Any special notes" />
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/branch/members")}>
            Clear
          </Button>
          <Button type="submit">Save Member</Button>
        </div>
      </form>
    </div>
  );
}
