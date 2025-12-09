"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, DollarSign, TrendingDown, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

export default function ExpensesPage() {
    const toast = useToast();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
                    <p className="text-muted-foreground">Track your branch spending and overheads.</p>
                </div>
                <Button
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                    type="button"
                    onClick={() =>
                        toast({
                            title: "Add expense",
                            description: "Expense entry form is mock-only in this version.",
                            variant: "info",
                        })
                    }
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses (Oct)</CardTitle>
                        <DollarSign className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹3,45,000</div>
                        <p className="text-xs text-muted-foreground">+12% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Largest Category</CardTitle>
                        <TrendingDown className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rent</div>
                        <p className="text-xs text-muted-foreground">₹2,00,000 / month</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Expense History</CardTitle>
                    <CardDescription>Recent transactions and bills.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Payee</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { desc: "Monthly Rent", cat: "Rent", date: "Oct 01, 2025", payee: "Landlord LLC", amount: "₹2,00,000" },
                                { desc: "Cleaning Supplies", cat: "Maintenance", date: "Oct 05, 2025", payee: "CleanCo", amount: "₹12,500" },
                                { desc: "Electricity Bill", cat: "Utilities", date: "Oct 12, 2025", payee: "Power Grid", amount: "₹35,000" },
                                { desc: "Equipment Repair", cat: "Maintenance", date: "Oct 15, 2025", payee: "GymFix", amount: "₹25,000" },
                                { desc: "Staff Snacks", cat: "Misc", date: "Oct 20, 2025", payee: "Costco", amount: "₹8,500" },
                            ].map((ex, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium">{ex.desc}</TableCell>
                                    <TableCell><span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">{ex.cat}</span></TableCell>
                                    <TableCell>{ex.date}</TableCell>
                                    <TableCell>{ex.payee}</TableCell>
                                    <TableCell className="text-right font-mono text-red-600">-{ex.amount}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
