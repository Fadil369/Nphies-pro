import fs from 'node:fs';
import path from 'node:path';

// Establish DATABASE_URL before loading Prisma client
const testDbPath = path.join(__dirname, '../../prisma/test.db');
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

beforeEach(async () => {
  await prisma.claim.deleteMany();
  await prisma.tenant.deleteMany();

  await prisma.tenant.create({
    data: {
      id: 'tenant-1',
      name: 'Test Tenant',
      plan: 'enterprise',
      claimsProcessed: 10,
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

describe('Tenants API', () => {
  it('returns tenants from the database', async () => {
    const app = createApp();

    const response = await request(app).get('/api/tenants');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      id: 'tenant-1',
      name: 'Test Tenant',
      plan: 'enterprise',
    });
  });

  it('creates a tenant', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/tenants')
      .send({ name: 'New Tenant', plan: 'professional' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('New Tenant');

    const stored = await prisma.tenant.findMany({ where: { name: 'New Tenant' } });
    expect(stored).toHaveLength(1);
  });
});
