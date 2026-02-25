import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
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
        return NextResponse.json({ success: true, message: 'Tables initialized' });
    } catch (e) {
        return NextResponse.json({ success: false, error: e });
    }
}
