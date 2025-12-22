"use client";

import { Calendar, Home, User, CreditCard, Dumbbell, Apple, RefreshCw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function MemberLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const isActive = (href: string) => pathname.startsWith(href);

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            {/* Mobile Header */}
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 md:hidden shadow-sm">
                <div className="flex items-center gap-2 font-bold text-xl text-primary">
                    <div className="h-8 w-8 bg-primary text-white rounded-lg flex items-center justify-center">SF</div>
                    SmartFit
                </div>
                <Link href="/portal/profile" className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden cursor-pointer block relative">
                    <Image
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
                        alt="Profile"
                        fill
                        className="object-cover"
                    />
                </Link>
            </header>

            <main className="p-4 md:p-8 max-w-4xl mx-auto">
                {children}
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white px-4 py-2 md:hidden shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center overflow-x-auto">
                    <Link
                        href="/portal/dashboard"
                        className={`flex flex-col items-center gap-1 text-[10px] font-medium min-w-0 flex-shrink-0 ${isActive("/portal/dashboard") ? "text-primary" : "text-gray-400 hover:text-primary transition-colors"
                            }`}
                    >
                        <Home className="h-5 w-5" />
                        <span>Home</span>
                    </Link>
                    <Link
                        href="/portal/workouts"
                        className={`flex flex-col items-center gap-1 text-[10px] font-medium min-w-0 flex-shrink-0 ${isActive("/portal/workouts") ? "text-primary" : "text-gray-400 hover:text-primary transition-colors"
                            }`}
                    >
                        <Dumbbell className="h-5 w-5" />
                        <span>Workout</span>
                    </Link>
                    <Link
                        href="/portal/diet"
                        className={`flex flex-col items-center gap-1 text-[10px] font-medium min-w-0 flex-shrink-0 ${isActive("/portal/diet") ? "text-primary" : "text-gray-400 hover:text-primary transition-colors"
                            }`}
                    >
                        <Apple className="h-5 w-5" />
                        <span>Nutrition</span>
                    </Link>
                    <Link
                        href="/portal/renewal"
                        className={`flex flex-col items-center gap-1 text-[10px] font-medium min-w-0 flex-shrink-0 ${isActive("/portal/renewal") ? "text-primary" : "text-gray-400 hover:text-primary transition-colors"
                            }`}
                    >
                        <RefreshCw className="h-5 w-5" />
                        <span>Renew</span>
                    </Link>
                    <Link
                        href="/portal/profile"
                        className={`flex flex-col items-center gap-1 text-[10px] font-medium min-w-0 flex-shrink-0 ${isActive("/portal/profile") ? "text-primary" : "text-gray-400 hover:text-primary transition-colors"
                            }`}
                    >
                        <User className="h-5 w-5" />
                        <span>Profile</span>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
