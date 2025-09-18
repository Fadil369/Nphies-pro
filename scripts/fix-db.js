#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Fixing database connection...');

// Change to platform-gateway directory
process.chdir(path.join(__dirname, '../services/platform-gateway'));

try {
  // Remove existing database
  execSync('rm -f prisma/dev.db*', { stdio: 'inherit' });
  
  // Push schema
  execSync('pnpm prisma db push --force-reset', { stdio: 'inherit' });
  
  // Generate client
  execSync('pnpm prisma generate', { stdio: 'inherit' });
  
  // Seed database
  execSync('pnpm prisma:seed', { stdio: 'inherit' });
  
  console.log('✅ Database fixed successfully!');
  
  // Verify data
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  prisma.tenant.findMany().then(tenants => {
    console.log(`📊 Found ${tenants.length} tenants`);
    return prisma.claim.findMany();
  }).then(claims => {
    console.log(`📋 Found ${claims.length} claims`);
    return prisma.$disconnect();
  }).catch(console.error);
  
} catch (error) {
  console.error('❌ Error fixing database:', error.message);
  process.exit(1);
}
