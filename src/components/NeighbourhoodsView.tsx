import React, { useMemo, useState } from 'react';
import { Bookmark, Columns3, Info, Search, X } from 'lucide-react';
import { ALL_FACILITY_TAGS, FacilityTag } from '../data/cities';
import {
  OnboardingProfile,
  ScoredNeighbourhood,
  formatCurrency,
} from '../utils/relocationEngine';

interface NeighbourhoodsViewProps {
  profile: OnboardingProfile;
  neighbourhoods: ScoredNeighbourhood[];
  shortlistedIds: string[];
  comparedIds: string[];
  onToggleShortlist: (id: string) => void;
  onToggleCompare: (id: string) => { limitReached: boolean };
  onCompareTopMatches: (ids: string[]) => void;
  onClearCompare: () => void;
  onExploreProperties: (neighbourhoodName: string) => void;
}

type FilterMode = 'all' | 'within-budget' | 'within-commute' | 'shortlisted';
type DistanceFilter = 'any' | '5' | '10';
type SortMode = 'best' | 'rent' | 'distance' | 'commute';

export const NeighbourhoodsView: React.FC<NeighbourhoodsViewProps> = ({
  profile,
  neighbourhoods,
  shortlistedIds,
  comparedIds,
  onToggleShortlist,
  onToggleCompare,
  onCompareTopMatches,
  onClearCompare,
  onExploreProperties,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>('any');
  const [selectedFacilities, setSelectedFacilities] = useState<FacilityTag[]>([]);
  const [sortBy, setSortBy] = useState<SortMode>('best');
  const [limitMessage, setLimitMessage] = useState(false);

  const toggleFacility = (tag: FacilityTag) => {
    setSelectedFacilities((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCompareClick = (id: string) => {
    const res = onToggleCompare(id);
    setLimitMessage(res.limitReached);
  };

  const comparedItems = useMemo(
    () =>
      comparedIds
        .map((id) => neighbourhoods.find((n) => n.id === id))
        .filter((item): item is ScoredNeighbourhood => Boolean(item)),
    [comparedIds, neighbourhoods]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = neighbourhoods.filter((hood) => {
      if (filter === 'within-budget' && hood.budgetFit === 'over') return false;
      if (filter === 'within-commute' && hood.commuteFit === 'far') return false;
      if (filter === 'shortlisted' && !shortlistedIds.includes(hood.id)) return false;

      if (distanceFilter === '5' && hood.distanceKm > 5) return false;
      if (distanceFilter === '10' && hood.distanceKm > 10) return false;

      if (
        selectedFacilities.length > 0 &&
        !selectedFacilities.every((tag) => hood.nearbyFacilities.includes(tag))
      ) {
        return false;
      }

      if (
        q &&
        !hood.name.toLowerCase().includes(q) &&
        !hood.vibe.toLowerCase().includes(q) &&
        !hood.transitLine.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    if (sortBy === 'rent') {
      return [...list].sort((a, b) => a.estimatedRent - b.estimatedRent);
    }
    if (sortBy === 'distance') {
      return [...list].sort((a, b) => a.distanceKm - b.distanceKm);
    }
    if (sortBy === 'commute') {
      return [...list].sort((a, b) => a.estCommuteMinutes - b.estCommuteMinutes);
    }
    return list;
  }, [
    neighbourhoods,
    filter,
    distanceFilter,
    selectedFacilities,
    sortBy,
    search,
    shortlistedIds,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            Target {formatCurrency(profile.accommodationBudget, profile.currency)}/mo
            <span aria-hidden="true"> · </span>
            Max {profile.preferredCommuteMinutes} min from {profile.anchorLocation}
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Explore neighbourhoods in {profile.destinationCity}
          </h1>
        </div>
        <p className="text-xs font-mono text-slate-500 tabular-nums whitespace-nowrap">
          {shortlistedIds.length} shortlisted · {comparedItems.length}/3 comparing
        </p>
      </div>

      {/* Illustrative Sample Data Notice */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-2.5 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          Illustrative sample Indian city estimates calibrated to your onboarding budget and commute target. Confirm current rents, transit schedules, and local conditions before finalizing.
        </p>
      </div>

      {/* Side-by-Side Comparison Matrix (up to 3 neighbourhoods) */}
      {comparedItems.length === 0 ? (
        <section
          className="bg-white border border-slate-200 rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          aria-label="Neighbourhood comparison quick start"
        >
          <div className="flex items-start gap-3">
            <Columns3 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h2 className="font-display text-sm font-semibold text-slate-900">
                Compare up to 3 neighbourhoods side by side
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                See rent, commute time, monthly transportation expenses, and total expected living costs together.
              </p>
            </div>
          </div>
          {neighbourhoods.length >= 2 && (
            <button
              type="button"
              onClick={() =>
                onCompareTopMatches(neighbourhoods.slice(0, 3).map((n) => n.id))
              }
              className="self-start sm:self-auto px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              Compare top {Math.min(3, neighbourhoods.length)} matches
            </button>
          )}
        </section>
      ) : (
        <section
          className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
          aria-labelledby="compare-heading"
          data-testid="neighbourhood-compare-panel"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <Columns3 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <h2
                  id="compare-heading"
                  className="font-display text-base font-semibold text-slate-900"
                >
                  Side-by-side comparison ({comparedItems.length} of 3)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparing rent, commute to {profile.anchorLocation}, transport, and total expected monthly living costs
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClearCompare();
                setLimitMessage(false);
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Clear comparison
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="py-3 px-5 text-xs font-medium text-slate-500 w-52">
                    Decision metric
                  </th>
                  {comparedItems.map((hood) => (
                    <th
                      key={hood.id}
                      className="py-3 px-5 text-xs font-semibold text-slate-900 min-w-[220px]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{hood.name}</span>
                        <button
                          type="button"
                          onClick={() => handleCompareClick(hood.id)}
                          aria-label={`Remove ${hood.name} from comparison`}
                          className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200/60"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                <tr>
                  <td className="py-3 px-5 font-medium text-slate-600">
                    Overall match
                  </td>
                  {comparedItems.map((hood) => (
                    <td key={hood.id} className="py-3 px-5">
                      <span
                        className={`text-xs font-semibold ${
                          hood.matchTier === 'Strong match'
                            ? 'text-green-700'
                            : hood.matchTier === 'Good match'
                              ? 'text-teal-700'
                              : 'text-amber-700'
                        }`}
                      >
                        {hood.matchTier}
                      </span>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {hood.anchorAffinity
                          ? `Near ${profile.anchorLocation}`
                          : hood.walkability}
                      </p>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-5 font-medium text-slate-600">
                    Monthly rent ({comparedItems[0]?.rentFormat || 'Estimated'})
                  </td>
                  {comparedItems.map((hood) => {
                    const rentDiff = profile.accommodationBudget - hood.estimatedRent;
                    return (
                      <td
                        key={hood.id}
                        className="py-3 px-5 tabular-nums"
                      >
                        <p className="font-mono font-semibold text-slate-900">
                          {formatCurrency(hood.estimatedRent, profile.currency)}/mo
                        </p>
                        <p
                          className={`mt-0.5 text-xs ${
                            rentDiff >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {rentDiff >= 0
                            ? `${formatCurrency(rentDiff, profile.currency)} under housing cap`
                            : `${formatCurrency(Math.abs(rentDiff), profile.currency)} over housing cap`}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400 font-mono">
                          Shared {formatCurrency(hood.avgSharedRent, profile.currency)} · Studio{' '}
                          {formatCurrency(hood.avgStudioRent, profile.currency)}
                        </p>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-3 px-5 font-medium text-slate-600">
                    Estimated commute
                  </td>
                  {comparedItems.map((hood) => {
                    const withinTime =
                      hood.estCommuteMinutes <= profile.preferredCommuteMinutes;
                    return (
                      <td
                        key={hood.id}
                        className="py-3 px-5 text-slate-900 tabular-nums"
                      >
                        <p>
                          <span className="font-mono font-semibold">
                            {hood.estCommuteMinutes} min
                          </span>
                          <span className="text-slate-400 mx-1.5" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-mono text-xs text-slate-600">
                            {hood.distanceKm} km
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {hood.transitLine}
                          <span aria-hidden="true"> · </span>
                          <span className={withinTime ? 'text-green-700' : 'text-amber-700'}>
                            {withinTime
                              ? 'Within target'
                              : `+${hood.estCommuteMinutes - profile.preferredCommuteMinutes} min over`}
                          </span>
                        </p>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-3 px-5 font-medium text-slate-600">
                    Transportation expenses
                  </td>
                  {comparedItems.map((hood) => (
                    <td
                      key={hood.id}
                      className="py-3 px-5 tabular-nums"
                    >
                      <p className="font-mono font-semibold text-slate-900">
                        {formatCurrency(hood.estimatedTransportCost, profile.currency)}/mo
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {profile.commuteMode === 'walk_bike'
                          ? 'Walk / cycle pass'
                          : profile.commuteMode === 'car'
                            ? 'Cab / fuel estimate'
                            : hood.nearbyFacilities.includes('Metro')
                              ? 'Metro + short feeder'
                              : 'Bus + last-mile auto'}
                      </p>
                    </td>
                  ))}
                </tr>
                <tr className="bg-slate-50/70">
                  <td className="py-3.5 px-5 font-semibold text-slate-900">
                    Total expected monthly living cost
                  </td>
                  {comparedItems.map((hood) => {
                    const totalDiff =
                      profile.totalMonthlyBudget - hood.totalExpectedMonthlyCost;
                    return (
                      <td
                        key={hood.id}
                        className="py-3.5 px-5 tabular-nums"
                      >
                        <p className="font-mono text-sm font-semibold text-slate-900">
                          {formatCurrency(hood.totalExpectedMonthlyCost, profile.currency)}/mo
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 font-mono">
                          Incl. ~{formatCurrency(hood.estimatedOtherMonthlyCosts, profile.currency)} food &amp; utilities
                        </p>
                        <p
                          className={`mt-0.5 text-xs font-medium ${
                            totalDiff >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}
                        >
                          {totalDiff >= 0
                            ? `${formatCurrency(totalDiff, profile.currency)} under monthly budget`
                            : `${formatCurrency(Math.abs(totalDiff), profile.currency)} over monthly budget`}
                        </p>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-3 px-5 font-medium text-slate-600">
                    Nearby facilities
                  </td>
                  {comparedItems.map((hood) => (
                    <td key={hood.id} className="py-3 px-5 text-xs text-slate-600">
                      {hood.nearbyFacilities.join(' · ')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-5 font-medium text-slate-600">
                    Next step
                  </td>
                  {comparedItems.map((hood) => (
                    <td key={hood.id} className="py-3 px-5">
                      <button
                        type="button"
                        onClick={() => onExploreProperties(hood.name)}
                        className="text-xs font-medium text-teal-700 hover:underline"
                      >
                        Explore homes in {hood.name.split('(')[0].trim()}
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {limitMessage && (
        <div
          role="status"
          className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900"
        >
          <span>
            You can compare up to 3 neighbourhoods at a time. Remove one before adding another.
          </span>
          <button
            type="button"
            onClick={() => setLimitMessage(false)}
            className="font-medium underline whitespace-nowrap"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter & Discovery Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl self-start shrink-0">
            {[
              { id: 'all' as FilterMode, label: 'All areas' },
              { id: 'within-budget' as FilterMode, label: 'Within rent budget' },
              { id: 'within-commute' as FilterMode, label: 'Within commute' },
              { id: 'shortlisted' as FilterMode, label: 'Shortlisted' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  filter === tab.id
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
              <label htmlFor="hood-search" className="sr-only">
                Search neighbourhoods or transit lines
              </label>
              <input
                id="hood-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search area or Metro..."
                className="w-full sm:w-44 pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <label htmlFor="hood-distance" className="text-xs text-slate-500 whitespace-nowrap">
                Distance
              </label>
              <select
                id="hood-distance"
                value={distanceFilter}
                onChange={(e) => setDistanceFilter(e.target.value as DistanceFilter)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
              >
                <option value="any">Any distance</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <label htmlFor="hood-sort" className="text-xs text-slate-500 whitespace-nowrap">
                Sort
              </label>
              <select
                id="hood-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortMode)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
              >
                <option value="best">Best match</option>
                <option value="rent">Lowest rent</option>
                <option value="distance">Nearest distance</option>
                <option value="commute">Shortest commute</option>
              </select>
            </div>
          </div>
        </div>

        {/* Nearby Facilities Multi-Filter */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 mr-1">Nearby facilities:</span>
          {ALL_FACILITY_TAGS.map((tag) => {
            const active = selectedFacilities.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleFacility(tag)}
                aria-pressed={active}
                className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'border-teal-700 bg-teal-50 text-teal-800'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tag}
              </button>
            );
          })}
          {selectedFacilities.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedFacilities([])}
              className="text-xs text-slate-500 hover:text-slate-900 underline ml-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <p className="text-sm font-medium text-slate-900">
            {filter === 'shortlisted' && shortlistedIds.length === 0
              ? 'No shortlisted neighbourhoods yet'
              : 'No neighbourhoods match the current filters'}
          </p>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            {filter === 'shortlisted' && shortlistedIds.length === 0
              ? 'Shortlist 2–3 areas while browsing to keep your top options handy whenever you return.'
              : 'Try widening your distance limit or clearing facility filters.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter('all');
              setDistanceFilter('any');
              setSelectedFacilities([]);
              setSearch('');
            }}
            className="mt-4 px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {filter === 'shortlisted' && shortlistedIds.length === 0
              ? 'Explore all areas'
              : 'Reset all filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((hood) => {
            const isSaved = shortlistedIds.includes(hood.id);
            const isCompared = comparedIds.includes(hood.id);
            const tierColor =
              hood.matchTier === 'Strong match'
                ? 'text-green-700'
                : hood.matchTier === 'Good match'
                  ? 'text-teal-700'
                  : 'text-amber-700';

            return (
              <article
                key={hood.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-base font-semibold text-slate-900">
                        {hood.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-600">{hood.vibe}</p>
                    </div>
                    <span className={`text-xs font-semibold whitespace-nowrap ${tierColor}`}>
                      {hood.matchTier}
                    </span>
                  </div>

                  {/* Why this neighbourhood is a match */}
                  <div className="mt-3.5 rounded-xl bg-slate-50 px-3.5 py-2.5">
                    <p className="text-xs font-medium text-slate-800">
                      Why it matches
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                      {hood.matchReason}
                    </p>
                  </div>

                  {/* Key Monthly & Commute Numbers */}
                  <dl className="mt-3.5 grid grid-cols-3 gap-2 py-2.5 border-y border-slate-100 text-xs tabular-nums">
                    <div>
                      <dt className="text-slate-500">Est. commute</dt>
                      <dd className="mt-0.5 font-mono font-semibold text-slate-900">
                        {hood.estCommuteMinutes} min · {hood.distanceKm} km
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Transport</dt>
                      <dd className="mt-0.5 font-mono font-semibold text-slate-900">
                        {formatCurrency(hood.estimatedTransportCost, profile.currency)}/mo
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Total monthly</dt>
                      <dd className="mt-0.5 font-mono font-semibold text-slate-900">
                        ~{formatCurrency(hood.totalExpectedMonthlyCost, profile.currency)}/mo
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-3 text-xs text-slate-500">
                    {hood.transitLine}
                    <span aria-hidden="true"> · </span>
                    {hood.nearbyFacilities.join(' · ')}
                  </p>

                  <ul className="mt-2.5 space-y-1 text-xs text-slate-600">
                    {hood.highlights.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span
                          className="w-1 h-1 rounded-full bg-slate-400 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
                    <div>
                      <span className="text-slate-500">Shared: </span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatCurrency(hood.avgSharedRent, profile.currency)}
                      </span>
                      <span className="text-slate-400 mx-2" aria-hidden="true">
                        /
                      </span>
                      <span className="text-slate-500">Studio: </span>
                      <span className="font-mono font-semibold text-slate-900">
                        {formatCurrency(hood.avgStudioRent, profile.currency)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onExploreProperties(hood.name)}
                      className="text-xs font-medium text-teal-700 hover:underline whitespace-nowrap"
                    >
                      View homes
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleCompareClick(hood.id)}
                      aria-pressed={isCompared}
                      aria-label={`${isCompared ? 'Remove' : 'Compare'} ${hood.name}`}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap ${
                        isCompared
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Columns3 className="w-3.5 h-3.5" />
                      <span>{isCompared ? 'Comparing' : 'Compare'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleShortlist(hood.id)}
                      aria-pressed={isSaved}
                      aria-label={`${isSaved ? 'Remove' : 'Shortlist'} ${hood.name}`}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap ${
                        isSaved
                          ? 'border-teal-700 bg-teal-50 text-teal-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{isSaved ? 'Shortlisted' : 'Shortlist'}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
