"use client";

import { useEffect, useState } from "react";
import { settingsApi } from "@/lib/api/client";
import { useAuth } from "@/hooks/use-auth";
import { ShieldAlert, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const [maintenance, setMaintenance] = useState(false);
    const [checking, setChecking] = useState(true);
    const { logout, user } = useAuth();

    useEffect(() => {
        const checkMaintenance = async () => {
            try {
                const settings = await settingsApi.get();
                if (settings.maintenanceMode && user?.role === "member") {
                    setMaintenance(true);
                }
            } catch (e) {
                console.warn("Failed to check maintenance mode", e);
            } finally {
                setChecking(false);
            }
        };
        checkMaintenance();
    }, [user]);

    if (checking) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
        );
    }

    if (maintenance) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-20 animate-pulse" />
                        <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative z-10">
                            <ShieldAlert className="h-16 w-16 text-amber-500 mx-auto mb-6" />
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4 text-center">Under Maintenance</h2>
                            <p className="text-slate-400 font-medium leading-relaxed mb-8 text-center">
                                We&apos;re currently performing some routine maintenance to improve your experience. We&apos;ll be back online shortly!
                            </p>
                            <Button
                                onClick={() => logout()}
                                variant="outline"
                                className="w-full h-14 rounded-2xl border-white/10 text-white hover:bg-white/5 font-bold uppercase tracking-widest flex items-center justify-center gap-3"
                            >
                                <LogOut className="h-5 w-5" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
