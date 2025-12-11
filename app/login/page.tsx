"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Mail, ArrowRight, Phone } from "lucide-react";
import { loginSchema, memberLoginSchema, type LoginFormData, type MemberLoginFormData } from "@/lib/validations/auth";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/components/ui/toast-provider";

type UserRole = "super_admin" | "branch_admin" | "member";

export default function LoginPage() {
    const toast = useToast();
    const { login, memberLogin } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [memberOtp, setMemberOtp] = useState("");
    const [memberError, setMemberError] = useState("");
    const [devOtp, setDevOtp] = useState<string | null>(null);

    // Branch Admin Form
    const branchForm = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    // Super Admin Form
    const adminForm = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    // Member Form
    const memberForm = useForm<MemberLoginFormData>({
        resolver: zodResolver(memberLoginSchema),
        defaultValues: { phone: "" },
    });

    const handleAdminLogin = async (data: LoginFormData, role: UserRole) => {
        setIsLoading(true);
        try {
            const success = await login(data.email, data.password);
            if (success) {
                toast({ title: "Success", description: "Login successful!", variant: "success" });
            } else {
                const message = "Login failed";
                toast({ title: "Error", description: message, variant: "destructive" });
                if (role === "super_admin") {
                    adminForm.setError("root", { message });
                } else {
                    branchForm.setError("root", { message });
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleMemberLogin = async (data: MemberLoginFormData) => {
        setMemberError("");
        setIsLoading(true);
        
        try {
            if (!isOtpSent) {
                const result = await memberLogin(data.phone);
                if (result.success && result.otpSent) {
                    setIsOtpSent(true);
                    if (result.devOtp) {
                        setDevOtp(result.devOtp);
                        toast({
                            title: "OTP Sent",
                            description: `Dev OTP: ${result.devOtp}`,
                            variant: "info",
                        });
                    } else {
                        toast({ title: "OTP Sent", description: "Check your phone", variant: "success" });
                    }
                } else if (!result.success) {
                    setMemberError("Login failed");
                    toast({ title: "Error", description: "Login failed", variant: "destructive" });
                }
            } else {
                if (!memberOtp) {
                    setMemberError("Please enter the OTP.");
                    return;
                }
                const result = await memberLogin(data.phone, memberOtp);
                if (result.success) {
                    toast({ title: "Success", description: "Login successful!", variant: "success" });
                } else {
                    setMemberError("Login failed");
                    toast({ title: "Error", description: "Login failed", variant: "destructive" });
                }
            }
        } catch {
            setMemberError("Login failed");
            toast({ title: "Error", description: "Login failed", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
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
                        <form onSubmit={branchForm.handleSubmit((data) => handleAdminLogin(data, "branch_admin"))}>
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
                                                {...branchForm.register("email")}
                                            />
                                        </div>
                                        {branchForm.formState.errors.email && (
                                            <p className="text-sm text-red-500">{branchForm.formState.errors.email.message}</p>
                                        )}
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
                                                {...branchForm.register("password")}
                                            />
                                        </div>
                                        {branchForm.formState.errors.password && (
                                            <p className="text-sm text-red-500">{branchForm.formState.errors.password.message}</p>
                                        )}
                                    </div>
                                    {branchForm.formState.errors.root && (
                                        <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{branchForm.formState.errors.root.message}</p>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? "Signing in..." : "Sign In"} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </TabsContent>

                    {/* Super Admin Login */}
                    <TabsContent value="admin">
                        <form onSubmit={adminForm.handleSubmit((data) => handleAdminLogin(data, "super_admin"))}>
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
                                                {...adminForm.register("email")}
                                            />
                                        </div>
                                        {adminForm.formState.errors.email && (
                                            <p className="text-sm text-red-500">{adminForm.formState.errors.email.message}</p>
                                        )}
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
                                                {...adminForm.register("password")}
                                            />
                                        </div>
                                        {adminForm.formState.errors.password && (
                                            <p className="text-sm text-red-500">{adminForm.formState.errors.password.message}</p>
                                        )}
                                    </div>
                                    {adminForm.formState.errors.root && (
                                        <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{adminForm.formState.errors.root.message}</p>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90" disabled={isLoading}>
                                        {isLoading ? "Signing in..." : "Sign In"} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                        <Card>
                            <CardHeader>
                                <CardTitle>Admin Credentials</CardTitle>
                                <CardDescription>Secure access for platform administrators.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p>Email: admin@smartfit.com</p>
                                <p>Password: admin123</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Member Login */}
                    <TabsContent value="member">
                        <form onSubmit={memberForm.handleSubmit(handleMemberLogin)}>
                            <Card className="border-t-4 border-t-green-500 shadow-xl">
                                <CardHeader>
                                    <CardTitle>Member Portal</CardTitle>
                                    <CardDescription>Access your profile and bookings.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="member-phone">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                            <Input
                                                id="member-phone"
                                                placeholder="+1 (555) 000-0000"
                                                className="pl-9"
                                                {...memberForm.register("phone")}
                                            />
                                        </div>
                                        {memberForm.formState.errors.phone && (
                                            <p className="text-sm text-red-500">{memberForm.formState.errors.phone.message}</p>
                                        )}
                                    </div>
                                    {isOtpSent && (
                                        <div className="space-y-2">
                                            <Label htmlFor="member-otp">OTP</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="member-otp"
                                                    placeholder="Enter 6-digit OTP"
                                                    className="pl-9"
                                                    value={memberOtp}
                                                    onChange={(e) => setMemberOtp(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {memberError && (
                                        <p className="text-sm text-red-500">{memberError}</p>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                                        {isLoading
                                            ? isOtpSent
                                                ? "Verifying..."
                                                : "Sending OTP..."
                                            : isOtpSent
                                                ? "Verify OTP"
                                                : "Send OTP"} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </TabsContent>
                </Tabs>

                <p className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account? <span className="text-primary cursor-pointer hover:underline">Contact your gym admin</span> to get started.              </p>
            </div>
        </div>
    );
}
