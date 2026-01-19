import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
  LucideIcon,
} from "lucide-react";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-medium",
  {
    variants: {
      variant: {
        success: "bg-success/10 text-success border-success/20",
        warning: "bg-warning/10 text-warning border-warning/20",
        error: "bg-error/10 text-error border-error/20",
        info: "bg-info/10 text-info border-info/20",
        pending: "bg-neutral-500/10 text-neutral-700 border-neutral-500/20",
      },
      size: {
        sm: "h-6 px-2.5 py-0.5 text-xs",
        md: "h-7 px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "info",
      size: "md",
    },
  }
);

const iconMap: Record<string, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
  pending: Clock,
};

export interface StatusBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof statusBadgeVariants> {
  /** Status label text */
  label: string;
  /** Whether to show the status icon (default: true for accessibility) */
  showIcon?: boolean;
}

/**
 * Accessible status indicator badge
 *
 * Features:
 * - Always pairs color with icon for WCAG compliance (unless showIcon=false)
 * - Variants: success, warning, error, info, pending
 * - Sizes: sm (24px), md (28px)
 *
 * Icon mappings:
 * - success: CheckCircle2
 * - warning: AlertTriangle
 * - error: XCircle
 * - info: Info
 * - pending: Clock
 */
export function StatusBadge({
  variant = "info",
  size = "md",
  label,
  showIcon = true,
  className,
  ...props
}: StatusBadgeProps) {
  const Icon = variant ? iconMap[variant] : Info;

  return (
    <span
      className={cn(statusBadgeVariants({ variant, size }), className)}
      data-testid="status-badge"
      data-variant={variant}
      {...props}
    >
      {showIcon && Icon && (
        <Icon
          className={cn("flex-shrink-0", size === "sm" ? "h-3 w-3" : "h-4 w-4")}
          aria-hidden="true"
        />
      )}
      <span className="leading-none">{label}</span>
    </span>
  );
}
