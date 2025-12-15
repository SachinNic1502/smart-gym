"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { Bell, Search, LogOut, User as UserIcon, Settings, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/hooks/use-auth";
import { NotificationCenter } from "@/components/ui/notification-center";

interface HeaderProps {
    onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
    const { logout, user } = useAuth();
    const pathname = usePathname();
    const pathSegments = pathname.split("/").filter(Boolean);
    const currentPage = pathSegments[pathSegments.length - 1];
    const formattedTitle = currentPage
        ? currentPage.charAt(0).toUpperCase() + currentPage.slice(1)
        : "Dashboard";

    const [searchValue, setSearchValue] = useState("");
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);

    const displayName = user?.name || "Admin";
    const displayEmail = user?.email || "admin@smartfit.com";
    const avatarSeed = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;
    const initials = displayName
        .split(" ")
        .map(part => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchValue(value);
        if (typeof window !== "undefined") {
            window.dispatchEvent(
                new CustomEvent("smartfit:global-search", {
                    detail: { value, path: pathname },
                })
            );
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                profileRef.current &&
                !profileRef.current.contains(event.target as Node)
            ) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3 md:h-16 md:px-6 md:py-0 shadow-sm">
            <div className="flex items-center gap-2">
                {onMenuClick && (
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onMenuClick}
                        className="md:hidden hover:bg-gray-100 transition-colors"
                        aria-label="Open sidebar"
                    >
                        <Menu className="h-5 w-5 text-gray-700" />
                    </Button>
                )}
                <h1 className="text-lg font-semibold md:text-xl capitalize hidden md:block text-gray-800">
                    {formattedTitle.replace(/-/g, " ")}
                </h1>
            </div>

            {/* SEARCH */}
            <div className="relative order-3 w-full md:order-none md:w-auto md:max-w-sm md:mx-auto md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    type="search"
                    placeholder="Search..."
                    className="pl-10 rounded-xl border-gray-300 focus-visible:ring-1"
                    value={searchValue}
                    onChange={handleSearchChange}
                />
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                {/* Notifications */}
                <NotificationCenter />

                {/* Profile */}
                <div className="relative" ref={profileRef}>
                    <button
                        className="flex items-center gap-2 focus:outline-none"
                        onClick={() => setIsProfileOpen((v) => !v)}
                    >
                        <Avatar className="h-9 w-9 shadow-sm cursor-pointer hover:scale-105 transition">
                            <AvatarImage src={avatarSeed} />
                            <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                    </button>

                    {isProfileOpen && (
                        <div
                            className={clsx(
                                "absolute right-0 mt-3 w-52 rounded-xl border bg-white shadow-xl py-2",
                                "animate-in fade-in zoom-in-95 duration-150"
                            )}
                        >
                            <div className="px-4 py-2 border-b">
                                <p className="font-semibold text-sm">{displayName}</p>
                                <p className="text-xs text-gray-500">
                                    {displayEmail}
                                </p>
                            </div>

                            <button className="flex w-full items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm">
                                <UserIcon className="h-4 w-4 text-gray-600" />
                                Profile
                            </button>

                            <button className="flex w-full items-center gap-3 px-4 py-2 hover:bg-gray-50 text-sm">
                                <Settings className="h-4 w-4 text-gray-600" />
                                Settings
                            </button>

                            <button className="flex w-full items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 text-sm" onClick={logout}>
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
