import { notFound } from 'next/navigation';

import { TenantProfile } from '@/components/tenant/profile';

interface Props {
  params: {
    id: string;
  };
}

async function fetchTenant(id: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'http://localhost:3001'}/api/tenants/${id}`, {
    next: { revalidate: 0 },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to load tenant');
  }

  const body = await response.json();
  return body.data as TenantProfileData;
}

export default async function TenantPage({ params }: Props) {
  const tenant = await fetchTenant(params.id);

  if (!tenant) {
    notFound();
  }

  return <TenantProfile tenant={tenant} />;
}

export interface TenantProfileData {
  id: string;
  name: string;
  plan: string;
  status: string;
  claimsProcessed: number;
  lastActivity: string;
  metrics: {
    totalClaims: number;
    approvedClaims: number;
    rejectedClaims: number;
    pendingClaims: number;
    approvalRate: number;
    avgProcessingSeconds: number;
  };
  recentClaims: Array<{
    id: string;
    patientName: string;
    amount: number;
    status: string;
    submittedAt: string;
    processedAt: string | null;
    diagnosis: string;
    procedures: string;
    tenantId: string;
  }>;
  recentActivities: Array<{
    id: string;
    claimId: string;
    patientName: string;
    type: string;
    message: string;
    createdAt: string;
  }>;
}
