#!/bin/sh
set -e

echo "database migrations"
npx prisma migrate deploy

echo "Migrations completed"

echo "Starting application"
exec npm run start:prod
