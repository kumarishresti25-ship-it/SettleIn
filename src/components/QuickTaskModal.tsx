import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TaskCategory, TaskPhase } from '../utils/relocationEngine';

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, phase: TaskPhase, category: TaskCategory) => void;
}

export const QuickTaskModal: React.FC<QuickTaskModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<TaskPhase>('pre-move');
  const [category, setCategory] = useState<TaskCategory>('Essentials');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Enter a task description.');
      return;
    }
    onAdd(title.trim(), phase, category);
    setTitle('');
    setError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-task-title"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2
            id="quick-task-title"
            className="font-display text-lg font-semibold text-slate-900"
          >
            Add relocation task
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add task dialog"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="modal-task-title"
              className="block text-sm font-medium text-slate-800 mb-1.5"
            >
              Task
            </label>
            <input
              id="modal-task-title"
              type="text"
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Activate metro smart card"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700 ${
                error ? 'border-red-500' : 'border-slate-200'
              }`}
            />
            {error && (
              <p className="mt-1.5 text-xs text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="modal-task-phase"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Phase
              </label>
              <select
                id="modal-task-phase"
                value={phase}
                onChange={(e) => setPhase(e.target.value as TaskPhase)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
              >
                <option value="pre-move">Before Moving</option>
                <option value="arrival-week">First 7 Days</option>
                <option value="first-month">First 30 Days</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="modal-task-category"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Category
              </label>
              <select
                id="modal-task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-700"
              >
                <option value="Housing">Housing</option>
                <option value="Commute">Commute</option>
                <option value="Finance">Finance</option>
                <option value="Admin">Admin</option>
                <option value="Essentials">Essentials</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800 transition-colors"
            >
              Add task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
