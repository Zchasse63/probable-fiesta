import React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Optional URL (if null, renders as plain text) */
  href?: string;
}

export interface HeaderProps {
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[];
  /** Placeholder text for search input */
  searchPlaceholder?: string;
  /** Action buttons or other right-side content */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * Sticky glass-effect header with breadcrumbs, search, and actions
 *
 * Features:
 * - Fixed height: 56px (h-14)
 * - Glass morphism: backdrop-blur with semi-transparent background
 * - Layout: breadcrumbs (left), search (center), actions (right)
 * - Sticky positioning with proper z-index
 */
export function Header({
  breadcrumbs = [],
  searchPlaceholder = "Search...",
  children,
  className,
}: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 h-14",
        "border-b border-border/50",
        "bg-background/80 backdrop-blur-lg",
        "supports-[backdrop-filter]:bg-background/60",
        className
      )}
      data-testid="header"
    >
      <div className="flex h-full items-center gap-4 px-6">
        {/* Breadcrumbs - Left */}
        {breadcrumbs.length > 0 && (
          <nav
            className="flex items-center gap-2 text-sm"
            aria-label="Breadcrumb"
            data-testid="header-breadcrumbs"
          >
            <ol className="flex items-center gap-2">
              {breadcrumbs.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronRight
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                  {item.href ? (
                    <a
                      href={item.href}
                      className={cn(
                        "font-medium transition-colors hover:text-foreground",
                        index === breadcrumbs.length - 1
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span
                      className={cn(
                        "font-medium",
                        index === breadcrumbs.length - 1
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Search - Center (flex-1 with max-width) */}
        <div className="mx-auto flex max-w-md flex-1 items-center" data-testid="header-search">
          <input
            type="search"
            placeholder={searchPlaceholder}
            className={cn(
              "h-9 w-full rounded-lg border border-border bg-muted/50 px-4 py-1",
              "text-sm placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
              "transition-all duration-200"
            )}
            data-testid="header-search-input"
          />
        </div>

        {/* Actions - Right */}
        {children && (
          <div className="flex items-center gap-2" data-testid="header-actions">
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
