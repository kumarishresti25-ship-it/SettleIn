import React from 'react';
import {
  Building2,
  CheckSquare,
  Compass,
  Home,
  Plus,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react';
import { OnboardingProfile, calculateCountdown } from '../utils/relocationEngine';
import { DashboardTab } from './OverviewView';

interface DashboardShellProps {
  profile: OnboardingProfile;
  activeTab: DashboardTab;
  pendingTaskCount: number;
  savedPropertyCount: number;
  onSelectTab: (tab: DashboardTab) => void;
  onOpenQuickTask: () => void;
  onOpenMovePlan: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: {
  id: DashboardTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'stay', label: 'Stay', icon: Building2 },
  { id: 'budget', label: 'Budget', icon: Wallet },
  { id: 'checklist', label: 'Checklist', icon: CheckSquare },
];

export const DashboardShell: React.FC<DashboardShellProps> = ({
  profile,
  activeTab,
  pendingTaskCount,
  savedPropertyCount,
  onSelectTab,
  onOpenQuickTask,
  onOpenMovePlan,
  children,
}) => {
  const countdown = calculateCountdown(profile.movingDate);
  const activeLabel =
    NAV_ITEMS.find((item) => item.id === activeTab)?.label || 'Home';

  const renderCount = (id: DashboardTab) => {
    if (id === 'checklist' && pendingTaskCount > 0) return pendingTaskCount;
    if (id === 'stay' && savedPropertyCount > 0) return savedPropertyCount;
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar (5 main sections) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200">
        <div className="h-16 px-6 flex items-center border-b border-slate-100">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            SettleIn
          </span>
        </div>

        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Moving to</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900 truncate">
              {profile.destinationCity}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {profile.anchorLocation}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenMovePlan}
            aria-label="Edit move plan"
            className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            title="Edit move plan"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const count = renderCount(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full min-h-[44px] flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {count !== null && (
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-6 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">Countdown</p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900 tabular-nums">
            {countdown.headline}
          </p>
          <p className="text-xs text-slate-500">{countdown.sublabel}</p>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar (52px mobile / 64px desktop) */}
        <header className="sticky top-0 z-30 h-[52px] lg:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="lg:hidden font-display text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              SettleIn
            </span>
            <span
              className="lg:hidden text-xs text-slate-500 truncate"
              aria-hidden="true"
            >
              · {profile.destinationCity}
            </span>

            <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
              <span>{profile.destinationCity}</span>
              <span aria-hidden="true">/</span>
              <span className="font-medium text-slate-900">{activeLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenMovePlan}
              aria-label="Edit move plan"
              className="lg:hidden inline-flex items-center gap-1.5 min-h-[38px] px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Plan</span>
            </button>

            <button
              type="button"
              onClick={onOpenQuickTask}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-2 rounded-xl bg-teal-700 text-white text-xs sm:text-sm font-medium hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add task</span>
            </button>
          </div>
        </header>

        {/* Main Content (with bottom clearance for mobile tab bar) */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:py-8 lg:pb-12">
          {children}
        </main>

        {/* Mobile Bottom Tab Bar (5 main sections) */}
        <nav
          aria-label="Mobile navigation"
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-[60px] bg-white/95 backdrop-blur-md border-t border-slate-200 px-1 grid grid-cols-5"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-teal-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <span
                    className="absolute top-0 inset-x-4 h-0.5 bg-teal-700 rounded-full"
                    aria-hidden="true"
                  />
                )}
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="truncate leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
