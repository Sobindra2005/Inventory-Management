import React from "react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<TData> {
  id: string;
  header: React.ReactNode;
  cell: (row: TData) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<TData> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  beforeTable?: React.ReactNode;
  afterTable?: React.ReactNode;
  columns: DataTableColumn<TData>[];
  rows: TData[];
  rowKey: (row: TData) => string;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  tableClassName?: string;
  wrapperClassName?: string;
  minWidthClassName?: string;
  rowClassName?: (row: TData) => string;
}

export function DataTable<TData>({
  title,
  subtitle,
  filters,
  actions,
  beforeTable,
  afterTable,
  columns,
  rows,
  rowKey,
  isLoading,
  loadingMessage = "Loading...",
  emptyMessage = "No data found.",
  tableClassName,
  wrapperClassName,
  minWidthClassName,
  rowClassName,
}: DataTableProps<TData>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 text-card-foreground md:p-6",
        wrapperClassName,
      )}
    >
      {(title || subtitle || filters || actions) && (
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {(filters || actions) && (
            <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-end">
              {filters}
              {actions}
            </div>
          )}
        </div>
      )}

      {beforeTable && <div className="mb-4">{beforeTable}</div>}

      <div className="overflow-x-auto">
        <table className={cn("w-full", minWidthClassName, tableClassName)}>
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-sm text-muted-foreground">
                  {loadingMessage}
                </td>
              </tr>
            )}

            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-sm text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!isLoading &&
              rows.map((row) => (
                <tr key={rowKey(row)} className={cn("hover:bg-accent/40", rowClassName?.(row))}>
                  {columns.map((column) => (
                    <td key={column.id} className={cn("px-3 py-3 text-sm", column.cellClassName)}>
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {afterTable && <div className="mt-4">{afterTable}</div>}
    </div>
  );
}
