"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCcw, Power, Wifi, Fingerprint, Plus } from "lucide-react";

export default function DevicesPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Device Fleet</h2>
                    <p className="text-muted-foreground">Monitor and manage biometric devices across all branches.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Device
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-green-50 border-green-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600">Online</p>
                            <p className="text-2xl font-bold text-green-700">28</p>
                        </div>
                        <Wifi className="h-8 w-8 text-green-500 opacity-50" />
                    </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-600">Offline</p>
                            <p className="text-2xl font-bold text-red-700">2</p>
                        </div>
                        <Power className="h-8 w-8 text-red-500 opacity-50" />
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Devices</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Device Name</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>IP Address</TableHead>
                                <TableHead>Last Sync</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[
                                { id: "DEV001", name: "Main Entrance A", branch: "FitStop Downtown", ip: "192.168.1.101", sync: "2 mins ago", status: "Online", model: "ZKTeco F22" },
                                { id: "DEV002", name: "Back Validtor", branch: "FitStop Downtown", ip: "192.168.1.102", sync: "5 mins ago", status: "Online", model: "eSSL uFace" },
                                { id: "DEV003", name: "Turnstile 1", branch: "Iron Gym East", ip: "10.0.0.45", sync: "15 hours ago", status: "Offline", model: "ZKTeco K40" },
                            ].map((device) => (
                                <TableRow key={device.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2.5 w-2.5 rounded-full ${device.status === 'Online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                            <span className="text-xs font-medium">{device.status}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Fingerprint className="h-4 w-4 text-gray-400" />
                                            <Link href={`/admin/devices/${device.id}`} className="hover:underline">
                                                {device.name}
                                            </Link>
                                        </div>
                                    </TableCell>
                                    <TableCell>{device.branch}</TableCell>
                                    <TableCell className="font-mono text-xs">{device.ip}</TableCell>
                                    <TableCell>{device.sync}</TableCell>
                                    <TableCell>{device.model}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">
                                            <RefreshCcw className="h-4 w-4 mr-2" />
                                            Sync
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
