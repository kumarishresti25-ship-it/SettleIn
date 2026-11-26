import React, { useState } from 'react';
import { AlertTriangle, Info, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { CURRENCY_CONFIG } from '../data/cities';
import {
  ExpenseBreakdown,
  OnboardingProfile,
  OneTimeSetupCost,
  ScoredAccommodation,
  calculateExpenseSummary,
  formatCurrency,
} from '../utils/relocationEngine';

interface BudgetViewProps {
  profile: OnboardingProfile;
  expenses: ExpenseBreakdown;
  setupCosts: OneTimeSetupCost[];
  savedProperties: ScoredAccommodation[];
  onUpdateExpense: (key: keyof ExpenseBreakdown, value: number) => void;
  onUpdateSetupCost: (id: string, value: number) => void;
  onAddSetupCost: (
    label: string,
    amount: number,
    category: OneTimeSetupCost['category']
  ) => void;
  onDeleteSetupCost: (id: string) => void;
  onApplyPropertyToBudget: (listing: ScoredAccommodation) => void;
  onResetExpenses: () => void;
}

const EXPENSE_FIELDS: {
  key: keyof ExpenseBreakdown;
  label: string;
  hint: string;
  color: string;
}[] = [
  {
    key: 'rent',
    label: 'Monthly rent',
    hint: 'PG, shared flat room, or private studio',
    color: 'bg-teal-700',
  },
  {
    key: 'food',
    label: 'Food & groceries',
    hint: 'Tiffin/mess, supermarket runs, and dining',
    color: 'bg-slate-700',
  },
  {
    key: 'transport',
    label: 'Transport & commute',
    hint: 'Metro card, bus pass, auto/cab rides',
    color: 'bg-amber-600',
  },
  {
    key: 'utilities',
    label: 'Utilities & Wi-Fi',
    hint: 'Electricity, water, broadband, cooking gas',
    color: 'bg-slate-500',
  },
  {
    key: 'personal',
    label: 'Personal & misc',
    hint: 'Mobile recharge, laundry, toiletries, buffer',
    color: 'bg-slate-300',
  },
];

export const BudgetView: React.FC<BudgetViewProps> = ({
  profile,
  expenses,
  setupCosts,
  savedProperties,
  onUpdateExpense,
  onUpdateSetupCost,
  onAddSetupCost,
  onDeleteSetupCost,
  onApplyPropertyToBudget,
  onResetExpenses,
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] =
    useState<OneTimeSetupCost['category']>('Setup');
  const [formError, setFormError] = useState('');

  const summary = calculateExpenseSummary(profile, expenses);
  const symbol = CURRENCY_CONFIG[profile.currency].symbol;
  const setupTotal = setupCosts.reduce((sum, item) => sum + item.amount, 0);
  const depositTotal = setupCosts
    .filter((c) => c.category === 'Deposit')
    .reduce((sum, c) => sum + c.amount, 0);
  const travelAndSetupTotal = setupTotal - depositTotal;
  const firstMonthCashNeeded = setupTotal + summary.totalEstimated;
  const barBase = Math.max(1, summary.totalEstimated, profile.totalMonthlyBudget);
  const showWarning =
    summary.totalExceededBy > 0 ||
    summary.rentExceededBy > 0 ||
    summary.status === 'tight';

  const handleAddOneTime = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(newAmount);
    if (!newLabel.trim()) {
      setFormError('Enter an expense name.');
      return;
    }
    if (!Number.isFinite(num) || num <= 0) {
      setFormError('Enter a valid positive amount.');
      return;
    }
    onAddSetupCost(newLabel.trim(), Math.round(num), newCategory);
    setNewLabel('');
    setNewAmount('');
    setFormError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 tabular-nums">
            Monthly ceiling {formatCurrency(profile.totalMonthlyBudget, profile.currency)}
            <span aria-hidden="true"> · </span>
            Housing target {formatCurrency(profile.accommodationBudget, profile.currency)}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Budget planner
          </h1>
        </div>

        <button
          type="button"
          onClick={onResetExpenses}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to city estimate</span>
        </button>
      </div>

      {/* Illustrative Notice & Saved Property Sync */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            Illustrative city cost baselines synced to your onboarding plan. Edit any row below to reflect your actual lease and travel quotes.
          </p>
        </div>

        {savedProperties.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 min-w-0 w-full sm:w-auto">
            <label htmlFor="sync-saved-prop" className="text-slate-500 whitespace-nowrap">
              Apply saved property:
            </label>
            <select
              id="sync-saved-prop"
              defaultValue=""
              onChange={(e) => {
                const chosen = savedProperties.find((p) => p.id === e.target.value);
                if (chosen) onApplyPropertyToBudget(chosen);
              }}
              className="w-full sm:w-56 max-w-full min-w-0 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
            >
              <option value="" disabled>
                Choose property...
              </option>
              {savedProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({formatCurrency(p.monthlyRent, profile.currency)}/mo)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Budget Exceedance & Margin Warning */}
      {showWarning && (
        <div
          role="alert"
          data-testid="budget-warning-banner"
          className={`rounded-xl border px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            summary.totalExceededBy > 0
              ? 'bg-red-50 border-red-200 text-red-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                summary.totalExceededBy > 0 ? 'text-red-700' : 'text-amber-700'
              }`}
              aria-hidden="true"
            />
            <div className="text-xs sm:text-sm space-y-1">
              {summary.totalExceededBy > 0 ? (
                <>
                  <p className="font-semibold">
                    Estimated monthly expenses exceed your{' '}
                    {formatCurrency(profile.totalMonthlyBudget, profile.currency)}/mo budget by{' '}
                    {formatCurrency(summary.totalExceededBy, profile.currency)}
                  </p>
                  <p className="text-xs opacity-90">
                    Your monthly living costs ({formatCurrency(summary.totalEstimated, profile.currency)}/mo) are above your target ceiling.
                    {summary.rentExceededBy > 0
                      ? ` Monthly rent alone is ${formatCurrency(summary.rentExceededBy, profile.currency)} over your housing cap—try comparing shared rooms or PGs to bring costs back in range.`
                      : ' Lower rent, choose a shared flat/PG, or trim personal and food estimates to restore a safe monthly buffer.'}
                  </p>
                </>
              ) : summary.rentExceededBy > 0 ? (
                <>
                  <p className="font-semibold">
                    Monthly rent exceeds your{' '}
                    {formatCurrency(profile.accommodationBudget, profile.currency)}/mo housing cap by{' '}
                    {formatCurrency(summary.rentExceededBy, profile.currency)}
                  </p>
                  <p className="text-xs opacity-90">
                    Total spending still fits your monthly ceiling, though higher rent reduces flexibility for food, utilities, and emergencies.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold">
                    Tight monthly margin ({formatCurrency(summary.remainingBuffer, profile.currency)} buffer left)
                  </p>
                  <p className="text-xs opacity-90">
                    Less than 8% of your monthly budget remains unallocated for unexpected bills or price changes.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
            {summary.rentExceededBy > 0 && (
              <button
                type="button"
                onClick={() => onUpdateExpense('rent', profile.accommodationBudget)}
                className="px-3 py-1.5 rounded-lg border border-current/20 bg-white/80 text-xs font-medium hover:bg-white transition-colors whitespace-nowrap"
              >
                Cap rent at {formatCurrency(profile.accommodationBudget, profile.currency)}
              </button>
            )}
            {summary.totalExceededBy > 0 && (
              <button
                type="button"
                onClick={onResetExpenses}
                className="px-3 py-1.5 rounded-lg border border-current/20 bg-white/80 text-xs font-medium hover:bg-white transition-colors whitespace-nowrap"
              >
                Reset estimates
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Budget Summary Strip: Before Moving vs Every Month */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <p className="text-xs font-medium text-slate-500">
            Needed before moving
          </p>
          <p
            className="mt-1.5 font-display text-2xl font-semibold text-slate-900 tabular-nums"
            data-testid="budget-onetime-total"
          >
            {formatCurrency(setupTotal, profile.currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {formatCurrency(depositTotal, profile.currency)} deposits · {formatCurrency(travelAndSetupTotal, profile.currency)} travel &amp; setup
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <p className="text-xs font-medium text-slate-500">
            Needed every month
          </p>
          <p
            className="mt-1.5 font-display text-2xl font-semibold text-slate-900 tabular-nums"
            data-testid="budget-monthly-total"
          >
            {formatCurrency(summary.totalEstimated, profile.currency)}
          </p>
          <p
            className={`mt-1 text-xs font-medium tabular-nums ${
              summary.status === 'over'
                ? 'text-red-700'
                : summary.status === 'tight'
                  ? 'text-amber-700'
                  : 'text-green-700'
            }`}
          >
            {summary.remainingBuffer >= 0
              ? `${formatCurrency(summary.remainingBuffer, profile.currency)} under your ${formatCurrency(profile.totalMonthlyBudget, profile.currency)} cap`
              : `${formatCurrency(Math.abs(summary.remainingBuffer), profile.currency)} over your ${formatCurrency(profile.totalMonthlyBudget, profile.currency)} cap`}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <p className="text-xs font-medium text-slate-500">
            Total Month-1 cash required
          </p>
          <p className="mt-1.5 font-display text-2xl font-semibold text-teal-700 tabular-nums">
            {formatCurrency(firstMonthCashNeeded, profile.currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Before-moving cash + Month 1 living costs
          </p>
        </div>
      </div>

      {/* Two Separated Budget Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Section 1: Needed Before Moving (One-Time) */}
        <section
          className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden"
          aria-labelledby="budget-upfront-heading"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div>
              <h2
                id="budget-upfront-heading"
                className="font-display text-base font-semibold text-slate-900"
              >
                Needed before moving (one-time)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Security deposits, travel &amp; move-in setup
              </p>
            </div>
            <p className="font-mono text-base font-semibold text-slate-900 tabular-nums">
              {formatCurrency(setupTotal, profile.currency)}
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {setupCosts.map((cost) => (
              <div
                key={cost.id}
                className="px-6 py-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`setup-${cost.id}`}
                    className="block text-sm font-medium text-slate-900"
                  >
                    {cost.label}
                  </label>
                  <span className="text-xs text-slate-500">{cost.category}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="relative w-28 sm:w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                      {symbol}
                    </span>
                    <input
                      id={`setup-${cost.id}`}
                      type="number"
                      min={0}
                      value={cost.amount}
                      onChange={(e) =>
                        onUpdateSetupCost(
                          cost.id,
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      }
                      className="w-full pl-7 pr-2.5 py-2 rounded-lg border border-slate-200 text-sm font-mono text-slate-900 text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                    />
                  </div>
                  {cost.custom && (
                    <button
                      type="button"
                      onClick={() => onDeleteSetupCost(cost.id)}
                      aria-label={`Delete ${cost.label}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Custom One-Time Cost */}
          <form
            onSubmit={handleAddOneTime}
            noValidate
            className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl space-y-2.5"
          >
            <p className="text-xs font-medium text-slate-700">
              Add one-time expense
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-4">
                <label htmlFor="new-onetime-label" className="sr-only">
                  Expense name
                </label>
                <input
                  id="new-onetime-label"
                  type="text"
                  value={newLabel}
                  onChange={(e) => {
                    setNewLabel(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="Item (e.g. Flight)"
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="new-onetime-cat" className="sr-only">
                  Category
                </label>
                <select
                  id="new-onetime-cat"
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(e.target.value as OneTimeSetupCost['category'])
                  }
                  className="w-full px-2 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-900"
                >
                  <option value="Deposit">Deposit</option>
                  <option value="Travel">Travel</option>
                  <option value="Setup">Setup</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="new-onetime-amount" className="sr-only">
                  Amount
                </label>
                <input
                  id="new-onetime-amount"
                  type="number"
                  min={1}
                  value={newAmount}
                  onChange={(e) => {
                    setNewAmount(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="Amount"
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-mono text-slate-900 tabular-nums"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  aria-label="Add one-time expense"
                  className="w-full inline-flex items-center justify-center px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {formError && (
              <p className="text-xs text-red-600" role="alert">
                {formError}
              </p>
            )}
          </form>
        </section>

        {/* Section 2: Monthly Recurring Expenses */}
        <section
          className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden"
          aria-labelledby="budget-monthly-heading"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div>
              <h2
                id="budget-monthly-heading"
                className="font-display text-base font-semibold text-slate-900"
              >
                Needed every month (recurring)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rent, food, transport, utilities, and personal spending
              </p>
            </div>
            <div className="text-right tabular-nums">
              <p className="font-mono text-base font-semibold text-slate-900">
                {formatCurrency(summary.totalEstimated, profile.currency)}
              </p>
              <p
                className={`text-xs font-medium ${
                  summary.status === 'over'
                    ? 'text-red-700'
                    : summary.status === 'tight'
                      ? 'text-amber-700'
                      : 'text-green-700'
                }`}
              >
                {summary.remainingBuffer >= 0
                  ? `${formatCurrency(summary.remainingBuffer, profile.currency)} under cap`
                  : `${formatCurrency(Math.abs(summary.remainingBuffer), profile.currency)} over cap`}
              </p>
            </div>
          </div>

          <div className="px-6 pt-5 pb-2">
            <div
              className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex"
              aria-hidden="true"
            >
              {EXPENSE_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className={`${field.color} h-full transition-all duration-200`}
                  style={{
                    width: `${Math.min(100, (expenses[field.key] / barBase) * 100)}%`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {EXPENSE_FIELDS.map((field) => {
              const val = expenses[field.key];
              const pct =
                summary.totalEstimated > 0
                  ? Math.round((val / summary.totalEstimated) * 100)
                  : 0;
              return (
                <div
                  key={field.key}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-sm shrink-0 ${field.color}`}
                        aria-hidden="true"
                      />
                      <label
                        htmlFor={`expense-${field.key}`}
                        className="text-sm font-medium text-slate-900"
                      >
                        {field.label}
                      </label>
                      <span className="text-xs text-slate-400 tabular-nums">
                        {pct}%
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500 pl-4.5">
                      {field.hint}
                    </p>
                  </div>

                  <div className="relative w-full sm:w-36 shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                      {symbol}
                    </span>
                    <input
                      id={`expense-${field.key}`}
                      type="number"
                      min={0}
                      value={val}
                      onChange={(e) =>
                        onUpdateExpense(
                          field.key,
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      }
                      className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 text-sm font-mono text-slate-900 text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
