"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Package
} from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming a utility exists or I'll create one

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
  const content = (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer group",
      isActive ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      isCollapsed ? "justify-center" : "justify-start"
    )}>
      <div className={cn("shrink-0", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground group-hover:text-foreground")}>
        {icon}
      </div>
      {!isCollapsed && (
        <>
          <span className="flex-1 font-medium truncate">{label}</span>
          {hasSubmenu && (
            <div className="shrink-0">
              {isSubmenuOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          )}
        </>
      )}
    </div>
  );

  if (href && !hasSubmenu) {
    return <Link href={href}>{content}</Link>;
  }

  return <div onClick={onToggleSubmenu}>{content}</div>;
};

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

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
            { label: "Products", href: "/dashboard/products" },
            { label: "Orders", href: "/dashboard/orders" },
            { label: "Inventory", href: "/dashboard/inventory", active: true },
            { label: "Discount", href: "/dashboard/discounts" },
          ]
        },
        { 
          icon: <Wallet className="w-5 h-5" />, 
          label: "Finance", 
          hasSubmenu: true, 
          isOpen: isFinanceOpen, 
          onToggle: () => setIsFinanceOpen(!isFinanceOpen),
          submenu: [
            { label: "Overview", href: "/dashboard/finance" },
          ]
        },
        { icon: <Users className="w-5 h-5" />, label: "Customers", href: "/dashboard/customers" },
        { icon: <BarChart3 className="w-5 h-5" />, label: "Analytics Report", href: "/dashboard/analytics" },
        { icon: <Megaphone className="w-5 h-5" />, label: "Marketing", href: "/dashboard/marketing" },
        { icon: <Settings className="w-5 h-5" />, label: "Settings", href: "/dashboard/settings" },
      ]
    },
    {
      title: "SALES CHANNELS",
      items: [
        { icon: <ShoppingBag className="w-5 h-5" />, label: "Online Store", href: "/dashboard/online-store" },
        { icon: <Monitor className="w-5 h-5" />, label: "Point of Sale", href: "/dashboard/pos" },
      ]
    }
  ];

  return (
    <aside className={cn(
      "relative h-screen bg-card border-r border-border transition-all duration-300 flex flex-col",
      isCollapsed ? "w-20" : "w-64"
    )}>
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
        {!isCollapsed && (
          <span className="text-xl font-bold tracking-tight text-foreground truncate">StockFlow</span>
        )}
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
                    isActive={pathname === item.href || item.submenu?.some(sub => pathname === sub.href) || (item.submenu && item.submenu.some(s => s.active))}
                    hasSubmenu={item.hasSubmenu}
                    isSubmenuOpen={item.isOpen}
                    onToggleSubmenu={item.onToggle}
                  />
                  {item.hasSubmenu && item.isOpen && !isCollapsed && (
                    <div className="mt-1 ml-9 space-y-1 border-l border-border pl-2">
                      {item.submenu?.map((subItem, subIndex) => (
                        <Link 
                          key={subIndex} 
                          href={subItem.href}
                          className={cn(
                            "block px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                            subItem.active 
                              ? "text-foreground bg-secondary/50" 
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                          )}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
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
        <div className={cn("flex items-center gap-3 p-2 rounded-xl hover:bg-secondary transition-colors cursor-pointer group", isCollapsed ? "justify-center" : "")}>
          <div className="w-10 h-10 rounded-full bg-indigo-100 overflow-hidden shrink-0 border border-border">
            <img 
              src="https://avatar.iran.liara.run/public/boy" 
              alt="Himmad" 
              className="w-full h-full object-cover"
            />
          </div>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-foreground truncate">Himmad</p>
              <p className="text-xs text-muted-foreground truncate">CEO-StockFlow</p>
            </div>
          )}
          {!isCollapsed && <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />}
        </div>
      </div>
    </aside>
  );
}
