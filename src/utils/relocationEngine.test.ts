import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDefaultExpenses,
  buildDefaultTasks,
  buildOneTimeSetupCosts,
  calculateCountdown,
  calculateExpenseSummary,
  calculateProgress,
  getDemoProfile,
  getNextRecommendedAction,
  recommendAccommodations,
  recommendNeighbourhoods,
  toggleCompareNeighbourhood,
  validateOnboardingAll,
} from './relocationEngine';

test('validateOnboardingAll rejects missing fields and accommodation exceeding total budget', () => {
  const emptyErrors = validateOnboardingAll({});
  assert.ok(emptyErrors.destinationCity);
  assert.ok(emptyErrors.anchorLocation);
  assert.ok(emptyErrors.movingDate);
  assert.ok(emptyErrors.accommodationBudget);
  assert.ok(emptyErrors.totalMonthlyBudget);
  assert.ok(emptyErrors.preferredCommuteMinutes);

  const budgetErrors = validateOnboardingAll({
    destinationCity: 'Pune',
    anchorLocation: 'Viman Nagar',
    movingDate: '2026-12-15',
    accommodationBudget: 35000,
    totalMonthlyBudget: 30000,
    preferredCommuteMinutes: 20,
  });
  assert.ok(budgetErrors.accommodationBudget);
  assert.equal(budgetErrors.totalMonthlyBudget, undefined);
});

test('calculateCountdown handles upcoming, moving-day, and settled dates cleanly', () => {
  const base = new Date(2026, 10, 25);
  const upcoming = calculateCountdown('2026-12-05', base);
  assert.equal(upcoming.daysRemaining, 10);
  assert.equal(upcoming.status, 'upcoming');
  assert.equal(upcoming.headline, '10 days');

  const today = calculateCountdown('2026-11-25', base);
  assert.equal(today.daysRemaining, 0);
  assert.equal(today.status, 'moving-day');
  assert.equal(today.headline, 'Today');

  const settled = calculateCountdown('2026-11-20', base);
  assert.equal(settled.daysRemaining, -5);
  assert.equal(settled.status, 'settled');
  assert.equal(settled.headline, 'Day 6');
});

test('recommendNeighbourhoods ranks Indian city neighbourhoods with distance and facilities', () => {
  const profile = getDemoProfile(new Date(2026, 10, 25));
  const ranked = recommendNeighbourhoods(profile);
  assert.ok(ranked.length >= 4);
  assert.equal(ranked[0].id, 'blr-indiranagar');
  assert.ok(ranked[0].distanceKm > 0);
  assert.ok(ranked[0].nearbyFacilities.includes('Metro'));
});

test('toggleCompareNeighbourhood enforces maximum of 3 neighbourhoods', () => {
  let ids: string[] = [];
  ids = toggleCompareNeighbourhood(ids, 'a').nextIds;
  ids = toggleCompareNeighbourhood(ids, 'b').nextIds;
  ids = toggleCompareNeighbourhood(ids, 'c').nextIds;
  assert.deepEqual(ids, ['a', 'b', 'c']);

  const fourth = toggleCompareNeighbourhood(ids, 'd');
  assert.equal(fourth.limitReached, true);
  assert.deepEqual(fourth.nextIds, ['a', 'b', 'c']);

  const removed = toggleCompareNeighbourhood(ids, 'b');
  assert.equal(removed.limitReached, false);
  assert.deepEqual(removed.nextIds, ['a', 'c']);
});

test('recommendAccommodations returns PGs, shared flats, and private rooms with deposits', () => {
  const profile = getDemoProfile(new Date(2026, 10, 25));
  const listings = recommendAccommodations(profile);
  const categories = new Set(listings.map((l) => l.category));
  assert.ok(categories.has('pg'));
  assert.ok(categories.has('shared'));
  assert.ok(categories.has('private'));
  assert.ok(listings.every((l) => l.securityDeposit > 0 && l.estCommuteMinutes > 0));

  const customListings = recommendAccommodations({
    ...profile,
    destinationCity: 'Jaipur',
    cityId: 'custom',
    anchorLocation: 'MNIT Campus',
  });
  assert.equal(customListings.length, 3);
});

test('calculateProgress, monthly expenses, and one-time setup costs compute exact totals', () => {
  const profile = getDemoProfile();
  const tasks = buildDefaultTasks(profile);
  tasks[0].completed = true;
  tasks[1].completed = true;
  const progress = calculateProgress(tasks);
  assert.equal(progress.completed, 2);
  assert.equal(progress.total, tasks.length);

  const expenses = buildDefaultExpenses(profile);
  const summary = calculateExpenseSummary(profile, expenses);
  assert.equal(
    summary.totalEstimated,
    expenses.rent +
      expenses.food +
      expenses.transport +
      expenses.utilities +
      expenses.personal
  );

  const oneTime = buildOneTimeSetupCosts(profile);
  assert.ok(oneTime.some((item) => item.category === 'Deposit'));
  assert.ok(oneTime.some((item) => item.category === 'Travel'));
});

test('getNextRecommendedAction personalizes recommendation by moving date and progress', () => {
  const now = new Date(2026, 10, 25); // Nov 25, 2026

  // 1. User 24 days before moving -> Before Moving accommodation task
  const futureProfile = getDemoProfile(now);
  const futureTasks = buildDefaultTasks(futureProfile);
  const recFuture = getNextRecommendedAction(futureProfile, futureTasks, now);
  assert.equal(recFuture.task?.phase, 'pre-move');
  assert.equal(recFuture.task?.id, 'task-arrange-accom');
  assert.ok(recFuture.reason.includes('Bengaluru'));

  // 2. If all Before Moving tasks are completed early, it advances to First 7 Days
  const advancedTasks = futureTasks.map((t) =>
    t.phase === 'pre-move' ? { ...t, completed: true } : t
  );
  const recAhead = getNextRecommendedAction(futureProfile, advancedTasks, now);
  assert.equal(recAhead.task?.phase, 'arrival-week');
  assert.equal(recAhead.phaseLabel, 'First 7 Days');

  // 3. User on Day 3 after arriving in Pune -> First 7 Days commute/groceries recommendation
  const settledProfile = {
    ...futureProfile,
    destinationCity: 'Pune',
    cityId: 'pune',
    anchorLocation: 'Viman Nagar IT Park',
    movingDate: '2026-11-23', // 2 days ago -> Day 3 in city
  };
  const settledTasks = buildDefaultTasks(settledProfile);
  const recSettled = getNextRecommendedAction(settledProfile, settledTasks, now);
  assert.equal(recSettled.task?.phase, 'arrival-week');
  assert.ok(recSettled.timingContext.includes('Day 3 in Pune'));
  assert.ok(recSettled.reason.includes('Viman Nagar IT Park'));

  // 4. All tasks complete -> null task with settled message
  const allDone = settledTasks.map((t) => ({ ...t, completed: true }));
  const recDone = getNextRecommendedAction(settledProfile, allDone, now);
  assert.equal(recDone.task, null);
  assert.ok(recDone.timingContext.includes('100% complete'));
});

test('recommendNeighbourhoods factors office location, transport expense, total living cost & match reasons', () => {
  const base = getDemoProfile(new Date(2026, 10, 25));

  // Changing anchorLocation to IISc Malleshwaram should rank Malleshwaram #1
  const studentIisc = {
    ...base,
    role: 'student' as const,
    anchorLocation: 'IISc Malleshwaram',
    accommodationBudget: 16000,
    totalMonthlyBudget: 30000,
    preferredCommuteMinutes: 20,
    commuteMode: 'walk_bike' as const,
  };
  const rankedIisc = recommendNeighbourhoods(studentIisc);
  assert.equal(rankedIisc[0].id, 'blr-malleshwaram');
  assert.equal(rankedIisc[0].anchorAffinity, true);
  assert.equal(rankedIisc[0].matchTier, 'Strong match');
  assert.ok(rankedIisc[0].matchReason.includes('IISc Malleshwaram'));
  assert.ok(
    rankedIisc[0].totalExpectedMonthlyCost > rankedIisc[0].estimatedRent + rankedIisc[0].estimatedTransportCost
  );

  // Car commute should produce higher estimated transport cost than walk_bike
  const carProfile = { ...studentIisc, commuteMode: 'car' as const };
  const rankedCar = recommendNeighbourhoods(carProfile);
  const malleshCar = rankedCar.find((h) => h.id === 'blr-malleshwaram')!;
  assert.ok(malleshCar.estimatedTransportCost > rankedIisc[0].estimatedTransportCost);
});

test('recommendAccommodations computes deposit ratio, upfront cash & budget exceedance flags', () => {
  const base = getDemoProfile(new Date(2026, 10, 25));
  const listings = recommendAccommodations(base);
  for (const item of listings) {
    assert.equal(item.upfrontMoveInCost, item.monthlyRent + item.securityDeposit);
    assert.ok(item.depositMonths > 0);
    assert.ok(item.decisionNote.length > 10);
  }

  // Over-budget expense summary computes exact exceedance
  const expenses = {
    rent: 24000,
    food: 10000,
    transport: 3500,
    utilities: 4000,
    personal: 3500,
  };
  const summary = calculateExpenseSummary(base, expenses);
  assert.equal(summary.status, 'over');
  assert.equal(summary.rentExceededBy, 4000);
  assert.equal(summary.totalExceededBy, 5000);
});

