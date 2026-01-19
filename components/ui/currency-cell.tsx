import React from "react";
import { cn } from "@/lib/utils";

export interface CurrencyCellProps {
  /** Numeric value to format as USD currency */
  value: number;
  /** Additional className */
  className?: string;
}

/**
 * Data table currency display component
 *
 * Features:
 * - Formats value as USD with 2 decimal places
 * - Right-aligned with tabular/lining numerals
 * - Monospace font for proper alignment in tables
 * - Negative values displayed in parentheses with destructive color
 *
 * Typography:
 * - font-mono: monospace for alignment
 * - tabular-nums: fixed-width digits
 * - lining-nums: digits aligned to baseline
 */
export function CurrencyCell({ value, className }: CurrencyCellProps) {
  const isNegative = value < 0;
  const absoluteValue = Math.abs(value);

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedValue = formatter.format(absoluteValue);

  return (
    <span
      className={cn(
        "font-mono tabular-nums lining-nums text-right",
        isNegative && "text-destructive",
        className
      )}
      data-testid="currency-cell"
      data-value={value}
    >
      {isNegative ? `(${formattedValue})` : formattedValue}
    </span>
  );
}
