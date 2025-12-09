"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Download, CreditCard, Filter, AlertCircle, CheckCircle2, DollarSign } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

export default function PaymentsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const toast = useToast();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Payments & Renewals</h2>
                    <p className="text-muted-foreground">Manage transactions, invoices, and membership renewals.</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        type="button"
                        onClick={() =>
                            toast({
                                title: "Export report",
                                description: "Exporting payments report is mock-only right now.",
                                variant: "info",
                            })
                        }
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                    </Button>
                    <Button
                        type="button"
                        onClick={() =>
                            toast({
                                title: "Record payment",
                                description: "Payment recording flow will be wired to billing later.",
                                variant: "info",
                            })
                        }
                    >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Record Payment
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue (Dec)</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹4,25,000</div>
                        <p className="text-xs text-muted-foreground">+12% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Collections</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹45,000</div>
                        <p className="text-xs text-muted-foreground">8 invoices overdue</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Renewals</CardTitle>
                        <CreditCard className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">12</div>
                        <p className="text-xs text-muted-foreground">Expiring in next 7 days</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="transactions" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="transactions">All Transactions</TabsTrigger>
                    <TabsTrigger value="renewals">Pending Renewals</TabsTrigger>
                </TabsList>

                {/* Transactions Tab */}
                <TabsContent value="transactions" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle>Recent Transactions</CardTitle>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-64">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search member or invoice..."
                                            className="pl-8"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        type="button"
                                        onClick={() =>
                                            toast({
                                                title: "Transactions filter",
                                                description: "Advanced filters are mock-only on this screen.",
                                                variant: "info",
                                            })
                                        }
                                    >
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice ID</TableHead>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Payment Method</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[
                                        { id: "INV-2024-001", member: "Alex Johnson", date: "Dec 08, 2025", amount: "₹2,500", method: "UPI", status: "Paid" },
                                        { id: "INV-2024-002", member: "Sarah Connor", date: "Dec 07, 2025", amount: "₹1,500", method: "Cash", status: "Paid" },
                                        { id: "INV-2024-003", member: "Mike Ross", date: "Dec 05, 2025", amount: "₹5,000", method: "Card", status: "Failed" },
                                        { id: "INV-2024-004", member: "Harvey Specter", date: "Dec 04, 2025", amount: "₹12,000", method: "Net Banking", status: "Paid" },
                                        { id: "INV-2024-005", member: "Donna Paulsen", date: "Dec 01, 2025", amount: "₹2,500", method: "UPI", status: "Paid" },
                                    ].map((tx, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                                            <TableCell className="font-medium">{tx.member}</TableCell>
                                            <TableCell>{tx.date}</TableCell>
                                            <TableCell>{tx.amount}</TableCell>
                                            <TableCell>{tx.method}</TableCell>
                                            <TableCell>
                                                <Badge variant={tx.status === 'Paid' ? 'success' : 'destructive'}>
                                                    {tx.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">
                                                    <Download className="h-4 w-4 text-gray-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Renewals Tab */}
                <TabsContent value="renewals" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Expiring Memberships</CardTitle>
                            <CardDescription>Members whose plans are expiring soon or have expired.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Current Plan</TableHead>
                                        <TableHead>Expiry Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[
                                        { member: "Rachel Zane", plan: "Silver Monthly", expiry: "Tomorrow", status: "Active" },
                                        { member: "Louis Litt", plan: "Gold Yearly", expiry: "Yesterday", status: "Expired" },
                                        { member: "Jessica Pearson", plan: "Platinum", expiry: "In 3 Days", status: "Active" },
                                    ].map((item, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{item.member}</TableCell>
                                            <TableCell>{item.plan}</TableCell>
                                            <TableCell className={item.status === 'Expired' ? 'text-red-600 font-bold' : ''}>{item.expiry}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.status === 'Active' ? 'warning' : 'destructive'}>
                                                    {item.status === 'Active' ? 'Expiring Soon' : 'Expired'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        type="button"
                                                        onClick={() =>
                                                            toast({
                                                                title: "Reminder queued",
                                                                description:
                                                                    "A renewal reminder would be sent to this member (mock).",
                                                                variant: "info",
                                                            })
                                                        }
                                                    >
                                                        Remind
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        type="button"
                                                        onClick={() =>
                                                            toast({
                                                                title: "Renewal flow",
                                                                description:
                                                                    "In a full app this would open a membership renewal screen.",
                                                                variant: "info",
                                                            })
                                                        }
                                                    >
                                                        Renew
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
