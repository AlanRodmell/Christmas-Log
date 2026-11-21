import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowDownAZ,
  ArrowUp,
  Check,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { GiftEntry, Recipient, RecipientSortMode } from '../types';
import { formatCurrency, getRecipientSealColor } from '../storage';
import { RecipientBauble } from './RecipientBauble';

interface RecipientsViewProps {
  recipients: Recipient[];
  recipientIndexMap: Map<string, number>;
  gifts: GiftEntry[];
  recipientSort: RecipientSortMode;
  onChangeRecipientSort: (mode: RecipientSortMode) => void;
  onSortRecipientsAlphabetically: () => void;
  onMoveRecipient: (id: string, direction: 'up' | 'down') => void;
  onAddRecipient: (name: string, budget: number, note?: string) => void;
  onUpdateRecipient: (id: string, name: string, budget: number, note?: string) => void;
  onDeleteRecipient: (id: string) => void;
  onViewRecipientGifts: (recipientId: string) => void;
  onAddGiftForRecipient: (recipientId: string) => void;
}

const JOLLY_SNOWMAN_PATH = `${import.meta.env.BASE_URL}src/assets/images/jolly_festive_crest_1795244022183.jpg`;

export const RecipientsView: React.FC<RecipientsViewProps> = ({
  recipients,
  recipientIndexMap,
  gifts,
  recipientSort,
  onChangeRecipientSort,
  onSortRecipientsAlphabetically,
  onMoveRecipient,
  onAddRecipient,
  onUpdateRecipient,
  onDeleteRecipient,
  onViewRecipientGifts,
  onAddGiftForRecipient,
}) => {
  const [newName, setNewName] = useState('');
  const [newBudget, setNewBudget] = useState('50');
  const [newNote, setNewNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [crestFailed, setCrestFailed] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editNote, setEditNote] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const totalBudgets = recipients.reduce((sum, r) => sum + r.budget, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setFormError('Enter a name for the recipient.');
      return;
    }
    const parsedBudget = newBudget.trim() === '' ? 0 : parseFloat(newBudget);
    if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
      setFormError('Enter a valid budget amount.');
      return;
    }
    onAddRecipient(trimmed, Math.round(parsedBudget * 100) / 100, newNote.trim() || undefined);
    setNewName('');
    setNewBudget('50');
    setNewNote('');
    setFormError(null);
  };

  const startEdit = (recipient: Recipient) => {
    setEditingId(recipient.id);
    setEditName(recipient.name);
    setEditBudget(String(recipient.budget));
    setEditNote(recipient.note ?? '');
    setConfirmDeleteId(null);
  };

  const saveEdit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed) return;
    const parsedBudget = editBudget.trim() === '' ? 0 : parseFloat(editBudget);
    if (Number.isNaN(parsedBudget) || parsedBudget < 0) return;
    onUpdateRecipient(id, trimmed, Math.round(parsedBudget * 100) / 100, editNote.trim() || undefined);
    setEditingId(null);
  };

  return (
    <div className="space-y-7">
      {/* Jolly Pine Green Header Banner */}
      <div className="rounded-3xl bg-[#157A4B] text-white overflow-hidden shadow-lg shadow-[#157A4B]/15 border border-[#BFE6CE]">
        <div className="h-2 w-full candy-cane-trim" aria-hidden="true" />
        <div className="px-5 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {!crestFailed && (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-white ring-2 ring-[#FFE07D] shadow-sm shrink-0">
                <img
                  src={JOLLY_SNOWMAN_PATH}
                  alt="Smiling Christmas snowman beside a wrapped present"
                  referrerPolicy="no-referrer"
                  onError={() => setCrestFailed(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                Recipient Budgets
              </h1>
              <p className="mt-1 text-sm text-[#E4F8EC]">
                Set a budget for each person on your Christmas list and see how much you have spent.
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="block text-xs text-[#FFE082] font-semibold">Combined Budget</span>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {formatCurrency(totalBudgets)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Add Recipient + Budget Form */}
        <section className="lg:col-span-4 rounded-2xl bg-white border border-[#F0DFC8] shadow-xs overflow-hidden">
          <div className="px-5 sm:px-6 py-4 bg-[#FFF6EC] border-b border-[#F3E5D3]">
            <h2 className="font-serif text-lg font-bold text-[#1D2B24]">Add Recipient</h2>
            <p className="mt-0.5 text-xs text-[#7A6855]">
              Add someone to your list with their own Christmas budget.
            </p>
          </div>

          <form onSubmit={handleAdd} className="p-5 sm:p-6 space-y-3.5">
            <div>
              <label htmlFor="recipient-name-input" className="block text-xs font-semibold text-[#1D2B24] mb-1">
                Name
              </label>
              <input
                id="recipient-name-input"
                type="text"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="e.g., Aunt Margaret"
                maxLength={50}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FFFBF5] border border-[#E5D3BC] text-sm text-[#1D2B24] placeholder:text-[#968672] focus:outline-none focus:border-[#157A4B] focus:ring-2 focus:ring-[#157A4B]/15"
              />
            </div>

            <div>
              <label htmlFor="recipient-budget-input" className="block text-xs font-semibold text-[#1D2B24] mb-1">
                Budget (£)
              </label>
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5A6D62]"
                >
                  £
                </span>
                <input
                  id="recipient-budget-input"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={newBudget}
                  onChange={(e) => {
                    setNewBudget(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="50.00"
                  className="w-full min-h-[44px] pl-8 pr-3.5 py-2 rounded-xl bg-[#FFFBF5] border border-[#E5D3BC] text-sm font-semibold text-[#1D2B24] tabular-nums focus:outline-none focus:border-[#157A4B] focus:ring-2 focus:ring-[#157A4B]/15"
                />
              </div>
            </div>

            <div>
              <label htmlFor="recipient-note-input" className="block text-xs font-semibold text-[#1D2B24] mb-1">
                Relationship or note <span className="text-[#8E7D69] font-normal">(optional)</span>
              </label>
              <input
                id="recipient-note-input"
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g., Family, Secret Santa"
                maxLength={40}
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FFFBF5] border border-[#E5D3BC] text-sm text-[#1D2B24] placeholder:text-[#968672] focus:outline-none focus:border-[#157A4B] focus:ring-2 focus:ring-[#157A4B]/15"
              />
            </div>

            {formError && (
              <p role="alert" className="text-xs font-semibold text-[#C61D2B]">
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 min-h-[46px] px-4 py-2.5 rounded-xl bg-[#157A4B] hover:bg-[#10623B] active:scale-[0.98] text-sm font-semibold text-white transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#FFE07D]" aria-hidden="true" />
              <span>Add Recipient</span>
            </button>
          </form>
        </section>

        {/* Recipient Directory */}
        <section className="lg:col-span-8 rounded-2xl bg-white border border-[#F0DFC8] shadow-xs overflow-hidden">
          <div className="px-5 sm:px-6 py-4 bg-[#FFF6EC] border-b border-[#F3E5D3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#1D2B24]">
                Your Christmas List
              </h2>
              <p className="text-xs text-[#7A6855] tabular-nums">
                {recipients.length} {recipients.length === 1 ? 'person' : 'people'} · Sort alphabetically or organise your own order
              </p>
            </div>

            {recipients.length > 1 && (
              <div className="flex items-center gap-2 shrink-0">
                <select
                  aria-label="Sort people"
                  value={recipientSort}
                  onChange={(e) => onChangeRecipientSort(e.target.value as RecipientSortMode)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-[#E5D3BC] text-xs font-semibold text-[#1D2B24] focus:outline-none focus:border-[#157A4B]"
                >
                  <option value="alpha-asc">Name (A–Z)</option>
                  <option value="alpha-desc">Name (Z–A)</option>
                  <option value="custom">Custom order</option>
                  <option value="spend-desc">Most spent</option>
                </select>
                <button
                  type="button"
                  onClick={onSortRecipientsAlphabetically}
                  className={`inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
                    recipientSort === 'alpha-asc'
                      ? 'bg-[#157A4B] border-[#157A4B] text-white'
                      : 'bg-white border-[#E5D3BC] text-[#157A4B] hover:bg-[#F3FBF6]'
                  }`}
                >
                  <ArrowDownAZ className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Sort A–Z</span>
                </button>
              </div>
            )}
          </div>

          {recipients.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-[#5A6D62]">
                No recipients yet. Add your first person with a budget to start logging gifts.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F4E9DA]">
              {recipients.map((recipient, idx) => {
                const seal = getRecipientSealColor(recipientIndexMap.get(recipient.id) ?? idx);
                const personGifts = gifts.filter((g) => g.recipientId === recipient.id);
                const subtotal = personGifts.reduce((sum, g) => sum + g.estimatedCost, 0);
                const boughtCount = personGifts.filter((g) => g.purchased).length;
                const remaining = recipient.budget - subtotal;
                const isOver = recipient.budget > 0 && remaining < 0;
                const progressPct =
                  recipient.budget > 0 ? Math.min((subtotal / recipient.budget) * 100, 100) : subtotal > 0 ? 100 : 0;

                const isEditing = editingId === recipient.id;
                const isConfirmingDelete = confirmDeleteId === recipient.id;

                return (
                  <div key={recipient.id} className="px-5 sm:px-6 py-4">
                    {isEditing ? (
                      <form
                        onSubmit={(e) => saveEdit(e, recipient.id)}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
                      >
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          aria-label="Recipient name"
                          className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-[#157A4B] bg-white text-sm font-medium text-[#1D2B24] focus:outline-none"
                          autoFocus
                        />
                        <div className="relative sm:w-28">
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5A6D62]"
                          >
                            £
                          </span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            value={editBudget}
                            onChange={(e) => setEditBudget(e.target.value)}
                            aria-label="Recipient budget in pounds"
                            className="w-full min-h-[44px] pl-7 pr-2.5 py-2 rounded-xl border border-[#157A4B] bg-white text-sm font-semibold text-[#1D2B24] tabular-nums focus:outline-none"
                          />
                        </div>
                        <input
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Note (optional)"
                          aria-label="Recipient note"
                          className="sm:w-32 min-h-[44px] px-3 py-2 rounded-xl border border-[#E5D3BC] bg-white text-sm text-[#1D2B24] focus:outline-none focus:border-[#157A4B]"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            aria-label="Save recipient"
                            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 rounded-xl bg-[#157A4B] text-white hover:bg-[#10623B]"
                          >
                            <Check className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label="Cancel edit"
                            onClick={() => setEditingId(null)}
                            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] px-3 rounded-xl border border-[#E5D3BC] text-[#5A6D62] hover:bg-[#FFF6EC]"
                          >
                            <X className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </form>
                    ) : isConfirmingDelete ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-sm text-[#C61D2B] font-semibold">
                          Remove {recipient.name}
                          {personGifts.length > 0
                            ? ` and ${personGifts.length} ${personGifts.length === 1 ? 'gift' : 'gifts'} (${formatCurrency(subtotal)})?`
                            : '?'}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteRecipient(recipient.id);
                              setConfirmDeleteId(null);
                            }}
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C61D2B] text-white text-xs font-semibold hover:bg-[#A61723] whitespace-nowrap"
                          >
                            Remove
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E5D3BC] text-[#47564E] text-xs font-medium hover:bg-[#FFF6EC] whitespace-nowrap"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={() => onViewRecipientGifts(recipient.id)}
                            className="min-w-0 flex-1 flex items-center gap-3.5 text-left group focus-visible:outline-2 focus-visible:outline-[#157A4B] rounded-lg py-0.5"
                          >
                            <RecipientBauble
                              name={recipient.name}
                              bg={seal.bg}
                              text={seal.text}
                              size="lg"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-[16px] font-semibold text-[#1D2B24] group-hover:text-[#C61D2B] transition-colors truncate">
                                  {recipient.name}
                                </span>
                                {recipient.note && (
                                  <span className="text-xs text-[#84725F] truncate">
                                    · {recipient.note}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-[#6B7A71] tabular-nums flex flex-wrap items-center gap-x-1.5">
                                <span className="font-semibold text-[#1D2B24]">
                                  {formatCurrency(subtotal)}
                                </span>
                                <span>of {formatCurrency(recipient.budget)} budget</span>
                                <span aria-hidden="true">·</span>
                                {isOver ? (
                                  <span className="inline-flex items-center gap-1 font-semibold text-[#C61D2B]">
                                    <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                                    Over by {formatCurrency(Math.abs(remaining))}
                                  </span>
                                ) : (
                                  <span className="text-[#157A4B] font-semibold">
                                    {formatCurrency(remaining)} left
                                  </span>
                                )}
                                <span aria-hidden="true">·</span>
                                <span>
                                  {boughtCount}/{personGifts.length} bought
                                </span>
                              </p>
                            </div>
                            <ChevronRight
                              className="w-4 h-4 text-[#B09D87] group-hover:text-[#C61D2B] shrink-0 transition-transform group-hover:translate-x-0.5"
                              aria-hidden="true"
                            />
                          </button>
                        </div>

                        <div className="h-2 w-full rounded-full bg-[#F5ECDF] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${subtotal > 0 ? Math.max(progressPct, 3) : 0}%`,
                              backgroundColor: isOver ? '#C61D2B' : '#157A4B',
                            }}
                          />
                        </div>

                        {/* Organise (Move Up / Down) & Row Actions */}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div className="flex items-center gap-1" role="group" aria-label={`Reorder ${recipient.name}`}>
                            <button
                              type="button"
                              onClick={() => onMoveRecipient(recipient.id, 'up')}
                              disabled={idx === 0}
                              aria-label={`Move ${recipient.name} up`}
                              className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl border border-[#EFE2D0] text-[#5A6D62] hover:text-[#157A4B] hover:bg-[#F3FBF6] disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#5A6D62] transition-colors"
                            >
                              <ArrowUp className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveRecipient(recipient.id, 'down')}
                              disabled={idx === recipients.length - 1}
                              aria-label={`Move ${recipient.name} down`}
                              className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl border border-[#EFE2D0] text-[#5A6D62] hover:text-[#157A4B] hover:bg-[#F3FBF6] disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-[#5A6D62] transition-colors"
                            >
                              <ArrowDown className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onAddGiftForRecipient(recipient.id)}
                              aria-label={`Log gift for ${recipient.name}`}
                              className="inline-flex items-center gap-1 min-h-[40px] px-3 rounded-xl text-xs font-semibold text-[#C61D2B] hover:bg-[#C61D2B]/10 transition-colors whitespace-nowrap"
                            >
                              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                              <span>Log Gift</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => startEdit(recipient)}
                              aria-label={`Edit ${recipient.name} and budget`}
                              className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-[#5A6D62] hover:text-[#157A4B] hover:bg-[#157A4B]/10 transition-colors"
                            >
                              <Pencil className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(recipient.id)}
                              aria-label={`Delete ${recipient.name}`}
                              className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] rounded-xl text-[#5A6D62] hover:text-[#C61D2B] hover:bg-[#C61D2B]/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
