import { NextResponse, NextRequest } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET() {
    try {
        const values = await sql`SELECT * FROM pnl_values`;

        // Transform into a Record<itemId, Record<periodId, value>> for easy frontend use
        const valuesMap: Record<string, Record<string, number>> = {};
        values.forEach(v => {
            if (!valuesMap[v.item_id]) valuesMap[v.item_id] = {};
            valuesMap[v.item_id][v.period_id] = parseFloat(v.value);
        });

        return NextResponse.json({ success: true, data: valuesMap });
    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { item_id, period_id, value } = await req.json();

        if (!item_id || !period_id || value === undefined) {
            return NextResponse.json({ success: false, message: "Missing data" }, { status: 400 });
        }

        const result = await sql`
      INSERT INTO pnl_values (item_id, period_id, value)
      VALUES (${item_id}, ${period_id}, ${value})
      ON CONFLICT (item_id, period_id) DO UPDATE SET value = EXCLUDED.value
      RETURNING *
    `;

        return NextResponse.json({ success: true, data: result[0] });
    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
