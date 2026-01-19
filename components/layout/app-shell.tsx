import React from "react";
import { cn } from "@/lib/utils";

export interface AppShellProps {
  /** Whether the sidebar is in collapsed state (icon-only) */
  sidebarCollapsed?: boolean;
  /** Whether the right context panel is open */
  rightPanelOpen?: boolean;
  /** Sidebar content */
  sidebar?: React.ReactNode;
  /** Header content (sticky glass-effect header) */
  header?: React.ReactNode;
  /** Main content area */
  children: React.ReactNode;
  /** Right context panel content */
  rightPanel?: React.ReactNode;
  /** Additional className for the root container */
  className?: string;
}

/**
 * Tri-pane responsive layout for B2B frozen protein platform
 *
 * Layout structure:
 * - Left sidebar: 280px desktop (fixed), 64px laptop (collapsed), drawer mobile (<768px)
 * - Main content: Flexible (1fr) with overflow-y-auto
 * - Right panel: 400px on xl screens (1280px+), slide-over on smaller
 *
 * Z-index hierarchy: sidebar (z-20), header (z-10), overlays (z-30)
 */
export function AppShell({
  sidebarCollapsed = false,
  rightPanelOpen = false,
  sidebar,
  header,
  children,
  rightPanel,
  className,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "relative h-screen w-full overflow-hidden",
        "grid grid-cols-[auto_1fr] xl:grid-cols-[auto_1fr_auto]",
        className
      )}
      data-testid="app-shell"
    >
      {/* Left Sidebar */}
      {sidebar && (
        <aside
          className={cn(
            "relative z-20 h-full transition-all duration-300",
            "border-r border-border bg-sidebar",
            // Mobile (<768px): drawer overlay
            "max-md:fixed max-md:left-0 max-md:top-0",
            "max-md:shadow-lg max-md:w-[280px]",
            "max-md:-translate-x-full max-md:data-[open=true]:translate-x-0",
            // Tablet/Laptop (768px-1279px): 64px collapsed
            "md:w-16 md:max-xl:w-16",
            // Desktop XL (1280px+): 280px expanded or 64px if manually collapsed
            sidebarCollapsed ? "xl:w-16" : "xl:w-[280px]"
          )}
          data-open={!sidebarCollapsed || undefined}
          data-testid="app-shell-sidebar"
        >
          {sidebar}
        </aside>
      )}

      {/* Main Content Area with Header */}
      <main className="relative flex h-full flex-col overflow-hidden" data-testid="app-shell-main">
        {/* Sticky Header */}
        {header && (
          <div className="relative z-10 flex-shrink-0" data-testid="app-shell-header">
            {header}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-muted/30" data-testid="app-shell-content">
          {children}
        </div>
      </main>

      {/* Right Context Panel */}
      {rightPanel && (
        <aside
          className={cn(
            "relative h-full transition-all duration-300",
            "border-l border-border bg-card",
            // XL screens: fixed 400px width
            "xl:w-[400px]",
            // Smaller screens: slide-over overlay
            "max-xl:fixed max-xl:right-0 max-xl:top-0 max-xl:z-30",
            "max-xl:w-[400px] max-xl:max-w-[85vw] max-xl:shadow-xl",
            rightPanelOpen
              ? "max-xl:translate-x-0"
              : "max-xl:translate-x-full xl:hidden"
          )}
          data-testid="app-shell-right-panel"
        >
          <div className="h-full overflow-y-auto">
            {rightPanel}
          </div>
        </aside>
      )}

      {/* Mobile Overlay for Right Panel */}
      {rightPanelOpen && rightPanel && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm xl:hidden"
          data-testid="app-shell-overlay"
        />
      )}
    </div>
  );
}
