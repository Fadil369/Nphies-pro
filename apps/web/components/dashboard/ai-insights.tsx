'use client';

export function AIInsights({ insights, title, emptyLabel }: { insights: string[]; title: string; emptyLabel: string }) {
  return (
    <div className="glass space-y-3 p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {insights.length === 0 ? (
        <p className="text-sm text-slate-300">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2 text-sm text-slate-100">
          {insights.map((insight, index) => (
            <li key={index} className="rounded-xl border border-white/10 bg-white/5 p-3">
              {insight}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
