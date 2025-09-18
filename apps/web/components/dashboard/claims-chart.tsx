'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type ChartDatum = {
  name: string;
  claims: number;
  approved: number;
};

export function ClaimsChart({
  data,
  title,
  emptyLabel,
}: {
  data: ChartDatum[];
  title: string;
  emptyLabel: string;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4 h-80">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-200">
            {emptyLabel}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
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
              <Line
                type="monotone"
                dataKey="claims"
                stroke="#38bdf8"
                strokeWidth={2}
                name="Total Claims"
              />
              <Line
                type="monotone"
                dataKey="approved"
                stroke="#34d399"
                strokeWidth={2}
                name="Auto-Approved"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
