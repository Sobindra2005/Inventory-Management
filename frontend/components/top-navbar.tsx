"use client";

import { Search, Bell, Mail } from "lucide-react";
import Link from "next/link";

export default function TopNavbar() {
  return (
    <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="max-w-md w-full relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder="Search..."
          className="w-full h-10 pl-10 pr-4 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50"
        />
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-full hover:bg-secondary relative transition-colors text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-background rounded-full"></span>
        </button>
        <button className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          <Link href="https://mail.google.com/mail/u/0/#inbox" target="_blank" rel="noopener noreferrer">
            <Mail className="w-5 h-5" />
          </Link>
        </button>
      </div>
    </header>
  );
}
