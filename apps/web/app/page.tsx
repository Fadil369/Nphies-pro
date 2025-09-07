import { Metadata } from 'next';
import { DashboardStats } from '@/components/dashboard/stats';
import { ClaimsChart } from '@/components/dashboard/claims-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';

export const metadata: Metadata = {
  title: 'BrainSAIT Digital Insurance Platform',
  description: 'Comprehensive SaaS solution for Saudi Arabia healthcare digitization',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏥 BrainSAIT Digital Insurance Platform
          </h1>
          <p className="text-gray-600 text-lg">
            Comprehensive healthcare digitization for Saudi Arabia
          </p>
        </div>

        {/* Stats Grid */}
        <DashboardStats />

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <ClaimsChart />
          <RecentActivity />
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Submit New Claim
            </h3>
            <p className="text-gray-600 mb-4">
              Process insurance claims with AI-powered validation
            </p>
            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
              Start Claim
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              NPHIES Integration
            </h3>
            <p className="text-gray-600 mb-4">
              Real-time eligibility verification and data sync
            </p>
            <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors">
              Check Status
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Analytics Dashboard
            </h3>
            <p className="text-gray-600 mb-4">
              Advanced insights and compliance reporting
            </p>
            <button className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition-colors">
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
