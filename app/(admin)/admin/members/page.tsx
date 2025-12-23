"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Download, Users, SlidersHorizontal, ChevronLeft, ChevronRight, Eye, UserCog, UserCircle2, Filter } from "lucide-react";
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

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-indigo-800 via-purple-700 to-fuchsia-800 text-white p-8 rounded-[2rem] shadow-2xl overflow-hidden mx-1 border border-white/10">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-12 -translate-y-12">
                    <UserCircle2 className="w-64 h-64" />
                </div>
                <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-4xl font-black tracking-tight">Global Members</h2>
                        </div>
                        <p className="text-indigo-100 mt-1 text-lg font-light max-w-xl">
                            Master directory of all members across the entire gym network, including subcriptions and status.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm shadow-xl transition-all hover:scale-105 active:scale-95 px-6 font-bold"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export Directory
                    </Button>
                </div>
            </div>

            {/* Content Section */}
            <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden mx-1">
                <CardHeader className="bg-white border-b border-gray-100 pb-6 pt-8 px-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold text-gray-800">Member Directory</CardTitle>
                            <p className="text-sm text-gray-500 mt-1 font-medium">Total registered users: {total}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            {/* Search */}
                            <div className="relative w-full sm:w-72 group">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <Input
                                    placeholder="Search member..."
                                    className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:ring-indigo-500 rounded-xl transition-all font-medium"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSearchTerm(value);
                                        updateFilters({ search: value || undefined, page: 1 });
                                    }}
                                />
                            </div>

                            {/* Filters Bar */}
                            <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-2 px-3">
                                    <SlidersHorizontal className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Filter</span>
                                </div>
                                <select
                                    className="h-8 rounded-lg border-0 bg-white shadow-sm px-3 text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
                                    value={filters.branchId || ""}
                                    onChange={(e) => updateFilters({ branchId: e.target.value || undefined, page: 1 })}
                                >
                                    <option value="">All Branches</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="h-8 rounded-lg border-0 bg-white shadow-sm px-3 text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-500 min-w-[100px]"
                                    value={filters.status || ""}
                                    onChange={(e) => updateFilters({ status: e.target.value || undefined, page: 1 })}
                                >
                                    <option value="">All Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Frozen">Frozen</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {error && (
                        <div className="p-4 mx-8 mt-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <Table className="min-w-[900px]">
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-0">
                                    <TableHead className="font-bold text-gray-600 px-8 py-4 uppercase text-[11px] tracking-wider">Member</TableHead>
                                    <TableHead className="font-bold text-gray-600 py-4 uppercase text-[11px] tracking-wider">Home Branch</TableHead>
                                    <TableHead className="font-bold text-gray-600 py-4 uppercase text-[11px] tracking-wider">Subscription</TableHead>
                                    <TableHead className="font-bold text-gray-600 py-4 uppercase text-[11px] tracking-wider font-semibold">Joined Date</TableHead>
                                    <TableHead className="font-bold text-gray-600 py-4 uppercase text-[11px] tracking-wider">Status</TableHead>
                                    <TableHead className="text-right font-bold text-gray-600 px-8 py-4 uppercase text-[11px] tracking-wider">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Fetching members...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : membersWithBranch.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                <Users className="h-12 w-12" />
                                                <p className="font-bold text-gray-500 uppercase tracking-widest">No members found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    membersWithBranch.map((member, index) => (
                                        <TableRow key={member.id} className="group hover:bg-indigo-50/30 transition-all border-b border-gray-50">
                                            <TableCell className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-11 w-11 rounded-2xl shadow-sm border border-white">
                                                        <AvatarFallback className={`text-white font-black bg-gradient-to-br ${index % 2 === 0 ? 'from-indigo-500 to-purple-600' : 'from-fuchsia-500 to-rose-600'}`}>
                                                            {member.name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <Link href={`/admin/members/${member.id}`} className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase text-xs tracking-tight">
                                                            {member.name}
                                                        </Link>
                                                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">{member.id}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="bg-white font-bold text-[10px] text-gray-600 uppercase tracking-tighter shadow-sm border-gray-200">
                                                    {member.branchName}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col items-start gap-1">
                                                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 text-[9px] font-black tracking-widest uppercase">
                                                        {member.plan}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-500 text-xs font-semibold">
                                                {new Date(member.createdAt).toLocaleDateString('en-GB')}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm border-0 ${member.status === "Active" ? "bg-emerald-500 text-white" :
                                                        member.status === "Expired" ? "bg-rose-500 text-white" :
                                                            "bg-amber-500 text-white"
                                                        }`}
                                                >
                                                    {member.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="px-8 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white border border-gray-100 shadow-sm text-indigo-600 hover:bg-indigo-50">
                                                        <Link href={`/admin/members/${member.id}`} title="View Profile">
                                                            <Eye className="h-4 w-4" />
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

                    {/* Pagination */}
                    {!loading && membersWithBranch.length > 0 && (
                        <div className="p-8 border-t border-gray-50 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                Page {page} of {totalPages}
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl px-4 font-bold disabled:opacity-30 transition-all hover:bg-indigo-50 border-gray-200"
                                    disabled={page <= 1}
                                    onClick={() => updateFilters({ page: Math.max(1, page - 1) })}
                                >
                                    <ChevronLeft className="mr-1 h-3 w-3" /> Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl px-4 font-bold disabled:opacity-30 transition-all hover:bg-indigo-50 border-gray-200"
                                    disabled={page >= totalPages}
                                    onClick={() => updateFilters({ page: Math.min(totalPages, page + 1) })}
                                >
                                    Next <ChevronRight className="ml-1 h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
