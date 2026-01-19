import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md focus-visible:ring-primary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-secondary",
        ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
        outline: "border border-border bg-background hover:bg-muted transition-colors focus-visible:ring-ring",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md focus-visible:ring-destructive",
        success: "bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow-md focus-visible:ring-success",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-lg",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        data-testid="button"
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
