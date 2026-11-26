import {
  ACCOMMODATIONS_DATA,
  AccommodationCategory,
  AccommodationListing,
  CITY_PRESETS,
  CURRENCY_CONFIG,
  CommuteMode,
  CurrencyCode,
  FacilityTag,
  MoverRole,
  NEIGHBOURHOODS_DATA,
  NeighbourhoodData,
} from '../data/cities';

export interface OnboardingProfile {
  destinationCity: string;
  cityId: string;
  anchorLocation: string;
  role: MoverRole;
  movingDate: string; // YYYY-MM-DD
  accommodationBudget: number;
  totalMonthlyBudget: number;
  preferredCommuteMinutes: number;
  commuteMode: CommuteMode;
  currency: CurrencyCode;
}

export interface OnboardingErrors {
  destinationCity?: string;
  anchorLocation?: string;
  movingDate?: string;
  accommodationBudget?: string;
  totalMonthlyBudget?: string;
  preferredCommuteMinutes?: string;
}

export interface ScoredNeighbourhood extends NeighbourhoodData {
  estimatedRent: number;
  rentFormat: 'Shared room' | 'Studio / 1BHK';
  estimatedTransportCost: number;
  estimatedOtherMonthlyCosts: number;
  totalExpectedMonthlyCost: number;
  budgetFit: 'within' | 'tight' | 'over';
  commuteFit: 'within' | 'close' | 'far';
  monthlyTotalFit: 'within' | 'tight' | 'over';
  anchorAffinity: boolean;
  matchTier: 'Strong match' | 'Good match' | 'Trade-off';
  matchReason: string;
  rankScore: number;
}

export interface ScoredAccommodation extends AccommodationListing {
  budgetFit: 'within' | 'tight' | 'over';
  commuteFit: 'within' | 'close' | 'far';
  depositMonths: number;
  upfrontMoveInCost: number;
  rentDelta: number;
  decisionNote: string;
  rankScore: number;
}

export interface ExpenseBreakdown {
  rent: number;
  food: number;
  transport: number;
  utilities: number;
  personal: number;
}

export type TaskPhase = 'pre-move' | 'arrival-week' | 'first-month';
export type TaskCategory = 'Housing' | 'Commute' | 'Finance' | 'Admin' | 'Essentials';

export interface RelocationTask {
  id: string;
  title: string;
  phase: TaskPhase;
  category: TaskCategory;
  completed: boolean;
  custom?: boolean;
}

export interface OneTimeSetupCost {
  id: string;
  label: string;
  amount: number;
  category: 'Deposit' | 'Travel' | 'Setup' | 'Admin';
  custom?: boolean;
}

export interface CountdownInfo {
  daysRemaining: number;
  status: 'upcoming' | 'moving-day' | 'settled';
  headline: string;
  sublabel: string;
}

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const cfg = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.INR;
  const rounded = Math.round(amount);
  return new Intl.NumberFormat(cfg.locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(rounded);
}

export function validateOnboardingStep1(
  draft: Partial<OnboardingProfile>
): OnboardingErrors {
  const errors: OnboardingErrors = {};
  if (!draft.destinationCity || draft.destinationCity.trim().length < 2) {
    errors.destinationCity = 'Enter your destination city.';
  }
  if (!draft.anchorLocation || draft.anchorLocation.trim().length < 2) {
    errors.anchorLocation = 'Enter your college campus or office location.';
  }
  if (!draft.movingDate) {
    errors.movingDate = 'Choose your target moving date.';
  } else {
    const parsed = new Date(`${draft.movingDate}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      errors.movingDate = 'Enter a valid calendar date.';
    }
  }
  return errors;
}

export function validateOnboardingStep2(
  draft: Partial<OnboardingProfile>
): OnboardingErrors {
  const errors: OnboardingErrors = {};
  const accomm = Number(draft.accommodationBudget);
  const total = Number(draft.totalMonthlyBudget);
  const commute = Number(draft.preferredCommuteMinutes);

  if (!Number.isFinite(accomm) || accomm <= 0) {
    errors.accommodationBudget = 'Enter a valid monthly accommodation budget.';
  }
  if (!Number.isFinite(total) || total <= 0) {
    errors.totalMonthlyBudget = 'Enter a valid total monthly budget.';
  } else if (Number.isFinite(accomm) && accomm > total) {
    errors.accommodationBudget =
      'Accommodation budget cannot exceed your total monthly budget.';
  }
  if (!Number.isFinite(commute) || commute < 5 || commute > 120) {
    errors.preferredCommuteMinutes =
      'Preferred commute should be between 5 and 120 minutes.';
  }
  return errors;
}

export function validateOnboardingAll(
  draft: Partial<OnboardingProfile>
): OnboardingErrors {
  return {
    ...validateOnboardingStep1(draft),
    ...validateOnboardingStep2(draft),
  };
}

export function calculateCountdown(
  movingDateStr: string,
  nowDate: Date = new Date()
): CountdownInfo {
  const todayStart = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate()
  );
  const target = new Date(`${movingDateStr}T00:00:00`);
  if (Number.isNaN(target.getTime())) {
    return {
      daysRemaining: 0,
      status: 'upcoming',
      headline: 'Date pending',
      sublabel: 'Set a valid moving date',
    };
  }
  const diffMs = target.getTime() - todayStart.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return {
      daysRemaining: days,
      status: 'upcoming',
      headline: `${days} ${days === 1 ? 'day' : 'days'}`,
      sublabel: `Until move on ${target.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`,
    };
  }
  if (days === 0) {
    return {
      daysRemaining: 0,
      status: 'moving-day',
      headline: 'Today',
      sublabel: 'Moving day has arrived',
    };
  }
  const daysSince = Math.abs(days);
  return {
    daysRemaining: days,
    status: 'settled',
    headline: `Day ${daysSince + 1}`,
    sublabel: `${daysSince} ${daysSince === 1 ? 'day' : 'days'} since arrival`,
  };
}

export function calculateProgress(tasks: RelocationTask[]) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const pending = total - completed;

  const byPhase: Record<TaskPhase, { completed: number; total: number }> = {
    'pre-move': { completed: 0, total: 0 },
    'arrival-week': { completed: 0, total: 0 },
    'first-month': { completed: 0, total: 0 },
  };

  for (const task of tasks) {
    byPhase[task.phase].total += 1;
    if (task.completed) {
      byPhase[task.phase].completed += 1;
    }
  }

  return { completed, pending, total, percentage, byPhase };
}

function buildCustomCityNeighbourhoods(
  profile: OnboardingProfile
): NeighbourhoodData[] {
  const baseRent = Math.max(100, profile.accommodationBudget);
  const anchorShort = profile.anchorLocation.split(',')[0].trim() || 'your destination';
  const modeLabel =
    profile.commuteMode === 'walk_bike'
      ? 'Walk & cycle corridor'
      : profile.commuteMode === 'car'
        ? 'Direct arterial road'
        : 'Metro & feeder bus';

  const coreCommute = Math.max(8, Math.round(profile.preferredCommuteMinutes * 0.55));
  const midCommute = Math.round(profile.preferredCommuteMinutes * 0.85);
  const outerCommute = Math.min(60, Math.round(profile.preferredCommuteMinutes * 1.15));

  return [
    {
      id: 'custom-core',
      cityId: 'custom',
      name: `${anchorShort} Central Pocket`,
      vibe: 'Closest walkable blocks right around your campus or workplace',
      avgSharedRent: Math.round(baseRent * 0.98),
      avgStudioRent: Math.round(baseRent * 1.35),
      distanceKm: Number((coreCommute * 0.18).toFixed(1)),
      estCommuteMinutes: coreCommute,
      transitLine: `${modeLabel} · Core`,
      walkability: 'Very walkable',
      nearbyFacilities: ['Metro', 'Cafés', 'Groceries', 'Hospital'] as FacilityTag[],
      highlights: ['Minimal daily commute', 'Tiffin & grocery stores nearby', 'Compact flats'],
      studentFriendly: true,
      gradFriendly: true,
    },
    {
      id: 'custom-midtown',
      cityId: 'custom',
      name: 'Midtown Transit Belt',
      vibe: 'Balanced rents one transit hop from your daily anchor',
      avgSharedRent: Math.round(baseRent * 0.82),
      avgStudioRent: Math.round(baseRent * 1.08),
      distanceKm: Number((midCommute * 0.25).toFixed(1)),
      estCommuteMinutes: midCommute,
      transitLine: `${modeLabel} · Express`,
      walkability: 'High walkability',
      nearbyFacilities: ['Metro', 'Groceries', 'Gym', 'Parks'] as FacilityTag[],
      highlights: ['Strong rent-to-space value', 'Supermarkets within 5 mins', 'Active grad hub'],
      studentFriendly: true,
      gradFriendly: true,
    },
    {
      id: 'custom-residential',
      cityId: 'custom',
      name: 'Quiet Residential Sector',
      vibe: 'Leafy, calm streets with spacious shared apartments',
      avgSharedRent: Math.round(baseRent * 0.72),
      avgStudioRent: Math.round(baseRent * 0.94),
      distanceKm: Number((outerCommute * 0.28).toFixed(1)),
      estCommuteMinutes: outerCommute,
      transitLine: `${modeLabel} · Feeder`,
      walkability: 'Moderate walkability',
      nearbyFacilities: ['Parks', 'Groceries', 'Hospital'] as FacilityTag[],
      highlights: ['Lowest monthly rent', 'Quiet study evenings', 'Local parks'],
      studentFriendly: true,
      gradFriendly: true,
    },
  ];
}

const ANCHOR_STOP_WORDS = new Set([
  'road',
  'main',
  'park',
  'tech',
  'city',
  'area',
  'east',
  'west',
  'north',
  'south',
  'sector',
  'phase',
  'block',
  'stage',
  'campus',
  'office',
  'college',
  'near',
  'central',
]);

const ANCHOR_CORRIDOR_ALIASES: { pattern: RegExp; keywords: string[] }[] = [
  { pattern: /\biisc\b/i, keywords: ['malleshwaram', 'iisc', 'green line'] },
  { pattern: /\borr\b|outer ring|bellandur/i, keywords: ['orr', 'koramangala', 'hsr'] },
  { pattern: /itpl|whitefield/i, keywords: ['whitefield', 'itpl', 'purple line'] },
  { pattern: /iit\s*bombay|\biitb\b|powai/i, keywords: ['powai', 'iit bombay'] },
  { pattern: /\bbkc\b|bandra\s*kurla/i, keywords: ['bkc', 'santacruz'] },
  { pattern: /lower\s*parel/i, keywords: ['lower parel', 'dadar'] },
  { pattern: /\biiit\b|financial\s*district|gachibowli/i, keywords: ['gachibowli', 'iiit', 'kondapur'] },
  { pattern: /hitec/i, keywords: ['hitec', 'madhapur', 'kondapur'] },
  { pattern: /\bdu\b|north\s*campus/i, keywords: ['kamla', 'hudson', 'north campus'] },
  { pattern: /cyber\s*city|gurugram/i, keywords: ['dlf', 'sikanderpur', 'gurugram'] },
  { pattern: /iit\s*madras|\biitm\b|adyar/i, keywords: ['adyar', 'velachery', 'guindy'] },
  { pattern: /tidel|taramani|\bomr\b/i, keywords: ['taramani', 'adyar', 'sholinganallur', 'thiruvanmiyur'] },
];

function computeAnchorAffinity(
  hood: NeighbourhoodData,
  anchorLocation: string
): boolean {
  const normalizedAnchor = anchorLocation.toLowerCase();
  const haystack = `${hood.name} ${hood.vibe} ${hood.transitLine} ${hood.highlights.join(' ')}`.toLowerCase();

  const tokens = normalizedAnchor
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !ANCHOR_STOP_WORDS.has(word));

  if (tokens.some((token) => haystack.includes(token))) {
    return true;
  }

  for (const alias of ANCHOR_CORRIDOR_ALIASES) {
    if (alias.pattern.test(normalizedAnchor)) {
      if (alias.keywords.some((kw) => haystack.includes(kw))) {
        return true;
      }
    }
  }

  return false;
}

function estimateNeighbourhoodCosts(
  hood: NeighbourhoodData,
  profile: OnboardingProfile
): {
  estimatedTransportCost: number;
  estimatedOtherMonthlyCosts: number;
} {
  const preset = CITY_PRESETS.find((c) => c.id === profile.cityId);
  const nonHousing = Math.max(0, profile.totalMonthlyBudget - profile.accommodationBudget);

  const baseTransit = preset
    ? preset.avgTransitPass
    : Math.max(20, Math.round(profile.totalMonthlyBudget * 0.05));

  const hasMetro = hood.nearbyFacilities.includes('Metro');
  let modeFactor = hasMetro ? 0.9 : 1.15;
  if (profile.commuteMode === 'walk_bike') {
    modeFactor = hood.distanceKm <= 3.5 ? 0.35 : 0.55;
  } else if (profile.commuteMode === 'car') {
    modeFactor = 1.75 + Math.min(1.25, hood.distanceKm * 0.09);
  }

  const distanceAddon =
    profile.currency === 'INR'
      ? Math.round(hood.distanceKm * (profile.commuteMode === 'walk_bike' ? 15 : 40))
      : Math.round(baseTransit * Math.min(0.45, hood.distanceKm * 0.03));

  const estimatedTransportCost = Math.max(
    0,
    Math.round(baseTransit * modeFactor + distanceAddon)
  );

  const estimatedOtherMonthlyCosts = preset
    ? Math.round(
        preset.avgFood +
          preset.avgUtilities +
          (preset.avgFood + preset.avgUtilities) * 0.22
      )
    : Math.round(nonHousing * 0.72);

  return {
    estimatedTransportCost,
    estimatedOtherMonthlyCosts,
  };
}

export function recommendNeighbourhoods(
  profile: OnboardingProfile
): ScoredNeighbourhood[] {
  const cityRecords = NEIGHBOURHOODS_DATA.filter(
    (n) => n.cityId === profile.cityId
  );
  const source =
    cityRecords.length > 0 ? cityRecords : buildCustomCityNeighbourhoods(profile);

  const scored: ScoredNeighbourhood[] = source.map((hood) => {
    const canAffordStudio = hood.avgStudioRent <= profile.accommodationBudget * 1.05;
    const useStudio = profile.role === 'graduate' && canAffordStudio;
    const estimatedRent = useStudio ? hood.avgStudioRent : hood.avgSharedRent;
    const rentFormat: 'Shared room' | 'Studio / 1BHK' = useStudio
      ? 'Studio / 1BHK'
      : 'Shared room';

    const { estimatedTransportCost, estimatedOtherMonthlyCosts } =
      estimateNeighbourhoodCosts(hood, profile);
    const totalExpectedMonthlyCost =
      estimatedRent + estimatedTransportCost + estimatedOtherMonthlyCosts;

    const budgetRatio = estimatedRent / Math.max(1, profile.accommodationBudget);
    const budgetFit: ScoredNeighbourhood['budgetFit'] =
      budgetRatio <= 1.0 ? 'within' : budgetRatio <= 1.12 ? 'tight' : 'over';

    const commuteDiff = hood.estCommuteMinutes - profile.preferredCommuteMinutes;
    const commuteFit: ScoredNeighbourhood['commuteFit'] =
      commuteDiff <= 0 ? 'within' : commuteDiff <= 7 ? 'close' : 'far';

    const totalRatio =
      totalExpectedMonthlyCost / Math.max(1, profile.totalMonthlyBudget);
    const monthlyTotalFit: ScoredNeighbourhood['monthlyTotalFit'] =
      totalRatio <= 1.0 ? 'within' : totalRatio <= 1.08 ? 'tight' : 'over';

    const anchorAffinity = computeAnchorAffinity(hood, profile.anchorLocation);

    let score = 100;
    if (budgetFit === 'within') score += 25;
    else if (budgetFit === 'tight') score += 5;
    else score -= 35;

    if (commuteFit === 'within') score += 25;
    else if (commuteFit === 'close') score += 5;
    else score -= 25;

    if (monthlyTotalFit === 'within') score += 12;
    else if (monthlyTotalFit === 'tight') score += 2;
    else score -= 18;

    if (anchorAffinity) score += 18;

    if (profile.commuteMode === 'walk_bike' && hood.distanceKm <= 4.5) score += 8;
    if (profile.commuteMode === 'transit' && hood.nearbyFacilities.includes('Metro')) {
      score += 6;
    }

    if (profile.role === 'student' && hood.studentFriendly) score += 10;
    if (profile.role === 'graduate' && hood.gradFriendly) score += 10;

    score -= hood.estCommuteMinutes * 0.3;

    const matchTier: ScoredNeighbourhood['matchTier'] =
      budgetFit === 'within' && commuteFit === 'within' && monthlyTotalFit !== 'over'
        ? 'Strong match'
        : budgetFit !== 'over' && commuteFit !== 'far'
          ? 'Good match'
          : 'Trade-off';

    const rentDelta = profile.accommodationBudget - estimatedRent;
    const rentPhrase =
      rentDelta >= 1500
        ? `saves ${formatCurrency(rentDelta, profile.currency)}/mo below your housing cap`
        : rentDelta >= 0
          ? `fits inside your ${formatCurrency(profile.accommodationBudget, profile.currency)}/mo housing cap`
          : `runs ${formatCurrency(Math.abs(rentDelta), profile.currency)}/mo above your housing cap`;

    const totalDelta = profile.totalMonthlyBudget - totalExpectedMonthlyCost;
    const totalPhrase =
      totalDelta >= 0
        ? `keeps total living costs ~${formatCurrency(totalExpectedMonthlyCost, profile.currency)}/mo (${formatCurrency(totalDelta, profile.currency)} under cap)`
        : `brings total living costs to ~${formatCurrency(totalExpectedMonthlyCost, profile.currency)}/mo (${formatCurrency(Math.abs(totalDelta), profile.currency)} over total budget)`;

    let matchReason = '';
    if (anchorAffinity && commuteFit !== 'far') {
      matchReason = `Direct corridor match to ${profile.anchorLocation} (${hood.estCommuteMinutes} min, ${hood.distanceKm} km via ${hood.transitLine}); ${rentPhrase} and ${totalPhrase}.`;
    } else if (budgetFit === 'within' && commuteFit === 'within') {
      matchReason = `${rentFormat} rent (${formatCurrency(estimatedRent, profile.currency)}/mo) ${rentPhrase}, with a ${hood.estCommuteMinutes}-min commute to ${profile.anchorLocation} and ${totalPhrase}.`;
    } else if (budgetFit === 'within' && commuteFit !== 'within') {
      matchReason = `${rentFormat} rent ${rentPhrase}, though the ${hood.estCommuteMinutes}-min commute to ${profile.anchorLocation} is ${commuteDiff} min longer than your ${profile.preferredCommuteMinutes}-min target.`;
    } else if (budgetFit !== 'within' && commuteFit === 'within') {
      matchReason = `Fast ${hood.estCommuteMinutes}-min commute to ${profile.anchorLocation} via ${hood.transitLine}, though ${rentFormat.toLowerCase()} rent ${rentPhrase}.`;
    } else {
      matchReason = `Higher rent (${formatCurrency(estimatedRent, profile.currency)}/mo) and ${hood.estCommuteMinutes}-min trip to ${profile.anchorLocation}; ${totalPhrase}.`;
    }

    return {
      ...hood,
      estimatedRent,
      rentFormat,
      estimatedTransportCost,
      estimatedOtherMonthlyCosts,
      totalExpectedMonthlyCost,
      budgetFit,
      commuteFit,
      monthlyTotalFit,
      anchorAffinity,
      matchTier,
      matchReason,
      rankScore: score,
    };
  });

  return scored.sort((a, b) => b.rankScore - a.rankScore);
}

function buildCustomCityAccommodations(
  profile: OnboardingProfile
): AccommodationListing[] {
  const baseRent = Math.max(100, profile.accommodationBudget);
  const anchorShort = profile.anchorLocation.split(',')[0].trim() || 'Central District';
  const commuteBase = Math.max(10, Math.round(profile.preferredCommuteMinutes * 0.75));

  return [
    {
      id: 'acc-custom-pg',
      cityId: 'custom',
      neighbourhoodId: 'custom-core',
      neighbourhoodName: `${anchorShort} Central Pocket`,
      title: `${anchorShort} Scholar & Grad PG`,
      category: 'pg',
      roomType: 'Twin sharing PG · Meals included',
      monthlyRent: Math.round(baseRent * 0.78),
      securityDeposit: Math.round(baseRent * 0.8),
      distanceKm: Number((commuteBase * 0.2).toFixed(1)),
      estCommuteMinutes: Math.max(8, commuteBase - 4),
      furnishing: 'Fully furnished',
      brokerageFree: true,
      amenities: ['Wi-Fi', '2 meals/day', 'Laundry', 'Study desk'],
      idealFor: 'both',
    },
    {
      id: 'acc-custom-shared',
      cityId: 'custom',
      neighbourhoodId: 'custom-midtown',
      neighbourhoodName: 'Midtown Transit Belt',
      title: 'Sunlit Private Room in 2BHK',
      category: 'shared',
      roomType: 'Private bedroom in shared 2BHK',
      monthlyRent: Math.round(baseRent * 0.92),
      securityDeposit: Math.round(baseRent * 1.85),
      distanceKm: Number((commuteBase * 0.26).toFixed(1)),
      estCommuteMinutes: commuteBase + 2,
      furnishing: 'Semi-furnished',
      brokerageFree: true,
      amenities: ['Attached washroom', 'Shared kitchen', 'Balcony', 'Fibre Wi-Fi'],
      idealFor: 'both',
    },
    {
      id: 'acc-custom-private',
      cityId: 'custom',
      neighbourhoodId: 'custom-midtown',
      neighbourhoodName: 'Midtown Transit Belt',
      title: 'Private 1RK Studio Apartment',
      category: 'private',
      roomType: 'Private 1RK Studio',
      monthlyRent: Math.round(baseRent * 1.08),
      securityDeposit: Math.round(baseRent * 2.15),
      distanceKm: Number((commuteBase * 0.25).toFixed(1)),
      estCommuteMinutes: commuteBase,
      furnishing: 'Fully furnished',
      brokerageFree: true,
      amenities: ['Kitchenette', 'Work desk', 'Washing machine', '24x7 security'],
      idealFor: 'graduate',
    },
  ];
}

export function recommendAccommodations(
  profile: OnboardingProfile
): ScoredAccommodation[] {
  const cityListings = ACCOMMODATIONS_DATA.filter(
    (item) => item.cityId === profile.cityId
  );
  const source =
    cityListings.length > 0
      ? cityListings
      : buildCustomCityAccommodations(profile);

  const scored: ScoredAccommodation[] = source.map((item) => {
    const budgetRatio = item.monthlyRent / Math.max(1, profile.accommodationBudget);
    const budgetFit: ScoredAccommodation['budgetFit'] =
      budgetRatio <= 1.0 ? 'within' : budgetRatio <= 1.15 ? 'tight' : 'over';

    const commuteDiff = item.estCommuteMinutes - profile.preferredCommuteMinutes;
    const commuteFit: ScoredAccommodation['commuteFit'] =
      commuteDiff <= 0 ? 'within' : commuteDiff <= 7 ? 'close' : 'far';

    const depositMonths = Number(
      (item.securityDeposit / Math.max(1, item.monthlyRent)).toFixed(1)
    );
    const upfrontMoveInCost = item.monthlyRent + item.securityDeposit;
    const rentDelta = profile.accommodationBudget - item.monthlyRent;

    let score = 100;
    if (budgetFit === 'within') score += 25;
    else if (budgetFit === 'tight') score += 5;
    else score -= 35;

    if (commuteFit === 'within') score += 25;
    else if (commuteFit === 'close') score += 5;
    else score -= 25;

    if (item.idealFor === 'both' || item.idealFor === profile.role) {
      score += 10;
    }
    if (item.brokerageFree) score += 5;
    if (depositMonths <= 1.5) score += 4;
    score -= item.estCommuteMinutes * 0.25;

    const depositPhrase =
      depositMonths <= 1.5
        ? `Low upfront cash (${depositMonths}x rent deposit)`
        : `Higher deposit (${depositMonths}x rent = ${formatCurrency(item.securityDeposit, profile.currency)})`;

    const rentComparison =
      rentDelta >= 0
        ? `${formatCurrency(rentDelta, profile.currency)}/mo under housing cap`
        : `${formatCurrency(Math.abs(rentDelta), profile.currency)}/mo over housing cap`;

    const decisionNote = `${depositPhrase} · ${rentComparison} · ${
      item.estCommuteMinutes <= profile.preferredCommuteMinutes
        ? `${item.estCommuteMinutes} min commute fits target`
        : `${item.estCommuteMinutes} min commute (+${commuteDiff} min)`
    }`;

    return {
      ...item,
      budgetFit,
      commuteFit,
      depositMonths,
      upfrontMoveInCost,
      rentDelta,
      decisionNote,
      rankScore: score,
    };
  });

  return scored.sort((a, b) => b.rankScore - a.rankScore);
}

export function toggleCompareNeighbourhood(
  currentIds: string[],
  targetId: string,
  maxCount: number = 3
): { nextIds: string[]; limitReached: boolean } {
  if (currentIds.includes(targetId)) {
    return {
      nextIds: currentIds.filter((id) => id !== targetId),
      limitReached: false,
    };
  }
  if (currentIds.length >= maxCount) {
    return {
      nextIds: currentIds,
      limitReached: true,
    };
  }
  return {
    nextIds: [...currentIds, targetId],
    limitReached: false,
  };
}

export function buildDefaultExpenses(
  profile: OnboardingProfile
): ExpenseBreakdown {
  const preset = CITY_PRESETS.find((c) => c.id === profile.cityId);
  const nonHousing = Math.max(0, profile.totalMonthlyBudget - profile.accommodationBudget);

  if (preset) {
    const rawTransit =
      profile.commuteMode === 'walk_bike'
        ? Math.round(preset.avgTransitPass * 0.35)
        : profile.commuteMode === 'car'
          ? Math.round(preset.avgTransitPass * 2.2)
          : preset.avgTransitPass;

    const baseOther = preset.avgUtilities + rawTransit + preset.avgFood;
    const scale = nonHousing > 0 && baseOther > nonHousing ? nonHousing / baseOther : 1;

    const utilities = Math.round(preset.avgUtilities * scale);
    const transport = Math.round(rawTransit * scale);
    const food = Math.round(preset.avgFood * scale);
    const personal = Math.max(
      0,
      Math.round((nonHousing - (utilities + transport + food)) * 0.55)
    );

    return {
      rent: Math.round(profile.accommodationBudget),
      food,
      transport,
      utilities,
      personal,
    };
  }

  return {
    rent: Math.round(profile.accommodationBudget),
    food: Math.round(nonHousing * 0.4),
    transport: Math.round(
      nonHousing *
        (profile.commuteMode === 'walk_bike'
          ? 0.05
          : profile.commuteMode === 'car'
            ? 0.22
            : 0.12)
    ),
    utilities: Math.round(nonHousing * 0.16),
    personal: Math.round(nonHousing * 0.18),
  };
}

export function calculateExpenseSummary(
  profile: OnboardingProfile,
  expenses: ExpenseBreakdown
) {
  const totalEstimated =
    expenses.rent +
    expenses.food +
    expenses.transport +
    expenses.utilities +
    expenses.personal;

  const remainingBuffer = profile.totalMonthlyBudget - totalEstimated;
  const housingSharePercent =
    profile.totalMonthlyBudget > 0
      ? Math.round((expenses.rent / profile.totalMonthlyBudget) * 100)
      : 0;
  const rentExceededBy = Math.max(0, expenses.rent - profile.accommodationBudget);
  const totalExceededBy = Math.max(0, totalEstimated - profile.totalMonthlyBudget);

  const status: 'healthy' | 'tight' | 'over' =
    remainingBuffer < 0
      ? 'over'
      : remainingBuffer < profile.totalMonthlyBudget * 0.08
        ? 'tight'
        : 'healthy';

  return {
    totalEstimated,
    remainingBuffer,
    housingSharePercent,
    rentExceededBy,
    totalExceededBy,
    status,
  };
}

export function buildOneTimeSetupCosts(
  profile: OnboardingProfile
): OneTimeSetupCost[] {
  const preset = CITY_PRESETS.find((c) => c.id === profile.cityId);
  const depositMonths = preset ? preset.depositMonths : 2;
  const depositAmount = Math.round(profile.accommodationBudget * depositMonths);
  const travelAmount = preset
    ? preset.avgTravelMoveCost
    : Math.round(profile.accommodationBudget * 0.28);
  const homeKit = Math.round(profile.accommodationBudget * 0.3);
  const transitAndAdmin = preset ? Math.round(preset.avgTransitPass * 0.8) : 1000;

  return [
    {
      id: 'setup-deposit',
      label: `Security deposit (~${depositMonths} mo)`,
      amount: depositAmount,
      category: 'Deposit',
    },
    {
      id: 'setup-travel',
      label: 'Inter-city travel & luggage shipping',
      amount: travelAmount,
      category: 'Travel',
    },
    {
      id: 'setup-kit',
      label: 'Mattress, kitchen & desk basics',
      amount: homeKit,
      category: 'Setup',
    },
    {
      id: 'setup-transit',
      label: 'Metro card, SIM & lease admin',
      amount: transitAndAdmin,
      category: 'Admin',
    },
  ];
}

export const PHASE_DISPLAY_NAMES: Record<TaskPhase, string> = {
  'pre-move': 'Before Moving',
  'arrival-week': 'First 7 Days',
  'first-month': 'First 30 Days',
};

export interface NextActionRecommendation {
  task: RelocationTask | null;
  phaseLabel: string;
  timingContext: string;
  reason: string;
  alternateTasks: RelocationTask[];
}

export function buildDefaultTasks(profile: OnboardingProfile): RelocationTask[] {
  const cityLabel = profile.destinationCity.split(',')[0].trim();
  const isStudent = profile.role === 'student';
  const commuteModeLabel =
    profile.commuteMode === 'walk_bike'
      ? 'walking or cycle'
      : profile.commuteMode === 'car'
        ? 'cab or driving'
        : 'Metro / bus';

  const moveDateObj = new Date(`${profile.movingDate}T00:00:00`);
  const moveDateLabel = Number.isNaN(moveDateObj.getTime())
    ? 'your move date'
    : moveDateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

  return [
    // Before Moving
    {
      id: 'task-arrange-accom',
      title: `Arrange accommodation in ${cityLabel} within ${formatCurrency(profile.accommodationBudget, profile.currency)}/mo`,
      phase: 'pre-move',
      category: 'Housing',
      completed: false,
    },
    {
      id: 'task-shortlist',
      title: `Compare 2–3 ${cityLabel} neighbourhoods under ${profile.preferredCommuteMinutes} min to ${profile.anchorLocation}`,
      phase: 'pre-move',
      category: 'Housing',
      completed: false,
    },
    {
      id: 'task-travel',
      title: `Book travel & luggage shipping to ${cityLabel} before ${moveDateLabel}`,
      phase: 'pre-move',
      category: 'Essentials',
      completed: false,
    },
    {
      id: 'task-pack',
      title: isStudent
        ? 'Pack essentials, seasonal clothes & Aadhaar, admission letter & transcripts'
        : 'Pack essentials, work attire & Aadhaar/PAN, offer letter & bank KYC',
      phase: 'pre-move',
      category: 'Admin',
      completed: false,
    },

    // First 7 Days
    {
      id: 'task-transit',
      title: `Understand the commute: test ${commuteModeLabel} route to ${profile.anchorLocation} & get transit pass`,
      phase: 'arrival-week',
      category: 'Commute',
      completed: false,
    },
    {
      id: 'task-groceries',
      title: `Find nearest grocery stores, tiffin/mess options & 24-hour pharmacy in ${cityLabel}`,
      phase: 'arrival-week',
      category: 'Essentials',
      completed: false,
    },
    {
      id: 'task-utilities',
      title: 'Set up broadband Wi-Fi, drinking water & electricity billing at your stay',
      phase: 'arrival-week',
      category: 'Essentials',
      completed: false,
    },
    {
      id: 'task-lease',
      title: isStudent
        ? 'Confirm PG/hostel house rules, curfew & security deposit receipt'
        : 'Verify signed rental agreement, lock-in period & security deposit receipt',
      phase: 'arrival-week',
      category: 'Housing',
      completed: false,
    },

    // First 30 Days
    {
      id: 'task-budget-check',
      title: `Review first 30 days of spending against your ${formatCurrency(profile.totalMonthlyBudget, profile.currency)}/mo budget`,
      phase: 'first-month',
      category: 'Finance',
      completed: false,
    },
    {
      id: 'task-bank',
      title: isStudent
        ? 'Update local address with bank, UPI/mobile carrier & college portal'
        : 'Update local address with bank, UPI/mobile carrier & HR payroll',
      phase: 'first-month',
      category: 'Finance',
      completed: false,
    },
    {
      id: 'task-clinic',
      title: isStudent
        ? 'Locate campus health centre, parks & study spaces nearby'
        : 'Locate network hospital, gym & weekend essentials around your locality',
      phase: 'first-month',
      category: 'Admin',
      completed: false,
    },
  ];
}

export function getNextRecommendedAction(
  profile: OnboardingProfile,
  tasks: RelocationTask[],
  nowDate: Date = new Date()
): NextActionRecommendation {
  const pending = tasks.filter((t) => !t.completed);
  const progress = calculateProgress(tasks);
  const countdown = calculateCountdown(profile.movingDate, nowDate);
  const cityLabel = profile.destinationCity.split(',')[0].trim();

  if (pending.length === 0) {
    return {
      task: null,
      phaseLabel: 'Settled in',
      timingContext: `100% complete · ${cityLabel}`,
      reason: `All ${progress.total} relocation tasks are checked off. You are all set in ${cityLabel} — add a custom reminder anytime.`,
      alternateTasks: [],
    };
  }

  const days = countdown.daysRemaining;
  const prePending = pending.filter((t) => t.phase === 'pre-move');
  const week1Pending = pending.filter((t) => t.phase === 'arrival-week');
  const month1Pending = pending.filter((t) => t.phase === 'first-month');

  // Determine target phase priority order based on moving date
  let orderedPool: RelocationTask[] = [];
  let timingContext = '';

  if (days > 7) {
    orderedPool = [...prePending, ...week1Pending, ...month1Pending];
    timingContext = `${days} days until move`;
  } else if (days >= 0) {
    // Final countdown week or moving day: prioritize packing/travel if still pending, else First 7 Days
    const urgentPre = [...prePending].sort((a, b) => {
      const weight = (t: RelocationTask) =>
        t.id === 'task-pack' || t.id === 'task-travel'
          ? 0
          : t.id === 'task-arrange-accom'
            ? 1
            : 2;
      return weight(a) - weight(b);
    });
    orderedPool =
      days === 0
        ? [...week1Pending, ...urgentPre, ...month1Pending]
        : [...urgentPre, ...week1Pending, ...month1Pending];
    timingContext =
      days === 0
        ? 'Moving day today'
        : `${days} ${days === 1 ? 'day' : 'days'} until move`;
  } else if (days >= -7) {
    // Currently in First 7 Days after arrival
    const dayInCity = Math.abs(days) + 1;
    orderedPool = [...week1Pending, ...prePending, ...month1Pending];
    timingContext = `Day ${dayInCity} in ${cityLabel} · First 7 Days`;
  } else {
    // Day 8+ after arrival: First 30 Days (surface any lingering First 7 Days first if critical)
    const dayInCity = Math.abs(days) + 1;
    orderedPool = [...week1Pending, ...month1Pending, ...prePending];
    timingContext = `Day ${dayInCity} in ${cityLabel} · First 30 Days`;
  }

  const chosen = orderedPool[0];
  const alternateTasks = orderedPool.slice(1, 3);
  const phaseLabel = PHASE_DISPLAY_NAMES[chosen.phase];

  // Personalized rationale tied to moving date, progress, and user profile
  let reason = '';
  if (chosen.phase === 'pre-move') {
    if (prePending.length === progress.byPhase['pre-move'].total && days > 14) {
      reason = `With ${days} days left before moving to ${cityLabel}, locking in your stay within ${formatCurrency(profile.accommodationBudget, profile.currency)}/mo first keeps the rest of your budget and commute predictable.`;
    } else if (days >= 0 && days <= 7) {
      reason = `Your move to ${cityLabel} is ${days === 0 ? 'today' : `in ${days} ${days === 1 ? 'day' : 'days'}`} (${progress.percentage}% overall progress). Finishing this before departure avoids last-minute arrival stress.`;
    } else {
      reason = `You are ${progress.percentage}% through your move plan with ${days > 0 ? `${days} days to go` : 'arrival underway'}. Completing Before Moving tasks now frees up your First 7 Days.`;
    }
  } else if (chosen.phase === 'arrival-week') {
    if (days > 0 && prePending.length === 0) {
      reason = `Great pace — all Before Moving tasks are done with ${days} days left. Prepare for your First 7 Days near ${profile.anchorLocation} ahead of arrival.`;
    } else if (days <= 0 && days >= -7) {
      reason = `You are in your First 7 Days in ${cityLabel}. Sorting out your ${profile.preferredCommuteMinutes}-minute commute to ${profile.anchorLocation} and daily essentials early makes week one much calmer.`;
    } else {
      reason = `This First 7 Days priority is still open (${progress.completed} of ${progress.total} tasks done). Knocking it out stabilizes your daily routine in ${cityLabel}.`;
    }
  } else {
    reason = `Your core arrival setup is underway (${progress.percentage}% complete). Checking this First 30 Days milestone keeps your ${formatCurrency(profile.totalMonthlyBudget, profile.currency)}/mo budget and local records on track.`;
  }

  return {
    task: chosen,
    phaseLabel,
    timingContext,
    reason,
    alternateTasks,
  };
}

export function getDemoProfile(now: Date = new Date()): OnboardingProfile {
  const target = new Date(now.getTime() + 24 * 24 * 60 * 60 * 1000);
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');

  return {
    destinationCity: 'Bengaluru',
    cityId: 'bengaluru',
    anchorLocation: 'Indiranagar 100ft Rd',
    role: 'graduate',
    movingDate: `${yyyy}-${mm}-${dd}`,
    accommodationBudget: 20000,
    totalMonthlyBudget: 40000,
    preferredCommuteMinutes: 25,
    commuteMode: 'transit',
    currency: 'INR',
  };
}

export function getCategoryLabel(category: AccommodationCategory): string {
  if (category === 'pg') return 'PG';
  if (category === 'shared') return 'Shared Flat';
  return 'Private Room';
}
