'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';

type SortBy = 'name' | 'claims';
type SortOrder = 'asc' | 'desc';

interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: string;
  claimsProcessed: number;
  lastActivity: string;
}

interface ClaimSummary {
  id: string;
  tenantId: string;
  status: string;
  amount: number;
  submittedAt: string;
  processedAt: string | null;
  patientName: string;
}

export function TenantTable({
  tenants,
  claims,
  title,
  searchPlaceholder,
  emptyLabel,
}: {
  tenants: Tenant[];
  claims: ClaimSummary[];
  title: string;
  searchPlaceholder: string;
  emptyLabel: string;
}) {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const { t } = useTranslation('common');

  const planOptions = useMemo(
    () => [
      { value: 'all', label: t('tenants.planOptions.all') },
      { value: 'starter', label: t('tenants.planOptions.starter') },
      { value: 'professional', label: t('tenants.planOptions.professional') },
      { value: 'enterprise', label: t('tenants.planOptions.enterprise') },
    ],
    [t],
  );

  const enrichedTenants = useMemo(() => {
    const claimBuckets = claims.reduce<Record<string, { total: number; rejected: number }>>(
      (acc, claim) => {
        if (!acc[claim.tenantId]) {
          acc[claim.tenantId] = { total: 0, rejected: 0 };
        }
        acc[claim.tenantId].total += 1;
        if (claim.status === 'rejected') {
          acc[claim.tenantId].rejected += 1;
        }
        return acc;
      },
      {},
    );

    return tenants.map((tenant) => {
      const bucket = claimBuckets[tenant.id] ?? { total: 0, rejected: 0 };
      return {
        ...tenant,
        totalClaims: bucket.total,
        rejectedClaims: bucket.rejected,
      };
    });
  }, [claims, tenants]);

  const filtered = useMemo(() => {
    return enrichedTenants
      .filter((tenant) =>
        planFilter === 'all' ? true : tenant.plan.toLowerCase() === planFilter,
      )
      .filter((tenant) =>
        tenant.name.toLowerCase().includes(search.toLowerCase()) || tenant.plan.toLowerCase().includes(search.toLowerCase()),
      );
  }, [enrichedTenants, planFilter, search]);

  const sorted = useMemo(() => {
    return filtered
      .slice()
      .sort((a, b) => {
        if (sortBy === 'claims') {
          return sortOrder === 'asc'
            ? a.totalClaims - b.totalClaims
            : b.totalClaims - a.totalClaims;
        }

        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
  }, [filtered, sortBy, sortOrder]);

  const toggleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <select
            value={planFilter}
            onChange={(event) => setPlanFilter(event.target.value)}
            className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            {planOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
          {emptyLabel}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/10 text-left uppercase tracking-wider text-slate-200">
              <tr>
                <th className="px-4 py-3">Tenant</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-white"
                    onClick={() => toggleSort('name')}
                  >
                    Plan
                    {sortBy === 'name' && <SortIcon order={sortOrder} />}
                  </button>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    className="flex items-center gap-1 hover:text-white"
                    onClick={() => toggleSort('claims')}
                  >
                    Total Claims
                    {sortBy === 'claims' && <SortIcon order={sortOrder} />}
                  </button>
                </th>
                <th className="px-4 py-3">Rejected</th>
                <th className="px-4 py-3">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {sorted.map((tenant) => (
                <tr key={tenant.id} className="text-slate-100">
                <td className="px-4 py-3">
                  <Link
                    href={`/tenants/${tenant.id}`}
                    data-testid="tenant-link"
                    className="font-medium text-white hover:underline"
                  >
                    {tenant.name}
                  </Link>
                  <p className="text-xs text-slate-300">ID: {tenant.id}</p>
                </td>
                <td className="px-4 py-3 capitalize">{t(`tenants.planOptions.${tenant.plan}`)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs capitalize text-emerald-300">
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTenant(tenant)}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20"
                    >
                      {tenant.totalClaims.toLocaleString()}
                    </button>
                  </td>
                <td className="px-4 py-3">{tenant.rejectedClaims.toLocaleString()}</td>
                <td className="px-4 py-3 text-xs text-slate-300">
                  {formatDistanceToNow(new Date(tenant.lastActivity), { addSuffix: true })}
                </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTenant && (
        <TenantDrawer
          tenant={selectedTenant}
          claims={claims.filter((claim) => claim.tenantId === selectedTenant.id)}
          onClose={() => setSelectedTenant(null)}
          closeLabel={t('tenants.close')}
          emptyLabel={t('tenants.noClaims')}
        />
      )}
    </div>
  );
}

function SortIcon({ order }: { order: SortOrder }) {
  return <span className="text-xs">{order === 'asc' ? '▲' : '▼'}</span>;
}

function TenantDrawer({
  tenant,
  claims,
  onClose,
  closeLabel,
  emptyLabel,
}: {
  tenant: Tenant & { totalClaims?: number; rejectedClaims?: number };
  claims: ClaimSummary[];
  onClose: () => void;
  closeLabel: string;
  emptyLabel: string;
}) {
  const { t } = useTranslation('common');
  const total = claims.length;
  const approved = claims.filter((claim) => claim.status === 'approved').length;
  const approvalRate = total === 0 ? 0 : Math.round((approved / total) * 100);
  const avgProcessingSeconds = (() => {
    const durations = claims
      .filter((claim) => claim.processedAt)
      .map((claim) =>
        (new Date(claim.processedAt!).getTime() - new Date(claim.submittedAt).getTime()) / 1000,
      );
    if (durations.length === 0) return 0;
    return Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length);
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
          <div>
            <h4 className="text-lg font-semibold text-white">{tenant.name}</h4>
            <p className="text-sm text-slate-300">
              Plan: {tenant.plan} • Total claims: {(tenant.totalClaims ?? claims.length).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 px-3 py-1 text-sm text-white hover:bg-white/20"
          >
            {closeLabel}
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 border-b border-white/10 bg-white/5 p-6 text-sm text-slate-100 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-300">{t('tenants.metrics.total')}</p>
              <p className="mt-1 text-xl font-semibold">{total.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-300">{t('tenants.metrics.approval')}</p>
              <p className="mt-1 text-xl font-semibold">{approvalRate}%</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-300">{t('tenants.metrics.processing')}</p>
              <p className="mt-1 text-xl font-semibold">{avgProcessingSeconds}s</p>
            </div>
          </div>
          {claims.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-200">{emptyLabel}</div>
          ) : (
            <table className="min-w-full divide-y divide-white/10 text-sm text-slate-100">
              <thead className="bg-white/5 text-left uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">Claim</th>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {claims.map((claim) => (
                  <tr key={claim.id}>
                    <td className="px-6 py-3 text-xs text-slate-300">{claim.id}</td>
                    <td className="px-6 py-3">{claim.patientName}</td>
                    <td className="px-6 py-3">SAR {claim.amount.toLocaleString()}</td>
                    <td className="px-6 py-3 capitalize">{claim.status}</td>
                    <td className="px-6 py-3 text-xs text-slate-300">
                      {formatDistanceToNow(new Date(claim.submittedAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
