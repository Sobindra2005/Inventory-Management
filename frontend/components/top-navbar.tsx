"use client";

import { Search, Bell, Sun, Moon, Plus, ShoppingCart, Settings, LogOut, User } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useClerk } from "@clerk/nextjs";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/lib/queries/use-notifications-query";

export default function TopNavbar() {
  const { setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const { signOut } = useClerk();

  const notificationsQuery = useNotifications(20);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-8 sticky top-0 z-30 gap-6">
      {/* Left - Shop Name/Logo */}
      <div className="flex-shrink-0">
        <h1 className="text-lg font-bold tracking-tight">📦 POS Store</h1>
      </div>

      {/* Center - Global Search */}
      <div className="flex-1 max-w-2xl relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search products, customers, invoices..."
          className="w-full h-10 pl-10 pr-4 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Right - Quick Actions & Settings */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* New Sale Button */}
        <Link
          href="/dashboard/sales"
          className="hidden sm:flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <ShoppingCart className="w-4 h-4" />
          New Sale
        </Link>

        {/* Add Product Button */}
        <Link
          href="/dashboard/inventory"
          className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors hover:bg-accent"
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications((open) => !open)}
            className="p-2 rounded-full hover:bg-accent relative transition-colors text-muted-foreground hover:text-foreground"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] leading-4 rounded-full text-center border border-background">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-40">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs text-primary hover:underline disabled:opacity-60"
                  disabled={markAllReadMutation.isPending || unreadCount === 0}
                >
                  Mark all as read
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notificationsQuery.isLoading && (
                  <div className="px-4 py-6 text-sm text-muted-foreground">Loading notifications...</div>
                )}

                {!notificationsQuery.isLoading && notifications.length === 0 && (
                  <div className="px-4 py-6 text-sm text-muted-foreground">No notifications yet.</div>
                )}

                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => {
                      if (!notification.isRead) {
                        markReadMutation.mutate(notification.id);
                      }
                      if (notification.reportId) {
                        router.push("/dashboard");
                        setShowNotifications(false);
                      }
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-foreground">{notification.message}</p>
                      {!notification.isRead && <span className="mt-1 w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <User className="w-5 h-5" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-40">
              <button
                onClick={() => {
                  router.push("/dashboard");
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-sm text-left hover:bg-accent transition-colors flex items-center gap-2 text-foreground"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={() => {
                  router.push("/dashboard");
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-sm text-left hover:bg-accent transition-colors flex items-center gap-2 text-foreground"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <div className="border-t border-border"></div>
              <button
                onClick={() => {
                  signOut();
                  setShowProfileMenu(false);
                }}
                className="w-full px-4 py-2 text-sm text-left hover:bg-accent transition-colors flex items-center gap-2 text-destructive"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
