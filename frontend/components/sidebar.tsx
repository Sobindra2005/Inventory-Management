"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Home,
  Store,
  Wallet,
  Users,
  BarChart3,
  Megaphone,
  Settings,
  ShoppingBag,
  Monitor,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Package,
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming a utility exists or I'll create one
import { Show, UserButton } from "@clerk/nextjs";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  isCollapsed: boolean;
  isActive?: boolean;
  hasSubmenu?: boolean;
  isSubmenuOpen?: boolean;
  onToggleSubmenu?: () => void;
}

const SidebarItem = ({
  icon,
  label,
  href,
  isCollapsed,
  isActive,
  hasSubmenu,
  isSubmenuOpen,
  onToggleSubmenu
}: SidebarItemProps) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (hasSubmenu) {
      e.preventDefault();
      onToggleSubmenu?.();
    } else if (href) {
      e.preventDefault();
      router.push(href);
    }
  };

  const content = (
    <motion.div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 cursor-pointer group",
        isActive ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        isCollapsed ? "justify-center" : "justify-start"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={cn("shrink-0", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground group-hover:text-foreground")}>
        {icon}
      </div>
      <motion.div
        initial={{ opacity: 0, width: 0 }}
        animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
        transition={{ duration: 0.2 }}
        className="flex items-center flex-1 gap-2 overflow-hidden"
      >
        <span className="font-medium truncate">{label}</span>
        {hasSubmenu && (
          <motion.div
            className="shrink-0"
            animate={{ rotate: isSubmenuOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );

  return (
    <div onClick={handleClick} role="button" tabIndex={0}>
      {content}
    </div>
  );
};

interface SubMenuItemProps {
  href: string;
  label: string;
  isActive: boolean;
}

const SubMenuItem = ({ href, label, isActive }: SubMenuItemProps) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <motion.div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      className={cn(
        "block px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
        isActive
          ? "text-foreground bg-secondary/50"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {label}
    </motion.div>
  );
};

export default function Sidebar() {
  const userButtonContainerRef = useRef<HTMLDivElement | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    window.localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const openUserMenu = () => {
    const userButtonTrigger = userButtonContainerRef.current?.querySelector("button");
    userButtonTrigger?.click();
  };

  const handleProfileSectionKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openUserMenu();
    }
  };

  const menuSections = [
    {
      title: "MAIN MENU",
      items: [
        { icon: <Home className="w-5 h-5" />, label: "Home", href: "/dashboard" },
        {
          icon: <Store className="w-5 h-5" />,
          label: "My Store",
          hasSubmenu: true,
          isOpen: isStoreOpen,
          onToggle: () => setIsStoreOpen(!isStoreOpen),
          submenu: [
            { label: "Inventory", href: "/dashboard/inventory", active: true },
            { label: "Sales/Billing", href: "/dashboard/sales" },

          ]
        },
        { icon: <Users className="w-5 h-5" />, label: "Customers", href: "/dashboard/customers" },
        { icon: <BarChart3 className="w-5 h-5" />, label: "Reports", href: "/dashboard/reports" },
      ]
    },
    // {
    //   title: "SALES CHANNELS",
    //   items: [
    //     { icon: <ShoppingBag className="w-5 h-5" />, label: "Online Store", href: "/dashboard/online-store" },
    //     { icon: <Monitor className="w-5 h-5" />, label: "Point of Sale", href: "/dashboard/pos" },
    //   ]
    // }
  ];

  return (
    <motion.aside
      initial={false}
      className={cn(
        "relative h-screen bg-card border-r border-border flex flex-col",
        isCollapsed ? "w-20" : "w-64"
      )}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Sidebar Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 z-50 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-secondary text-muted-foreground transition-all"
        aria-label="Toggle sidebar"
      >
        {isCollapsed ? <ChevronsRight className="w-3.5 h-3.5" /> : <ChevronsLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Logo Section */}
      <div className={cn("p-6 flex items-center gap-3", isCollapsed ? "justify-center" : "justify-start")}>
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-white" />
        </div>
        <motion.span
          initial={false}
          className="text-xl font-bold tracking-tight text-foreground"
          animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
          transition={{ duration: 0.2 }}
        >
          StockFlow
        </motion.span>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 custom-scrollbar">
        {menuSections.map((section, sIndex) => (
          <div key={sIndex} className="mb-6 last:mb-0">
            {!isCollapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground/50 tracking-wider">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item, iIndex) => (
                <div key={iIndex}>
                  <SidebarItem
                    icon={item.icon}
                    label={item.label}
                    href={item.href}
                    isCollapsed={isCollapsed}
                    isActive={pathname === item.href || (item.submenu && item.submenu.some(sub => pathname === sub.href))}
                    hasSubmenu={item.hasSubmenu}
                    isSubmenuOpen={item.isOpen}
                    onToggleSubmenu={item.onToggle}
                  />
                  {item.hasSubmenu && item.isOpen && !isCollapsed && (
                    <motion.div
                      className="mt-1 ml-9 space-y-1 border-l border-border pl-2"
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.submenu?.map((subItem, subIndex) => (
                        <SubMenuItem
                          key={subIndex}
                          href={subItem.href}
                          label={subItem.label}
                          isActive={pathname === subItem.href}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
            {isCollapsed && sIndex < menuSections.length - 1 && (
              <div className="mx-3 my-4 border-t border-border opacity-50" />
            )}
          </div>
        ))}
      </div>

      {/* User Profile Section */}
      <div className={cn("p-4 border-t border-border mt-auto", isCollapsed ? "flex justify-center" : "block")}>
        <motion.div
          className={cn("flex items-center gap-3 p-2 rounded-xl hover:bg-secondary transition-colors cursor-pointer group", isCollapsed ? "justify-center" : "")}
          role="button"
          tabIndex={0}
          onClick={openUserMenu}
          onKeyDown={handleProfileSectionKeyDown}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div ref={userButtonContainerRef} className="shrink-0">
            <Show when="signed-in">
              <UserButton>
              </UserButton>
            </Show>
          </div>

          <motion.div
            initial={false}
            className="flex-1 overflow-hidden"
            animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-sm font-bold text-foreground truncate">Himmad</p>
            <p className="text-xs text-muted-foreground truncate">CEO-StockFlow</p>
          </motion.div>
          <motion.div
            initial={false}
            animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : "auto" }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </motion.div>
        </motion.div>
      </div>
    </motion.aside>
  );
}
