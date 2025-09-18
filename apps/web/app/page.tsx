'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, TrendingUp, Users, FileText } from 'lucide-react';

import { DashboardStats } from '@/components/dashboard/stats';
import { ClaimsChart } from '@/components/dashboard/claims-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { TenantTable } from '@/components/dashboard/tenant-table';
import { ClaimList, ClaimListItem } from '@/components/dashboard/claim-list';
import { BrainSAITMeshGradient } from '@/components/ui/BrainSAITMeshGradient';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ClaimSubmissionModal } from '@/components/forms/claim-submission-modal';
import {
  ClaimTimelineDrawer,
  ClaimActivityEntry,
} from '@/components/dashboard/claim-timeline-drawer';
import { CopilotProvider } from '@/components/copilot/copilot-provider';
import { ClaimsActions } from '@/components/copilot/claims-actions';
import { PerformanceTrends } from '@/components/dashboard/performance-trends';
import { TenantLeaderboard } from '@/components/dashboard/tenant-leaderboard';
import { AIInsights } from '@/components/dashboard/ai-insights';
import { RoleSwitcher } from '@/components/copilot/role-switcher';

export default function HomePage() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [timelineClaim, setTimelineClaim] = useState<ClaimListItem | null>(null);
  const [trendRange, setTrendRange] = useState<'3' | '6' | '12'>('6');
  const [leaderboardPlan, setLeaderboardPlan] = useState<'all' | 'starter' | 'professional' | 'enterprise'>('all');

  const { data: session } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        return null;
      }
      const body = await response.json();
      return body.data as { id: string; scopes: string[]; role: string };
    },
  });
  const canWriteClaims = session?.scopes?.includes('claims.write') ?? false;

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics-dashboard', trendRange, leaderboardPlan],
    queryFn: async () => {
      const params = new URLSearchParams();
      const months = Number(trendRange);
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - months);
      params.set('from', fromDate.toISOString());
      params.set('to', toDate.toISOString());
      if (leaderboardPlan !== 'all') {
        params.set('plan', leaderboardPlan);
      }

      const response = await fetch(`/api/analytics/dashboard?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }
      const body = await response.json();
      return body.data as {
        totalClaims: number;
        activePatients: number;
        autoApproved: number;
        avgProcessingTime: string;
        monthlyGrowth: number;
        approvalRate: number;
        statusTrends: Array<{
          name: string;
          approved: number;
          pending: number;
          rejected: number;
        }>;
        tenantLeaderboard: Array<{
          id: string;
          name: string;
          plan: string;
          total: number;
          approved: number;
          rejected: number;
          pending: number;
          approvalRate: number;
        }>;
        insights: string[];
      };
    },
  });

  const planLabelMap = useMemo(
    () => ({
      all: t('tenants.planOptions.all'),
      starter: t('tenants.planOptions.starter'),
      professional: t('tenants.planOptions.professional'),
      enterprise: t('tenants.planOptions.enterprise'),
    }),
    [t],
  );

  const { data: claimsData } = useQuery({
    queryKey: ['claims'],
    queryFn: async () => {
      const response = await fetch('/api/claims');
      if (!response.ok) {
        throw new Error('Failed to load claims');
      }
      const body = await response.json();
      return body.data as Array<{
        id: string;
        status: string;
        submittedAt: string;
        processedAt: string | null;
        patientName: string;
        amount: number;
        tenantId: string;
      }>;
    },
  });

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const response = await fetch('/api/tenants');
      if (!response.ok) {
        throw new Error('Failed to load tenants');
      }
      const body = await response.json();
      return body.data as Array<{
        id: string;
        name: string;
        plan: string;
        status: string;
        claimsProcessed: number;
        lastActivity: string;
      }>;
    },
  });

  const createClaimMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Failed to create claim');
      }
      return response.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['claims'] });
      void queryClient.invalidateQueries({ queryKey: ['analytics-dashboard'] });
      setIsClaimModalOpen(false);
    },
  });

  const updateClaimStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/claims/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      return response.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['claims'] });
      void queryClient.invalidateQueries({ queryKey: ['analytics-dashboard'] });
    },
  });

  const stats = useMemo(() => {
    if (!analyticsData) {
      return [];
    }

    return [
      {
        name: t('stats.totalClaims'),
        value: analyticsData.totalClaims.toLocaleString(),
        change: `+${analyticsData.monthlyGrowth}%`,
        changeType: 'positive' as const,
        changeLabel: t('stats.change'),
        icon: FileText,
      },
      {
        name: t('stats.activePatients'),
        value: analyticsData.activePatients.toLocaleString(),
        change: '+0%',
        changeType: 'positive' as const,
        changeLabel: t('stats.change'),
        icon: Users,
      },
      {
        name: t('stats.autoApproved'),
        value: analyticsData.autoApproved.toLocaleString(),
        change: `${analyticsData.approvalRate.toFixed(1)}% ${t('stats.change')}`,
        changeType: 'positive' as const,
        icon: CheckCircle,
      },
      {
        name: t('stats.processingTime'),
        value: analyticsData.avgProcessingTime,
        icon: TrendingUp,
      },
    ];
  }, [analyticsData, t]);

  const chartData = useMemo(() => {
    if (!claimsData || claimsData.length === 0) {
      return [];
    }

    const monthMap = new Map<string, { name: string; claims: number; approved: number; monthIndex: number }>();

    claimsData.forEach((claim) => {
      const submitted = new Date(claim.submittedAt);
      const monthKey = submitted.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const monthIndex = submitted.getFullYear() * 12 + submitted.getMonth();

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          name: monthKey,
          claims: 0,
          approved: 0,
          monthIndex,
        });
      }

      const bucket = monthMap.get(monthKey)!;
      bucket.claims += 1;
      if (claim.status === 'approved') {
        bucket.approved += 1;
      }
    });

    return Array.from(monthMap.values())
      .sort((a, b) => a.monthIndex - b.monthIndex)
      .map(({ monthIndex, ...rest }) => rest)
      .slice(-6);
  }, [claimsData]);

  const activities = useMemo(() => {
    if (!claimsData) {
      return [] as Array<{ id: string; message: string; time: string; status: 'approved' | 'pending' | 'flagged' | 'rejected' }>;
    }

    return claimsData
      .slice()
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5)
      .map((claim) => ({
        id: claim.id,
        message: `${claim.patientName} • SAR ${claim.amount.toLocaleString()} • ${claim.status}`,
        time: formatDistanceToNow(new Date(claim.submittedAt), { addSuffix: true }),
        status: (claim.status as 'approved' | 'pending' | 'flagged' | 'rejected') ?? 'pending',
      }));
  }, [claimsData]);

  const kpiTiles = useMemo(() => {
    const rejectionClaims = claimsData?.filter((claim) => claim.status === 'rejected') ?? [];
    const rejectionAmount = rejectionClaims.reduce((sum, claim) => sum + (claim.amount ?? 0), 0);

    return [
      {
        id: 'rejectionAmount',
        label: t('dashboard.kpis.rejectionAmount'),
        value: rejectionClaims.length ? `SAR ${rejectionAmount.toLocaleString()}` : 'SAR 0',
      },
      {
        id: 'rejectionCount',
        label: t('dashboard.kpis.rejectionCount'),
        value: rejectionClaims.length.toLocaleString(),
      },
      {
        id: 'fpar',
        label: t('dashboard.kpis.fpar'),
        value: analyticsData ? `${analyticsData.approvalRate.toFixed(1)}%` : '—',
      },
    ];
  }, [analyticsData, claimsData, t]);

  const pendingClaims = claimsData?.filter((claim) => claim.status === 'pending').length ?? 0;
  const rejectedClaims = claimsData?.filter((claim) => claim.status === 'rejected').length ?? 0;
  const approvedClaims = claimsData?.filter((claim) => claim.status === 'approved').length ?? 0;

  const quickActions = useMemo(
    () => [
      {
        id: 'submit',
        title: t('dashboard.cta.submit.title'),
        description: t('dashboard.cta.submit.description'),
        action: t('dashboard.cta.submit.action'),
        accent: 'from-cyan-500/80 to-blue-600/60',
        stat: `${pendingClaims.toLocaleString()} ${t('dashboard.cta.stats.pending')}`,
        onClick: canWriteClaims ? () => setIsClaimModalOpen(true) : undefined,
        disabled: !canWriteClaims,
        helper: !canWriteClaims ? t('dashboard.cta.disabled') : undefined,
      },
      {
        id: 'integration',
        title: t('dashboard.cta.integration.title'),
        description: t('dashboard.cta.integration.description'),
        action: t('dashboard.cta.integration.action'),
        accent: 'from-emerald-500/70 to-teal-500/60',
        stat: `${approvedClaims.toLocaleString()} ${t('dashboard.cta.stats.verified')}`,
      },
      {
        id: 'analytics',
        title: t('dashboard.cta.analytics.title'),
        description: t('dashboard.cta.analytics.description'),
        action: t('dashboard.cta.analytics.action'),
        accent: 'from-purple-500/70 to-fuchsia-500/60',
        stat: `${rejectedClaims.toLocaleString()} ${t('dashboard.cta.stats.rejected')}`,
      },
    ],
    [approvedClaims, canWriteClaims, pendingClaims, rejectedClaims, t],
  );

  const { data: claimTimeline } = useQuery({
    queryKey: ['claim-activity', timelineClaim?.id],
    queryFn: async () => {
      if (!timelineClaim) return [] as ClaimActivityEntry[];
      const response = await fetch(`/api/claims/${timelineClaim.id}/activity`);
      if (!response.ok) {
        throw new Error('Failed to load claim activity');
      }
      const body = await response.json();
      return body.data as ClaimActivityEntry[];
    },
    enabled: !!timelineClaim,
  });

  const addTimelineNoteMutation = useMutation({
    mutationFn: async ({ claimId, message }: { claimId: string; message: string }) => {
      const response = await fetch(`/api/claims/${claimId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) {
        throw new Error('Failed to append timeline note');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['claim-activity', variables.claimId] });
    },
  });

  return (
    <CopilotProvider>
      <div className="relative min-h-screen overflow-hidden">
        <BrainSAITMeshGradient />
        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-8 p-6 md:p-10">
          <header className="flex flex-col-reverse items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-semibold md:text-4xl">{t('dashboard.title')}</h1>
              <p className="mt-2 text-base text-slate-200 md:text-lg">{t('dashboard.subtitle')}</p>
            </div>
            <LanguageToggle />
          </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {kpiTiles.map((tile) => (
            <div key={tile.id} className="glass p-5 text-slate-100">
              <p className="text-sm text-slate-300">{tile.label}</p>
              <p className="mt-2 text-3xl font-semibold">{tile.value}</p>
            </div>
          ))}
        </section>

        <section className="glass p-6">
          <DashboardStats stats={stats} emptyLabel={t('charts.empty')} />
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="glass p-6">
            <ClaimsChart
              data={chartData}
              title={t('charts.claimsTrend')}
              emptyLabel={t('charts.empty')}
            />
          </div>
          <div className="glass p-6">
            <RecentActivity
              activities={activities}
              title={t('charts.recentActivity')}
              viewAllLabel={t('actions.viewActivity')}
              emptyLabel={t('charts.empty')}
            />
          </div>
        </section>

        <div className="glass space-y-4 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg font-semibold text-white">{t('analytics.trendTitle')}</h3>
            <div className="flex items-center gap-2 text-xs text-white">
              <label htmlFor="trend-range" className="text-slate-300">
                {t('analytics.filters.rangeLabel')}
              </label>
              <select
                id="trend-range"
                value={trendRange}
                onChange={(event) => setTrendRange(event.target.value as '3' | '6' | '12')}
                className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="3">{t('analytics.filters.range.3')}</option>
                <option value="6">{t('analytics.filters.range.6')}</option>
                <option value="12">{t('analytics.filters.range.12')}</option>
              </select>
            </div>
          </div>
          <PerformanceTrends data={analyticsData?.statusTrends ?? []} emptyLabel={t('charts.empty')} />
        </div>

        <div className="glass space-y-4 p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg font-semibold text-white">{t('analytics.leaderboardTitle')}</h3>
            <div className="flex items-center gap-2 text-xs text-white">
              <label htmlFor="leaderboard-plan" className="text-slate-300">
                {t('analytics.filters.planLabel')}
              </label>
              <select
                id="leaderboard-plan"
                value={leaderboardPlan}
                onChange={(event) =>
                  setLeaderboardPlan(event.target.value as 'all' | 'starter' | 'professional' | 'enterprise')
                }
                className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="all">{planLabelMap.all}</option>
                <option value="starter">{planLabelMap.starter}</option>
                <option value="professional">{planLabelMap.professional}</option>
                <option value="enterprise">{planLabelMap.enterprise}</option>
              </select>
            </div>
          </div>
          <TenantLeaderboard
            entries={analyticsData?.tenantLeaderboard ?? []}
            emptyLabel={t('analytics.leaderboardEmpty')}
            planLabels={planLabelMap}
          />
        </div>

        <AIInsights
          insights={analyticsData?.insights ?? []}
          title={t('analytics.insightsTitle')}
          emptyLabel={t('analytics.insightsEmpty')}
        />

        {process.env.NODE_ENV !== 'production' && <RoleSwitcher currentRole={session?.role} />}

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {quickActions.map((action) => (
            <div
              key={action.id}
              className="glass border border-white/5 p-6 shadow-lg transition duration-200 hover:shadow-xl"
            >
              <div className={`h-1 w-16 rounded-full bg-gradient-to-r ${action.accent}`} />
              <h3 className="mt-4 text-lg font-semibold text-white">{action.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{action.description}</p>
              {action.stat && (
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-200">
                  {action.stat}
                </p>
              )}
              <button
                data-testid={`quick-action-${action.id}`}
                className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20 disabled:opacity-40"
                onClick={action.onClick}
                type="button"
                disabled={action.disabled}
              >
                {action.action}
              </button>
              {action.helper && (
                <p className="mt-2 text-xs text-slate-300">{action.helper}</p>
              )}
            </div>
          ))}
        </section>

        <section className="glass p-6">
          <TenantTable
            tenants={tenantsData ?? []}
            claims={claimsData ?? []}
            title={t('tenants.title')}
            searchPlaceholder={t('tenants.searchPlaceholder')}
            emptyLabel={t('tenants.empty')}
          />
        </section>

        <section className="glass p-6">
        <ClaimList
          claims={claimsData ?? []}
          tenantsById={(tenantsData ?? []).reduce<Record<string, { name: string }>>(
            (acc, tenant) => {
              acc[tenant.id] = { name: tenant.name };
              return acc;
            },
            {},
          )}
          tenants={tenantsData ?? []}
          title={t('claims.title')}
          emptyLabel={t('claims.empty')}
            filters={[
              { value: 'all', label: t('claims.filters.all') },
              { value: 'approved', label: t('claims.filters.approved') },
              { value: 'pending', label: t('claims.filters.pending') },
              { value: 'rejected', label: t('claims.filters.rejected') },
            ]}
            exportLabel={t('claims.export')}
            searchPlaceholder={t('claims.searchPlaceholder')}
          tenantFilterLabel={t('claims.tenantFilter')}
          dateFromLabel={t('claims.dateFrom')}
          dateToLabel={t('claims.dateTo')}
          onUpdateStatus={
            canWriteClaims ? (id, status) => updateClaimStatusMutation.mutate({ id, status }) : undefined
          }
          onViewTimeline={(claim) => setTimelineClaim(claim)}
          timelineLabel={t('claims.timelineButton')}
        />
      </section>

        {canWriteClaims && (
          <ClaimSubmissionModal
            open={isClaimModalOpen}
            tenants={tenantsData ?? []}
            onClose={() => setIsClaimModalOpen(false)}
            onSubmit={(values) => createClaimMutation.mutate(values)}
            submitting={createClaimMutation.isPending}
          />
        )}
        <ClaimTimelineDrawer
          open={Boolean(timelineClaim)}
          claim={timelineClaim}
          activities={claimTimeline ?? []}
          onClose={() => setTimelineClaim(null)}
          title={t('claims.timelineTitle')}
          emptyLabel={t('claims.timelineEmpty')}
          closeLabel={t('claims.form.close')}
          allowNotes={canWriteClaims}
          notePlaceholder={t('claims.timelineAdd.placeholder')}
          submitLabel={t('claims.timelineAdd.submit')}
          onAddNote={
            canWriteClaims && timelineClaim
              ? (message) => addTimelineNoteMutation.mutateAsync({ claimId: timelineClaim.id, message })
              : undefined
          }
          typeLabels={{
            created: t('claims.timelineTypes.created'),
            status: t('claims.timelineTypes.status'),
            ai_decision: t('claims.timelineTypes.ai'),
            note: t('claims.timelineTypes.note'),
          }}
        />
        
        {/* CopilotKit NPHIES AI Assistant */}
        <ClaimsActions 
          claims={claimsData ?? []}
          onClaimAnalyzed={(analysis) => {
            console.log('AI Analysis completed:', analysis);
            // Refresh analytics data after AI analysis
            void queryClient.invalidateQueries({ queryKey: ['analytics'] });
          }}
        />
        </div>
      </div>
    </CopilotProvider>
  );
}

interface ClaimTimeline {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}
