"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronLeft, ChevronRight } from "lucide-react";

export interface NavItem {
  /** Display label for the nav item */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** URL path for navigation */
  href: string;
  /** Whether this item is currently active */
  active?: boolean;
  /** Optional badge count (e.g., notifications) */
  badge?: number;
}

export interface SidebarProps {
  /** Whether the sidebar is collapsed (icon-only mode) */
  collapsed?: boolean;
  /** Callback when collapse toggle is clicked */
  onToggle?: () => void;
  /** Navigation items to display */
  navItems?: NavItem[];
  /** Logo/branding content for top section */
  logo?: React.ReactNode;
  /** User profile/menu content for bottom section */
  userMenu?: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * Navigation sidebar with collapsible state
 *
 * Features:
 * - Logo section at top (64px height)
 * - Scrollable nav items with Lucide icons
 * - User profile/menu at bottom (sticky positioning)
 * - Supports collapsed state (icon-only)
 * - Active state highlighting
 */
export function Sidebar({
  collapsed = false,
  onToggle,
  navItems = [],
  logo,
  userMenu,
  className,
}: SidebarProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar",
        className
      )}
      data-testid="sidebar"
    >
      {/* Logo Section */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-4",
          collapsed && "justify-center px-2"
        )}
        data-testid="sidebar-logo"
      >
        {logo || (
          <div className={cn(
            "font-semibold text-sidebar-foreground",
            collapsed ? "text-sm" : "text-lg"
          )}>
            {collapsed ? "FP" : "Frozen Protein"}
          </div>
        )}
      </div>

      {/* Navigation Items - Scrollable */}
      <nav
        className="flex-1 overflow-y-auto py-4"
        data-testid="sidebar-nav"
      >
        <ul className="space-y-1 px-2">
          {navItems.map((item, index) => (
            <li key={item.href || index}>
              <a
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5",
                  "text-sm transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  item.active
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary -ml-[2px]"
                    : "text-sidebar-foreground/70 hover:bg-accent hover:text-sidebar-foreground font-normal",
                  collapsed && "justify-center px-2 border-l-0 ml-0"
                )}
                data-testid={`sidebar-nav-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-transform",
                    "group-hover:scale-110"
                  )}
                  aria-hidden="true"
                />

                {!collapsed && (
                  <>
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={cn(
                          "ml-auto flex h-5 min-w-[20px] items-center justify-center",
                          "rounded-full px-1.5 text-xs font-semibold",
                          "bg-primary text-primary-foreground"
                        )}
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <span
                    className={cn(
                      "pointer-events-none absolute left-full ml-2 whitespace-nowrap",
                      "rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md",
                      "opacity-0 transition-opacity group-hover:opacity-100"
                    )}
                    role="tooltip"
                  >
                    {item.label}
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Menu - Sticky at bottom */}
      {userMenu && (
        <div
          className={cn(
            "sticky bottom-0 border-t border-border bg-sidebar p-4",
            collapsed && "px-2"
          )}
          data-testid="sidebar-user-menu"
        >
          {userMenu}
        </div>
      )}

      {/* Collapse Toggle Button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className={cn(
            "sticky bottom-0 flex items-center justify-center",
            "border-t border-border bg-sidebar p-3",
            "text-sidebar-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          data-testid="sidebar-toggle"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      )}
    </div>
  );
}
