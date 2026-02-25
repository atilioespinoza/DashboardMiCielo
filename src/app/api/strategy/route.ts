import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const pillar = searchParams.get('pillar');

    if (!pillar) {
        return NextResponse.json({ error: 'Pillar is required' }, { status: 400 });
    }

    try {
        const strategies = await sql`
            SELECT id, title, description, pillar, status, created_at FROM strategies 
            WHERE pillar = ${pillar} 
            ORDER BY created_at DESC
        `;

        const tasks = await sql`
            SELECT t.id, t.strategy_id, t.title, t.is_completed, t.created_at FROM tasks t
            JOIN strategies s ON t.strategy_id = s.id
            WHERE s.pillar = ${pillar}
            ORDER BY t.created_at ASC
        `;

        // Group tasks by strategy_id
        const strategiesWithTasks = strategies.map(strategy => ({
            ...strategy,
            tasks: tasks.filter(task => task.strategy_id === strategy.id)
        }));

        return NextResponse.json({ success: true, data: strategiesWithTasks });
    } catch (e) {
        // Just in case table doesn't exist yet, we will create it automatically later, but return empty for now
        if ((e as any).message?.includes('relation "strategies" does not exist')) {
            return NextResponse.json({ success: true, data: [] });
        }
        console.error("Error fetching strategies:", e);
        return NextResponse.json({ error: "Failed to fetch strategies" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, title, description, pillar } = body;

        if (!id || !title || !pillar) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Ensure tables exist
        await sql`
            CREATE TABLE IF NOT EXISTS strategies (
                id VARCHAR(255) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                pillar VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS tasks (
                id VARCHAR(255) PRIMARY KEY,
                strategy_id VARCHAR(255) REFERENCES strategies(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                is_completed BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;

        const result = await sql`
            INSERT INTO strategies (id, title, description, pillar, status)
            VALUES (${id}, ${title}, ${description || ''}, ${pillar}, 'active')
            RETURNING id, title, description, pillar, status, created_at
        `;

        return NextResponse.json({ success: true, data: { ...result[0], tasks: [] } });
    } catch (e) {
        console.error("Error creating strategy:", e);
        return NextResponse.json({ error: "Failed to create strategy" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await sql`
            UPDATE strategies 
            SET status = ${status}
            WHERE id = ${id}
            RETURNING id, title, description, pillar, status, created_at
        `;

        return NextResponse.json({ success: true, data: result[0] });
    } catch (e) {
        console.error("Error updating strategy:", e);
        return NextResponse.json({ error: "Failed to update strategy" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Strategy ID is required' }, { status: 400 });
    }

    try {
        // Due to ON DELETE CASCADE, deleting strategy should delete tasks, but just in case:
        await sql`DELETE FROM tasks WHERE strategy_id = ${id}`;
        await sql`DELETE FROM strategies WHERE id = ${id}`;
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Error deleting strategy:", e);
        return NextResponse.json({ error: "Failed to delete strategy" }, { status: 500 });
    }
}
