'use client';

import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { TenantProfileData } from '@/app/tenants/[id]/page';
import { ClaimsChart } from '@/components/dashboard/claims-chart';
import { ClaimList, ClaimListItem } from '@/components/dashboard/claim-list';
import {
  ClaimTimelineDrawer,
  ClaimActivityEntry,
} from '@/components/dashboard/claim-timeline-drawer';

export function TenantProfile({ tenant }: { tenant: TenantProfileData }) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const [timelineClaim, setTimelineClaim] = useState<ClaimListItem | null>(null);

  const { data: session } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        return null;
      }
      const body = await response.json();
      return body.data as { scopes: string[] };
    },
  });
  const canWriteClaims = session?.scopes?.includes('claims.write') ?? false;

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
  const chartData = useMemo(() => {
    const bucketMap = new Map<string, { name: string; claims: number; approved: number; monthIndex: number }>();

    tenant.recentClaims.forEach((claim) => {
      const submitted = new Date(claim.submittedAt);
      const key = submitted.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const index = submitted.getFullYear() * 12 + submitted.getMonth();

      if (!bucketMap.has(key)) {
        bucketMap.set(key, { name: key, claims: 0, approved: 0, monthIndex: index });
      }

      const bucket = bucketMap.get(key)!;
      bucket.claims += 1;
      if (claim.status === 'approved') {
        bucket.approved += 1;
      }
    });

    return Array.from(bucketMap.values())
      .sort((a, b) => a.monthIndex - b.monthIndex)
      .map(({ monthIndex, ...rest }) => rest);
  }, [tenant.recentClaims]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border border-white/10 bg-white/5 p-6 text-slate-100 backdrop-blur md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{tenant.name}</h1>
          <p className="text-sm text-slate-300">
            {t('tenantProfile.plan', { plan: tenant.plan })} · {t('tenantProfile.status', { status: tenant.status })}
          </p>
          <p className="text-xs text-slate-400">
            {t('tenantProfile.lastActivity', {
              value: formatDistanceToNow(new Date(tenant.lastActivity), { addSuffix: true }),
            })}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
        >
          ← {t('tenantProfile.back')}
        </Link>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <MetricCard label={t('tenantProfile.metrics.total')} value={tenant.metrics.totalClaims.toLocaleString()} />
        <MetricCard label={t('tenantProfile.metrics.approved')} value={tenant.metrics.approvedClaims.toLocaleString()} />
        <MetricCard label={t('tenantProfile.metrics.pending')} value={tenant.metrics.pendingClaims.toLocaleString()} />
        <MetricCard label={t('tenantProfile.metrics.rejected')} value={tenant.metrics.rejectedClaims.toLocaleString()} />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <MetricCard label={t('tenantProfile.metrics.approval')} value={`${tenant.metrics.approvalRate.toFixed(1)}%`} />
        <MetricCard label={t('tenantProfile.metrics.processing')} value={`${tenant.metrics.avgProcessingSeconds}s`} />
      </section>

      <section className="glass p-6">
        <ClaimsChart
          data={chartData}
          title={t('tenantProfile.trendTitle')}
          emptyLabel={t('charts.empty')}
        />
      </section>

      <section className="glass p-6">
        <ClaimList
          claims={tenant.recentClaims}
          tenantsById={{ [tenant.id]: { name: tenant.name } }}
          tenants={[{ id: tenant.id, name: tenant.name }]}
          title={t('tenantProfile.recentClaims')}
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
          onViewTimeline={(claim) => setTimelineClaim(claim)}
          timelineLabel={t('claims.timelineButton')}
        />
      </section>

      <section className="glass p-6">
        <h2 className="text-lg font-semibold text-white">{t('tenantProfile.activityTitle')}</h2>
        {tenant.recentActivities.length === 0 ? (
          <p className="mt-4 text-sm text-slate-300">{t('tenantProfile.timeline.empty')}</p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            {tenant.recentActivities.map((activity) => (
              <li key={activity.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-slate-300">
                    {activity.type}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1 text-slate-100">{activity.message}</p>
                <p className="text-xs text-slate-300">{activity.claimId}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

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
    </div>
  );
}

interface ClaimTimeline {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl border border-white/10 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-300">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
