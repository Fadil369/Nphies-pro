'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export interface ClaimListItem {
  id: string;
  patientName: string;
  amount: number;
  status: string;
  submittedAt: string;
  processedAt: string | null;
  tenantId: string;
  procedures?: string;
}

export function ClaimList({
  claims,
  tenantsById,
  tenants,
  title,
  emptyLabel,
  filters,
  exportLabel,
  searchPlaceholder,
  tenantFilterLabel,
  dateFromLabel,
  dateToLabel,
  pageSize = 6,
  onUpdateStatus,
  onViewTimeline,
  timelineLabel,
}: {
  claims: ClaimListItem[];
  tenantsById: Record<string, { name: string }>;
  tenants: Array<{ id: string; name: string }>;
  title: string;
  emptyLabel: string;
  filters: Array<{ value: string; label: string }>;
  exportLabel: string;
  searchPlaceholder: string;
  tenantFilterLabel: string;
  dateFromLabel: string;
  dateToLabel: string;
  pageSize?: number;
  onUpdateStatus?: (id: string, status: string) => void;
  onViewTimeline?: (claim: ClaimListItem) => void;
  timelineLabel?: string;
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [tenantFilter, setTenantFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const { t } = useTranslation('common');

  const filtered = useMemo(() => {
    return claims.filter((claim) =>
      (statusFilter === 'all' ? true : claim.status === statusFilter) &&
      (tenantFilter === 'all' ? true : claim.tenantId === tenantFilter) &&
      (search
        ? claim.patientName.toLowerCase().includes(search.toLowerCase()) ||
          claim.id.toLowerCase().includes(search.toLowerCase())
        : true) &&
      (fromDate ? new Date(claim.submittedAt) >= new Date(fromDate) : true) &&
      (toDate ? new Date(claim.submittedAt) <= new Date(toDate) : true),
    );
  }, [claims, fromDate, search, statusFilter, tenantFilter, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-200">
            <button
              type="button"
              onClick={() => downloadCsv(filtered, tenantsById)}
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1 hover:bg-white/20"
            >
              {exportLabel}
            </button>
            <span>
              {t('claims.pagination', { current: currentPage, total: totalPages })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <select
              value={tenantFilter}
              onChange={(event) => setTenantFilter(event.target.value)}
              className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="all">{tenantFilterLabel}</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-300" htmlFor="claims-from">
              {dateFromLabel}
            </label>
            <input
              id="claims-from"
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="flex-1 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-300" htmlFor="claims-to">
              {dateToLabel}
            </label>
            <input
              id="claims-to"
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="flex-1 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm text-white">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`rounded-full px-3 py-1 transition ${
                statusFilter === filter.value
                  ? 'bg-white text-slate-900'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
          {emptyLabel}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {paginated.map((claim) => {
            const statusLabel =
              filters.find((filter) => filter.value === claim.status)?.label ?? claim.status;
            return (
              <div
                key={claim.id}
                data-testid="claim-card"
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-300">{claim.id}</p>
                    <p className="text-lg font-semibold text-white">{claim.patientName}</p>
                  </div>
                  <StatusBadge status={claim.status} label={statusLabel} />
                </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-200">
                <div>
                  <p className="text-xs text-slate-400">Tenant</p>
                  <p>{tenantsById[claim.tenantId]?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Amount</p>
                  <p>SAR {claim.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Submitted</p>
                  <p>{format(new Date(claim.submittedAt), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Processed</p>
                  <p>
                    {claim.processedAt
                      ? format(new Date(claim.processedAt), 'dd MMM yyyy')
                      : '—'}
                  </p>
                </div>
              </div>
              {onUpdateStatus && (
                <div className="mt-3 flex items-center gap-2 text-xs">
                  {filters
                    .filter((filter) => filter.value !== 'all')
                    .map((filter) => (
                      <button
                        key={filter.value}
                        data-testid={`status-${filter.value}`}
                        type="button"
                        onClick={() => onUpdateStatus(claim.id, filter.value)}
                        className={`rounded-full px-3 py-1 transition ${
                          claim.status === filter.value
                            ? 'bg-white text-slate-900'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                </div>
              )}
              {onViewTimeline && (
                <button
                  type="button"
                  data-testid="view-timeline"
                  onClick={() => onViewTimeline(claim)}
                  className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs text-white transition hover:bg-white/20"
                >
                  {timelineLabel ?? 'View timeline'}
                </button>
              )}
            </div>
          );
          })}
        </div>
      )}

      {filtered.length > pageSize && (
        <div className="flex items-center justify-center gap-3 text-xs text-white">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded-full border border-white/10 bg-white/10 px-3 py-1 disabled:opacity-40"
          >
            ◀
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="rounded-full border border-white/10 bg-white/10 px-3 py-1 disabled:opacity-40"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}

function downloadCsv(claims: ClaimListItem[], tenantsById: Record<string, { name: string }>) {
  const header = ['Claim ID', 'Patient', 'Amount', 'Status', 'Tenant', 'Submitted', 'Processed'];
  const rows = claims.map((claim) => [
    claim.id,
    claim.patientName,
    claim.amount.toString(),
    claim.status,
    tenantsById[claim.tenantId]?.name ?? '—',
    claim.submittedAt,
    claim.processedAt ?? '',
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'claims.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const palette: Record<string, string> = {
    approved: 'bg-emerald-500/20 text-emerald-300',
    pending: 'bg-amber-500/20 text-amber-200',
    rejected: 'bg-rose-500/20 text-rose-300',
  };

  const cls = palette[status] ?? 'bg-slate-500/20 text-slate-200';
  return (
    <span className={`rounded-full px-3 py-1 text-xs capitalize ${cls}`}>
      {label}
    </span>
  );
}
