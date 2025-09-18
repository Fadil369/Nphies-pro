import fs from 'node:fs';
import path from 'node:path';

const testDbPath = path.join(__dirname, '../../prisma/tenant-detail.db');
process.env.DATABASE_URL = `file:${testDbPath}`;

import request from 'supertest';

import { createApp } from '../app';
import { prisma } from '../db/client';

const migrationPath = path.join(
  __dirname,
  '../../prisma/migrations/0001_init/migration.sql',
);

const readMigrationStatements = () => {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  return sql
    .split(/;\s*\n/)
    .map((statement) => statement.trim())
    .filter(Boolean)
    .map((statement) => `${statement};`);
};

beforeAll(async () => {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const statements = readMigrationStatements();
  for (const statement of statements) {
    // eslint-disable-next-line no-await-in-loop
    await prisma.$executeRawUnsafe(statement);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

beforeEach(async () => {
  await prisma.claim.deleteMany();
  await prisma.tenant.deleteMany();
});

describe('Tenant detail endpoint', () => {
  it('returns metrics and recent claims for a tenant', async () => {
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        plan: 'starter',
        claimsProcessed: 5,
      },
    });

    await prisma.claim.createMany({
      data: [
        {
          id: 'claim-1',
          tenantId: tenant.id,
          patientName: 'Alice',
          patientId: 'P001',
          nationalId: '1234567890',
          amount: 1000,
          status: 'approved',
          submittedAt: new Date(Date.now() - 10_000),
          processedAt: new Date(),
          diagnosis: 'Hypertension',
          procedures: '[]',
          provider: 'Provider A',
          insurancePolicy: 'POL-1',
          nphiesStatus: 'verified',
          preAuthRequired: false,
        },
        {
          id: 'claim-2',
          tenantId: tenant.id,
          patientName: 'Bob',
          patientId: 'P002',
          nationalId: '1234567891',
          amount: 500,
          status: 'pending',
          submittedAt: new Date(),
          processedAt: null,
          diagnosis: 'Flu',
          procedures: '[]',
          provider: 'Provider B',
          insurancePolicy: 'POL-2',
          nphiesStatus: 'pending_verification',
          preAuthRequired: false,
        },
      ],
    });

    const app = createApp();
    const response = await request(app).get(`/api/tenants/${tenant.id}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.metrics).toMatchObject({
      totalClaims: 2,
      approvedClaims: 1,
      pendingClaims: 1,
      rejectedClaims: 0,
    });
    expect(response.body.data.recentClaims).toHaveLength(2);
  });
});
