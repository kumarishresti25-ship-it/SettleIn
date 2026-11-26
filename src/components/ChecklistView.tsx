import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, Plus, Trash2 } from 'lucide-react';
import {
  OnboardingProfile,
  PHASE_DISPLAY_NAMES,
  RelocationTask,
  TaskCategory,
  TaskPhase,
  calculateProgress,
  getNextRecommendedAction,
} from '../utils/relocationEngine';

interface ChecklistViewProps {
  profile: OnboardingProfile;
  tasks: RelocationTask[];
  initialPhaseFilter?: TaskPhase | 'all';
  onToggleTask: (id: string) => void;
  onAddTask: (title: string, phase: TaskPhase, category: TaskCategory) => void;
  onDeleteTask: (id: string) => void;
}

const SECTION_META: {
  phase: TaskPhase;
  title: string;
  subtitle: string;
}[] = [
  {
    phase: 'pre-move',
    title: 'Before Moving',
    subtitle: 'Arrange accommodation, book travel, and pack essentials before departure',
  },
  {
    phase: 'arrival-week',
    title: 'First 7 Days',
    subtitle: 'Understand the commute, find grocery stores, and set up daily utilities',
  },
  {
    phase: 'first-month',
    title: 'First 30 Days',
    subtitle: 'Review your monthly budget, update records, and settle into your routine',
  },
];

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  profile,
  tasks,
  initialPhaseFilter = 'all',
  onToggleTask,
  onAddTask,
  onDeleteTask,
}) => {
  const [phaseFilter, setPhaseFilter] = useState<TaskPhase | 'all'>(initialPhaseFilter);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newPhase, setNewPhase] = useState<TaskPhase>('pre-move');
  const [newCategory, setNewCategory] = useState<TaskCategory>('Essentials');
  const [error, setError] = useState('');

  const progress = useMemo(() => calculateProgress(tasks), [tasks]);
  const nextAction = useMemo(
    () => getNextRecommendedAction(profile, tasks),
    [profile, tasks]
  );

  const sectionsToRender = useMemo(() => {
    const activeSections =
      phaseFilter === 'all'
        ? SECTION_META
        : SECTION_META.filter((s) => s.phase === phaseFilter);

    return activeSections.map((section) => {
      const sectionTasks = tasks.filter((task) => {
        if (task.phase !== section.phase) return false;
        if (statusFilter === 'pending' && task.completed) return false;
        if (statusFilter === 'completed' && !task.completed) return false;
        return true;
      });
      const counts = progress.byPhase[section.phase];
      return {
        ...section,
        tasks: sectionTasks,
        counts,
      };
    });
  }, [tasks, phaseFilter, statusFilter, progress]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setError('Enter a task title before adding.');
      return;
    }
    onAddTask(newTitle.trim(), newPhase, newCategory);
    setNewTitle('');
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 tabular-nums">
            {progress.completed} of {progress.total} tasks complete ({progress.percentage}%)
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Relocation checklist
          </h1>
        </div>
        <div className="w-full sm:w-48">
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-teal-700 transition-all duration-200"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Personalized "What should I do next?" Section */}
      <section
        className="bg-white border border-slate-200 rounded-2xl p-6"
        aria-labelledby="checklist-next-heading"
        data-testid="next-action-card"
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-teal-700">
              What should I do next? · {nextAction.timingContext}
            </p>
            {nextAction.task ? (
              <>
                <h2
                  id="checklist-next-heading"
                  className="mt-1.5 font-display text-lg font-semibold text-slate-900"
                >
                  {nextAction.task.title}
                </h2>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed max-w-2xl">
                  {nextAction.reason}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {nextAction.phaseLabel}
                  <span aria-hidden="true"> · </span>
                  {nextAction.task.category}
                </p>
              </>
            ) : (
              <>
                <h2
                  id="checklist-next-heading"
                  className="mt-1.5 font-display text-lg font-semibold text-slate-900"
                >
                  You are settled in {profile.destinationCity}
                </h2>
                <p className="mt-1.5 text-sm text-slate-600">{nextAction.reason}</p>
              </>
            )}
          </div>

          {nextAction.task && (
            <button
              type="button"
              onClick={() => onToggleTask(nextAction.task!.id)}
              className="self-start inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-700 text-white text-xs sm:text-sm font-medium hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>Mark done</span>
            </button>
          )}
        </div>

        {nextAction.alternateTasks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700 shrink-0">Up next:</span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {nextAction.alternateTasks.map((alt, idx) => (
                <span key={alt.id} className="inline-flex items-center gap-1.5">
                  {idx > 0 && <span aria-hidden="true">·</span>}
                  <span>{alt.title}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Add Task Bar */}
      <form
        onSubmit={handleAdd}
        noValidate
        className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <label htmlFor="checklist-new-title" className="sr-only">
              New task description
            </label>
            <input
              id="checklist-new-title"
              type="text"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="Add a custom task (e.g. Set up Aadhaar address update)..."
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 ${
                error ? 'border-red-500' : 'border-slate-200'
              }`}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="checklist-new-phase" className="sr-only">
              Phase
            </label>
            <select
              id="checklist-new-phase"
              value={newPhase}
              onChange={(e) => setNewPhase(e.target.value as TaskPhase)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
            >
              <option value="pre-move">Before Moving</option>
              <option value="arrival-week">First 7 Days</option>
              <option value="first-month">First 30 Days</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="checklist-new-category" className="sr-only">
              Category
            </label>
            <select
              id="checklist-new-category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
            >
              <option value="Housing">Housing</option>
              <option value="Commute">Commute</option>
              <option value="Finance">Finance</option>
              <option value="Admin">Admin</option>
              <option value="Essentials">Essentials</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add task</span>
            </button>
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
      </form>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl self-start">
          {[
            { id: 'all' as const, label: 'All 3 stages' },
            { id: 'pre-move' as const, label: 'Before Moving' },
            { id: 'arrival-week' as const, label: 'First 7 Days' },
            { id: 'first-month' as const, label: 'First 30 Days' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPhaseFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                phaseFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl self-start">
          {[
            { id: 'all' as const, label: 'All' },
            { id: 'pending' as const, label: 'Pending' },
            { id: 'completed' as const, label: 'Done' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Three Structured Relocation Sections */}
      <div className="space-y-6">
        {sectionsToRender.map((section) => {
          const sectionPct =
            section.counts.total === 0
              ? 0
              : Math.round((section.counts.completed / section.counts.total) * 100);
          return (
            <section
              key={section.phase}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
              aria-labelledby={`section-heading-${section.phase}`}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2
                    id={`section-heading-${section.phase}`}
                    className="font-display text-base font-semibold text-slate-900"
                  >
                    {section.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{section.subtitle}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    {section.counts.completed}/{section.counts.total} done
                  </span>
                  <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-teal-700 transition-all duration-200"
                      style={{ width: `${sectionPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {section.tasks.length === 0 ? (
                <div className="px-6 py-6 text-center text-xs text-slate-500">
                  {statusFilter === 'pending'
                    ? `All ${section.title} tasks are completed.`
                    : statusFilter === 'completed'
                      ? `No completed tasks in ${section.title} yet.`
                      : `No tasks in ${section.title}.`}
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {section.tasks.map((task) => {
                    const isRecommended = nextAction.task?.id === task.id;
                    return (
                      <li
                        key={task.id}
                        className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={task.completed}
                            aria-label={`Mark "${task.title}" ${
                              task.completed ? 'pending' : 'complete'
                            }`}
                            onClick={() => onToggleTask(task.id)}
                            className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${
                              task.completed
                                ? 'bg-teal-700 border-teal-700 text-white'
                                : 'bg-white border-slate-300 hover:border-teal-700'
                            }`}
                          >
                            {task.completed && <Check className="w-3.5 h-3.5" />}
                          </button>
                          <div className="min-w-0">
                            <p
                              className={`text-sm ${
                                task.completed
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-900'
                              }`}
                            >
                              {task.title}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {PHASE_DISPLAY_NAMES[task.phase]}
                              <span aria-hidden="true"> · </span>
                              {task.category}
                              {isRecommended && (
                                <>
                                  <span aria-hidden="true"> · </span>
                                  <span className="text-teal-700 font-medium inline-flex items-center gap-0.5">
                                    Suggested next
                                    <ArrowRight className="w-3 h-3 inline" />
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteTask(task.id)}
                          aria-label={`Delete task "${task.title}"`}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
