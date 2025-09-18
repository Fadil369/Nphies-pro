#!/usr/bin/env bash
set -euo pipefail

pushd "$(dirname "$0")"/..

export DATABASE_URL="file:./services/platform-gateway/prisma/dev.db"

if [ -f services/platform-gateway/prisma/dev.db ]; then
  rm -f services/platform-gateway/prisma/dev.db
fi

pnpm --filter @nphies-pro/platform-gateway prisma:migrate deploy
pnpm --filter @nphies-pro/platform-gateway prisma:seed

popd
