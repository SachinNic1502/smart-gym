"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Added missing import
import { Search } from "lucide-react"; // Added missing import
import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast-provider";

export default function AttendancePage() {
    const [isManualOpen, setIsManualOpen] = useState(false);
    const toast = useToast();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
                    <p className="text-muted-foreground">
                        Live feed of member check-ins and quick manual overrides.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
                        <DialogTrigger asChild>
                            <Button variant="secondary">Manual Check-in</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[420px]">
                            <DialogHeader>
                                <DialogTitle>Manual Check-in</DialogTitle>
                                <DialogDescription>
                                    Use this when a device fails or you need to override access manually.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                                <div className="space-y-2">
                                    <Label htmlFor="member-id">Member ID or phone</Label>
                                    <Input id="member-id" placeholder="e.g. MEM001 or +1 555 000 0000" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reason">Reason / Note</Label>
                                    <Input id="reason" placeholder="e.g. Device offline" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" type="button" onClick={() => setIsManualOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => {
                                        setIsManualOpen(false);
                                        toast({
                                            title: "Manual check-in saved",
                                            description:
                                                "Manual check-in recorded (mock). This would create an entry in real logs.",
                                            variant: "success",
                                        });
                                    }}
                                >
                                    Save Check-in
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Check-ins today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">126</p>
                        <p className="text-[11px] text-muted-foreground">Peak at 7:00–9:00 AM</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Denied entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-red-500">4</p>
                        <p className="text-[11px] text-muted-foreground">Expired or blocked members</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium text-muted-foreground">Average duration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">01:12 h</p>
                        <p className="text-[11px] text-muted-foreground">Based on last 50 exits</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Today's Log</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input placeholder="Search logs..." className="pl-9" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Time</TableHead>
                                <TableHead>Member</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2, 3, 4, 5].map((i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-mono">09:3{i} AM</TableCell>
                                    <TableCell className="font-medium">John Doe</TableCell>
                                    <TableCell>Fingerprint</TableCell>
                                    <TableCell>
                                        <Badge variant="success">Allowed</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell className="font-mono">09:28 AM</TableCell>
                                <TableCell className="font-medium">Unknown</TableCell>
                                <TableCell>Fingerprint</TableCell>
                                <TableCell>
                                    <Badge variant="destructive">Denied (Expired)</Badge>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
