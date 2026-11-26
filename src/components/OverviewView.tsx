import React from 'react';
import { ArrowRight, Check, SlidersHorizontal } from 'lucide-react';
import {
  ExpenseBreakdown,
  OnboardingProfile,
  OneTimeSetupCost,
  PHASE_DISPLAY_NAMES,
  RelocationTask,
  TaskPhase,
  calculateCountdown,
  calculateExpenseSummary,
  calculateProgress,
  formatCurrency,
  getNextRecommendedAction,
} from '../utils/relocationEngine';

export type DashboardTab = 'home' | 'explore' | 'stay' | 'budget' | 'checklist';

interface OverviewViewProps {
  profile: OnboardingProfile;
  tasks: RelocationTask[];
  expenses: ExpenseBreakdown;
  setupCosts: OneTimeSetupCost[];
  onToggleTask: (id: string) => void;
  onNavigate: (
    tab: DashboardTab,
    options?: TaskPhase | { phaseFilter?: TaskPhase; accommodationFilter?: 'all' | 'saved' }
  ) => void;
  onOpenMovePlan: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  profile,
  tasks,
  expenses,
  setupCosts,
  onToggleTask,
  onNavigate,
  onOpenMovePlan,
}) => {
  const countdown = calculateCountdown(profile.movingDate);
  const progress = calculateProgress(tasks);
  const nextAction = getNextRecommendedAction(profile, tasks);
  const expenseSummary = calculateExpenseSummary(profile, expenses);
  const oneTimeTotal = setupCosts.reduce((sum, c) => sum + c.amount, 0);
  const firstMonthCash = oneTimeTotal + expenseSummary.totalEstimated;

  const expenseRows: {
    key: keyof ExpenseBreakdown;
    label: string;
    amount: number;
    color: string;
  }[] = [
    { key: 'rent', label: 'Monthly rent', amount: expenses.rent, color: 'bg-teal-700' },
    { key: 'food', label: 'Food & groceries', amount: expenses.food, color: 'bg-slate-700' },
    { key: 'utilities', label: 'Utilities & Wi-Fi', amount: expenses.utilities, color: 'bg-slate-500' },
    { key: 'transport', label: 'Transport', amount: expenses.transport, color: 'bg-amber-600' },
    { key: 'personal', label: 'Personal & misc', amount: expenses.personal, color: 'bg-slate-300' },
  ];

  const totalBarBase = Math.max(
    1,
    expenseSummary.totalEstimated,
    profile.totalMonthlyBudget
  );

  return (
    <div className="space-y-6">
      {/* Clean Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {profile.role === 'student' ? 'Student move plan' : 'Graduate move plan'}
            <span aria-hidden="true"> · </span>
            {profile.anchorLocation}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 text-balance">
            Moving to {profile.destinationCity}
          </h1>
        </div>
        <button
          type="button"
          onClick={onOpenMovePlan}
          className="hidden lg:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span>Edit move plan</span>
        </button>
      </div>

      {/* 1. Moving Countdown + 2. Relocation Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section
          className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4"
          aria-labelledby="home-countdown-heading"
        >
          <div>
            <h2
              id="home-countdown-heading"
              className="text-xs font-medium text-slate-500"
            >
              Moving countdown
            </h2>
            <p
              className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900 tabular-nums"
              data-testid="kpi-countdown"
            >
              {countdown.headline}
            </p>
          </div>
          <p className="text-xs text-slate-500 tabular-nums">
            {countdown.sublabel}
            <span aria-hidden="true"> · </span>
            Max {profile.preferredCommuteMinutes} min commute
          </p>
        </section>

        <section
          className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-4"
          aria-labelledby="home-progress-heading"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2
                id="home-progress-heading"
                className="text-xs font-medium text-slate-500"
              >
                Relocation progress
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('checklist')}
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap"
              >
                <span>Open checklist</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-2 flex items-baseline justify-between gap-3">
              <p
                className="font-display text-3xl font-semibold tracking-tight text-slate-900 tabular-nums"
                data-testid="kpi-progress"
              >
                {progress.percentage}%
              </p>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {progress.completed} of {progress.total} tasks done
              </span>
            </div>

            <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-teal-700 transition-all duration-200"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 tabular-nums">
            {(['pre-move', 'arrival-week', 'first-month'] as TaskPhase[]).map(
              (phase, index) => {
                const counts = progress.byPhase[phase];
                return (
                  <span key={phase}>
                    {index > 0 && <span aria-hidden="true"> · </span>}
                    {PHASE_DISPLAY_NAMES[phase]} {counts.completed}/{counts.total}
                  </span>
                );
              }
            )}
          </p>
        </section>
      </div>

      {/* 3. What Should I Do Next? */}
      <section
        className="bg-white border border-slate-200 rounded-2xl p-6"
        aria-labelledby="overview-next-heading"
        data-testid="overview-next-action"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-teal-700">
              What should I do next? · {nextAction.timingContext}
            </p>
            {nextAction.task ? (
              <>
                <h2
                  id="overview-next-heading"
                  className="mt-1.5 font-display text-lg font-semibold text-slate-900"
                >
                  {nextAction.task.title}
                </h2>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed max-w-2xl">
                  {nextAction.reason}
                </p>
                <p className="mt-2.5 text-xs text-slate-500">
                  {nextAction.phaseLabel}
                  <span aria-hidden="true"> · </span>
                  {nextAction.task.category}
                </p>
              </>
            ) : (
              <>
                <h2
                  id="overview-next-heading"
                  className="mt-1.5 font-display text-lg font-semibold text-slate-900"
                >
                  All relocation milestones complete
                </h2>
                <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
                  {nextAction.reason}
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {nextAction.task && (
              <button
                type="button"
                onClick={() => onToggleTask(nextAction.task!.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-700 text-white text-xs sm:text-sm font-medium hover:bg-teal-800 transition-colors whitespace-nowrap"
              >
                <Check className="w-4 h-4" />
                <span>Mark done</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigate('checklist')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <span>View checklist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Budget Overview */}
      <section
        className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
        aria-labelledby="heading-expenses"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h2
              id="heading-expenses"
              className="font-display text-base font-semibold text-slate-900"
            >
              Budget overview
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              Monthly cap {formatCurrency(profile.totalMonthlyBudget, profile.currency)}
              <span aria-hidden="true"> · </span>
              Housing target {formatCurrency(profile.accommodationBudget, profile.currency)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('budget')}
            className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-800 whitespace-nowrap shrink-0"
          >
            <span>Manage budget</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {(expenseSummary.totalExceededBy > 0 || expenseSummary.rentExceededBy > 0) && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-900"
            >
              {expenseSummary.totalExceededBy > 0 ? (
                <>
                  Monthly estimate exceeds your{' '}
                  {formatCurrency(profile.totalMonthlyBudget, profile.currency)} cap by{' '}
                  <span className="font-mono font-semibold">
                    {formatCurrency(expenseSummary.totalExceededBy, profile.currency)}
                  </span>
                  .
                </>
              ) : (
                <>
                  Estimated monthly rent exceeds your{' '}
                  {formatCurrency(profile.accommodationBudget, profile.currency)} housing target by{' '}
                  <span className="font-mono font-semibold">
                    {formatCurrency(expenseSummary.rentExceededBy, profile.currency)}
                  </span>
                  .
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left: Monthly Recurring Summary */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500">Needed every month</p>
                  <p
                    className="mt-1 font-display text-2xl font-semibold text-slate-900 tabular-nums"
                    data-testid="overview-expense-total"
                  >
                    {formatCurrency(expenseSummary.totalEstimated, profile.currency)}
                    <span className="text-sm font-normal text-slate-500">/mo</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Monthly buffer</p>
                  <p
                    className={`mt-1 font-mono text-sm font-semibold tabular-nums ${
                      expenseSummary.status === 'over'
                        ? 'text-red-700'
                        : expenseSummary.status === 'tight'
                          ? 'text-amber-700'
                          : 'text-green-700'
                    }`}
                  >
                    {expenseSummary.remainingBuffer >= 0 ? '+' : ''}
                    {formatCurrency(expenseSummary.remainingBuffer, profile.currency)}
                  </p>
                </div>
              </div>

              <div
                className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex"
                aria-hidden="true"
              >
                {expenseRows.map((row) => (
                  <div
                    key={row.key}
                    className={`${row.color} h-full transition-all duration-200`}
                    style={{
                      width: `${Math.min(100, (row.amount / totalBarBase) * 100)}%`,
                    }}
                  />
                ))}
              </div>

              <dl className="divide-y divide-slate-100 text-sm">
                {expenseRows.map((row) => (
                  <div
                    key={row.key}
                    className="py-2.5 flex items-center justify-between gap-4"
                  >
                    <dt className="flex items-center gap-2.5 text-slate-600">
                      <span
                        className={`w-2.5 h-2.5 rounded-sm shrink-0 ${row.color}`}
                        aria-hidden="true"
                      />
                      <span>{row.label}</span>
                    </dt>
                    <dd className="font-mono text-sm font-medium text-slate-900 tabular-nums">
                      {formatCurrency(row.amount, profile.currency)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Right: Before Moving & Month-1 Cash Overview */}
            <div className="lg:col-span-5 lg:border-l lg:border-slate-100 lg:pl-8 flex flex-col justify-between gap-5 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500">
                    Needed before moving (one-time)
                  </p>
                  <p className="mt-1 font-display text-2xl font-semibold text-slate-900 tabular-nums">
                    {formatCurrency(oneTimeTotal, profile.currency)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Includes security deposit, travel &amp; initial move-in setup
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">Total Month-1 cash needed</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-teal-700 tabular-nums">
                    {formatCurrency(firstMonthCash, profile.currency)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    One-time setup + first month living expenses
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed pt-4 border-t border-slate-100">
                Ready to compare areas or stays? Use <span className="font-medium text-slate-700">Explore</span> and <span className="font-medium text-slate-700">Stay</span> in the navigation to refine your rent and deposit estimates.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
