"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [branchEmail, setBranchEmail] = useState("");
    const [branchPassword, setBranchPassword] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [memberPhone, setMemberPhone] = useState("");
    const [branchError, setBranchError] = useState("");
    const [adminError, setAdminError] = useState("");
    const [memberError, setMemberError] = useState("");

    const handleLogin = (role: string) => {
        setBranchError("");
        setAdminError("");
        setMemberError("");

        if (role === 'branch_admin') {
            if (!branchEmail || !branchPassword) {
                setBranchError("Please enter email and password.");
                return;
            }
            if (!branchEmail.includes("@")) {
                setBranchError("Please enter a valid email address.");
                return;
            }
        } else if (role === 'super_admin') {
            if (!adminEmail || !adminPassword) {
                setAdminError("Please enter email and password.");
                return;
            }
            if (!adminEmail.includes("@")) {
                setAdminError("Please enter a valid email address.");
                return;
            }
        } else if (role === 'member') {
            if (!memberPhone) {
                setMemberError("Please enter your phone number.");
                return;
            }
        }

        setIsLoading(true);
        // Simulate login delay
        setTimeout(() => {
            if (role === 'super_admin') {
                router.push('/admin/dashboard');
            } else if (role === 'branch_admin') {
                router.push('/branch/dashboard');
            } else {
                router.push('/portal/dashboard');
            }
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center">
                    <div className="h-12 w-12 bg-primary rounded-xl mx-auto flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg shadow-primary/30">
                        SF
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-secondary">Welcome back</h2>
                    <p className="text-muted-foreground mt-2">Sign in to SmartFit Management</p>
                </div>

                <Tabs defaultValue="branch" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="admin">Super Admin</TabsTrigger>
                        <TabsTrigger value="branch">Branch</TabsTrigger>
                        <TabsTrigger value="member">Member</TabsTrigger>
                    </TabsList>

                    {/* Branch Admin Login */}
                    <TabsContent value="branch">
                        <Card className="border-t-4 border-t-primary shadow-xl">
                            <CardHeader>
                                <CardTitle>Branch Login</CardTitle>
                                <CardDescription>Enter your credentials to manage your gym.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="branch-email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="branch-email"
                                            placeholder="manager@gym.com"
                                            className="pl-9"
                                            value={branchEmail}
                                            onChange={(e) => setBranchEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="branch-password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="branch-password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-9"
                                            value={branchPassword}
                                            onChange={(e) => setBranchPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {branchError && (
                                    <p className="text-sm text-red-500">{branchError}</p>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" onClick={() => handleLogin('branch_admin')} disabled={isLoading}>
                                    {isLoading ? "Signing in..." : "Sign In"} <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* Super Admin Login */}
                    <TabsContent value="admin">
                        <Card className="border-t-4 border-t-secondary shadow-xl">
                            <CardHeader>
                                <CardTitle>Super Admin</CardTitle>
                                <CardDescription>Secure access for platform administrators.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="admin-email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="admin-email"
                                            placeholder="admin@smartfit.com"
                                            className="pl-9"
                                            value={adminEmail}
                                            onChange={(e) => setAdminEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="admin-password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="admin-password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-9"
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {adminError && (
                                    <p className="text-sm text-red-500">{adminError}</p>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full bg-secondary hover:bg-secondary/90" onClick={() => handleLogin('super_admin')} disabled={isLoading}>
                                    {isLoading ? "Signing in..." : "Sign In"} <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    {/* Member Login */}
                    <TabsContent value="member">
                        <Card className="border-t-4 border-t-green-500 shadow-xl">
                            <CardHeader>
                                <CardTitle>Member Portal</CardTitle>
                                <CardDescription>Access your profile and bookings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="member-phone">Phone Number</Label>
                                    <div className="relative">
                                        <Input
                                            id="member-phone"
                                            placeholder="+1 (555) 000-0000"
                                            value={memberPhone}
                                            onChange={(e) => setMemberPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                                {memberError && (
                                    <p className="text-sm text-red-500">{memberError}</p>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleLogin('member')} disabled={isLoading}>
                                    {isLoading ? "Send OTP" : "Send OTP"} <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>

                <p className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account? <span className="text-primary cursor-pointer hover:underline">Contact your gym admin</span> to get started.              </p>
            </div>
        </div>
    );
}
