import React, { useState } from 'react';
import { AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { formatCurrency, getChristmasCountdownLabel } from '../storage';

interface BudgetHeaderCardProps {
  totalBudget: number;
  totalEstimated: number;
  totalBought: number;
  giftCount: number;
  boughtCount: number;
  recipientCount: number;
  overBudgetRecipientsCount: number;
  onManageBudgets: () => void;
  compact?: boolean;
}

const JOLLY_BANNER_PATH = `${import.meta.env.BASE_URL}src/assets/images/jolly_christmas_banner_1795244022918.jpg`;

export const BudgetHeaderCard: React.FC<BudgetHeaderCardProps> = ({
  totalBudget,
  totalEstimated,
  totalBought,
  giftCount,
  boughtCount,
  recipientCount,
  overBudgetRecipientsCount,
  onManageBudgets,
  compact = false,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const remaining = totalBudget - totalEstimated;
  const isOverBudget = remaining < 0;
  const estimatedPercent =
    totalBudget > 0 ? Math.min((totalEstimated / totalBudget) * 100, 100) : totalEstimated > 0 ? 100 : 0;
  const boughtPercent = totalBudget > 0 ? Math.min((totalBought / totalBudget) * 100, 100) : 0;
  const rawPercent = totalBudget > 0 ? Math.round((totalEstimated / totalBudget) * 100) : 0;
  const countdownLabel = getChristmasCountdownLabel();

  return (
    <section
      aria-label="Christmas budget overview"
      className="relative overflow-hidden rounded-3xl bg-[#B81624] text-white shadow-lg shadow-[#B81624]/15 border border-[#F0D5B2]"
    >
      {/* Cheerful candy-cane diagonal trim */}
      <div className="relative z-20 h-2 w-full candy-cane-trim" aria-hidden="true" />

      {/* Vibrant British storybook Christmas illustration frame */}
      {!imgFailed ? (
        <img
          src={JOLLY_BANNER_PATH}
          alt="Festive Christmas robins, candy canes, wooden sleigh with wrapped presents, gingerbread stars, and glowing fairy lights"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none select-none"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-[#C81E2B] via-[#A61723] to-[#8F121D] pointer-events-none"
        />
      )}

      {/* Inner framed Santa-red card letting the cheerful border art shine around all edges */}
      <div className={`relative z-10 ${compact ? 'p-3.5 sm:p-4' : 'p-4 sm:p-5'}`}>
        <div className="rounded-2xl bg-[#AE1422]/92 backdrop-blur-[2px] border border-[#FFE082]/45 p-4 sm:p-5 shadow-md">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#FFE082] tracking-wide">
                {countdownLabel}
              </p>
              <div className="mt-1.5 flex items-baseline gap-2 flex-wrap">
                <span className="font-serif text-3xl sm:text-[38px] leading-none font-bold tracking-tight text-white tabular-nums">
                  {formatCurrency(totalEstimated)}
                </span>
                <span className="text-sm text-[#FFE9EA] tabular-nums">
                  of {formatCurrency(totalBudget)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onManageBudgets}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F8C537] hover:bg-[#FFD154] active:scale-[0.98] text-xs font-bold text-[#143D29] shadow-xs transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Budgets</span>
            </button>
          </div>

          {/* Festive Progress Bar */}
          <div className="mt-4">
            <div
              className="relative h-3.5 w-full overflow-hidden rounded-full bg-black/25 ring-1 ring-inset ring-white/20"
              role="progressbar"
              aria-valuenow={Math.round(estimatedPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Combined budget used: ${rawPercent}%`}
            >
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-300 ${
                  isOverBudget
                    ? 'bg-gradient-to-r from-[#FF9900] to-[#FFE066]'
                    : 'bg-gradient-to-r from-[#F4B41A] to-[#FFE07D]'
                }`}
                style={{ width: `${estimatedPercent}%` }}
              />
              {boughtPercent > 0 && !isOverBudget && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[#3AD17F] transition-all duration-300"
                  style={{ width: `${boughtPercent}%` }}
                />
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
              {isOverBudget ? (
                <p className="inline-flex items-center gap-1.5 font-semibold text-[#FFE082] tabular-nums">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Over combined budget by {formatCurrency(Math.abs(remaining))}</span>
                </p>
              ) : overBudgetRecipientsCount > 0 ? (
                <p className="inline-flex items-center gap-1.5 font-semibold text-[#FFE082] tabular-nums">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {formatCurrency(remaining)} left · {overBudgetRecipientsCount}{' '}
                    {overBudgetRecipientsCount === 1 ? 'person' : 'people'} over
                  </span>
                </p>
              ) : (
                <p className="font-medium text-[#FFF2D1] tabular-nums">
                  Remaining:{' '}
                  <span className="font-bold text-white">{formatCurrency(remaining)}</span>
                </p>
              )}

              <p className="text-[#FFE4E6] font-medium tabular-nums">
                {totalBudget > 0 ? `${rawPercent}% used` : 'Set budgets'}
              </p>
            </div>
          </div>

          {/* Clean unboxed summary footer line */}
          <div className="mt-3.5 pt-3 border-t border-white/20 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#FFE8EA] tabular-nums">
            <span>
              {recipientCount} {recipientCount === 1 ? 'recipient' : 'recipients'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {giftCount} {giftCount === 1 ? 'gift' : 'gifts'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#FFE082] font-semibold">
              {boughtCount} bought ({formatCurrency(totalBought)})
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
