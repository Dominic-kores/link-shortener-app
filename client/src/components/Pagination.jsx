
export default function Pagination({
  page,
  totalPages,
  onPage,
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-4 mt-6">
      <button
        className="btn"
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </button>

      <span className="text-sm">
        Page {page} of {totalPages}
      </span>

      <button
        className="btn"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
