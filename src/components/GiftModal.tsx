import React, { useState, useEffect, useRef } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { GiftEntry, Recipient } from '../types';
import { formatCurrency } from '../storage';

interface GiftModalProps {
  isOpen: boolean;
  editingGift: GiftEntry | null;
  defaultRecipientId: string | null;
  recipients: Recipient[];
  gifts: GiftEntry[];
  onClose: () => void;
  onSave: (payload: {
    id?: string;
    recipientId?: string;
    newRecipientName?: string;
    newRecipientBudget?: number;
    description: string;
    estimatedCost: number;
    purchased: boolean;
  }) => void;
  onDelete?: (gift: GiftEntry) => void;
}

export const GiftModal: React.FC<GiftModalProps> = ({
  isOpen,
  editingGift,
  defaultRecipientId,
  recipients,
  gifts,
  onClose,
  onSave,
  onDelete,
}) => {
  const [recipientMode, setRecipientMode] = useState<'existing' | 'new'>('existing');
  const [recipientId, setRecipientId] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientBudget, setNewRecipientBudget] = useState('');
  const [description, setDescription] = useState('');
  const [costInput, setCostInput] = useState('');
  const [purchased, setPurchased] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const newRecipientInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (editingGift) {
      setRecipientMode('existing');
      setRecipientId(editingGift.recipientId);
      setNewRecipientName('');
      setNewRecipientBudget('');
      setDescription(editingGift.description);
      setCostInput(String(editingGift.estimatedCost));
      setPurchased(Boolean(editingGift.purchased));
      setError(null);
    } else {
      const hasRecipients = recipients.length > 0;
      setRecipientMode(hasRecipients ? 'existing' : 'new');
      setRecipientId(
        defaultRecipientId && recipients.some((r) => r.id === defaultRecipientId)
          ? defaultRecipientId
          : recipients[0]?.id ?? ''
      );
      setNewRecipientName('');
      setNewRecipientBudget('50');
      setDescription('');
      setCostInput('');
      setPurchased(true);
      setError(null);
    }

    const timer = window.setTimeout(() => {
      if (!editingGift && recipients.length === 0) {
        newRecipientInputRef.current?.focus();
      } else {
        descriptionInputRef.current?.focus();
      }
    }, 60);

    return () => window.clearTimeout(timer);
  }, [isOpen, editingGift, defaultRecipientId, recipients]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const parsedCost = parseFloat(costInput);
  const validCost = !Number.isNaN(parsedCost) && parsedCost >= 0 ? parsedCost : 0;

  const activeRecipient =
    recipientMode === 'existing'
      ? recipients.find((r) => r.id === recipientId) ?? null
      : null;

  const parsedNewBudget = parseFloat(newRecipientBudget);
  const targetBudget =
    recipientMode === 'existing'
      ? activeRecipient?.budget ?? 0
      : !Number.isNaN(parsedNewBudget) && parsedNewBudget >= 0
        ? parsedNewBudget
        : 0;

  const targetName =
    recipientMode === 'existing'
      ? activeRecipient?.name ?? 'Recipient'
      : newRecipientName.trim() || 'New recipient';

  const currentRecipientSpend =
    recipientMode === 'existing' && activeRecipient
      ? gifts
          .filter((g) => g.recipientId === activeRecipient.id && g.id !== editingGift?.id)
          .reduce((sum, g) => sum + g.estimatedCost, 0)
      : 0;

  const projectedRecipientTotal = currentRecipientSpend + validCost;
  const projectedRecipientRemaining = targetBudget - projectedRecipientTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      setError('Please enter a gift description.');
      descriptionInputRef.current?.focus();
      return;
    }

    let finalNewBudget: number | undefined;
    if (recipientMode === 'new') {
      const trimmedName = newRecipientName.trim();
      if (!trimmedName) {
        setError('Please enter a recipient name.');
        newRecipientInputRef.current?.focus();
        return;
      }
      const parsedB = newRecipientBudget.trim() === '' ? 0 : parseFloat(newRecipientBudget);
      if (Number.isNaN(parsedB) || parsedB < 0) {
        setError('Please enter a valid non-negative recipient budget.');
        return;
      }
      finalNewBudget = Math.round(parsedB * 100) / 100;
    } else if (!recipientId) {
      setError('Please select a recipient.');
      return;
    }

    const numericCost = costInput.trim() === '' ? 0 : parseFloat(costInput);
    if (Number.isNaN(numericCost) || numericCost < 0) {
      setError('Please enter a valid non-negative cost.');
      return;
    }

    onSave({
      id: editingGift?.id,
      recipientId: recipientMode === 'existing' ? recipientId : undefined,
      newRecipientName: recipientMode === 'new' ? newRecipientName.trim() : undefined,
      newRecipientBudget: finalNewBudget,
      description: trimmedDesc,
      estimatedCost: Math.round(numericCost * 100) / 100,
      purchased,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#181012]/55 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-[#F0DFC8] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Jolly Candy-Cane Trim + Santa Red Header */}
        <div className="h-2 w-full candy-cane-trim" aria-hidden="true" />
        <div className="bg-[#C61D2B] text-white">
          <div className="sm:hidden pt-2.5 pb-0.5 flex justify-center">
            <div className="w-10 h-1.5 rounded-full bg-white/40" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4">
            <h2 id="gift-modal-title" className="font-serif text-xl font-semibold text-white">
              {editingGift ? 'Edit Christmas Gift' : 'Log Christmas Gift'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 rounded-xl text-white/85 hover:text-white hover:bg-white/15 transition-colors"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-5 sm:px-6 py-5 space-y-5">
          {/* Recipient Selector */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label
                htmlFor={recipientMode === 'existing' ? 'gift-recipient-select' : 'gift-recipient-new'}
                className="text-sm font-semibold text-[#1D2B24]"
              >
                Recipient
              </label>
              {recipients.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = recipientMode === 'existing' ? 'new' : 'existing';
                    setRecipientMode(nextMode);
                    setError(null);
                    if (nextMode === 'new') {
                      window.setTimeout(() => newRecipientInputRef.current?.focus(), 30);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#157A4B] hover:text-[#C61D2B] min-h-[36px] px-1 whitespace-nowrap transition-colors"
                >
                  {recipientMode === 'existing' ? (
                    <>
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>New recipient</span>
                    </>
                  ) : (
                    <span>Choose existing</span>
                  )}
                </button>
              )}
            </div>

            {recipientMode === 'existing' ? (
              <select
                id="gift-recipient-select"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-[#FFFBF5] border border-[#E5D3BC] text-[15px] text-[#1D2B24] focus:outline-none focus:border-[#157A4B] focus:ring-2 focus:ring-[#157A4B]/15"
              >
                {recipients.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — Budget {formatCurrency(r.budget)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                <input
                  ref={newRecipientInputRef}
                  id="gift-recipient-new"
                  type="text"
                  value={newRecipientName}
                  onChange={(e) => setNewRecipientName(e.target.value)}
                  placeholder="Name (e.g., Gran)"
                  maxLength={50}
                  className="sm:col-span-3 w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-[#FFFBF5] border border-[#E5D3BC] text-[15px] text-[#1D2B24] placeholder:text-[#968672] focus:outline-none focus:border-[#157A4B] focus:ring-2 focus:ring-[#157A4B]/15"
                />
                <div className="sm:col-span-2 relative">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5A6D62]"
                  >
                    £
                  </span>
                  <input
                    id="gift-recipient-budget"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={newRecipientBudget}
                    onChange={(e) => setNewRecipientBudget(e.target.value)}
                    aria-label="New recipient budget in pounds"
                    placeholder="Budget"
                    className="w-full min-h-[46px] pl-7 pr-3 py-2.5 rounded-xl bg-[#FFFBF5] border border-[#E5D3BC] text-[15px] font-semibold text-[#1D2B24] tabular-nums placeholder:font-normal placeholder:text-[#968672] focus:outline-none focus:border-[#157A4B] focus:ring-2 focus:ring-[#157A4B]/15"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Gift Description */}
          <div>
            <label htmlFor="gift-description" className="block text-sm font-semibold text-[#1D2B24] mb-1.5">
              Gift description
            </label>
            <input
              ref={descriptionInputRef}
              id="gift-description"
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g., Cosy tartan pyjamas"
              maxLength={120}
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-[#FFFBF5] border border-[#E5D3BC] text-[15px] text-[#1D2B24] placeholder:text-[#968672] focus:outline-none focus:border-[#157A4B] focus:ring-2 focus:ring-[#157A4B]/15"
            />
          </div>

          {/* Cost (£) */}
          <div>
            <label htmlFor="gift-cost" className="block text-sm font-semibold text-[#1D2B24] mb-1.5">
              Cost
            </label>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-[#5A6D62]"
              >
                £
              </span>
              <input
                id="gift-cost"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={costInput}
                onChange={(e) => {
                  setCostInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="0.00"
                className="w-full min-h-[46px] pl-8 pr-3.5 py-2.5 rounded-xl bg-[#FFFBF5] border border-[#E5D3BC] text-[15px] font-semibold text-[#1D2B24] tabular-nums placeholder:font-normal placeholder:text-[#968672] focus:outline-none focus:border-[#157A4B] focus:ring-2 focus:ring-[#157A4B]/15"
              />
            </div>

            <p
              className={`mt-2 text-xs tabular-nums ${
                targetBudget > 0 && projectedRecipientRemaining < 0
                  ? 'text-[#C61D2B] font-semibold'
                  : 'text-[#157A4B] font-medium'
              }`}
            >
              {targetBudget <= 0
                ? `${targetName}: ${formatCurrency(projectedRecipientTotal)} total (no budget set)`
                : projectedRecipientRemaining < 0
                  ? `${targetName}'s budget: over by ${formatCurrency(Math.abs(projectedRecipientRemaining))} (budget ${formatCurrency(targetBudget)})`
                  : `${targetName}'s budget: ${formatCurrency(projectedRecipientRemaining)} left of ${formatCurrency(targetBudget)}`}
            </p>
          </div>

          {/* Purchased Boolean Checkbox */}
          <label className="flex items-center gap-3 min-h-[50px] px-3.5 rounded-xl bg-[#F3FBF6] border border-[#CBEAD7] cursor-pointer select-none">
            <button
              type="button"
              role="checkbox"
              aria-checked={purchased}
              onClick={() => setPurchased((prev) => !prev)}
              className={`flex items-center justify-center w-[24px] h-[24px] rounded-lg border-2 transition-colors shrink-0 ${
                purchased
                  ? 'bg-[#157A4B] border-[#157A4B] text-white'
                  : 'bg-white border-[#B9D8C5]'
              }`}
            >
              {purchased && <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />}
            </button>
            <div>
              <span className="block text-sm font-semibold text-[#1D2B24]">Already purchased</span>
              <span className="block text-xs text-[#546B5E]">
                Untick if this is a gift idea still to buy
              </span>
            </div>
          </label>

          {error && (
            <p role="alert" className="text-xs font-semibold text-[#C61D2B]">
              {error}
            </p>
          )}

          {/* Footer Actions */}
          <div className="pt-1 flex items-center gap-3">
            {editingGift && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(editingGift);
                  onClose();
                }}
                aria-label="Delete this gift"
                className="inline-flex items-center justify-center min-h-[48px] min-w-[48px] px-3.5 rounded-xl border border-[#F2C6C9] text-[#C61D2B] hover:bg-[#C61D2B]/10 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl border border-[#E5D3BC] bg-white text-sm font-semibold text-[#47564E] hover:bg-[#FFF6EC] transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[1.5] min-h-[48px] px-5 py-2.5 rounded-xl bg-[#157A4B] hover:bg-[#10623B] active:scale-[0.98] text-sm font-semibold text-white transition-all whitespace-nowrap shadow-sm"
            >
              {editingGift ? 'Save Changes' : 'Save Gift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
