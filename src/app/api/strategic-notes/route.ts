import { NextResponse, NextRequest } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';


// GET all notes for a specific pillar
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const pillar = searchParams.get('pillar');

    try {
        let notes;
        if (pillar) {
            notes = await sql`SELECT * FROM strategic_notes WHERE pillar = ${pillar} ORDER BY created_at DESC`;
        } else {
            notes = await sql`SELECT * FROM strategic_notes ORDER BY created_at DESC`;
        }

        return NextResponse.json({ success: true, data: notes });
    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST a new strategic note
export async function POST(req: NextRequest) {
    try {
        const { pillar, content } = await req.json();

        if (!pillar || !content) {
            return NextResponse.json({ success: false, message: "Pillar and content are required" }, { status: 400 });
        }

        const result = await sql`
      INSERT INTO strategic_notes (pillar, content, status)
      VALUES (${pillar}, ${content}, 'active')
      RETURNING *
    `;

        return NextResponse.json({ success: true, data: result[0] });
    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
