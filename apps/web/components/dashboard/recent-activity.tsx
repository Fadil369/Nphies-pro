'use client';

import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'approved',
    message: 'Claim #12345 auto-approved',
    time: '2 minutes ago',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  {
    id: 2,
    type: 'pending',
    message: 'Claim #12346 pending review',
    time: '5 minutes ago',
    icon: Clock,
    iconColor: 'text-yellow-500',
  },
  {
    id: 3,
    type: 'flagged',
    message: 'Claim #12347 flagged for fraud',
    time: '10 minutes ago',
    icon: AlertCircle,
    iconColor: 'text-red-500',
  },
  {
    id: 4,
    type: 'approved',
    message: 'Claim #12348 auto-approved',
    time: '15 minutes ago',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  {
    id: 5,
    type: 'rejected',
    message: 'Claim #12349 rejected',
    time: '20 minutes ago',
    icon: XCircle,
    iconColor: 'text-red-500',
  },
];

export function RecentActivity() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex items-center space-x-3">
              <div className={`p-2 rounded-full bg-gray-50`}>
                <Icon className={`h-4 w-4 ${activity.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.message}
                </p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6">
        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium">
          View all activity
        </button>
      </div>
    </div>
  );
}
