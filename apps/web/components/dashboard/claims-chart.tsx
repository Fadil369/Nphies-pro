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

const data = [
  { name: 'Jan', claims: 400, approved: 320 },
  { name: 'Feb', claims: 300, approved: 250 },
  { name: 'Mar', claims: 500, approved: 420 },
  { name: 'Apr', claims: 280, approved: 230 },
  { name: 'May', claims: 590, approved: 510 },
  { name: 'Jun', claims: 320, approved: 280 },
  { name: 'Jul', claims: 450, approved: 390 },
];

export function ClaimsChart() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Claims Processing Trends
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="claims"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Total Claims"
            />
            <Line
              type="monotone"
              dataKey="approved"
              stroke="#10B981"
              strokeWidth={2}
              name="Auto-Approved"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
