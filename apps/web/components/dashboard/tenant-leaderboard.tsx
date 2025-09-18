'use client';

interface LeaderboardEntry {
  id: string;
  name: string;
  plan: string;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  approvalRate: number;
}

export function TenantLeaderboard({
  entries,
  emptyLabel,
  planLabels = {},
}: {
  entries: LeaderboardEntry[];
  emptyLabel: string;
  planLabels?: Record<string, string>;
}) {
  if (entries.length === 0) {
    return <p className="mt-4 text-sm text-slate-300">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-sm text-slate-100">
        <thead className="bg-white/10">
          <tr className="text-left uppercase tracking-wider text-slate-300">
            <th className="px-4 py-3">Tenant</th>
            <th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3">Claims</th>
            <th className="px-4 py-3">Approved</th>
            <th className="px-4 py-3">Rejected</th>
            <th className="px-4 py-3">Approval rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="px-4 py-3 font-medium">{entry.name}</td>
              <td className="px-4 py-3 capitalize">{planLabels[entry.plan] ?? entry.plan}</td>
              <td className="px-4 py-3">{entry.total.toLocaleString()}</td>
              <td className="px-4 py-3 text-emerald-300">{entry.approved.toLocaleString()}</td>
              <td className="px-4 py-3 text-rose-300">{entry.rejected.toLocaleString()}</td>
              <td className="px-4 py-3">{entry.approvalRate.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
