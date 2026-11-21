import React from 'react';
import { RotateCcw, X } from 'lucide-react';

interface UndoToastProps {
  message: string | null;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ message, onUndo, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-18 md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2 rounded-2xl bg-[#157A4B] text-white shadow-xl border border-[#FFE07D]/50">
        <p className="text-sm font-medium truncate">{message}</p>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl text-xs font-bold text-[#FFE07D] hover:bg-white/15 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="inline-flex items-center justify-center min-w-[40px] min-h-[44px] rounded-xl text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
