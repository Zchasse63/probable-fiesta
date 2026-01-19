"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface TableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  sortable?: boolean;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  sortable = false,
  className,
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (columnKey: string) => {
    if (!sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortable || !sortColumn) return data;

    const column = columns.find((col) => col.key === sortColumn);
    if (!column) return data;

    return [...data].sort((a, b) => {
      let aValue: unknown;
      let bValue: unknown;

      if (typeof column.accessor === "function") {
        aValue = column.accessor(a);
        bValue = column.accessor(b);
      } else {
        aValue = a[column.accessor];
        bValue = b[column.accessor];
      }

      // Type-safe comparison for primitive values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === "asc" ? 1 : -1;
      if (bValue == null) return sortDirection === "asc" ? -1 : 1;

      // Convert to string for comparison to handle all types safely
      const aStr = String(aValue);
      const bStr = String(bValue);

      if (aStr < bStr) return sortDirection === "asc" ? -1 : 1;
      if (aStr > bStr) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection, columns, sortable]);

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3 text-left text-sm font-semibold text-foreground",
                  sortable && "cursor-pointer hover:bg-accent"
                )}
                onClick={() => handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {sortable && sortColumn === column.key && (
                    <span className="text-muted-foreground/80">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={cn(
                "border-b border-border hover:bg-accent",
                rowIndex % 2 === 0 ? "bg-card" : "bg-accent/50"
              )}
            >
              {columns.map((column) => {
                let cellContent: React.ReactNode;

                if (typeof column.accessor === "function") {
                  cellContent = column.accessor(row);
                } else {
                  const value = row[column.accessor];
                  cellContent = column.render
                    ? column.render(value, row)
                    : String(value);
                }

                return (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-sm text-foreground/80"
                  >
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
          {sortedData.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-muted-foreground/80"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
