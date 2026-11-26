import React, { useEffect, useState } from 'react';
import { Check, RotateCcw, X } from 'lucide-react';
import {
  CITY_PRESETS,
  CURRENCY_CONFIG,
  CommuteMode,
  CurrencyCode,
  MoverRole,
} from '../data/cities';
import {
  OnboardingErrors,
  OnboardingProfile,
  validateOnboardingAll,
} from '../utils/relocationEngine';

interface MovePlanViewProps {
  isOpen: boolean;
  profile: OnboardingProfile;
  onClose: () => void;
  onSaveProfile: (updated: OnboardingProfile) => void;
  onRestartOnboarding: () => void;
}

export const MovePlanView: React.FC<MovePlanViewProps> = ({
  isOpen,
  profile,
  onClose,
  onSaveProfile,
  onRestartOnboarding,
}) => {
  const [destinationCity, setDestinationCity] = useState(profile.destinationCity);
  const [cityId, setCityId] = useState(profile.cityId);
  const [anchorLocation, setAnchorLocation] = useState(profile.anchorLocation);
  const [role, setRole] = useState<MoverRole>(profile.role);
  const [movingDate, setMovingDate] = useState(profile.movingDate);
  const [currency, setCurrency] = useState<CurrencyCode>(profile.currency);
  const [accommodationBudget, setAccommodationBudget] = useState(
    String(profile.accommodationBudget)
  );
  const [totalMonthlyBudget, setTotalMonthlyBudget] = useState(
    String(profile.totalMonthlyBudget)
  );
  const [preferredCommuteMinutes, setPreferredCommuteMinutes] = useState(
    String(profile.preferredCommuteMinutes)
  );
  const [commuteMode, setCommuteMode] = useState<CommuteMode>(profile.commuteMode);
  const [errors, setErrors] = useState<OnboardingErrors>({});

  useEffect(() => {
    if (!isOpen) return;
    setDestinationCity(profile.destinationCity);
    setCityId(profile.cityId);
    setAnchorLocation(profile.anchorLocation);
    setRole(profile.role);
    setMovingDate(profile.movingDate);
    setCurrency(profile.currency);
    setAccommodationBudget(String(profile.accommodationBudget));
    setTotalMonthlyBudget(String(profile.totalMonthlyBudget));
    setPreferredCommuteMinutes(String(profile.preferredCommuteMinutes));
    setCommuteMode(profile.commuteMode);
    setErrors({});
  }, [isOpen, profile]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCityChange = (value: string) => {
    setDestinationCity(value);
    const matched = CITY_PRESETS.find(
      (c) => c.name.toLowerCase() === value.trim().toLowerCase()
    );
    setCityId(matched ? matched.id : 'custom');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const candidate: OnboardingProfile = {
      destinationCity: destinationCity.trim(),
      cityId,
      anchorLocation: anchorLocation.trim(),
      role,
      movingDate,
      accommodationBudget: Number(accommodationBudget),
      totalMonthlyBudget: Number(totalMonthlyBudget),
      preferredCommuteMinutes: Number(preferredCommuteMinutes),
      commuteMode,
      currency,
    };
    const validation = validateOnboardingAll(candidate);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    onSaveProfile(candidate);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-[2px] sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-plan-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-xl">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h2
              id="move-plan-dialog-title"
              className="font-display text-lg font-semibold text-slate-900"
            >
              Edit move plan
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Changes recalculate area rankings, stays, and monthly budget estimates
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close move plan editor"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="edit-city"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Destination city
              </label>
              <input
                id="edit-city"
                type="text"
                value={destinationCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 ${
                  errors.destinationCity ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.destinationCity && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.destinationCity}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {CITY_PRESETS.slice(0, 5).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setDestinationCity(preset.name);
                      setCityId(preset.id);
                      setCurrency(preset.currency);
                    }}
                    className="text-xs text-teal-700 hover:underline"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="edit-anchor"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                College or office location
              </label>
              <input
                id="edit-anchor"
                type="text"
                value={anchorLocation}
                onChange={(e) => setAnchorLocation(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 ${
                  errors.anchorLocation ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.anchorLocation && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.anchorLocation}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="edit-role"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Relocation type
              </label>
              <select
                id="edit-role"
                value={role}
                onChange={(e) => setRole(e.target.value as MoverRole)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
              >
                <option value="student">College Student</option>
                <option value="graduate">Fresh Graduate</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-date"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Moving date
              </label>
              <input
                id="edit-date"
                type="date"
                value={movingDate}
                onChange={(e) => setMovingDate(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 ${
                  errors.movingDate ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.movingDate && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.movingDate}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-currency"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Currency
              </label>
              <select
                id="edit-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
              >
                {(Object.keys(CURRENCY_CONFIG) as CurrencyCode[]).map((code) => (
                  <option key={code} value={code}>
                    {code} ({CURRENCY_CONFIG[code].symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="edit-accomm"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Accommodation budget
              </label>
              <input
                id="edit-accomm"
                type="number"
                min={1}
                value={accommodationBudget}
                onChange={(e) => setAccommodationBudget(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 ${
                  errors.accommodationBudget ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.accommodationBudget && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.accommodationBudget}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-total"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Total monthly budget
              </label>
              <input
                id="edit-total"
                type="number"
                min={1}
                value={totalMonthlyBudget}
                onChange={(e) => setTotalMonthlyBudget(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 ${
                  errors.totalMonthlyBudget ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.totalMonthlyBudget && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.totalMonthlyBudget}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit-commute"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Max commute (min)
              </label>
              <input
                id="edit-commute"
                type="number"
                min={5}
                max={120}
                value={preferredCommuteMinutes}
                onChange={(e) => setPreferredCommuteMinutes(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 ${
                  errors.preferredCommuteMinutes
                    ? 'border-red-500'
                    : 'border-slate-200'
                }`}
              />
              {errors.preferredCommuteMinutes && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {errors.preferredCommuteMinutes}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-mode"
              className="block text-sm font-medium text-slate-800 mb-1.5"
            >
              Primary commute mode
            </label>
            <select
              id="edit-mode"
              value={commuteMode}
              onChange={(e) => setCommuteMode(e.target.value as CommuteMode)}
              className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
            >
              <option value="transit">Public Transit</option>
              <option value="walk_bike">Walk / Bike</option>
              <option value="car">Car / Cab</option>
            </select>
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onClose();
                onRestartOnboarding();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-700 transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset &amp; restart onboarding</span>
            </button>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors whitespace-nowrap"
              >
                <Check className="w-4 h-4" />
                <span>Save changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
