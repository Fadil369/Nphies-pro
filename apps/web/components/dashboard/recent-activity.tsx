'use client';

type Activity = {
  id: string;
  message: string;
  time: string;
  status: 'approved' | 'pending' | 'flagged' | 'rejected';
};

const statusColor: Record<Activity['status'], string> = {
  approved: 'text-emerald-400',
  pending: 'text-amber-300',
  flagged: 'text-rose-400',
  rejected: 'text-rose-400',
};

export function RecentActivity({
  activities,
  title,
  viewAllLabel,
  emptyLabel,
}: {
  activities: Activity[];
  title: string;
  viewAllLabel: string;
  emptyLabel: string;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-4">
        {activities.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-slate-200">
            {emptyLabel}
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center space-x-3 rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur"
            >
              <div className={`rounded-full bg-white/10 p-2 ${statusColor[activity.status]}`}>
                ●
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">{activity.message}</p>
                <p className="text-xs text-slate-300">{activity.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-6">
        <button className="w-full rounded-full border border-white/10 bg-white/10 py-2 text-sm font-medium text-white transition hover:bg-white/20">
          {viewAllLabel}
        </button>
      </div>
    </div>
  );
}
