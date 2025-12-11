"use client";

import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { Bell, Search, LogOut, User as UserIcon, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
    const { logout, user } = useAuth();
    const pathname = usePathname();
    const pathSegments = pathname.split("/").filter(Boolean);
    const currentPage = pathSegments[pathSegments.length - 1];
    const formattedTitle = currentPage
        ? currentPage.charAt(0).toUpperCase() + currentPage.slice(1)
        : "Dashboard";

    const [searchValue, setSearchValue] = useState("");
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const notificationRef = useRef<HTMLDivElement>(null);
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
                notificationRef.current &&
                !notificationRef.current.contains(event.target as Node)
            ) {
                setIsNotificationsOpen(false);
            }
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
            <h1 className="text-lg font-semibold md:text-xl capitalize hidden md:block text-gray-800">
                {formattedTitle.replace(/-/g, " ")}
            </h1>

            {/* SEARCH */}
            <div className="relative w-full max-w-sm mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    type="search"
                    placeholder="Search..."
                    className="pl-10 rounded-xl border-gray-300 focus-visible:ring-1"
                    value={searchValue}
                    onChange={handleSearchChange}
                />
            </div>

            <div className="flex items-center gap-4">
                {/* Notifications */}
                <div className="relative" ref={notificationRef}>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setIsNotificationsOpen((v) => !v)}
                        className="hover:bg-gray-100 transition-colors"
                    >
                        <Bell className="h-5 w-5 text-gray-700" />
                    </Button>

                    {isNotificationsOpen && (
                        <div
                            className={clsx(
                                "absolute right-0 mt-3 w-80 rounded-xl border bg-white shadow-xl transition-all",
                                "animate-in fade-in zoom-in-95 duration-150"
                            )}
                        >
                            <div className="px-4 py-3 border-b">
                                <h2 className="text-sm font-semibold">Notifications</h2>
                            </div>
                            <div className="max-h-56 overflow-y-auto p-3 space-y-3">
                                <div className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                                    <p className="font-medium text-sm">Device offline</p>
                                    <p className="text-xs text-gray-500">
                                        Main Entrance A went offline 5 mins ago.
                                    </p>
                                </div>
                                <div className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                                    <p className="font-medium text-sm">New branch signup</p>
                                    <p className="text-xs text-gray-500">
                                        Flex Studio added to your network.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

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
