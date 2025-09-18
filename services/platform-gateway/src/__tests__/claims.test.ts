import fs from 'node:fs';
import path from 'node:path';

const testDbPath = path.join(__dirname, '../../prisma/test-claims.db');
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

afterEach(async () => {
  await prisma.claim.deleteMany();
  await prisma.tenant.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

describe('Claims API', () => {
  it('lists claims from database', async () => {
    const tenant = await prisma.tenant.create({
      data: { name: 'Tenant', plan: 'starter' },
    });

    await prisma.claim.create({
      data: {
        tenantId: tenant.id,
        patientName: 'Test Patient',
        patientId: 'PAT-1',
        nationalId: '1234567890',
        amount: 1000,
        status: 'approved',
        submittedAt: new Date(),
        processedAt: new Date(),
        diagnosis: 'Hypertension',
        procedures: JSON.stringify(['ECG']),
        provider: 'Provider',
        insurancePolicy: 'POL-1',
        nphiesStatus: 'verified',
        preAuthRequired: false,
      },
    });

    const app = createApp();
    const response = await request(app).get('/api/claims');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
  });
});
