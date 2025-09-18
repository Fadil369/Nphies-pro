'use client';

import { ComponentType } from 'react';
import { LucideProps } from 'lucide-react';

type Stat = {
  name: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative';
  changeLabel?: string;
  icon: ComponentType<LucideProps>;
};

const iconStyles = 'h-6 w-6 text-cyan-300';

export function DashboardStats({ stats, emptyLabel }: { stats: Stat[]; emptyLabel: string }) {
  if (!stats.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-200">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.name} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-200">{stat.name}</p>
                <p className="text-3xl font-semibold text-white">{stat.value}</p>
              </div>
              <div className="rounded-full bg-white/10 p-3">
                <Icon className={iconStyles} />
              </div>
            </div>
            {stat.change && (
              <div className="mt-4 flex items-center text-sm">
                <span
                  className={
                    stat.changeType === 'negative'
                      ? 'text-rose-400 font-medium'
                      : 'text-emerald-400 font-medium'
                  }
                >
                  {stat.change}
                </span>
                {stat.changeLabel && <span className="ml-2 text-slate-300">{stat.changeLabel}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
