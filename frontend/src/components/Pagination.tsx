import { Icon } from '@iconify/react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  // Optional: if the backend doesn't provide a full total count, caller can provide hasMore
  hasMore?: boolean;
}

export default function Pagination({ currentPage, totalPages, onPageChange, hasMore = false }: PaginationProps) {
  const pages = [];
  const showEllipsis = totalPages > 5;

  if (showEllipsis) {
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
  } else {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  }

  return (
    <div className="mt-8 flex items-center justify-between">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-6 py-2 border border-grid/30 font-mono text-[10px] tracking-widest uppercase rounded-sm hover:bg-forest hover:text-white transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Icon icon="lucide:chevron-left" className="text-sm" />
        <span>PREVIOUS</span>
      </button>

      <div className="flex items-center space-x-2">
        {pages.map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="font-mono text-xs text-grid/40">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`w-10 h-10 border font-mono text-xs rounded-sm transition-all ${
                page === currentPage
                  ? 'border-forest bg-forest text-white'
                  : 'border-grid/30 hover:bg-forest hover:text-white'
              }`}
            >
              {page}
            </button>
          )
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!(hasMore || currentPage < totalPages)}
        className="px-6 py-2 border border-grid/30 font-mono text-[10px] tracking-widest uppercase rounded-sm hover:bg-forest hover:text-white transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>NEXT</span>
        <Icon icon="lucide:chevron-right" className="text-sm" />
      </button>
    </div>
  );
}