'use client';

import { formatDistanceToNow } from 'date-fns';

import { useState } from 'react';

export interface ClaimActivityEntry {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

interface Props {
  open: boolean;
  claim?: { id: string; patientName: string } | null;
  activities: ClaimActivityEntry[];
  onClose(): void;
  title: string;
  emptyLabel: string;
  closeLabel: string;
  allowNotes?: boolean;
  notePlaceholder?: string;
  submitLabel?: string;
  onAddNote?: (message: string) => Promise<void> | void;
  typeLabels?: Record<string, string>;
}

export function ClaimTimelineDrawer({
  open,
  claim,
  activities,
  onClose,
  title,
  emptyLabel,
  closeLabel,
  allowNotes = false,
  notePlaceholder = 'Add note',
  submitLabel = 'Add note',
  onAddNote,
  typeLabels = {},
}: Props) {
  if (!open || !claim) return null;

  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!onAddNote || !note.trim()) return;
    setSubmitting(true);
    try {
      await onAddNote(note.trim());
      setNote('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/95 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 text-slate-100">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-xs text-slate-300">{claim.id} · {claim.patientName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
          >
            {closeLabel}
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 text-slate-100">
          {activities.length === 0 ? (
            <p className="py-6 text-sm text-slate-300">{emptyLabel}</p>
          ) : (
            <ul className="space-y-4">
              {activities.map((activity) => (
                <li key={activity.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium capitalize">{typeLabels[activity.type] ?? activity.type}</p>
                  <p className="text-xs text-slate-300">{activity.message}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        {allowNotes && (
          <div className="border-t border-white/10 bg-white/5 px-6 py-4">
            <textarea
              data-testid="timeline-note-input"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={notePlaceholder}
              className="h-20 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white/10 px-3 py-1 text-sm hover:bg-white/20"
              >
                {closeLabel}
              </button>
              <button
                type="button"
                disabled={submitting || note.trim().length === 0}
                onClick={handleSubmit}
                data-testid="timeline-note-submit"
                className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitLabel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
