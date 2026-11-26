import React, { useMemo, useState } from 'react';
import { Bookmark, Check, Info, Search, Wallet } from 'lucide-react';
import { AccommodationCategory } from '../data/cities';
import {
  OnboardingProfile,
  ScoredAccommodation,
  formatCurrency,
  getCategoryLabel,
} from '../utils/relocationEngine';

interface AccommodationViewProps {
  profile: OnboardingProfile;
  listings: ScoredAccommodation[];
  savedPropertyIds: string[];
  initialSearch?: string;
  initialFilter?: TypeFilter;
  onToggleSaveProperty: (id: string) => void;
  onApplyToBudget: (listing: ScoredAccommodation) => void;
}

type TypeFilter = 'all' | AccommodationCategory | 'saved';
type SortMode = 'best' | 'rent' | 'deposit' | 'commute';

export const AccommodationView: React.FC<AccommodationViewProps> = ({
  profile,
  listings,
  savedPropertyIds,
  initialSearch = '',
  initialFilter = 'all',
  onToggleSaveProperty,
  onApplyToBudget,
}) => {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(initialFilter);
  const [withinBudgetOnly, setWithinBudgetOnly] = useState(false);
  const [withinCommuteOnly, setWithinCommuteOnly] = useState(false);
  const [brokerageFreeOnly, setBrokerageFreeOnly] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<SortMode>('best');
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const savedListings = useMemo(
    () => listings.filter((item) => savedPropertyIds.includes(item.id)),
    [listings, savedPropertyIds]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = listings.filter((item) => {
      if (typeFilter === 'saved' && !savedPropertyIds.includes(item.id)) {
        return false;
      }
      if (
        typeFilter !== 'all' &&
        typeFilter !== 'saved' &&
        item.category !== typeFilter
      ) {
        return false;
      }
      if (withinBudgetOnly && item.budgetFit === 'over') return false;
      if (withinCommuteOnly && item.commuteFit === 'far') return false;
      if (brokerageFreeOnly && !item.brokerageFree) return false;
      if (
        q &&
        !item.title.toLowerCase().includes(q) &&
        !item.neighbourhoodName.toLowerCase().includes(q) &&
        !item.roomType.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    if (sortBy === 'rent') {
      return [...result].sort((a, b) => a.monthlyRent - b.monthlyRent);
    }
    if (sortBy === 'deposit') {
      return [...result].sort((a, b) => a.securityDeposit - b.securityDeposit);
    }
    if (sortBy === 'commute') {
      return [...result].sort((a, b) => a.estCommuteMinutes - b.estCommuteMinutes);
    }
    return result;
  }, [
    listings,
    typeFilter,
    withinBudgetOnly,
    withinCommuteOnly,
    brokerageFreeOnly,
    search,
    sortBy,
    savedPropertyIds,
  ]);

  const handleApply = (listing: ScoredAccommodation) => {
    onApplyToBudget(listing);
    setAppliedId(listing.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            Housing cap {formatCurrency(profile.accommodationBudget, profile.currency)}/mo
            <span aria-hidden="true"> · </span>
            Max {profile.preferredCommuteMinutes} min to {profile.anchorLocation}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Stays in {profile.destinationCity}
          </h1>
        </div>
        <p className="text-xs font-mono text-slate-500 tabular-nums whitespace-nowrap">
          {savedPropertyIds.length} saved{' '}
          {savedPropertyIds.length === 1 ? 'property' : 'properties'}
        </p>
      </div>

      {/* Illustrative Sample Data Notice */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          Illustrative sample Indian rental options (PGs, shared flats, and private rooms) calibrated to your onboarding preferences. Compare monthly rent, deposit multiples, and Day-1 move-in cash before shortlisting.
        </p>
      </div>

      {/* Saved & Shortlisted Properties Revisit Panel */}
      {savedListings.length > 0 && (
        <section
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
          aria-labelledby="saved-shortlist-heading"
          data-testid="saved-properties-panel"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Bookmark className="w-4 h-4 text-teal-700" aria-hidden="true" />
              <div>
                <h2
                  id="saved-shortlist-heading"
                  className="font-display text-base font-semibold text-slate-900"
                >
                  Shortlisted properties ({savedListings.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Revisit your saved stays and compare monthly rent, security deposit, and Day-1 move-in cash
                </p>
              </div>
            </div>
            {typeFilter !== 'saved' && (
              <button
                type="button"
                onClick={() => setTypeFilter('saved')}
                className="text-xs font-medium text-teal-700 hover:underline whitespace-nowrap"
              >
                Show only saved
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-2.5 px-5">Property</th>
                  <th className="py-2.5 px-4">Monthly rent</th>
                  <th className="py-2.5 px-4">Security deposit</th>
                  <th className="py-2.5 px-4">Move-in cash</th>
                  <th className="py-2.5 px-4">Commute</th>
                  <th className="py-2.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 tabular-nums">
                {savedListings.map((item) => {
                  const isApplied = appliedId === item.id;
                  return (
                    <tr key={item.id}>
                      <td className="py-3 px-5">
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">
                          {getCategoryLabel(item.category)} · {item.neighbourhoodName}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(item.monthlyRent, profile.currency)}/mo
                        </p>
                        <p
                          className={`text-xs ${
                            item.rentDelta >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {item.rentDelta >= 0
                            ? `${formatCurrency(item.rentDelta, profile.currency)} under cap`
                            : `${formatCurrency(Math.abs(item.rentDelta), profile.currency)} over cap`}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(item.securityDeposit, profile.currency)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.depositMonths}x rent
                        </p>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {formatCurrency(item.upfrontMoveInCost, profile.currency)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {item.estCommuteMinutes} min
                      </td>
                      <td className="py-3 px-5 text-right whitespace-nowrap space-x-3">
                        <button
                          type="button"
                          onClick={() => handleApply(item)}
                          className="text-xs font-medium text-teal-700 hover:underline"
                        >
                          {isApplied ? 'Synced to budget' : 'Use in budget'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleSaveProperty(item.id)}
                          aria-label={`Remove ${item.title} from saved`}
                          className="text-xs font-medium text-slate-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl self-start shrink-0">
            {[
              { id: 'all' as TypeFilter, label: 'All types' },
              { id: 'pg' as TypeFilter, label: 'PGs' },
              { id: 'shared' as TypeFilter, label: 'Shared flats' },
              { id: 'private' as TypeFilter, label: 'Private rooms' },
              {
                id: 'saved' as TypeFilter,
                label: `Saved (${savedPropertyIds.length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  typeFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <label htmlFor="acc-search" className="sr-only">
                Search properties or neighbourhoods
              </label>
              <input
                id="acc-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search locality or room..."
                className="w-full sm:w-48 pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <label htmlFor="acc-sort" className="text-xs text-slate-500 whitespace-nowrap">
                Sort
              </label>
              <select
                id="acc-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortMode)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
              >
                <option value="best">Best match</option>
                <option value="rent">Lowest rent</option>
                <option value="deposit">Lowest deposit</option>
                <option value="commute">Shortest commute</option>
              </select>
            </div>
          </div>
        </div>

        {/* Toggle Chips */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setWithinBudgetOnly((v) => !v)}
            aria-pressed={withinBudgetOnly}
            className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap ${
              withinBudgetOnly
                ? 'border-teal-700 bg-teal-50 text-teal-800'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Within housing budget
          </button>
          <button
            type="button"
            onClick={() => setWithinCommuteOnly((v) => !v)}
            aria-pressed={withinCommuteOnly}
            className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap ${
              withinCommuteOnly
                ? 'border-teal-700 bg-teal-50 text-teal-800'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Within {profile.preferredCommuteMinutes} min commute
          </button>
          <button
            type="button"
            onClick={() => setBrokerageFreeOnly((v) => !v)}
            aria-pressed={brokerageFreeOnly}
            className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap ${
              brokerageFreeOnly
                ? 'border-teal-700 bg-teal-50 text-teal-800'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Zero brokerage
          </button>
        </div>
      </div>

      {/* Property Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <p className="text-sm font-medium text-slate-900">
            {typeFilter === 'saved' && savedListings.length === 0
              ? 'No saved properties yet'
              : 'No properties match these filters'}
          </p>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            {typeFilter === 'saved' && savedListings.length === 0
              ? 'Save PGs, shared flats, or private rooms while browsing to compare monthly rent, deposits, and commute anytime.'
              : 'Try switching property type or clearing budget and commute constraints.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setTypeFilter('all');
              setWithinBudgetOnly(false);
              setWithinCommuteOnly(false);
              setBrokerageFreeOnly(false);
              setSearch('');
            }}
            className="mt-4 px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {typeFilter === 'saved' && savedListings.length === 0
              ? 'Browse all properties'
              : 'Reset filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((item) => {
            const isSaved = savedPropertyIds.includes(item.id);
            const isApplied = appliedId === item.id;
            const fitText =
              item.budgetFit === 'within'
                ? 'Within budget'
                : item.budgetFit === 'tight'
                  ? 'Near limit'
                  : 'Above budget';
            const fitColor =
              item.budgetFit === 'within'
                ? 'text-green-700'
                : item.budgetFit === 'tight'
                  ? 'text-amber-700'
                  : 'text-red-700';

            return (
              <article
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500">
                        {getCategoryLabel(item.category)}
                        <span aria-hidden="true"> · </span>
                        {item.neighbourhoodName}
                      </p>
                      <h2 className="mt-1 font-display text-base font-semibold text-slate-900">
                        {item.title}
                      </h2>
                    </div>
                    <span className={`text-xs font-medium whitespace-nowrap ${fitColor}`}>
                      {fitText}
                    </span>
                  </div>

                  <p className="mt-1.5 text-sm text-slate-600">{item.roomType}</p>

                  {/* Key Financial & Commute Comparison Grid */}
                  <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100 text-xs tabular-nums">
                    <div>
                      <dt className="text-slate-500">Monthly rent</dt>
                      <dd className="mt-0.5 font-mono text-sm font-semibold text-slate-900">
                        {formatCurrency(item.monthlyRent, profile.currency)}
                      </dd>
                      <dd
                        className={`mt-0.5 text-xs ${
                          item.rentDelta >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {item.rentDelta >= 0
                          ? `${formatCurrency(item.rentDelta, profile.currency)} under`
                          : `${formatCurrency(Math.abs(item.rentDelta), profile.currency)} over`}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Security deposit</dt>
                      <dd className="mt-0.5 font-mono text-sm font-semibold text-slate-900">
                        {formatCurrency(item.securityDeposit, profile.currency)}
                      </dd>
                      <dd className="mt-0.5 text-xs text-slate-500 font-mono">
                        {item.depositMonths}x rent
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Move-in cash</dt>
                      <dd className="mt-0.5 font-mono text-sm font-semibold text-slate-900">
                        {formatCurrency(item.upfrontMoveInCost, profile.currency)}
                      </dd>
                      <dd className="mt-0.5 text-xs text-slate-500">
                        Rent + deposit
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Est. commute</dt>
                      <dd className="mt-0.5 font-mono text-sm font-semibold text-slate-900">
                        {item.estCommuteMinutes} min
                      </dd>
                      <dd className="mt-0.5 text-xs text-slate-500 font-mono">
                        {item.distanceKm} km
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-3 text-xs text-slate-700 leading-relaxed">
                    {item.decisionNote}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {item.furnishing}
                    <span aria-hidden="true"> · </span>
                    {item.brokerageFree ? 'Zero brokerage' : 'Standard brokerage'}
                    <span aria-hidden="true"> · </span>
                    {item.amenities.join(' · ')}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onToggleSaveProperty(item.id)}
                    aria-pressed={isSaved}
                    aria-label={`${isSaved ? 'Remove' : 'Save'} ${item.title}`}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap ${
                      isSaved
                        ? 'border-teal-700 bg-teal-50 text-teal-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{isSaved ? 'Saved' : 'Save property'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApply(item)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap ${
                      isApplied
                        ? 'border-green-700 bg-green-50 text-green-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Synced to budget</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Use in budget</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
