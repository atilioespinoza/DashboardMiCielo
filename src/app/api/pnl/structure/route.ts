import { NextResponse, NextRequest } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET() {
    try {
        const categories = await sql`SELECT * FROM pnl_categories ORDER BY order_index ASC`;
        const items = await sql`SELECT * FROM pnl_items ORDER BY order_index ASC`;

        // Group items by category
        const structure = categories.map(cat => ({
            ...cat,
            items: items.filter(item => item.category_id === cat.id)
        }));

        return NextResponse.json({ success: true, data: structure });
    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { type, id, label, category_id } = await req.json();

        if (type === 'category') {
            const result = await sql`
        INSERT INTO pnl_categories (id, label)
        VALUES (${id}, ${label})
        RETURNING *
      `;
            return NextResponse.json({ success: true, data: result[0] });
        } else if (type === 'item') {
            const result = await sql`
        INSERT INTO pnl_items (id, category_id, label)
        VALUES (${id}, ${category_id}, ${label})
        RETURNING *
      `;
            return NextResponse.json({ success: true, data: result[0] });
        }

        return NextResponse.json({ success: false, message: "Invalid type" }, { status: 400 });
    } catch (error: any) {
        console.error("Database Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) return NextResponse.json({ success: false, message: "Missing params" }, { status: 400 });

    try {
        if (type === 'category') {
            await sql`DELETE FROM pnl_categories WHERE id = ${id}`;
        } else {
            await sql`DELETE FROM pnl_items WHERE id = ${id}`;
        }
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
