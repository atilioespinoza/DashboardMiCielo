import { NextResponse, NextRequest } from 'next/server';
import { sql } from '@/lib/db';

// GET all business goals
export async function GET() {
    try {
        const goals = await sql`SELECT * FROM business_goals ORDER BY category, key`;
        return NextResponse.json({ success: true, data: goals });
    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST/Update a goal
export async function POST(req: NextRequest) {
    try {
        const { key, value } = await req.json();

        if (!key || value === undefined) {
            return NextResponse.json({ success: false, message: "Key and value are required" }, { status: 400 });
        }

        const result = await sql`
      INSERT INTO business_goals (category, key, value)
      VALUES ('general', ${key}, ${value})
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      RETURNING *
    `;

        return NextResponse.json({ success: true, data: result[0] });
    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
