/**
 * Reusable Pagination Component
 * Displays pagination controls with page numbers, navigation buttons, and item info
 */

import React, { useMemo } from "react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  isDisabled?: boolean;
  showItemInfo?: boolean;
}

type PaginationItem = number | "ellipsis";

/**
 * Build pagination item array with ellipsis for large page counts
 * Shows: first page, around current page, and last page
 */
const buildPaginationItems = (currentPage: number, totalPages: number): PaginationItem[] => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PaginationItem[] = [1];
  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);

  if (left > 2) {
    items.push("ellipsis");
  }

  for (let pageNumber = left; pageNumber <= right; pageNumber += 1) {
    items.push(pageNumber);
  }

  if (right < totalPages - 1) {
    items.push("ellipsis");
  }

  items.push(totalPages);
  return items;
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  isDisabled = false,
  showItemInfo = true,
}) => {
  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4 md:flex-row md:items-center md:justify-between">
      {showItemInfo && (
        <p className="text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {totalItems} items
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={isDisabled || currentPage <= 1}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        {paginationItems.map((item, index) => {
          if (item === "ellipsis") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-sm text-muted-foreground"
              >
                ...
              </span>
            );
          }

          const isCurrent = item === currentPage;

          return (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              disabled={isDisabled}
              aria-current={isCurrent ? "page" : undefined}
              className={`min-w-9 rounded-lg border px-3 py-2 text-sm transition-colors ${
                isCurrent
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              }`}
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={isDisabled || currentPage >= totalPages}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};
