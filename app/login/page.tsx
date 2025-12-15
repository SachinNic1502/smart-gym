"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Mail, ArrowRight, Phone, Dumbbell, Activity, CalendarCheck } from "lucide-react";
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
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Panel: Branding & Marketing */}
            <div className="hidden lg:flex flex-col justify-between bg-zinc-900 text-white p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/50 to-transparent" />
                
                <div className="relative z-10 flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary/30">
                        SF
                    </div>
                    <span className="font-bold text-xl tracking-tight">SmartFit</span>
                </div>

                <div className="relative z-10 space-y-6 max-w-lg">
                    <h1 className="text-4xl font-bold leading-tight">
                        Transform your fitness management experience.
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        Everything you need to run your gym smoothly—memberships, attendance, payments, and communications, all in one place.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                                <Activity className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium">Real-time Analytics</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                                <CalendarCheck className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium">Easy Scheduling</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                                <Mail className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium">Automated Messaging</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                                <Dumbbell className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-sm font-medium">Workout Tracking</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-sm text-zinc-500">
                    © 2025 SmartFit Inc.
                </div>
            </div>

            {/* Right Panel: Login Form */}
            <div className="flex items-center justify-center p-6 bg-white dark:bg-zinc-950">
                <div className="w-full max-w-[420px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col gap-2 text-center lg:text-left">
                        <div className="lg:hidden h-12 w-12 bg-primary rounded-xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
                            SF
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                        <p className="text-muted-foreground">Sign in to your account to continue.</p>
                    </div>

                    <Tabs defaultValue="branch" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-8 h-11 p-1 bg-zinc-100/80 dark:bg-zinc-900 rounded-xl">
                            <TabsTrigger value="admin" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">Super Admin</TabsTrigger>
                            <TabsTrigger value="branch" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">Branch</TabsTrigger>
                            <TabsTrigger value="member" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200">Member</TabsTrigger>
                        </TabsList>

                        {/* Branch Admin Login */}
                        <TabsContent value="branch" className="space-y-4 focus-visible:ring-0">
                            <form onSubmit={branchForm.handleSubmit((data) => handleAdminLogin(data, "branch_admin"))} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="branch-email">Email Address</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="branch-email"
                                            placeholder="manager@gym.com"
                                            className="pl-10 h-11 bg-zinc-50 border-zinc-200 focus:bg-white transition-all duration-200"
                                            {...branchForm.register("email")}
                                        />
                                    </div>
                                    {branchForm.formState.errors.email && (
                                        <p className="text-xs text-red-500 font-medium animate-in slide-in-from-left-1">{branchForm.formState.errors.email.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="branch-password">Password</Label>
                                        <Button variant="link" className="px-0 h-auto text-xs text-muted-foreground hover:text-primary" tabIndex={-1}>Forgot password?</Button>
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <Input
                                            id="branch-password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-10 h-11 bg-zinc-50 border-zinc-200 focus:bg-white transition-all duration-200"
                                            {...branchForm.register("password")}
                                        />
                                    </div>
                                    {branchForm.formState.errors.password && (
                                        <p className="text-xs text-red-500 font-medium animate-in slide-in-from-left-1">{branchForm.formState.errors.password.message}</p>
                                    )}
                                </div>
                                {branchForm.formState.errors.root && (
                                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center justify-center animate-in zoom-in-95">
                                        {branchForm.formState.errors.root.message}
                                    </div>
                                )}
                                <Button type="submit" className="w-full h-11 text-base font-medium shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all duration-300" disabled={isLoading}>
                                    {isLoading ? "Signing in..." : "Sign in to Dashboard"} {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* Super Admin Login */}
                        <TabsContent value="admin" className="space-y-4 focus-visible:ring-0">
                            <form onSubmit={adminForm.handleSubmit((data) => handleAdminLogin(data, "super_admin"))} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="admin-email">Admin Email</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-secondary transition-colors" />
                                        <Input
                                            id="admin-email"
                                            placeholder="admin@smartfit.com"
                                            className="pl-10 h-11 bg-zinc-50 border-zinc-200 focus:bg-white transition-all duration-200 focus:ring-secondary"
                                            {...adminForm.register("email")}
                                        />
                                    </div>
                                    {adminForm.formState.errors.email && (
                                        <p className="text-xs text-red-500 font-medium animate-in slide-in-from-left-1">{adminForm.formState.errors.email.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="admin-password">Password</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-secondary transition-colors" />
                                        <Input
                                            id="admin-password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-10 h-11 bg-zinc-50 border-zinc-200 focus:bg-white transition-all duration-200 focus:ring-secondary"
                                            {...adminForm.register("password")}
                                        />
                                    </div>
                                    {adminForm.formState.errors.password && (
                                        <p className="text-xs text-red-500 font-medium animate-in slide-in-from-left-1">{adminForm.formState.errors.password.message}</p>
                                    )}
                                </div>
                                {adminForm.formState.errors.root && (
                                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center justify-center animate-in zoom-in-95">
                                        {adminForm.formState.errors.root.message}
                                    </div>
                                )}
                                <Button type="submit" className="w-full h-11 text-base font-medium bg-zinc-900 hover:bg-zinc-800 shadow-md shadow-zinc-900/20 hover:shadow-zinc-900/40 transition-all duration-300" disabled={isLoading}>
                                    {isLoading ? "Signing in..." : "Access Admin Console"} {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                                </Button>
                            </form>
                            <div className="mt-6 p-4 rounded-lg bg-zinc-50 border border-zinc-100 text-xs text-zinc-500">
                                <p className="font-semibold text-zinc-700 mb-1">Demo Credentials:</p>
                                <div className="flex justify-between">
                                    <span>Email: admin@smartfit.com</span>
                                    <span>Password: admin123</span>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Member Login */}
                        <TabsContent value="member" className="space-y-4 focus-visible:ring-0">
                            <form onSubmit={memberForm.handleSubmit(handleMemberLogin)} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="member-phone">Phone Number</Label>
                                    <div className="relative group">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-green-600 transition-colors" />
                                        <Input
                                            id="member-phone"
                                            placeholder="+1 (555) 000-0000"
                                            className="pl-10 h-11 bg-zinc-50 border-zinc-200 focus:bg-white transition-all duration-200 focus:ring-green-600"
                                            {...memberForm.register("phone")}
                                        />
                                    </div>
                                    {memberForm.formState.errors.phone && (
                                        <p className="text-xs text-red-500 font-medium animate-in slide-in-from-left-1">{memberForm.formState.errors.phone.message}</p>
                                    )}
                                </div>
                                {isOtpSent && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="member-otp">One-Time Password</Label>
                                            <span className="text-xs text-muted-foreground">Sent to your phone</span>
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-green-600 transition-colors" />
                                            <Input
                                                id="member-otp"
                                                placeholder="Enter 6-digit OTP"
                                                className="pl-10 h-11 bg-zinc-50 border-zinc-200 focus:bg-white transition-all duration-200 focus:ring-green-600 tracking-widest"
                                                value={memberOtp}
                                                onChange={(e) => setMemberOtp(e.target.value)}
                                                maxLength={6}
                                            />
                                        </div>
                                    </div>
                                )}
                                {memberError && (
                                    <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center justify-center animate-in zoom-in-95">
                                        {memberError}
                                    </div>
                                )}
                                <Button type="submit" className="w-full h-11 text-base font-medium bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20 hover:shadow-green-600/40 transition-all duration-300" disabled={isLoading}>
                                    {isLoading
                                        ? isOtpSent
                                            ? "Verifying..."
                                            : "Sending OTP..."
                                        : isOtpSent
                                            ? "Verify & Login"
                                            : "Send Login Code"} {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>

                    <div className="text-center pt-4">
                        <p className="text-sm text-muted-foreground">
                            Don&apos;t have an account? <span className="text-primary font-medium cursor-pointer hover:underline underline-offset-4 transition-all">Contact your gym admin</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
