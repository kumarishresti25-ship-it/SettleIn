import {
  ExpenseBreakdown,
  OnboardingProfile,
  OneTimeSetupCost,
  RelocationTask,
  buildDefaultExpenses,
  buildDefaultTasks,
  buildOneTimeSetupCosts,
  getDemoProfile,
} from './relocationEngine';

export interface SettleInState {
  profile: OnboardingProfile;
  expenses: ExpenseBreakdown;
  tasks: RelocationTask[];
  setupCosts: OneTimeSetupCost[];
  shortlistedIds: string[];
  comparedNeighbourhoodIds: string[];
  savedPropertyIds: string[];
}

const STORAGE_KEY = 'settlein_relocation_state_v1';

function normalizeExpenses(
  raw: Record<string, unknown> | undefined,
  profile: OnboardingProfile
): ExpenseBreakdown {
  const defaults = buildDefaultExpenses(profile);
  if (!raw) return defaults;
  return {
    rent: typeof raw.rent === 'number' ? raw.rent : defaults.rent,
    food:
      typeof raw.food === 'number'
        ? raw.food
        : typeof raw.groceries === 'number'
          ? raw.groceries
          : defaults.food,
    transport:
      typeof raw.transport === 'number'
        ? raw.transport
        : typeof raw.commute === 'number'
          ? raw.commute
          : defaults.transport,
    utilities:
      typeof raw.utilities === 'number' ? raw.utilities : defaults.utilities,
    personal:
      typeof raw.personal === 'number' ? raw.personal : defaults.personal,
  };
}

export function loadSettleInState(): SettleInState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SettleInState> & {
      expenses?: Record<string, unknown>;
    };
    if (!parsed || !parsed.profile || !parsed.profile.destinationCity) {
      return null;
    }
    return {
      profile: parsed.profile,
      expenses: normalizeExpenses(parsed.expenses, parsed.profile),
      tasks: Array.isArray(parsed.tasks)
        ? parsed.tasks
        : buildDefaultTasks(parsed.profile),
      setupCosts: Array.isArray(parsed.setupCosts)
        ? parsed.setupCosts
        : buildOneTimeSetupCosts(parsed.profile),
      shortlistedIds: Array.isArray(parsed.shortlistedIds)
        ? parsed.shortlistedIds
        : [],
      comparedNeighbourhoodIds: Array.isArray(parsed.comparedNeighbourhoodIds)
        ? parsed.comparedNeighbourhoodIds.slice(0, 3)
        : [],
      savedPropertyIds: Array.isArray(parsed.savedPropertyIds)
        ? parsed.savedPropertyIds
        : [],
    };
  } catch {
    return null;
  }
}

export function saveSettleInState(state: SettleInState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function clearSettleInState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function createInitialStateFromProfile(
  profile: OnboardingProfile
): SettleInState {
  return {
    profile,
    expenses: buildDefaultExpenses(profile),
    tasks: buildDefaultTasks(profile),
    setupCosts: buildOneTimeSetupCosts(profile),
    shortlistedIds: [],
    comparedNeighbourhoodIds: [],
    savedPropertyIds: [],
  };
}

export function createDemoState(): SettleInState {
  const profile = getDemoProfile();
  return createInitialStateFromProfile(profile);
}
