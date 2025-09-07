'use client';

import { TrendingUp, Users, FileText, CheckCircle } from 'lucide-react';

const stats = [
  {
    name: 'Total Claims',
    value: '12,345',
    change: '+12%',
    changeType: 'positive',
    icon: FileText,
  },
  {
    name: 'Active Patients',
    value: '8,921',
    change: '+8%',
    changeType: 'positive',
    icon: Users,
  },
  {
    name: 'Auto-Approved',
    value: '9,876',
    change: '+15%',
    changeType: 'positive',
    icon: CheckCircle,
  },
  {
    name: 'Processing Time',
    value: '24s',
    change: '-23%',
    changeType: 'positive',
    icon: TrendingUp,
  },
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span
                className={`text-sm font-medium ${
                  stat.changeType === 'positive'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 ml-2">from last month</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
