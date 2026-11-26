import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  Clock,
  GraduationCap,
  MapPin,
  Wallet,
} from 'lucide-react';
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
  calculateCountdown,
  formatCurrency,
  validateOnboardingStep1,
  validateOnboardingStep2,
} from '../utils/relocationEngine';

interface OnboardingWizardProps {
  onComplete: (profile: OnboardingProfile) => void;
  onUseDemo: () => void;
}

function getDefaultMoveDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
  onUseDemo,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<MoverRole>('student');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [destinationCity, setDestinationCity] = useState<string>('');
  const [anchorLocation, setAnchorLocation] = useState<string>('');
  const [movingDate, setMovingDate] = useState<string>(getDefaultMoveDate());
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [accommodationBudget, setAccommodationBudget] = useState<string>('');
  const [totalMonthlyBudget, setTotalMonthlyBudget] = useState<string>('');
  const [preferredCommuteMinutes, setPreferredCommuteMinutes] = useState<string>('25');
  const [commuteMode, setCommuteMode] = useState<CommuteMode>('transit');
  const [errors, setErrors] = useState<OnboardingErrors>({});

  const activePreset = useMemo(
    () => CITY_PRESETS.find((c) => c.id === selectedCityId) || null,
    [selectedCityId]
  );

  const handleSelectCityPreset = (presetId: string) => {
    const preset = CITY_PRESETS.find((c) => c.id === presetId);
    if (!preset) return;
    setSelectedCityId(preset.id);
    setDestinationCity(preset.name);
    setCurrency(preset.currency);
    setAccommodationBudget(String(preset.suggestedHousingBudget));
    setTotalMonthlyBudget(String(preset.suggestedTotalBudget));
    setErrors((prev) => ({
      ...prev,
      destinationCity: undefined,
      accommodationBudget: undefined,
      totalMonthlyBudget: undefined,
    }));
  };

  const handleCustomCityInput = (value: string) => {
    setDestinationCity(value);
    const matched = CITY_PRESETS.find(
      (c) => c.name.toLowerCase() === value.trim().toLowerCase()
    );
    setSelectedCityId(matched ? matched.id : 'custom');
    if (matched) {
      setCurrency(matched.currency);
    }
    if (errors.destinationCity) {
      setErrors((prev) => ({ ...prev, destinationCity: undefined }));
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    const step1Errors = validateOnboardingStep1({
      destinationCity,
      anchorLocation,
      movingDate,
    });
    if (Object.keys(step1Errors).length > 0) {
      setErrors(step1Errors);
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const accommNum = Number(accommodationBudget);
    const totalNum = Number(totalMonthlyBudget);
    const commuteNum = Number(preferredCommuteMinutes);

    const step2Errors = validateOnboardingStep2({
      accommodationBudget: accommNum,
      totalMonthlyBudget: totalNum,
      preferredCommuteMinutes: commuteNum,
    });

    if (Object.keys(step2Errors).length > 0) {
      setErrors(step2Errors);
      return;
    }

    onComplete({
      destinationCity: destinationCity.trim(),
      cityId: selectedCityId || 'custom',
      anchorLocation: anchorLocation.trim(),
      role,
      movingDate,
      accommodationBudget: accommNum,
      totalMonthlyBudget: totalNum,
      preferredCommuteMinutes: commuteNum,
      commuteMode,
      currency,
    });
  };

  const countdownPreview = useMemo(
    () => calculateCountdown(movingDate),
    [movingDate]
  );

  const accommNum = Number(accommodationBudget) || 0;
  const totalNum = Number(totalMonthlyBudget) || 0;
  const remainingPreview = Math.max(0, totalNum - accommNum);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Clean 3-zone header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
            SettleIn
          </span>
          <div className="hidden sm:flex items-center gap-6 text-sm text-slate-500">
            <span className={step === 1 ? 'font-medium text-slate-900' : ''}>
              1. Destination &amp; Date
            </span>
            <span aria-hidden="true">/</span>
            <span className={step === 2 ? 'font-medium text-slate-900' : ''}>
              2. Budget &amp; Commute
            </span>
          </div>
          <button
            type="button"
            onClick={onUseDemo}
            className="text-sm font-medium text-teal-700 hover:text-teal-800 transition-colors whitespace-nowrap shrink-0"
          >
            Preview sample plan
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left: Onboarding Form */}
          <div className="lg:col-span-7">
            <div className="mb-8">
              <p className="text-xs font-medium text-teal-700 mb-2">
                Step {step} of 2
              </p>
              <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 text-balance">
                {step === 1
                  ? 'Plan your move without the guesswork'
                  : 'Set your monthly budget and commute'}
              </h1>
              <p className="mt-2.5 text-base text-slate-600 max-w-xl">
                {step === 1
                  ? 'Tell us where you are heading and when you arrive. We will tailor neighbourhoods, costs, and your checklist around your routine.'
                  : 'Your housing ceiling and commute limit help filter areas that fit both your wallet and your daily schedule.'}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
              {step === 1 ? (
                <form onSubmit={handleNextStep} noValidate className="space-y-6">
                  {/* Role */}
                  <div>
                    <span className="block text-sm font-medium text-slate-800 mb-2">
                      I am relocating as a
                    </span>
                    <div
                      className="grid grid-cols-2 gap-3"
                      role="radiogroup"
                      aria-label="Relocation role"
                    >
                      <button
                        type="button"
                        onClick={() => setRole('student')}
                        aria-pressed={role === 'student'}
                        className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${
                          role === 'student'
                            ? 'border-teal-700 bg-teal-50/70 text-teal-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <GraduationCap className="w-4 h-4 shrink-0" />
                        <span>College Student</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('graduate')}
                        aria-pressed={role === 'graduate'}
                        className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${
                          role === 'graduate'
                            ? 'border-teal-700 bg-teal-50/70 text-teal-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <Building2 className="w-4 h-4 shrink-0" />
                        <span>Fresh Graduate</span>
                      </button>
                    </div>
                  </div>

                  {/* Destination City */}
                  <div>
                    <label
                      htmlFor="destination-city"
                      className="block text-sm font-medium text-slate-800 mb-2"
                    >
                      Destination city
                    </label>
                    <input
                      id="destination-city"
                      type="text"
                      value={destinationCity}
                      onChange={(e) => handleCustomCityInput(e.target.value)}
                      placeholder="Type any city (e.g. Bengaluru, Pune, Hyderabad)"
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 ${
                        errors.destinationCity
                          ? 'border-red-500'
                          : 'border-slate-200'
                      }`}
                    />
                    {errors.destinationCity && (
                      <p className="mt-1.5 text-xs text-red-600" role="alert">
                        {errors.destinationCity}
                      </p>
                    )}

                    <div className="mt-3">
                      <p className="text-xs text-slate-500 mb-2">
                        Illustrative Indian city hubs:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {CITY_PRESETS.map((city) => {
                          const isSelected = selectedCityId === city.id;
                          return (
                            <button
                              key={city.id}
                              type="button"
                              onClick={() => handleSelectCityPreset(city.id)}
                              className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                                isSelected
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {city.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Anchor Location */}
                  <div>
                    <label
                      htmlFor="anchor-location"
                      className="block text-sm font-medium text-slate-800 mb-2"
                    >
                      {role === 'student'
                        ? 'College or campus location'
                        : 'Office or workplace location'}
                    </label>
                    <input
                      id="anchor-location"
                      type="text"
                      value={anchorLocation}
                      onChange={(e) => {
                        setAnchorLocation(e.target.value);
                        if (errors.anchorLocation) {
                          setErrors((prev) => ({ ...prev, anchorLocation: undefined }));
                        }
                      }}
                      placeholder={
                        activePreset
                          ? activePreset.defaultAnchorPlaceholder
                          : 'e.g. Main University Campus or Downtown Tech Hub'
                      }
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 ${
                        errors.anchorLocation
                          ? 'border-red-500'
                          : 'border-slate-200'
                      }`}
                    />
                    {errors.anchorLocation && (
                      <p className="mt-1.5 text-xs text-red-600" role="alert">
                        {errors.anchorLocation}
                      </p>
                    )}

                    {activePreset && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>Suggestions:</span>
                        {activePreset.sampleAnchors.map((sample) => (
                          <button
                            key={sample}
                            type="button"
                            onClick={() => {
                              setAnchorLocation(sample);
                              setErrors((prev) => ({ ...prev, anchorLocation: undefined }));
                            }}
                            className="text-teal-700 hover:underline font-medium"
                          >
                            {sample}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Moving Date */}
                  <div>
                    <label
                      htmlFor="moving-date"
                      className="block text-sm font-medium text-slate-800 mb-2"
                    >
                      Target moving date
                    </label>
                    <input
                      id="moving-date"
                      type="date"
                      value={movingDate}
                      onChange={(e) => {
                        setMovingDate(e.target.value);
                        if (errors.movingDate) {
                          setErrors((prev) => ({ ...prev, movingDate: undefined }));
                        }
                      }}
                      className={`w-full sm:w-64 px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 ${
                        errors.movingDate ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {errors.movingDate && (
                      <p className="mt-1.5 text-xs text-red-600" role="alert">
                        {errors.movingDate}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 transition-colors whitespace-nowrap"
                    >
                      <span>Continue to budgets</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {/* Currency + Budgets */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label
                        htmlFor="currency-select"
                        className="block text-sm font-medium text-slate-800 mb-2"
                      >
                        Currency
                      </label>
                      <select
                        id="currency-select"
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
                      >
                        {(Object.keys(CURRENCY_CONFIG) as CurrencyCode[]).map(
                          (code) => (
                            <option key={code} value={code}>
                              {code} ({CURRENCY_CONFIG[code].symbol})
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="accommodation-budget"
                        className="block text-sm font-medium text-slate-800 mb-2"
                      >
                        Accommodation / mo
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                          {CURRENCY_CONFIG[currency].symbol}
                        </span>
                        <input
                          id="accommodation-budget"
                          type="number"
                          min={1}
                          value={accommodationBudget}
                          onChange={(e) => {
                            setAccommodationBudget(e.target.value);
                            if (errors.accommodationBudget) {
                              setErrors((prev) => ({
                                ...prev,
                                accommodationBudget: undefined,
                              }));
                            }
                          }}
                          placeholder="1500"
                          className={`w-full pl-8 pr-3.5 py-2.5 rounded-lg border text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 ${
                            errors.accommodationBudget
                              ? 'border-red-500'
                              : 'border-slate-200'
                          }`}
                        />
                      </div>
                      {errors.accommodationBudget && (
                        <p className="mt-1.5 text-xs text-red-600" role="alert">
                          {errors.accommodationBudget}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="total-budget"
                        className="block text-sm font-medium text-slate-800 mb-2"
                      >
                        Total monthly budget
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                          {CURRENCY_CONFIG[currency].symbol}
                        </span>
                        <input
                          id="total-budget"
                          type="number"
                          min={1}
                          value={totalMonthlyBudget}
                          onChange={(e) => {
                            setTotalMonthlyBudget(e.target.value);
                            if (errors.totalMonthlyBudget) {
                              setErrors((prev) => ({
                                ...prev,
                                totalMonthlyBudget: undefined,
                              }));
                            }
                          }}
                          placeholder="2600"
                          className={`w-full pl-8 pr-3.5 py-2.5 rounded-lg border text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 ${
                            errors.totalMonthlyBudget
                              ? 'border-red-500'
                              : 'border-slate-200'
                          }`}
                        />
                      </div>
                      {errors.totalMonthlyBudget && (
                        <p className="mt-1.5 text-xs text-red-600" role="alert">
                          {errors.totalMonthlyBudget}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Preferred Commute Time */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        htmlFor="commute-minutes"
                        className="text-sm font-medium text-slate-800"
                      >
                        Preferred maximum commute (one-way)
                      </label>
                      <span className="text-sm font-mono font-medium text-teal-700 tabular-nums">
                        {preferredCommuteMinutes || 0} min
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={10}
                        max={60}
                        step={5}
                        aria-label="Preferred commute slider"
                        value={Math.min(60, Math.max(10, Number(preferredCommuteMinutes) || 25))}
                        onChange={(e) => {
                          setPreferredCommuteMinutes(e.target.value);
                          if (errors.preferredCommuteMinutes) {
                            setErrors((prev) => ({
                              ...prev,
                              preferredCommuteMinutes: undefined,
                            }));
                          }
                        }}
                        className="flex-1 accent-teal-700 cursor-pointer"
                      />
                      <input
                        id="commute-minutes"
                        type="number"
                        min={5}
                        max={120}
                        value={preferredCommuteMinutes}
                        onChange={(e) => {
                          setPreferredCommuteMinutes(e.target.value);
                          if (errors.preferredCommuteMinutes) {
                            setErrors((prev) => ({
                              ...prev,
                              preferredCommuteMinutes: undefined,
                            }));
                          }
                        }}
                        className={`w-20 px-3 py-2 rounded-lg border text-sm text-slate-900 tabular-nums text-right focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 ${
                          errors.preferredCommuteMinutes
                            ? 'border-red-500'
                            : 'border-slate-200'
                        }`}
                      />
                    </div>
                    {errors.preferredCommuteMinutes && (
                      <p className="mt-1.5 text-xs text-red-600" role="alert">
                        {errors.preferredCommuteMinutes}
                      </p>
                    )}
                  </div>

                  {/* Commute Mode */}
                  <div>
                    <span className="block text-sm font-medium text-slate-800 mb-2">
                      Primary commute mode
                    </span>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'transit' as CommuteMode, label: 'Public Transit' },
                        { id: 'walk_bike' as CommuteMode, label: 'Walk / Bike' },
                        { id: 'car' as CommuteMode, label: 'Car / Cab' },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setCommuteMode(mode.id)}
                          aria-pressed={commuteMode === mode.id}
                          className={`px-3 py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                            commuteMode === mode.id
                              ? 'border-teal-700 bg-teal-50/70 text-teal-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setErrors({});
                        setStep(1);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 transition-colors whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" />
                      <span>Build my dashboard</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right: Live Relocation Blueprint Preview */}
          <aside className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7">
              <div className="pb-5 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-500">
                  Your Move Blueprint
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-slate-900">
                  {destinationCity.trim() || 'Your Destination City'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {role === 'student' ? 'Student relocation' : 'Fresh graduate relocation'}
                  {' · '}
                  {anchorLocation.trim() || 'Campus or office pending'}
                </p>
              </div>

              <dl className="divide-y divide-slate-100 text-sm">
                <div className="py-4 flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2.5 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Moving countdown</span>
                  </dt>
                  <dd className="font-mono font-medium text-slate-900 tabular-nums">
                    {countdownPreview.headline}
                  </dd>
                </div>

                <div className="py-4 flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2.5 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>Commute limit</span>
                  </dt>
                  <dd className="font-mono font-medium text-slate-900 tabular-nums">
                    {preferredCommuteMinutes ? `${preferredCommuteMinutes} min` : '—'}
                  </dd>
                </div>

                <div className="py-4 flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2.5 text-slate-600">
                    <Wallet className="w-4 h-4 text-slate-400" />
                    <span>Housing ceiling</span>
                  </dt>
                  <dd className="font-mono font-medium text-slate-900 tabular-nums">
                    {accommNum > 0 ? `${formatCurrency(accommNum, currency)}/mo` : '—'}
                  </dd>
                </div>

                <div className="py-4 flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2.5 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Non-housing allowance</span>
                  </dt>
                  <dd className="font-mono font-medium text-slate-900 tabular-nums">
                    {totalNum > 0 && accommNum > 0
                      ? `${formatCurrency(remainingPreview, currency)}/mo`
                      : '—'}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
                Once complete, SettleIn ranks neighbourhoods matching your commute and rent ceiling, builds a monthly cost plan, and prepares your 3-stage relocation checklist.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
