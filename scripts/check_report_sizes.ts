import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function checkSizes() {
    const results = await sql`
        SELECT report_type, length(content) as char_count, created_at 
        FROM ai_reports 
        ORDER BY created_at DESC 
        LIMIT 10;
    `;
    console.table(results);
}

checkSizes();
