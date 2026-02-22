import { NextResponse, NextRequest } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    if (!role) {
        return NextResponse.json({ success: false, error: "Rol no especificado" }, { status: 400 });
    }

    try {
        const result = await sql`
            SELECT content FROM ai_context_rules WHERE role = ${role} LIMIT 1
        `;

        if (result.length > 0) {
            return NextResponse.json({ success: true, context: result[0].content });
        } else {
            // Return empty context if not found so the UI can prompt the user to write one
            return NextResponse.json({ success: true, context: "" });
        }
    } catch (error: any) {
        console.error("AI Context API Error (GET):", error);
        return NextResponse.json({ success: false, error: error.message || "Error interno" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { role, content } = body;

        if (!role || content === undefined) {
            return NextResponse.json({ success: false, error: "Datos incompletos" }, { status: 400 });
        }

        // Upsert the context content on the cloud PG server
        await sql`
            INSERT INTO ai_context_rules (role, content)
            VALUES (${role}, ${content})
            ON CONFLICT (role) 
            DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
        `;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("AI Context API Error (POST):", error);
        return NextResponse.json({ success: false, error: error.message || "Error interno" }, { status: 500 });
    }
}
