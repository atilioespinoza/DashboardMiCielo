import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl) {
    console.warn('DATABASE_URL is missing. Database features will be disabled.');
}

export const sql = neon(databaseUrl);
