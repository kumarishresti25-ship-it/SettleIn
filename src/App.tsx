/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { AccommodationView } from './components/AccommodationView';
import { BudgetView } from './components/BudgetView';
import { ChecklistView } from './components/ChecklistView';
import { DashboardShell } from './components/DashboardShell';
import { MovePlanView } from './components/MovePlanView';
import { NeighbourhoodsView } from './components/NeighbourhoodsView';
import { OnboardingWizard } from './components/OnboardingWizard';
import { DashboardTab, OverviewView } from './components/OverviewView';
import { QuickTaskModal } from './components/QuickTaskModal';
import {
  ExpenseBreakdown,
  OnboardingProfile,
  OneTimeSetupCost,
  ScoredAccommodation,
  TaskCategory,
  TaskPhase,
  buildDefaultExpenses,
  buildDefaultTasks,
  buildOneTimeSetupCosts,
  recommendAccommodations,
  recommendNeighbourhoods,
  toggleCompareNeighbourhood,
} from './utils/relocationEngine';
import {
  SettleInState,
  clearSettleInState,
  createDemoState,
  createInitialStateFromProfile,
  loadSettleInState,
  saveSettleInState,
} from './utils/storage';

function getInitialAppState(): SettleInState | null {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      const existing = loadSettleInState();
      return existing || createDemoState();
    }
  }
  return loadSettleInState();
}

export default function App() {
  const [appState, setAppState] = useState<SettleInState | null>(getInitialAppState);
  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
  const [checklistPhaseFilter, setChecklistPhaseFilter] = useState<
    TaskPhase | 'all'
  >('all');
  const [accommodationSearch, setAccommodationSearch] = useState('');
  const [accommodationFilter, setAccommodationFilter] = useState<'all' | 'saved'>('all');
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);
  const [movePlanOpen, setMovePlanOpen] = useState(false);

  useEffect(() => {
    if (appState) {
      saveSettleInState(appState);
    }
  }, [appState]);

  const rankedNeighbourhoods = useMemo(() => {
    if (!appState) return [];
    return recommendNeighbourhoods(appState.profile);
  }, [appState]);

  const rankedAccommodations = useMemo(() => {
    if (!appState) return [];
    return recommendAccommodations(appState.profile);
  }, [appState]);

  const savedProperties = useMemo(() => {
    if (!appState) return [];
    return rankedAccommodations.filter((item) =>
      appState.savedPropertyIds.includes(item.id)
    );
  }, [appState, rankedAccommodations]);

  const handleCompleteOnboarding = (profile: OnboardingProfile) => {
    const nextState = createInitialStateFromProfile(profile);
    setAppState(nextState);
    setActiveTab('home');
  };

  const handleUseDemo = () => {
    const demo = createDemoState();
    setAppState(demo);
    setActiveTab('home');
  };

  const handleToggleShortlist = (hoodId: string) => {
    setAppState((prev) => {
      if (!prev) return prev;
      const exists = prev.shortlistedIds.includes(hoodId);
      const shortlistedIds = exists
        ? prev.shortlistedIds.filter((id) => id !== hoodId)
        : [...prev.shortlistedIds, hoodId];
      return { ...prev, shortlistedIds };
    });
  };

  const handleToggleCompare = (hoodId: string): { limitReached: boolean } => {
    if (!appState) return { limitReached: false };
    const result = toggleCompareNeighbourhood(
      appState.comparedNeighbourhoodIds,
      hoodId,
      3
    );
    if (!result.limitReached) {
      setAppState((prev) =>
        prev
          ? {
              ...prev,
              comparedNeighbourhoodIds: result.nextIds,
            }
          : prev
      );
    }
    return { limitReached: result.limitReached };
  };

  const handleCompareTopMatches = (ids: string[]) => {
    setAppState((prev) =>
      prev
        ? { ...prev, comparedNeighbourhoodIds: ids.slice(0, 3) }
        : prev
    );
  };

  const handleClearCompare = () => {
    setAppState((prev) =>
      prev ? { ...prev, comparedNeighbourhoodIds: [] } : prev
    );
  };

  const handleToggleSaveProperty = (propertyId: string) => {
    setAppState((prev) => {
      if (!prev) return prev;
      const exists = prev.savedPropertyIds.includes(propertyId);
      const savedPropertyIds = exists
        ? prev.savedPropertyIds.filter((id) => id !== propertyId)
        : [...prev.savedPropertyIds, propertyId];
      return { ...prev, savedPropertyIds };
    });
  };

  const handleApplyPropertyToBudget = (listing: ScoredAccommodation) => {
    setAppState((prev) => {
      if (!prev) return prev;
      const hasDepositRow = prev.setupCosts.some((c) => c.id === 'setup-deposit');
      const nextSetupCosts = hasDepositRow
        ? prev.setupCosts.map((c) =>
            c.id === 'setup-deposit'
              ? {
                  ...c,
                  label: `Security deposit (${listing.title})`,
                  amount: listing.securityDeposit,
                }
              : c
          )
        : [
            {
              id: 'setup-deposit',
              label: `Security deposit (${listing.title})`,
              amount: listing.securityDeposit,
              category: 'Deposit' as const,
            },
            ...prev.setupCosts,
          ];

      return {
        ...prev,
        expenses: {
          ...prev.expenses,
          rent: listing.monthlyRent,
        },
        setupCosts: nextSetupCosts,
      };
    });
  };

  const handleToggleTask = (taskId: string) => {
    setAppState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        ),
      };
    });
  };

  const handleAddTask = (
    title: string,
    phase: TaskPhase = 'pre-move',
    category: TaskCategory = 'Essentials'
  ) => {
    setAppState((prev) => {
      if (!prev) return prev;
      const newTask = {
        id: `task-custom-${Date.now()}`,
        title,
        phase,
        category,
        completed: false,
        custom: true,
      };
      return {
        ...prev,
        tasks: [newTask, ...prev.tasks],
      };
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setAppState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== taskId),
      };
    });
  };

  const handleUpdateExpense = (key: keyof ExpenseBreakdown, value: number) => {
    setAppState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        expenses: {
          ...prev.expenses,
          [key]: value,
        },
      };
    });
  };

  const handleUpdateSetupCost = (id: string, value: number) => {
    setAppState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        setupCosts: prev.setupCosts.map((item) =>
          item.id === id ? { ...item, amount: value } : item
        ),
      };
    });
  };

  const handleAddSetupCost = (
    label: string,
    amount: number,
    category: OneTimeSetupCost['category']
  ) => {
    setAppState((prev) => {
      if (!prev) return prev;
      const item: OneTimeSetupCost = {
        id: `setup-custom-${Date.now()}`,
        label,
        amount,
        category,
        custom: true,
      };
      return {
        ...prev,
        setupCosts: [...prev.setupCosts, item],
      };
    });
  };

  const handleDeleteSetupCost = (id: string) => {
    setAppState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        setupCosts: prev.setupCosts.filter((item) => item.id !== id),
      };
    });
  };

  const handleResetExpenses = () => {
    setAppState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        expenses: buildDefaultExpenses(prev.profile),
        setupCosts: buildOneTimeSetupCosts(prev.profile),
      };
    });
  };

  const handleSaveProfile = (updatedProfile: OnboardingProfile) => {
    setAppState((prev) => {
      if (!prev) return prev;
      const cityChanged =
        prev.profile.cityId !== updatedProfile.cityId ||
        prev.profile.destinationCity !== updatedProfile.destinationCity;
      const budgetChanged =
        prev.profile.accommodationBudget !== updatedProfile.accommodationBudget ||
        prev.profile.totalMonthlyBudget !== updatedProfile.totalMonthlyBudget ||
        prev.profile.currency !== updatedProfile.currency;
      const commuteModeChanged =
        prev.profile.commuteMode !== updatedProfile.commuteMode;

      const completedMap = new Map(
        prev.tasks.map((t) => [t.id, t.completed])
      );
      const customTasks = prev.tasks.filter((t) => t.custom);
      const refreshedDefaults = buildDefaultTasks(updatedProfile).map((t) => ({
        ...t,
        completed: completedMap.get(t.id) ?? false,
      }));

      return {
        ...prev,
        profile: updatedProfile,
        tasks: [...customTasks, ...refreshedDefaults],
        expenses:
          cityChanged || budgetChanged || commuteModeChanged
            ? buildDefaultExpenses(updatedProfile)
            : prev.expenses,
        setupCosts:
          cityChanged || budgetChanged
            ? buildOneTimeSetupCosts(updatedProfile)
            : prev.setupCosts,
        shortlistedIds: cityChanged ? [] : prev.shortlistedIds,
        comparedNeighbourhoodIds: cityChanged
          ? []
          : prev.comparedNeighbourhoodIds,
        savedPropertyIds: cityChanged ? [] : prev.savedPropertyIds,
      };
    });
  };

  const handleRestartOnboarding = () => {
    clearSettleInState();
    setAppState(null);
    setActiveTab('home');
  };

  const handleNavigate = (
    tab: DashboardTab,
    options?: TaskPhase | { phaseFilter?: TaskPhase; accommodationFilter?: 'all' | 'saved' }
  ) => {
    if (tab === 'checklist') {
      const phase =
        typeof options === 'string' ? options : options?.phaseFilter || 'all';
      setChecklistPhaseFilter(phase);
    }
    if (tab === 'stay') {
      const nextFilter =
        typeof options === 'object' && options?.accommodationFilter
          ? options.accommodationFilter
          : 'all';
      setAccommodationFilter(nextFilter);
    } else {
      setAccommodationSearch('');
      setAccommodationFilter('all');
    }
    setActiveTab(tab);
  };

  const handleExplorePropertiesForArea = (neighbourhoodName: string) => {
    const shortArea = neighbourhoodName.split('(')[0].trim();
    setAccommodationSearch(shortArea);
    setAccommodationFilter('all');
    setActiveTab('stay');
  };

  if (!appState) {
    return (
      <OnboardingWizard
        onComplete={handleCompleteOnboarding}
        onUseDemo={handleUseDemo}
      />
    );
  }

  const pendingTaskCount = appState.tasks.filter((t) => !t.completed).length;

  return (
    <>
      <DashboardShell
        profile={appState.profile}
        activeTab={activeTab}
        pendingTaskCount={pendingTaskCount}
        savedPropertyCount={appState.savedPropertyIds.length}
        onSelectTab={(tab) => handleNavigate(tab)}
        onOpenQuickTask={() => setQuickTaskOpen(true)}
        onOpenMovePlan={() => setMovePlanOpen(true)}
      >
        {activeTab === 'home' && (
          <OverviewView
            profile={appState.profile}
            tasks={appState.tasks}
            expenses={appState.expenses}
            setupCosts={appState.setupCosts}
            onToggleTask={handleToggleTask}
            onNavigate={handleNavigate}
            onOpenMovePlan={() => setMovePlanOpen(true)}
          />
        )}

        {activeTab === 'explore' && (
          <NeighbourhoodsView
            profile={appState.profile}
            neighbourhoods={rankedNeighbourhoods}
            shortlistedIds={appState.shortlistedIds}
            comparedIds={appState.comparedNeighbourhoodIds}
            onToggleShortlist={handleToggleShortlist}
            onToggleCompare={handleToggleCompare}
            onCompareTopMatches={handleCompareTopMatches}
            onClearCompare={handleClearCompare}
            onExploreProperties={handleExplorePropertiesForArea}
          />
        )}

        {activeTab === 'stay' && (
          <AccommodationView
            key={`${accommodationSearch}-${accommodationFilter}`}
            profile={appState.profile}
            listings={rankedAccommodations}
            savedPropertyIds={appState.savedPropertyIds}
            initialSearch={accommodationSearch}
            initialFilter={accommodationFilter}
            onToggleSaveProperty={handleToggleSaveProperty}
            onApplyToBudget={handleApplyPropertyToBudget}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetView
            profile={appState.profile}
            expenses={appState.expenses}
            setupCosts={appState.setupCosts}
            savedProperties={savedProperties}
            onUpdateExpense={handleUpdateExpense}
            onUpdateSetupCost={handleUpdateSetupCost}
            onAddSetupCost={handleAddSetupCost}
            onDeleteSetupCost={handleDeleteSetupCost}
            onApplyPropertyToBudget={handleApplyPropertyToBudget}
            onResetExpenses={handleResetExpenses}
          />
        )}

        {activeTab === 'checklist' && (
          <ChecklistView
            key={checklistPhaseFilter}
            profile={appState.profile}
            tasks={appState.tasks}
            initialPhaseFilter={checklistPhaseFilter}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </DashboardShell>

      <MovePlanView
        isOpen={movePlanOpen}
        profile={appState.profile}
        onClose={() => setMovePlanOpen(false)}
        onSaveProfile={handleSaveProfile}
        onRestartOnboarding={handleRestartOnboarding}
      />

      <QuickTaskModal
        isOpen={quickTaskOpen}
        onClose={() => setQuickTaskOpen(false)}
        onAdd={(title, phase, category) => handleAddTask(title, phase, category)}
      />
    </>
  );
}
