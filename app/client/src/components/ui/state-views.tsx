import React from 'react';

interface LoadingStateProps {
  message?: string;
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading sales data...', count = 4 }) => {
  return (
    <div className="w-full space-y-4 p-4 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-[#1D211E] rounded w-64"></div>
        <div className="flex gap-2">
          <div className="h-8 bg-[#1D211E] rounded w-24"></div>
          <div className="h-8 bg-[#1D211E] rounded w-32"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 bg-[#171918] border border-[#292E2A] rounded p-3 space-y-2">
            <div className="h-3 bg-[#1D211E] rounded w-16"></div>
            <div className="h-6 bg-[#1D211E] rounded w-20"></div>
          </div>
        ))}
      </div>
      <div className="h-12 bg-[#171918] border border-[#292E2A] rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 pt-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-96 bg-[#171918] border border-[#292E2A] rounded p-4 space-y-3">
            <div className="h-4 bg-[#1D211E] rounded w-3/4"></div>
            <div className="h-4 bg-[#1D211E] rounded w-1/2"></div>
            <div className="h-24 bg-[#1D211E] rounded w-full"></div>
            <div className="h-12 bg-[#1D211E] rounded w-full"></div>
          </div>
        ))}
      </div>
      <div className="text-center text-xs text-[#A5AEA8] mt-2">{message}</div>
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load sales data',
  message = 'We could not retrieve the latest pipeline data from the server. Please check your connection or retry.',
  onRetry,
}) => {
  return (
    <div className="w-full flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-[#171918] border border-[#E25757]/40 rounded-xl p-6 text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-[#E25757]/10 border border-[#E25757]/30 text-[#E25757] flex items-center justify-center mx-auto text-xl">
          ⚠️
        </div>
        <div>
          <h3 className="text-base font-bold text-[#F5F7F4]">{title}</h3>
          <p className="text-xs text-[#A5AEA8] mt-1.5 leading-relaxed">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn small secondary bg-[#1D211E] hover:bg-[#292E2A] text-[#F5F7F4] border border-[#292E2A] px-5 py-2 inline-flex items-center gap-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            🔄 Retry Request
          </button>
        )}
      </div>
    </div>
  );
};

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No opportunities found',
  message = 'There are currently no sales opportunities matching your applied filters.',
  actionLabel = 'Clear Filters',
  onAction,
  icon = '🔍',
}) => {
  return (
    <div className="w-full flex items-center justify-center p-12 text-center">
      <div className="max-w-md w-full bg-[#171918]/60 border border-[#292E2A] rounded-xl p-8 space-y-3">
        <div className="text-3xl mb-1">{icon}</div>
        <h4 className="text-sm font-bold text-[#F5F7F4]">{title}</h4>
        <p className="text-xs text-[#A5AEA8] leading-relaxed">{message}</p>
        {onAction && (
          <div className="pt-2">
            <button
              onClick={onAction}
              className="btn small secondary bg-[#1D211E] text-[#B8F23A] border border-[#333C31] hover:bg-[#292E2A] text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors"
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
