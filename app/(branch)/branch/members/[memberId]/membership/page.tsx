"use client";

import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";

const MOCK_MEMBER = {
  id: "MEM001",
  name: "Alex Johnson",
  contact: "+1 555 000 0000",
};

export default function MemberMembershipPage() {
  const router = useRouter();
  const params = useParams<{ memberId: string }>();
  const memberId = params?.memberId || MOCK_MEMBER.id;
  const toast = useToast();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    toast({
      title: "Membership saved",
      description: "Membership started/renewed (mock). In a real app this would create a billing record.",
      variant: "success",
    });
    router.push("/branch/members");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Assign Membership</h2>
          <p className="text-muted-foreground">
            Choose a plan and set dates for this member's membership.
          </p>
        </div>
        <Button variant="outline" type="button" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-t-4 border-t-primary/20">
          <CardHeader>
            <CardTitle>Member Information</CardTitle>
            <CardDescription>Basic details of the member you are assigning a plan to.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Member ID:</span> {memberId}
            </p>
            <p>
              <span className="font-semibold">Name:</span> {MOCK_MEMBER.name}
            </p>
            <p>
              <span className="font-semibold">Contact:</span> {MOCK_MEMBER.contact}
            </p>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="border-t-4 border-t-primary/20">
            <CardHeader>
              <CardTitle>Select Membership</CardTitle>
              <CardDescription>Pick a plan from your configured catalog.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan">Membership plan</Label>
                <select
                  id="plan"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Select plan</option>
                  <option value="gold">Gold Premium (₹2,499 /mo)</option>
                  <option value="silver">Silver Monthly (₹1,499 /mo)</option>
                  <option value="basic">Basic (₹799 /mo)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Start date</Label>
                  <Input id="start" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End date</Label>
                  <Input id="end" type="date" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input id="amount" type="number" placeholder="2499" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount (₹)</Label>
                  <Input id="discount" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mode">Payment mode</Label>
                  <select
                    id="mode"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit">Start Membership</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
