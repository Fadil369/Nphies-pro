export interface AuditRecord {
  action: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  phiInvolved: boolean;
  meta?: Record<string, unknown>;
}

const AUDIT_SINK = process.env.AUDIT_SINK ?? 'stdout';

export async function auditLog(record: AuditRecord): Promise<void> {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    ...record,
  });

  if (AUDIT_SINK === 'stdout') {
    // eslint-disable-next-line no-console
    console.log(line);
    return;
  }

  // TODO: push to dedicated audit service endpoint
  // eslint-disable-next-line no-console
  console.log(line);
}
