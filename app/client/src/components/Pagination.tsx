interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Deliberately a shared component (not a per-page duplicated helper, unlike this app's usual
// formatDate/formatCurrency convention) since it's real interactive JSX reused identically across
// every paginated list page, not a trivial formatting function.
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button className="btn small secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <span className="pagination-indicator muted">
        Page {page} of {totalPages}
      </span>
      <button className="btn small secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
