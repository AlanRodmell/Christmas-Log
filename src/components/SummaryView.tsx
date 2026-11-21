import React, { useState } from 'react';
import { AlertTriangle, Check, ChevronRight, RotateCcw, Share2, Trash2 } from 'lucide-react';
import { GiftEntry, Recipient } from '../types';
import { formatCurrency, formatCurrencySmart, getRecipientSealColor } from '../storage';
import { RecipientBauble } from './RecipientBauble';
import { PWAInstallButton } from './PWAInstallButton';

interface SummaryViewProps {
  recipients: Recipient[];
  gifts: GiftEntry[];
  onSelectRecipient: (recipientId: string) => void;
  onResetSampleData: () => void;
  onClearAllGifts: () => void;
  onClearBoughtGifts: () => void;
  onOpenAddGift: () => void;
}

const JOLLY_SNOWMAN_PATH = `${import.meta.env.BASE_URL}src/assets/images/jolly_festive_crest_1795244022183.jpg`;

const CHART_PALETTE = [
  '#D1202F', // Santa Red
  '#157A4B', // Jolly Pine
  '#E59F00', // Starlight Gold
  '#1D6FA5', // Frosty Blue
  '#A62863', // Sugar Plum
  '#C65D21', // Gingerbread
  '#2E9665', // Mistletoe
  '#E04F5F', // Candy Berry
];

export const SummaryView: React.FC<SummaryViewProps> = ({
  recipients,
  gifts,
  onSelectRecipient,
  onResetSampleData,
  onClearAllGifts,
  onClearBoughtGifts,
  onOpenAddGift,
}) => {
  const [excludePurchased, setExcludePurchased] = useState(false);
  const [pendingAction, setPendingAction] = useState<'clear-all' | 'reset-sample' | null>(null);
  const [crestFailed, setCrestFailed] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const handleShareApp = async () => {
    const shareUrl = new URL(import.meta.env.BASE_URL, window.location.origin).href;
    const shareData = {
      title: 'Christmas Log',
      text: 'Free Christmas gift list & per-recipient budget tracker — works offline with no sign-up.',
      url: shareUrl,
    };

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(shareData);
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback('Link copied');
        window.setTimeout(() => setShareFeedback(null), 2500);
      }
    } catch {
      // User dismissed native share sheet or clipboard unavailable
    }
  };

  const totalBudget = recipients.reduce((sum, r) => sum + r.budget, 0);
  const allTotalEstimated = gifts.reduce((sum, g) => sum + g.estimatedCost, 0);
  const purchasedGifts = gifts.filter((g) => g.purchased);
  const unpurchasedGifts = gifts.filter((g) => !g.purchased);
  const totalPurchased = purchasedGifts.reduce((sum, g) => sum + g.estimatedCost, 0);
  const totalUnpurchased = unpurchasedGifts.reduce((sum, g) => sum + g.estimatedCost, 0);

  const scopedGifts = excludePurchased ? unpurchasedGifts : gifts;
  const scopedTotal = excludePurchased ? totalUnpurchased : allTotalEstimated;

  const overallRemaining = totalBudget - allTotalEstimated;
  const isOverBudget = overallRemaining < 0;
  const scopedPercentOfBudget = totalBudget > 0 ? Math.round((scopedTotal / totalBudget) * 100) : 0;

  const recipientBreakdown = recipients
    .map((recipient, idx) => {
      const personAllGifts = gifts.filter((g) => g.recipientId === recipient.id);
      const personScopedGifts = scopedGifts.filter((g) => g.recipientId === recipient.id);
      const scopedSpend = personScopedGifts.reduce((sum, g) => sum + g.estimatedCost, 0);
      const allSpend = personAllGifts.reduce((sum, g) => sum + g.estimatedCost, 0);
      const purchasedCount = personAllGifts.filter((g) => g.purchased).length;
      const personRemaining = recipient.budget - allSpend;
      const isPersonOver = recipient.budget > 0 && personRemaining < 0;
      const budgetPercent =
        recipient.budget > 0 ? Math.min((scopedSpend / recipient.budget) * 100, 100) : scopedSpend > 0 ? 100 : 0;

      return {
        recipient,
        seal: getRecipientSealColor(idx),
        giftCount: personScopedGifts.length,
        purchasedCount,
        total: scopedSpend,
        allSpend,
        personRemaining,
        isPersonOver,
        budgetPercent,
        color: CHART_PALETTE[idx % CHART_PALETTE.length],
      };
    })
    .filter((item) => (!excludePurchased ? true : item.giftCount > 0))
    .sort((a, b) => b.total - a.total || a.recipient.name.localeCompare(b.recipient.name));

  const activeRecipientsCount = recipientBreakdown.filter((r) => r.giftCount > 0).length;
  const averageGift = scopedGifts.length > 0 ? scopedTotal / scopedGifts.length : 0;
  const averagePerRecipient = activeRecipientsCount > 0 ? scopedTotal / activeRecipientsCount : 0;
  const largestGift =
    scopedGifts.length > 0
      ? scopedGifts.reduce((max, g) => (g.estimatedCost > max.estimatedCost ? g : max), scopedGifts[0])
      : null;
  const largestGiftRecipient = largestGift
    ? recipients.find((r) => r.id === largestGift.recipientId)?.name ?? 'Recipient'
    : null;

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const donutDenominator = excludePurchased
    ? Math.max(scopedTotal, 1)
    : Math.max(totalBudget, allTotalEstimated, 1);

  const donutSegments: Array<{
    id: string;
    label: string;
    value: number;
    color: string;
    length: number;
    offset: number;
  }> = [];
  let accumulatedLength = 0;

  recipientBreakdown
    .filter((item) => item.total > 0)
    .forEach((item) => {
      const segmentLength = (item.total / donutDenominator) * circumference;
      donutSegments.push({
        id: item.recipient.id,
        label: item.recipient.name,
        value: item.total,
        color: item.color,
        length: segmentLength,
        offset: -accumulatedLength,
      });
      accumulatedLength += segmentLength;
    });

  return (
    <div className="space-y-7">
      {/* Jolly Pine Green Snowman Summary Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-[#157A4B] text-white shadow-lg shadow-[#157A4B]/15 border border-[#BFE6CE]">
        <div className="h-2 w-full candy-cane-trim" aria-hidden="true" />
        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            {!crestFailed && (
              <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl overflow-hidden bg-white ring-2 ring-[#FFE07D] shadow-sm shrink-0">
                <img
                  src={JOLLY_SNOWMAN_PATH}
                  alt="Smiling Christmas snowman in a red scarf beside a wrapped gift box under starry snowy pines"
                  referrerPolicy="no-referrer"
                  onError={() => setCrestFailed(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                Christmas Expense Summary
              </h1>
              <p className="mt-1 text-sm text-[#E4F8EC]">
                {excludePurchased
                  ? `Showing ${unpurchasedGifts.length} unpurchased ${unpurchasedGifts.length === 1 ? 'gift' : 'gifts'} · ${purchasedGifts.length} bought (${formatCurrency(totalPurchased)}) hidden.`
                  : `Tracking festive spend against individual budgets across ${recipients.length} ${recipients.length === 1 ? 'recipient' : 'recipients'}.`}
              </p>
            </div>
          </div>

          {/* Interactive Filter Control: All Gifts vs Unpurchased Only */}
          <div
            role="group"
            aria-label="Filter summary by purchase status"
            className="inline-flex items-center p-1 rounded-xl bg-[#0D5634] border border-white/20 self-start md:self-center shrink-0"
          >
            <button
              type="button"
              onClick={() => setExcludePurchased(false)}
              aria-pressed={!excludePurchased}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                !excludePurchased
                  ? 'bg-white text-[#125736] shadow-xs'
                  : 'text-[#DDF5E7] hover:text-white'
              }`}
            >
              All Gifts ({gifts.length})
            </button>
            <button
              type="button"
              onClick={() => setExcludePurchased(true)}
              aria-pressed={excludePurchased}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                excludePurchased
                  ? 'bg-[#F8C537] text-[#143D29] shadow-xs'
                  : 'text-[#DDF5E7] hover:text-white'
              }`}
            >
              Unpurchased Only ({unpurchasedGifts.length})
            </button>
          </div>
        </div>
      </section>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="rounded-2xl bg-white border border-[#F0DFC8] p-4 sm:p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#7A6855]">
            {excludePurchased ? 'Still to Spend' : 'Total Logged'}
          </p>
          <p className="mt-2 font-serif text-2xl sm:text-[28px] font-bold text-[#1D2B24] tabular-nums">
            {formatCurrency(scopedTotal)}
          </p>
          <p className="mt-1.5 text-xs text-[#6D7D73] tabular-nums">
            {excludePurchased
              ? `${unpurchasedGifts.length} unpurchased ${unpurchasedGifts.length === 1 ? 'item' : 'items'}`
              : totalBudget > 0
                ? `${scopedPercentOfBudget}% of combined budgets`
                : 'No budgets set'}
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-[#F0DFC8] p-4 sm:p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#7A6855]">
            {isOverBudget ? 'Over Combined Budget' : 'Budget Remaining'}
          </p>
          <p
            className={`mt-2 font-serif text-2xl sm:text-[28px] font-bold tabular-nums ${
              isOverBudget ? 'text-[#C61D2B]' : 'text-[#157A4B]'
            }`}
          >
            {isOverBudget
              ? `-${formatCurrency(Math.abs(overallRemaining))}`
              : formatCurrency(overallRemaining)}
          </p>
          <p className="mt-1.5 text-xs text-[#6D7D73] tabular-nums flex items-center gap-1">
            {isOverBudget && (
              <AlertTriangle className="w-3.5 h-3.5 text-[#C61D2B] shrink-0" aria-hidden="true" />
            )}
            <span>Combined {formatCurrency(totalBudget)}</span>
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-[#F0DFC8] p-4 sm:p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#7A6855]">
            {excludePurchased ? 'Purchased (Hidden)' : 'Gifts Bought'}
          </p>
          <p className="mt-2 font-serif text-2xl sm:text-[28px] font-bold text-[#157A4B] tabular-nums">
            {formatCurrency(totalPurchased)}
          </p>
          <p className="mt-1.5 text-xs text-[#6D7D73] tabular-nums">
            {purchasedGifts.length} of {gifts.length}{' '}
            {gifts.length === 1 ? 'gift' : 'gifts'} bought
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-[#F0DFC8] p-4 sm:p-5 shadow-xs">
          <p className="text-xs font-semibold text-[#7A6855]">
            {excludePurchased ? 'Remaining Share' : 'Left to Buy'}
          </p>
          <p className="mt-2 font-serif text-2xl sm:text-[28px] font-bold text-[#C61D2B] tabular-nums">
            {excludePurchased
              ? allTotalEstimated > 0
                ? `${Math.round((totalUnpurchased / allTotalEstimated) * 100)}%`
                : '0%'
              : formatCurrency(totalUnpurchased)}
          </p>
          <p className="mt-1.5 text-xs text-[#6D7D73] tabular-nums">
            {excludePurchased
              ? `of ${formatCurrency(allTotalEstimated)} total list`
              : `${unpurchasedGifts.length} still to buy`}
          </p>
        </div>
      </div>

      {/* Main 12-column Insights Grid */}
      {gifts.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#F0DFC8] p-8 sm:p-10 text-center shadow-xs">
          <h2 className="font-serif text-xl font-bold text-[#1D2B24]">No gifts logged yet</h2>
          <p className="mt-1.5 text-sm text-[#5A6D62] max-w-md mx-auto">
            Log your first Christmas gift to see per-recipient budget progress and spending insights.
          </p>
          <button
            type="button"
            onClick={onOpenAddGift}
            className="mt-5 inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl bg-[#C61D2B] hover:bg-[#A61723] text-sm font-semibold text-white transition-colors"
          >
            Log First Gift
          </button>
        </div>
      ) : scopedGifts.length === 0 && excludePurchased ? (
        <div className="rounded-2xl bg-white border border-[#CBEAD7] p-8 sm:p-10 text-center shadow-xs">
          <div className="mx-auto mb-3 inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#157A4B] text-white">
            <Check className="w-6 h-6 stroke-[2.75]" aria-hidden="true" />
          </div>
          <h2 className="font-serif text-xl font-bold text-[#1D2B24]">
            All wrapped up! Every gift is bought
          </h2>
          <p className="mt-1.5 text-sm text-[#5A6D62] max-w-md mx-auto tabular-nums">
            All {gifts.length} gifts ({formatCurrency(allTotalEstimated)}) have been ticked off your list.
          </p>
          <button
            type="button"
            onClick={() => setExcludePurchased(false)}
            className="mt-5 inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl bg-[#157A4B] hover:bg-[#10623B] text-sm font-semibold text-white transition-colors"
          >
            Show All Gifts
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left: Per-Recipient Budget & Spend Breakdown */}
          <section className="lg:col-span-7 rounded-2xl bg-white border border-[#F0DFC8] shadow-xs overflow-hidden">
            <div className="px-5 sm:px-6 py-4 bg-[#FFF6EC] border-b border-[#F3E5D3] flex items-baseline justify-between gap-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#1D2B24]">
                  {excludePurchased ? 'Unpurchased Spend by Recipient' : 'Budget vs Spend by Recipient'}
                </h2>
                <p className="mt-0.5 text-xs text-[#7A6855]">
                  Progress bar tracks each person against their individual budget.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#5A6D62] tabular-nums shrink-0">
                {recipientBreakdown.length} {recipientBreakdown.length === 1 ? 'person' : 'people'}
              </span>
            </div>

            <div className="px-5 sm:px-6 divide-y divide-[#F4E9DA]">
              {recipientBreakdown.map(
                ({
                  recipient,
                  seal,
                  giftCount,
                  purchasedCount,
                  total,
                  personRemaining,
                  isPersonOver,
                  budgetPercent,
                  color,
                }) => {
                  return (
                    <button
                      key={recipient.id}
                      type="button"
                      onClick={() => onSelectRecipient(recipient.id)}
                      className="w-full text-left py-4 group focus-visible:outline-2 focus-visible:outline-[#157A4B] rounded-lg"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <RecipientBauble name={recipient.name} bg={seal.bg} text={seal.text} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[15px] font-semibold text-[#1D2B24] group-hover:text-[#C61D2B] transition-colors truncate">
                                {recipient.name}
                              </span>
                              {recipient.note && (
                                <span className="text-xs text-[#84725F] truncate hidden sm:inline">
                                  · {recipient.note}
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-[#6B7A71] tabular-nums">
                              {excludePurchased
                                ? `${giftCount} left to buy · Budget ${formatCurrency(recipient.budget)}`
                                : isPersonOver
                                  ? `${giftCount} ${giftCount === 1 ? 'gift' : 'gifts'} · Over by ${formatCurrency(Math.abs(personRemaining))}`
                                  : `${giftCount} ${giftCount === 1 ? 'gift' : 'gifts'} · ${purchasedCount} bought · ${formatCurrency(personRemaining)} left`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 text-right">
                          <div className="tabular-nums">
                            <span
                              className={`block text-[15px] font-semibold ${
                                !excludePurchased && isPersonOver ? 'text-[#C61D2B]' : 'text-[#1D2B24]'
                              }`}
                            >
                              {formatCurrency(total)}
                            </span>
                            <span className="block text-[11px] text-[#84725F]">
                              of {formatCurrency(recipient.budget)}
                            </span>
                          </div>
                          <ChevronRight
                            className="w-4 h-4 text-[#B09D87] group-hover:text-[#C61D2B] transition-transform group-hover:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </div>
                      </div>

                      <div className="mt-2.5 h-2.5 w-full rounded-full bg-[#F5ECDF] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${total > 0 ? Math.max(budgetPercent, 4) : 0}%`,
                            backgroundColor: !excludePurchased && isPersonOver ? '#C61D2B' : color,
                          }}
                        />
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </section>

          {/* Right: Budget Allocation Donut + Key Insights */}
          <div className="lg:col-span-5 space-y-6">
            <section className="rounded-2xl bg-white border border-[#F0DFC8] p-5 sm:p-6 shadow-xs">
              <h2 className="font-serif text-lg font-bold text-[#1D2B24]">
                {excludePurchased ? 'Remaining Spend Share' : 'Combined Budget Share'}
              </h2>
              <p className="mt-0.5 text-xs text-[#7A6855]">
                {excludePurchased
                  ? `Breakdown of ${formatCurrency(scopedTotal)} still to buy.`
                  : `Share of your ${formatCurrency(totalBudget)} combined recipient budgets.`}
              </p>

              <div className="mt-5 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-6">
                <div className="relative w-40 h-40 shrink-0">
                  <svg
                    viewBox="0 0 160 160"
                    className="w-full h-full -rotate-90"
                    role="img"
                    aria-label="Christmas spending breakdown donut chart"
                  >
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="none"
                      stroke="#F5ECDF"
                      strokeWidth="16"
                    />
                    {donutSegments.map((seg) => (
                      <circle
                        key={seg.id}
                        cx="80"
                        cy="80"
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="16"
                        strokeDasharray={`${seg.length} ${circumference}`}
                        strokeDashoffset={seg.offset}
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                    <span className="text-[11px] font-medium text-[#7A6855]">
                      {excludePurchased ? 'To buy' : isOverBudget ? 'Over' : 'Used'}
                    </span>
                    <span
                      className={`font-serif text-xl font-bold tabular-nums ${
                        !excludePurchased && isOverBudget ? 'text-[#C61D2B]' : 'text-[#1D2B24]'
                      }`}
                    >
                      {excludePurchased
                        ? formatCurrencySmart(scopedTotal)
                        : totalBudget > 0
                          ? `${scopedPercentOfBudget}%`
                          : formatCurrencySmart(scopedTotal)}
                    </span>
                  </div>
                </div>

                <div className="flex-1 w-full space-y-2">
                  {donutSegments.slice(0, 6).map((seg) => (
                    <div key={seg.id} className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-xs shrink-0"
                          style={{ backgroundColor: seg.color }}
                          aria-hidden="true"
                        />
                        <span className="text-[#2B3B33] font-medium truncate">{seg.label}</span>
                      </div>
                      <span className="text-[#5A6D62] font-semibold tabular-nums shrink-0">
                        {formatCurrency(seg.value)}
                      </span>
                    </div>
                  ))}
                  {!excludePurchased && !isOverBudget && overallRemaining > 0 && (
                    <div className="flex items-center justify-between gap-2 text-xs pt-1.5 border-t border-[#F4E9DA]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-xs bg-[#F5ECDF] border border-[#E2D0B8] shrink-0"
                          aria-hidden="true"
                        />
                        <span className="text-[#7A6855] truncate">Unspent budget</span>
                      </div>
                      <span className="text-[#157A4B] font-semibold tabular-nums shrink-0">
                        {formatCurrency(overallRemaining)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Quick Expense Insights */}
            <section className="rounded-2xl bg-white border border-[#F0DFC8] p-5 sm:p-6 shadow-xs">
              <h2 className="font-serif text-lg font-bold text-[#1D2B24] pb-3 border-b border-[#F4E9DA]">
                {excludePurchased ? 'Remaining Insights' : 'Quick Insights'}
              </h2>
              <dl className="divide-y divide-[#F4E9DA] text-sm">
                <div className="py-3 flex items-center justify-between gap-4">
                  <dt className="text-[#5A6D62]">Average per gift</dt>
                  <dd className="font-semibold text-[#1D2B24] tabular-nums">
                    {formatCurrency(averageGift)}
                  </dd>
                </div>
                <div className="py-3 flex items-center justify-between gap-4">
                  <dt className="text-[#5A6D62]">Average per recipient</dt>
                  <dd className="font-semibold text-[#1D2B24] tabular-nums">
                    {formatCurrency(averagePerRecipient)}
                  </dd>
                </div>
                {largestGift && (
                  <div className="py-3 flex items-start justify-between gap-4">
                    <dt className="text-[#5A6D62]">
                      {excludePurchased ? 'Largest unpurchased gift' : 'Largest gift'}
                      <span className="block text-xs text-[#84725F] mt-0.5">
                        {largestGift.description} · {largestGiftRecipient}
                      </span>
                    </dt>
                    <dd className="font-semibold text-[#1D2B24] tabular-nums shrink-0">
                      {formatCurrency(largestGift.estimatedCost)}
                    </dd>
                  </div>
                )}
                <div className="pt-3 flex items-center justify-between gap-4">
                  <dt className="text-[#5A6D62]">Shopping progress</dt>
                  <dd className="font-semibold text-[#157A4B] tabular-nums">
                    {gifts.length > 0
                      ? `${Math.round((purchasedGifts.length / gifts.length) * 100)}% bought`
                      : '0%'}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        </div>
      )}

      {/* Offline Storage & List Actions */}
      <section className="rounded-2xl bg-white border border-[#F0DFC8] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h3 className="text-sm font-semibold text-[#1D2B24]">Free, Offline &amp; Private</h3>
          <p className="mt-0.5 text-xs text-[#7A6855]">
            Free to use with no account required. All recipient budgets and gifts save privately in local storage on your device.
          </p>
        </div>

        {pendingAction ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#C61D2B]">
              {pendingAction === 'clear-all' ? 'Remove all gifts?' : 'Restore sample UK list?'}
            </span>
            <button
              type="button"
              onClick={() => {
                if (pendingAction === 'clear-all') onClearAllGifts();
                else onResetSampleData();
                setPendingAction(null);
              }}
              className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#C61D2B] text-white text-xs font-semibold hover:bg-[#A61723] transition-colors whitespace-nowrap"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={() => setPendingAction(null)}
              className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-[#E5D3BC] text-[#47564E] text-xs font-medium hover:bg-[#FFF6EC] transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <PWAInstallButton variant="compact" />
            <button
              type="button"
              onClick={handleShareApp}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5D3BC] text-xs font-semibold text-[#157A4B] hover:bg-[#F3FBF6] transition-colors whitespace-nowrap"
            >
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{shareFeedback ?? 'Share App'}</span>
            </button>
            {purchasedGifts.length > 0 && (
              <button
                type="button"
                onClick={onClearBoughtGifts}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5D3BC] text-xs font-semibold text-[#47564E] hover:bg-[#FFF6EC] transition-colors whitespace-nowrap"
              >
                Clear Bought ({purchasedGifts.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setPendingAction('reset-sample')}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E5D3BC] text-xs font-semibold text-[#47564E] hover:bg-[#FFF6EC] transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Load Sample</span>
            </button>
            {gifts.length > 0 && (
              <button
                type="button"
                onClick={() => setPendingAction('clear-all')}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl border border-[#F2C6C9] text-xs font-semibold text-[#C61D2B] hover:bg-[#C61D2B]/8 transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Clear List</span>
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
