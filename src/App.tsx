/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AlertTriangle, Check, Gift, Pencil, PieChart, Plus, Search, Users, X } from 'lucide-react';
import { AppView, ChristmasLedgerData, GiftEntry, SortMode } from './types';
import {
  STORAGE_KEY,
  createId,
  formatCurrency,
  formatCurrencySmart,
  getRecipientSealColor,
  getStarterData,
  loadLedgerData,
  saveLedgerData,
} from './storage';
import { BudgetHeaderCard } from './components/BudgetHeaderCard';
import { SwipeableGiftRow } from './components/SwipeableGiftRow';
import { GiftModal } from './components/GiftModal';
import { SummaryView } from './components/SummaryView';
import { RecipientsView } from './components/RecipientsView';
import { UndoToast } from './components/UndoToast';
import { SnowfallBackdrop } from './components/SnowfallBackdrop';
import { FairyLightsTrim } from './components/FairyLightsTrim';
import { RecipientBauble } from './components/RecipientBauble';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallButton';

type PurchaseFilter = 'all' | 'unpurchased' | 'purchased';

export default function App() {
  const [ledger, setLedger] = useState<ChristmasLedgerData>(() => loadLedgerData());
  const [activeView, setActiveView] = useState<AppView>('gifts');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('all');
  const [purchaseFilter, setPurchaseFilter] = useState<PurchaseFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  // Inline budget editing directly on a recipient card in Gift List
  const [editingBudgetRecipientId, setEditingBudgetRecipientId] = useState<string | null>(null);
  const [inlineBudgetDraft, setInlineBudgetDraft] = useState('');

  // Swipe row coordination
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);

  // Add / Edit modal state
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftEntry | null>(null);
  const [modalDefaultRecipientId, setModalDefaultRecipientId] = useState<string | null>(null);

  // Undo deletion state
  const [undoEntry, setUndoEntry] = useState<{ gift: GiftEntry; message: string } | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  // Synchronous offline persistence in localStorage
  useEffect(() => {
    saveLedgerData(ledger);
  }, [ledger]);

  // Keep localStorage synced across tabs/windows on the same device
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setLedger(loadLedgerData());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    };
  }, []);

  // Derived real-time totals
  const totals = useMemo(() => {
    let totalBudget = 0;
    let totalEstimated = 0;
    let totalBought = 0;
    let boughtCount = 0;

    const spendByRecipient = new Map<string, number>();
    for (const gift of ledger.gifts) {
      totalEstimated += gift.estimatedCost;
      spendByRecipient.set(
        gift.recipientId,
        (spendByRecipient.get(gift.recipientId) ?? 0) + gift.estimatedCost
      );
      if (gift.purchased) {
        totalBought += gift.estimatedCost;
        boughtCount += 1;
      }
    }

    let overBudgetRecipientsCount = 0;
    for (const recipient of ledger.recipients) {
      totalBudget += recipient.budget;
      const spent = spendByRecipient.get(recipient.id) ?? 0;
      if (recipient.budget > 0 && spent > recipient.budget) {
        overBudgetRecipientsCount += 1;
      }
    }

    return {
      totalBudget: Math.round(totalBudget * 100) / 100,
      totalEstimated: Math.round(totalEstimated * 100) / 100,
      totalBought: Math.round(totalBought * 100) / 100,
      boughtCount,
      giftCount: ledger.gifts.length,
      recipientCount: ledger.recipients.length,
      overBudgetRecipientsCount,
    };
  }, [ledger.gifts, ledger.recipients]);

  const recipientMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of ledger.recipients) {
      map.set(r.id, r.name);
    }
    return map;
  }, [ledger.recipients]);

  const recipientIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    ledger.recipients.forEach((r, idx) => map.set(r.id, idx));
    return map;
  }, [ledger.recipients]);

  // CRUD: Update single recipient's budget inline
  const handleUpdateRecipientBudget = useCallback((recipientId: string, newBudget: number) => {
    setLedger((prev) => ({
      ...prev,
      recipients: prev.recipients.map((r) =>
        r.id === recipientId ? { ...r, budget: newBudget } : r
      ),
    }));
  }, []);

  // CRUD: Gift Save
  const handleSaveGift = useCallback(
    (payload: {
      id?: string;
      recipientId?: string;
      newRecipientName?: string;
      newRecipientBudget?: number;
      description: string;
      estimatedCost: number;
      purchased: boolean;
    }) => {
      const now = Date.now();
      setLedger((prev) => {
        let recipients = prev.recipients;
        let targetRecipientId = payload.recipientId;

        if (payload.newRecipientName) {
          const existing = recipients.find(
            (r) => r.name.toLowerCase() === payload.newRecipientName!.toLowerCase()
          );
          if (existing) {
            targetRecipientId = existing.id;
          } else {
            const created = {
              id: createId('rec'),
              name: payload.newRecipientName,
              budget: payload.newRecipientBudget ?? 0,
              createdAt: now,
            };
            recipients = [...recipients, created];
            targetRecipientId = created.id;
          }
        }

        if (!targetRecipientId) return prev;

        if (payload.id) {
          const updatedGifts = prev.gifts.map((g) =>
            g.id === payload.id
              ? {
                  ...g,
                  recipientId: targetRecipientId!,
                  description: payload.description,
                  estimatedCost: payload.estimatedCost,
                  purchased: payload.purchased,
                  updatedAt: now,
                }
              : g
          );
          return { ...prev, recipients, gifts: updatedGifts };
        }

        const newGift: GiftEntry = {
          id: createId('gift'),
          recipientId: targetRecipientId,
          description: payload.description,
          estimatedCost: payload.estimatedCost,
          purchased: payload.purchased,
          createdAt: now,
          updatedAt: now,
        };

        return {
          ...prev,
          recipients,
          gifts: [newGift, ...prev.gifts],
        };
      });
    },
    []
  );

  // CRUD: Toggle Purchased boolean
  const handleTogglePurchased = useCallback((id: string) => {
    setLedger((prev) => ({
      ...prev,
      gifts: prev.gifts.map((g) =>
        g.id === id ? { ...g, purchased: !g.purchased, updatedAt: Date.now() } : g
      ),
    }));
  }, []);

  // CRUD: Delete Gift with Undo
  const handleDeleteGift = useCallback((gift: GiftEntry) => {
    setLedger((prev) => ({
      ...prev,
      gifts: prev.gifts.filter((g) => g.id !== gift.id),
    }));
    setOpenSwipeId(null);

    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    setUndoEntry({
      gift,
      message: `Removed "${gift.description}"`,
    });
    undoTimerRef.current = window.setTimeout(() => {
      setUndoEntry(null);
      undoTimerRef.current = null;
    }, 5500);
  }, []);

  const handleUndoDelete = useCallback(() => {
    if (!undoEntry) return;
    const restored = undoEntry.gift;
    setLedger((prev) => {
      if (prev.gifts.some((g) => g.id === restored.id)) return prev;
      return { ...prev, gifts: [restored, ...prev.gifts] };
    });
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    setUndoEntry(null);
  }, [undoEntry]);

  // CRUD: Recipients
  const handleAddRecipient = useCallback((name: string, budget: number, note?: string) => {
    setLedger((prev) => ({
      ...prev,
      recipients: [
        ...prev.recipients,
        { id: createId('rec'), name, budget, note, createdAt: Date.now() },
      ],
    }));
  }, []);

  const handleUpdateRecipient = useCallback(
    (id: string, name: string, budget: number, note?: string) => {
      setLedger((prev) => ({
        ...prev,
        recipients: prev.recipients.map((r) =>
          r.id === id ? { ...r, name, budget, note } : r
        ),
      }));
    },
    []
  );

  const handleDeleteRecipient = useCallback(
    (id: string) => {
      setLedger((prev) => ({
        ...prev,
        recipients: prev.recipients.filter((r) => r.id !== id),
        gifts: prev.gifts.filter((g) => g.recipientId !== id),
      }));
      if (selectedRecipientId === id) {
        setSelectedRecipientId('all');
      }
    },
    [selectedRecipientId]
  );

  // Maintenance Actions
  const handleResetSampleData = useCallback(() => {
    setLedger(getStarterData());
    setSelectedRecipientId('all');
    setPurchaseFilter('all');
    setSearchQuery('');
  }, []);

  const handleClearAllGifts = useCallback(() => {
    setLedger((prev) => ({ ...prev, gifts: [] }));
  }, []);

  const handleClearBoughtGifts = useCallback(() => {
    setLedger((prev) => ({
      ...prev,
      gifts: prev.gifts.filter((g) => !g.purchased),
    }));
  }, []);

  // Modal Launchers
  const openAddGiftModal = useCallback(
    (recipientId?: string) => {
      setEditingGift(null);
      setModalDefaultRecipientId(
        recipientId ?? (selectedRecipientId !== 'all' ? selectedRecipientId : null)
      );
      setIsGiftModalOpen(true);
    },
    [selectedRecipientId]
  );

  const openEditGiftModal = useCallback((gift: GiftEntry) => {
    setOpenSwipeId(null);
    setEditingGift(gift);
    setModalDefaultRecipientId(gift.recipientId);
    setIsGiftModalOpen(true);
  }, []);

  const handleJumpToRecipient = useCallback((recipientId: string) => {
    setSelectedRecipientId(recipientId);
    setPurchaseFilter('all');
    setSearchQuery('');
    setActiveView('gifts');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const startInlineBudgetEdit = (recipientId: string, currentBudget: number) => {
    setEditingBudgetRecipientId(recipientId);
    setInlineBudgetDraft(String(currentBudget));
  };

  const commitInlineBudgetEdit = (e: React.FormEvent, recipientId: string) => {
    e.preventDefault();
    const parsed = parseFloat(inlineBudgetDraft);
    if (!Number.isNaN(parsed) && parsed >= 0) {
      handleUpdateRecipientBudget(recipientId, Math.round(parsed * 100) / 100);
      setEditingBudgetRecipientId(null);
    }
  };

  // Filtered and grouped gifts with per-recipient budget totals
  const groupedRecipientSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const sortGifts = (items: GiftEntry[]) => {
      const copy = [...items];
      switch (sortMode) {
        case 'cost-desc':
          return copy.sort((a, b) => b.estimatedCost - a.estimatedCost);
        case 'cost-asc':
          return copy.sort((a, b) => a.estimatedCost - b.estimatedCost);
        case 'unbought':
          return copy.sort((a, b) => Number(a.purchased) - Number(b.purchased) || b.createdAt - a.createdAt);
        case 'recent':
        default:
          return copy.sort((a, b) => b.createdAt - a.createdAt);
      }
    };

    const visibleRecipients =
      selectedRecipientId === 'all'
        ? ledger.recipients
        : ledger.recipients.filter((r) => r.id === selectedRecipientId);

    return visibleRecipients
      .map((recipient) => {
        const allPersonGifts = ledger.gifts.filter((g) => g.recipientId === recipient.id);
        const allPersonSpend = allPersonGifts.reduce((sum, g) => sum + g.estimatedCost, 0);
        const allPersonBoughtSpend = allPersonGifts
          .filter((g) => g.purchased)
          .reduce((sum, g) => sum + g.estimatedCost, 0);

        const filteredGifts = allPersonGifts.filter((g) => {
          if (purchaseFilter === 'unpurchased' && g.purchased) return false;
          if (purchaseFilter === 'purchased' && !g.purchased) return false;
          if (!query) return true;
          return (
            g.description.toLowerCase().includes(query) ||
            recipient.name.toLowerCase().includes(query)
          );
        });

        const sorted = sortGifts(filteredGifts);
        const remaining = recipient.budget - allPersonSpend;
        const isOverBudget = recipient.budget > 0 && remaining < 0;
        const budgetPct =
          recipient.budget > 0
            ? Math.min((allPersonSpend / recipient.budget) * 100, 100)
            : allPersonSpend > 0
              ? 100
              : 0;
        const boughtPct =
          recipient.budget > 0 ? Math.min((allPersonBoughtSpend / recipient.budget) * 100, 100) : 0;
        const boughtCount = allPersonGifts.filter((g) => g.purchased).length;
        const totalCount = allPersonGifts.length;
        const allWrappedUp = totalCount > 0 && boughtCount === totalCount && !isOverBudget;

        return {
          recipient,
          seal: getRecipientSealColor(recipientIndexMap.get(recipient.id) ?? 0),
          gifts: sorted,
          allPersonSpend,
          remaining,
          isOverBudget,
          budgetPct,
          boughtPct,
          boughtCount,
          totalCount,
          allWrappedUp,
        };
      })
      .filter((section) => {
        if (query || purchaseFilter !== 'all') return section.gifts.length > 0;
        return true;
      });
  }, [ledger.recipients, ledger.gifts, selectedRecipientId, purchaseFilter, searchQuery, sortMode, recipientIndexMap]);

  const sidebarRecipientTotals = useMemo(() => {
    return ledger.recipients
      .map((r, idx) => {
        const items = ledger.gifts.filter((g) => g.recipientId === r.id);
        const total = items.reduce((s, g) => s + g.estimatedCost, 0);
        const remaining = r.budget - total;
        return {
          recipient: r,
          seal: getRecipientSealColor(idx),
          count: items.length,
          boughtCount: items.filter((g) => g.purchased).length,
          total,
          remaining,
          isOver: r.budget > 0 && remaining < 0,
        };
      })
      .sort((a, b) => b.total - a.total || a.recipient.name.localeCompare(b.recipient.name));
  }, [ledger.recipients, ledger.gifts]);

  const totalVisibleGifts = groupedRecipientSections.reduce((s, sec) => s + sec.gifts.length, 0);

  return (
    <div className="relative min-h-screen flex flex-col text-[#1D2B24]">
      {/* Subtle drifting snowfall backdrop */}
      <SnowfallBackdrop />

      {/* Cheerful Santa Red Top Bar with twinkling fairy lights (3-zone contract, 56px height) */}
      <header className="sticky top-0 z-30 h-14 bg-[#C61D2B] text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => {
              setActiveView('gifts');
              setSelectedRecipientId('all');
              setPurchaseFilter('all');
            }}
            className="font-serif text-[22px] font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFE07D] rounded-md"
          >
            Christmas Log
          </button>

          {/* Zone 2: Single-line text navigation links (Desktop) */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
            {(
              [
                { id: 'gifts', label: 'Gift List' },
                { id: 'recipients', label: 'Budgets' },
                { id: 'summary', label: 'Summary' },
              ] as const
            ).map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-1 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FFE07D] ${
                    isActive
                      ? 'text-[#FFE07D]'
                      : 'text-white/90 hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-[15px] h-[3px] bg-[#FFE07D] rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Starlight Gold Action CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => openAddGiftModal()}
              className="inline-flex items-center gap-1.5 min-h-[40px] sm:min-h-[42px] px-4 py-2 rounded-xl bg-[#F8C537] hover:bg-[#FFD154] active:scale-[0.98] text-xs sm:text-sm font-bold text-[#143D29] shadow-sm transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Plus className="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" />
              <span>Log Gift</span>
            </button>
          </div>
        </div>

        {/* Twinkling festive fairy-light string */}
        <FairyLightsTrim />
      </header>

      {/* Main Content Workspace */}
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-7 sm:pt-8 pb-24 md:pb-12">
        {activeView === 'gifts' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Mobile Combined Budget Card + Install Banner */}
            <div className="lg:hidden space-y-4">
              <BudgetHeaderCard
                totalBudget={totals.totalBudget}
                totalEstimated={totals.totalEstimated}
                totalBought={totals.totalBought}
                giftCount={totals.giftCount}
                boughtCount={totals.boughtCount}
                recipientCount={totals.recipientCount}
                overBudgetRecipientsCount={totals.overBudgetRecipientsCount}
                onManageBudgets={() => setActiveView('recipients')}
                compact
              />
              <PWAInstallButton variant="banner" />
            </div>

            {/* Primary Column: Filter Bar + Grouped Recipient Cards */}
            <div className="lg:col-span-8 space-y-5 min-w-0">
              {/* Recipient Filter Strip */}
              <div className="space-y-3">
                <div
                  role="tablist"
                  aria-label="Filter gifts by recipient"
                  className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedRecipientId === 'all'}
                    onClick={() => setSelectedRecipientId('all')}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                      selectedRecipientId === 'all'
                        ? 'bg-[#157A4B] text-white shadow-xs'
                        : 'bg-white border border-[#F0DFC8] text-[#455A4F] hover:bg-[#FFF6EC]'
                    }`}
                  >
                    All ({ledger.gifts.length})
                  </button>
                  {ledger.recipients.map((recipient) => {
                    const isSelected = selectedRecipientId === recipient.id;
                    const count = ledger.gifts.filter((g) => g.recipientId === recipient.id).length;
                    return (
                      <button
                        key={recipient.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setSelectedRecipientId(recipient.id)}
                        className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                          isSelected
                            ? 'bg-[#157A4B] text-white shadow-xs'
                            : 'bg-white border border-[#F0DFC8] text-[#455A4F] hover:bg-[#FFF6EC]'
                        }`}
                      >
                        {recipient.name} ({count})
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setActiveView('recipients')}
                    className="inline-flex items-center gap-1 min-h-[40px] px-3 py-2 rounded-xl border border-dashed border-[#D8BE9B] bg-white/70 text-xs font-semibold text-[#157A4B] hover:bg-[#FFF6EC] transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Person</span>
                  </button>
                </div>

                {/* Search + Purchase Status Filter + Sort Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1 min-w-0">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B8770]"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search gifts or recipients..."
                      aria-label="Search gifts or recipients"
                      className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-xl bg-white border border-[#F0DFC8] text-sm text-[#1D2B24] placeholder:text-[#968672] focus:outline-none focus:border-[#157A4B] focus:ring-2 focus:ring-[#157A4B]/15"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                        className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[36px] min-h-[36px] text-[#7A6855] hover:text-[#1D2B24]"
                      >
                        <X className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      role="group"
                      aria-label="Filter by purchase status"
                      className="inline-flex items-center p-0.5 rounded-xl bg-[#F5E9D9] border border-[#EAD8C0]"
                    >
                      {(
                        [
                          { id: 'all', label: 'All' },
                          { id: 'unpurchased', label: 'To Buy' },
                          { id: 'purchased', label: 'Bought' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPurchaseFilter(opt.id)}
                          aria-pressed={purchaseFilter === opt.id}
                          className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                            purchaseFilter === opt.id
                              ? 'bg-white text-[#C61D2B] shadow-xs'
                              : 'text-[#6A5A48] hover:text-[#1D2B24]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <select
                      aria-label="Sort gifts"
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as SortMode)}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-white border border-[#F0DFC8] text-xs font-semibold text-[#455A4F] focus:outline-none focus:border-[#157A4B] shrink-0"
                    >
                      <option value="recent">Newest first</option>
                      <option value="cost-desc">Highest cost</option>
                      <option value="cost-asc">Lowest cost</option>
                      <option value="unbought">To buy first</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Quiet Interaction Hint */}
              {totalVisibleGifts > 0 && (
                <p className="text-xs text-[#7A6855] px-0.5">
                  Tap any budget to edit · Tick gifts bought · Swipe right to edit · Swipe left to delete
                </p>
              )}

              {/* Grouped Recipient Cards with Bauble Avatars & Individual Budgets */}
              {groupedRecipientSections.length === 0 ? (
                <div className="rounded-3xl bg-white border border-[#F0DFC8] p-8 sm:p-10 text-center shadow-xs">
                  <h2 className="font-serif text-xl font-bold text-[#1D2B24]">
                    {searchQuery || purchaseFilter !== 'all'
                      ? 'No matching gifts found'
                      : 'Start your Christmas list'}
                  </h2>
                  <p className="mt-1.5 text-sm text-[#5A6D62] max-w-sm mx-auto">
                    {searchQuery || purchaseFilter !== 'all'
                      ? 'Try clearing your active search or purchase filter to see the rest of your list.'
                      : 'Add your first recipient with a budget and start logging gifts bought.'}
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-3">
                    {searchQuery || purchaseFilter !== 'all' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setPurchaseFilter('all');
                        }}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#E5D3BC] bg-white text-sm font-semibold text-[#1D2B24] hover:bg-[#FFF6EC] transition-colors"
                      >
                        Reset Filters
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openAddGiftModal()}
                        className="inline-flex items-center gap-1.5 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#C61D2B] hover:bg-[#A61723] text-sm font-semibold text-white transition-colors"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span>Log Gift</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {groupedRecipientSections.map(
                    ({
                      recipient,
                      seal,
                      gifts,
                      allPersonSpend,
                      remaining,
                      isOverBudget,
                      budgetPct,
                      boughtPct,
                      boughtCount,
                      totalCount,
                      allWrappedUp,
                    }) => {
                      const isEditingThisBudget = editingBudgetRecipientId === recipient.id;

                      return (
                        <section
                          key={recipient.id}
                          aria-label={`Gifts and budget for ${recipient.name}`}
                          className="rounded-3xl bg-white border border-[#F0DFC8] shadow-sm shadow-[#A67B46]/8 overflow-hidden"
                        >
                          {/* Cheerful Festive Recipient Header */}
                          <div className="px-4 sm:px-5 pt-4 pb-3.5 bg-[#FFF6EC] border-b border-[#F3E5D3] space-y-3">
                            <div className="flex items-start sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <RecipientBauble
                                  name={recipient.name}
                                  bg={seal.bg}
                                  text={seal.text}
                                />
                                <div className="min-w-0">
                                  <div className="flex items-baseline gap-2">
                                    <h2 className="font-serif text-lg font-bold text-[#1D2B24] truncate">
                                      {recipient.name}
                                    </h2>
                                    {recipient.note && (
                                      <span className="text-xs text-[#84725F] truncate hidden sm:inline">
                                        · {recipient.note}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-[#6B7A71] tabular-nums">
                                    {allWrappedUp ? (
                                      <span className="font-semibold text-[#157A4B]">
                                        All wrapped up! ({boughtCount}/{totalCount})
                                      </span>
                                    ) : (
                                      <span>
                                        {boughtCount} of {totalCount} bought
                                      </span>
                                    )}
                                    <span aria-hidden="true"> · </span>
                                    {recipient.budget <= 0 ? (
                                      <span>No budget set</span>
                                    ) : isOverBudget ? (
                                      <span className="inline-flex items-center gap-1 font-semibold text-[#C61D2B]">
                                        <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                                        Over by {formatCurrency(Math.abs(remaining))}
                                      </span>
                                    ) : (
                                      <span className="font-semibold text-[#157A4B]">
                                        {formatCurrency(remaining)} left
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Spend / Budget tap-to-edit + Log Gift button */}
                              <div className="flex items-center gap-2 shrink-0">
                                {!isEditingThisBudget && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      startInlineBudgetEdit(recipient.id, recipient.budget)
                                    }
                                    aria-label={`Edit ${recipient.name}'s budget, currently ${formatCurrency(recipient.budget)}`}
                                    className="group/budget inline-flex items-center gap-1.5 min-h-[40px] px-2.5 py-1 rounded-xl hover:bg-[#F7E8D4] transition-colors text-right"
                                  >
                                    <div className="tabular-nums">
                                      <span
                                        className={`text-sm sm:text-[15px] font-bold ${
                                          isOverBudget ? 'text-[#C61D2B]' : 'text-[#157A4B]'
                                        }`}
                                      >
                                        {formatCurrency(allPersonSpend)}
                                      </span>
                                      <span className="text-xs text-[#7A6855]">
                                        {' '}
                                        / {formatCurrencySmart(recipient.budget)}
                                      </span>
                                    </div>
                                    <Pencil
                                      className="w-3.5 h-3.5 text-[#9B8770] group-hover/budget:text-[#157A4B] shrink-0"
                                      aria-hidden="true"
                                    />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => openAddGiftModal(recipient.id)}
                                  aria-label={`Log gift for ${recipient.name}`}
                                  className="inline-flex items-center gap-1 min-h-[40px] px-3 py-1.5 rounded-xl bg-[#C61D2B] hover:bg-[#A61723] text-xs font-semibold text-white transition-colors whitespace-nowrap shadow-xs focus-visible:outline-2 focus-visible:outline-[#C61D2B]"
                                >
                                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                                  <span className="hidden sm:inline">Log Gift</span>
                                </button>
                              </div>
                            </div>

                            {/* Inline Budget Editor */}
                            {isEditingThisBudget && (
                              <form
                                onSubmit={(e) => commitInlineBudgetEdit(e, recipient.id)}
                                className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-white border border-[#E5D3BC]"
                              >
                                <label
                                  htmlFor={`inline-budget-${recipient.id}`}
                                  className="text-xs font-semibold text-[#1D2B24] whitespace-nowrap"
                                >
                                  {recipient.name}&apos;s budget (£)
                                </label>
                                <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
                                  <input
                                    id={`inline-budget-${recipient.id}`}
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min="0"
                                    value={inlineBudgetDraft}
                                    onChange={(e) => setInlineBudgetDraft(e.target.value)}
                                    autoFocus
                                    className="w-full min-h-[40px] px-3 py-1.5 rounded-lg border border-[#157A4B] bg-white text-sm font-semibold text-[#1D2B24] tabular-nums focus:outline-none"
                                  />
                                  <button
                                    type="submit"
                                    aria-label="Save budget"
                                    className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg bg-[#157A4B] text-white hover:bg-[#10623B]"
                                  >
                                    <Check className="w-4 h-4" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="Cancel editing budget"
                                    onClick={() => setEditingBudgetRecipientId(null)}
                                    className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-lg border border-[#E5D3BC] text-[#5A6D62] hover:bg-[#FFF6EC]"
                                  >
                                    <X className="w-4 h-4" aria-hidden="true" />
                                  </button>
                                </div>
                              </form>
                            )}

                            {/* Per-Recipient Individual Budget Progress Bar */}
                            <div
                              className="relative h-2.5 w-full rounded-full bg-[#EFE2D0] overflow-hidden"
                              role="progressbar"
                              aria-valuenow={Math.round(budgetPct)}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${recipient.name}'s budget progress`}
                            >
                              <div
                                className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                                style={{
                                  width: `${allPersonSpend > 0 ? Math.max(budgetPct, 3) : 0}%`,
                                  backgroundColor: isOverBudget ? '#C61D2B' : '#F4B41A',
                                }}
                              />
                              {boughtPct > 0 && !isOverBudget && (
                                <div
                                  className="absolute inset-y-0 left-0 rounded-full bg-[#157A4B] transition-all duration-300"
                                  style={{ width: `${boughtPct}%` }}
                                />
                              )}
                            </div>
                          </div>

                          {/* Gift Rows */}
                          {gifts.length === 0 ? (
                            <div className="px-5 py-5 flex items-center justify-between gap-4">
                              <p className="text-sm text-[#7A6855]">
                                No gifts logged for {recipient.name} yet.
                              </p>
                              <button
                                type="button"
                                onClick={() => openAddGiftModal(recipient.id)}
                                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#157A4B]/10 hover:bg-[#157A4B]/18 text-xs font-semibold text-[#157A4B] transition-colors whitespace-nowrap"
                              >
                                Log Gift
                              </button>
                            </div>
                          ) : (
                            <div>
                              {gifts.map((gift, index) => (
                                <SwipeableGiftRow
                                  key={gift.id}
                                  gift={gift}
                                  recipientName={recipientMap.get(gift.recipientId)}
                                  isOpen={openSwipeId === gift.id}
                                  onOpenChange={setOpenSwipeId}
                                  onTogglePurchased={handleTogglePurchased}
                                  onEdit={openEditGiftModal}
                                  onDelete={handleDeleteGift}
                                  isLast={index === gifts.length - 1}
                                />
                              ))}
                            </div>
                          )}
                        </section>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            {/* Desktop Sticky Sidebar */}
            <aside className="hidden lg:block lg:col-span-4 space-y-5 sticky top-22">
              <BudgetHeaderCard
                totalBudget={totals.totalBudget}
                totalEstimated={totals.totalEstimated}
                totalBought={totals.totalBought}
                giftCount={totals.giftCount}
                boughtCount={totals.boughtCount}
                recipientCount={totals.recipientCount}
                overBudgetRecipientsCount={totals.overBudgetRecipientsCount}
                onManageBudgets={() => setActiveView('recipients')}
              />

              <PWAInstallButton variant="banner" />

              <section className="rounded-3xl bg-white border border-[#F0DFC8] shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 bg-[#FFF6EC] border-b border-[#F3E5D3] flex items-baseline justify-between gap-2">
                  <h2 className="font-serif text-base font-bold text-[#1D2B24]">
                    Recipient Budgets
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveView('recipients')}
                    className="text-xs font-semibold text-[#C61D2B] hover:text-[#9E1420] whitespace-nowrap"
                  >
                    Edit All
                  </button>
                </div>

                <div className="px-5 py-2">
                  {sidebarRecipientTotals.length === 0 ? (
                    <p className="py-3 text-xs text-[#7A6855]">
                      Add recipients to set individual budgets.
                    </p>
                  ) : (
                    <div className="divide-y divide-[#F4E9DA]">
                      {sidebarRecipientTotals.map(
                        ({ recipient, seal, count, boughtCount, total, isOver }) => {
                          const isActive = selectedRecipientId === recipient.id;
                          return (
                            <button
                              key={recipient.id}
                              type="button"
                              onClick={() =>
                                setSelectedRecipientId(isActive ? 'all' : recipient.id)
                              }
                              className={`w-full py-2.5 flex items-center justify-between gap-3 text-left transition-colors rounded-lg ${
                                isActive
                                  ? 'text-[#C61D2B] font-semibold'
                                  : 'text-[#1D2B24] hover:text-[#157A4B]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <RecipientBauble
                                  name={recipient.name}
                                  bg={seal.bg}
                                  text={seal.text}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <span className="block text-sm font-semibold truncate">
                                    {recipient.name}
                                  </span>
                                  <span className="block text-[11px] text-[#84725F] font-normal tabular-nums">
                                    {boughtCount}/{count} bought
                                  </span>
                                </div>
                              </div>
                              <div className="text-right tabular-nums shrink-0">
                                <span
                                  className={`block text-sm font-bold ${
                                    isOver ? 'text-[#C61D2B]' : 'text-[#157A4B]'
                                  }`}
                                >
                                  {formatCurrencySmart(total)}
                                </span>
                                <span className="block text-[11px] text-[#84725F] font-normal">
                                  of {formatCurrencySmart(recipient.budget)}
                                </span>
                              </div>
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </section>
            </aside>
          </div>
        )}

        {activeView === 'summary' && (
          <SummaryView
            recipients={ledger.recipients}
            gifts={ledger.gifts}
            onSelectRecipient={handleJumpToRecipient}
            onResetSampleData={handleResetSampleData}
            onClearAllGifts={handleClearAllGifts}
            onClearBoughtGifts={handleClearBoughtGifts}
            onOpenAddGift={() => openAddGiftModal()}
          />
        )}

        {activeView === 'recipients' && (
          <RecipientsView
            recipients={ledger.recipients}
            gifts={ledger.gifts}
            onAddRecipient={handleAddRecipient}
            onUpdateRecipient={handleUpdateRecipient}
            onDeleteRecipient={handleDeleteRecipient}
            onViewRecipientGifts={handleJumpToRecipient}
            onAddGiftForRecipient={(recipientId) => openAddGiftModal(recipientId)}
          />
        )}
      </main>

      {/* Mobile Fixed Santa-Red Bottom Tab Bar (56px height; total sticky = 112px <= 15% cap) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-[#C61D2B] border-t border-[#FFE07D]/40 shadow-lg"
      >
        <div className="grid grid-cols-3 h-full max-w-md mx-auto">
          {(
            [
              { id: 'gifts', label: 'Gifts', Icon: Gift },
              { id: 'recipients', label: 'Budgets', Icon: Users },
              { id: 'summary', label: 'Summary', Icon: PieChart },
            ] as const
          ).map(({ id, label, Icon }) => {
            const isActive = activeView === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveView(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center min-h-[44px] gap-0.5 transition-colors ${
                  isActive ? 'text-[#FFE07D]' : 'text-white/80'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} aria-hidden="true" />
                <span className={`text-[11px] tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Log / Edit Gift Modal */}
      <GiftModal
        isOpen={isGiftModalOpen}
        editingGift={editingGift}
        defaultRecipientId={modalDefaultRecipientId}
        recipients={ledger.recipients}
        gifts={ledger.gifts}
        onClose={() => {
          setIsGiftModalOpen(false);
          setEditingGift(null);
        }}
        onSave={handleSaveGift}
        onDelete={handleDeleteGift}
      />

      {/* Undo Delete Toast */}
      <UndoToast
        message={undoEntry?.message ?? null}
        onUndo={handleUndoDelete}
        onDismiss={() => {
          if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
          setUndoEntry(null);
        }}
      />

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}
