import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, strategy_id, title } = body;

        if (!id || !strategy_id || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await sql`
            INSERT INTO tasks (id, strategy_id, title, is_completed)
            VALUES (${id}, ${strategy_id}, ${title}, false)
            RETURNING id, strategy_id, title, is_completed, created_at
        `;

        return NextResponse.json({ success: true, data: result[0] });
    } catch (e) {
        console.error("Error creating task:", e);
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, is_completed, title } = body;

        if (!id) {
            return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
        }

        let result;
        if (title !== undefined && is_completed !== undefined) {
            result = await sql`
                UPDATE tasks 
                SET is_completed = ${is_completed}, title = ${title}
                WHERE id = ${id}
                RETURNING id, strategy_id, title, is_completed, created_at
            `;
        } else if (is_completed !== undefined) {
            result = await sql`
                UPDATE tasks 
                SET is_completed = ${is_completed}
                WHERE id = ${id}
                RETURNING id, strategy_id, title, is_completed, created_at
            `;
        } else if (title !== undefined) {
            result = await sql`
                UPDATE tasks 
                SET title = ${title}
                WHERE id = ${id}
                RETURNING id, strategy_id, title, is_completed, created_at
            `;
        } else {
            return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: result[0] });
    } catch (e) {
        console.error("Error updating task:", e);
        return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    try {
        await sql`DELETE FROM tasks WHERE id = ${id}`;
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Error deleting task:", e);
        return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }
}
