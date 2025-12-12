"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMembers } from "@/hooks/use-members";
import { useBranches } from "@/hooks/use-branches";

export default function GlobalMembersPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const { members, total, loading, error, filters, updateFilters } = useMembers({ page: 1, pageSize: 25 });
    const { branches } = useBranches();

    useEffect(() => {
        const handleGlobalSearch = (event: Event) => {
            const custom = event as CustomEvent<{ value?: unknown }>;
            if (custom.detail && typeof custom.detail.value === "string") {
                setSearchTerm(custom.detail.value);
            }
        };

        if (typeof window !== "undefined") {
            window.addEventListener("smartfit:global-search", handleGlobalSearch as EventListener);
        }

        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("smartfit:global-search", handleGlobalSearch as EventListener);
            }
        };
    }, []);

    const membersWithBranch = members.map((m) => {
        const branch = branches.find((b) => b.id === m.branchId);
        return {
            ...m,
            branchName: branch ? branch.name : m.branchId,
        };
    });

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 25;
    const totalPages = Math.max(1, Math.ceil((total || 0) / pageSize));

    const filteredMembers = membersWithBranch.filter((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.branchName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Global Members</h2>
                    <p className="text-muted-foreground">Master list of all members across all branches.</p>
                </div>
                <Button variant="outline" className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <Card className="border-t-4 border-t-primary/20">
                <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Member Directory ({total})</CardTitle>
                        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
                            <div className="relative w-full sm:max-w-sm">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search member or branch..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSearchTerm(value);
                                        updateFilters({ search: value || undefined, page: 1 });
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Branch</span>
                                <select
                                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs sm:min-w-[140px]"
                                    value={filters.branchId || ""}
                                    onChange={(e) => updateFilters({ branchId: e.target.value || undefined, page: 1 })}
                                >
                                    <option value="">All branches</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Status</span>
                                <select
                                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs sm:min-w-[120px]"
                                    value={filters.status || ""}
                                    onChange={(e) => updateFilters({ status: e.target.value || undefined, page: 1 })}
                                >
                                    <option value="">All</option>
                                    <option value="Active">Active</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Frozen">Frozen</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <p className="mb-2 text-xs text-red-500">{error}</p>
                    )}
                    <div className="overflow-x-auto">
                        <Table className="min-w-[820px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member Name</TableHead>
                                    <TableHead>Home Branch</TableHead>
                                    <TableHead>Current Plan</TableHead>
                                    <TableHead>Join Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                                            Loading members...
                                        </TableCell>
                                    </TableRow>
                                ) : membersWithBranch.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-6 text-center text-xs text-muted-foreground">
                                            No members found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    membersWithBranch.map((member) => (
                                        <TableRow key={member.id} className="cursor-pointer hover:bg-gray-50">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <Link href={`/admin/members/${member.id}`} className="font-medium hover:underline">
                                                        {member.name}
                                                    </Link>
                                                </div>
                                            </TableCell>
                                            <TableCell>{member.branchName}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{member.plan}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(member.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={member.status === "Active" ? "success" : "destructive"}>
                                                    {member.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button asChild variant="outline" size="sm">
                                                        <Link href={`/admin/members/${member.id}`}>
                                                            View
                                                        </Link>
                                                    </Button>
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/admin/members/${member.id}`}>
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {!loading && membersWithBranch.length > 0 && (
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
                            <span>
                                Page {page} of {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    disabled={page <= 1}
                                    onClick={() => updateFilters({ page: Math.max(1, page - 1) })}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    disabled={page >= totalPages}
                                    onClick={() => updateFilters({ page: Math.min(totalPages, page + 1) })}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
