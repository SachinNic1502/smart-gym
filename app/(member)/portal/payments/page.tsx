"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Clock } from "lucide-react";

export default function MemberPaymentsPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Billing History</h1>
                <p className="text-muted-foreground">View your active plan and past transactions.</p>
            </div>

            {/* Active Plan Card */}
            <Card className="bg-gradient-to-r from-primary to-blue-600 text-white border-none shadow-lg">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-100 font-medium mb-1">Current Plan</p>
                            <h2 className="text-3xl font-bold">Gold Premium</h2>
                            <p className="text-blue-100 text-sm mt-2 flex items-center gap-1">
                                <Clock className="h-4 w-4" /> Expires on Dec 31, 2025
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold">₹2,500<span className="text-sm font-normal opacity-80">/mo</span></p>
                            <Button variant="secondary" size="sm" className="mt-4 font-semibold text-primary">
                                Auto-Renew On
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Invoice</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { date: "Dec 01, 2025", desc: "Gold Premium - Monthly", amount: "₹2,500", status: "Paid" },
                                { date: "Nov 01, 2025", desc: "Gold Premium - Monthly", amount: "₹2,500", status: "Paid" },
                                { date: "Oct 25, 2025", desc: "Personal Training (5 Sessions)", amount: "₹5,000", status: "Paid" },
                                { date: "Oct 01, 2025", desc: "Gold Premium - Monthly", amount: "₹2,500", status: "Paid" },
                            ].map((tx, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium">{tx.date}</TableCell>
                                    <TableCell>{tx.desc}</TableCell>
                                    <TableCell>{tx.amount}</TableCell>
                                    <TableCell>
                                        <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                                            {tx.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <Download className="h-4 w-4 text-gray-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
