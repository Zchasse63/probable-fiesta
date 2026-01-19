"use client";

import React from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/springs";

export interface AnimatedPriceProps {
  /** Numeric value to animate and format as USD */
  value: number;
  /** Additional className */
  className?: string;
  /** Optional duration override (default uses gentle spring) */
  duration?: number;
}

/**
 * Framer Motion animated currency component
 *
 * Features:
 * - Smooth value transitions using gentle spring from lib/springs
 * - Formats as USD currency with 2 decimal places
 * - Tabular numerals for proper alignment
 * - Monospace font for data consistency
 *
 * Animation:
 * - Uses gentle spring: {stiffness: 100, damping: 15, mass: 0.8}
 * - Provides natural, smooth number transitions
 */
export function AnimatedPrice({
  value,
  className,
  duration,
}: AnimatedPriceProps) {
  const springValue = useSpring(value, {
    ...springs.gentle,
    ...(duration ? { duration } : {}),
  });

  // Update spring value when prop changes
  React.useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  const displayValue = useTransform(springValue, (latest) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(latest);
  });

  return (
    <motion.span
      className={cn("font-mono tabular-nums lining-nums", className)}
      data-testid="animated-price"
    >
      {displayValue}
    </motion.span>
  );
}
