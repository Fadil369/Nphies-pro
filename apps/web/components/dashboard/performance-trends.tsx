'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface TrendPoint {
  name: string;
  approved: number;
  pending: number;
  rejected: number;
}

export function PerformanceTrends({ data, emptyLabel }: { data: TrendPoint[]; emptyLabel: string }) {
  if (data.length === 0) {
    return <div className="flex h-80 items-center justify-center text-sm text-slate-200">{emptyLabel}</div>;
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="name" stroke="#CBD5F5" tick={{ fill: '#E2E8F0' }} />
          <YAxis stroke="#CBD5F5" tick={{ fill: '#E2E8F0' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '12px',
              border: '1px solid rgba(148, 163, 184, 0.4)',
              color: '#fff',
            }}
          />
          <Area type="monotone" dataKey="approved" stackId="1" stroke="#34d399" fill="#34d39955" name="Approved" />
          <Area type="monotone" dataKey="pending" stackId="1" stroke="#f59e0b" fill="#f59e0b55" name="Pending" />
          <Area type="monotone" dataKey="rejected" stackId="1" stroke="#f87171" fill="#f8717155" name="Rejected" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
