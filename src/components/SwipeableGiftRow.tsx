import React, { useRef, useState, useEffect } from 'react';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { GiftEntry } from '../types';
import { formatCurrency } from '../storage';

interface SwipeableGiftRowProps {
  gift: GiftEntry;
  recipientName?: string;
  showRecipientName?: boolean;
  isOpen: boolean;
  onOpenChange: (id: string | null) => void;
  onTogglePurchased: (id: string) => void;
  onEdit: (gift: GiftEntry) => void;
  onDelete: (gift: GiftEntry) => void;
  isLast: boolean;
}

const ACTION_WIDTH = 92;
const SNAP_THRESHOLD = 46;
const QUICK_EDIT_THRESHOLD = 148;
const QUICK_DELETE_THRESHOLD = 160;

export const SwipeableGiftRow: React.FC<SwipeableGiftRowProps> = ({
  gift,
  recipientName,
  showRecipientName = false,
  isOpen,
  onOpenChange,
  onTogglePurchased,
  onEdit,
  onDelete,
  isLast,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startOffsetRef = useRef(0);
  const axisLockRef = useRef<'none' | 'x' | 'y'>('none');
  const didDragRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen && !isDragging && offsetX !== 0) {
      setOffsetX(0);
    }
  }, [isOpen, isDragging, offsetX]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button[data-no-swipe="true"]')) return;

    pointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startOffsetRef.current = offsetX;
    axisLockRef.current = 'none';
    didDragRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;

    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    if (axisLockRef.current === 'none') {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        axisLockRef.current = 'y';
        pointerIdRef.current = null;
        return;
      }
      axisLockRef.current = 'x';
      setIsDragging(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }

    if (axisLockRef.current !== 'x') return;

    didDragRef.current = true;
    const rawNext = startOffsetRef.current + dx;

    let clamped = rawNext;
    if (rawNext > ACTION_WIDTH) {
      clamped = ACTION_WIDTH + (rawNext - ACTION_WIDTH) * 0.45;
    } else if (rawNext < -ACTION_WIDTH) {
      clamped = -ACTION_WIDTH + (rawNext + ACTION_WIDTH) * 0.45;
    }
    clamped = Math.max(-195, Math.min(180, clamped));
    setOffsetX(clamped);
  };

  const finishGesture = () => {
    if (pointerIdRef.current === null && !isDragging) return;
    pointerIdRef.current = null;

    if (axisLockRef.current !== 'x') {
      axisLockRef.current = 'none';
      setIsDragging(false);
      return;
    }

    setIsDragging(false);
    axisLockRef.current = 'none';

    if (offsetX >= QUICK_EDIT_THRESHOLD) {
      setOffsetX(0);
      onOpenChange(null);
      onEdit(gift);
      return;
    }

    if (offsetX <= -QUICK_DELETE_THRESHOLD) {
      setOffsetX(0);
      onOpenChange(null);
      onDelete(gift);
      return;
    }

    if (offsetX >= SNAP_THRESHOLD) {
      setOffsetX(ACTION_WIDTH);
      onOpenChange(gift.id);
    } else if (offsetX <= -SNAP_THRESHOLD) {
      setOffsetX(-ACTION_WIDTH);
      onOpenChange(gift.id);
    } else {
      setOffsetX(0);
      if (isOpen) onOpenChange(null);
    }
  };

  const handleRowClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (offsetX !== 0) {
      setOffsetX(0);
      onOpenChange(null);
      return;
    }
    onEdit(gift);
  };

  const showEditAction = offsetX > 0;
  const showDeleteAction = offsetX < 0;

  return (
    <div
      className={`relative overflow-hidden select-none ${
        !isLast ? 'border-b border-[#F3E7D8]' : ''
      }`}
    >
      {/* Underlying Swipe Action Panels */}
      <div
        className="absolute inset-0 flex items-stretch justify-between"
        aria-hidden={!showEditAction && !showDeleteAction}
      >
        {/* Swipe Right -> Edit (Jolly Pine Green) */}
        <button
          type="button"
          data-no-swipe="true"
          tabIndex={showEditAction ? 0 : -1}
          onClick={() => {
            setOffsetX(0);
            onOpenChange(null);
            onEdit(gift);
          }}
          className={`flex items-center justify-start pl-5 gap-2 bg-[#157A4B] text-white font-semibold text-xs transition-opacity ${
            showEditAction ? 'opacity-100 w-1/2' : 'opacity-0 w-0 pointer-events-none'
          }`}
          aria-label={`Edit ${gift.description}`}
        >
          <Pencil className="w-4 h-4 text-[#FFE07D] shrink-0" aria-hidden="true" />
          <span>Edit</span>
        </button>

        {/* Swipe Left -> Delete (Santa Red) */}
        <button
          type="button"
          data-no-swipe="true"
          tabIndex={showDeleteAction ? 0 : -1}
          onClick={() => {
            setOffsetX(0);
            onOpenChange(null);
            onDelete(gift);
          }}
          className={`ml-auto flex items-center justify-end pr-5 gap-2 bg-[#C61D2B] text-white font-semibold text-xs transition-opacity ${
            showDeleteAction ? 'opacity-100 w-1/2' : 'opacity-0 w-0 pointer-events-none'
          }`}
          aria-label={`Delete ${gift.description}`}
        >
          <span>Delete</span>
          <Trash2 className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>
      </div>

      {/* Foreground Swipeable Content Row */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishGesture}
        onPointerCancel={finishGesture}
        onClick={handleRowClick}
        style={{
          transform: `translate3d(${offsetX}px, 0, 0)`,
          transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          touchAction: 'pan-y',
        }}
        className={`group relative z-10 flex items-center gap-3 px-3 sm:px-4 min-h-[66px] py-2.5 cursor-grab active:cursor-grabbing transition-colors ${
          gift.purchased
            ? 'bg-[#F3FBF6] hover:bg-[#EAF7EF]'
            : 'bg-white hover:bg-[#FFFBF5]'
        }`}
      >
        {/* Tactile Purchased Checkbox */}
        <button
          type="button"
          role="checkbox"
          aria-checked={gift.purchased}
          data-no-swipe="true"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePurchased(gift.id);
          }}
          aria-label={
            gift.purchased
              ? `Mark "${gift.description}" as unpurchased`
              : `Mark "${gift.description}" as purchased`
          }
          className="flex items-center justify-center min-w-[44px] min-h-[44px] -ml-1.5 rounded-xl focus-visible:outline-2 focus-visible:outline-[#157A4B] shrink-0"
        >
          <span
            className={`flex items-center justify-center w-[24px] h-[24px] rounded-lg border-2 transition-all duration-150 ${
              gift.purchased
                ? 'bg-[#157A4B] border-[#157A4B] text-white shadow-xs scale-105'
                : 'bg-white border-[#D6C3AA] group-hover:border-[#157A4B]'
            }`}
          >
            {gift.purchased && <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />}
          </span>
        </button>

        {/* Description & clean unboxed status */}
        <div className="min-w-0 flex-1 py-0.5">
          <p
            className={`text-[15px] leading-snug font-medium truncate ${
              gift.purchased ? 'line-through text-[#63786C]' : 'text-[#1D2B24]'
            }`}
          >
            {gift.description}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs">
            {showRecipientName && recipientName && (
              <>
                <span className="text-[#5A6D62] truncate">{recipientName}</span>
                <span aria-hidden="true" className="text-[#C7B6A0]">·</span>
              </>
            )}
            <span
              className={
                gift.purchased
                  ? 'text-[#157A4B] font-semibold'
                  : 'text-[#84725F]'
              }
            >
              {gift.purchased ? 'Purchased' : 'To buy'}
            </span>
          </div>
        </div>

        {/* Cost & Desktop Hover Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`text-[15px] font-semibold tabular-nums ${
              gift.purchased ? 'text-[#5A7566]' : 'text-[#1D2B24]'
            }`}
          >
            {formatCurrency(gift.estimatedCost)}
          </span>

          <div className="hidden md:flex items-center ml-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              data-no-swipe="true"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(gift);
              }}
              aria-label={`Edit ${gift.description}`}
              className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg text-[#5A6D62] hover:text-[#157A4B] hover:bg-[#157A4B]/10 transition-colors focus-visible:outline-2 focus-visible:outline-[#157A4B]"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              data-no-swipe="true"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(gift);
              }}
              aria-label={`Delete ${gift.description}`}
              className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-lg text-[#5A6D62] hover:text-[#C61D2B] hover:bg-[#C61D2B]/10 transition-colors focus-visible:outline-2 focus-visible:outline-[#C61D2B]"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
