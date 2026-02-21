import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
    try {
        const logs: any[] = [];

        try {
            await sql`
                CREATE TABLE IF NOT EXISTS business_goals (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    category TEXT NOT NULL,
                    key TEXT NOT NULL UNIQUE,
                    value DECIMAL NOT NULL,
                    description TEXT,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `;
            logs.push({ cmd: "business_goals", status: "ok" });
        } catch (e: any) { logs.push({ cmd: "business_goals", error: e.message }); }

        try {
            await sql`
                CREATE TABLE IF NOT EXISTS strategic_notes (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    pillar TEXT NOT NULL,
                    content TEXT NOT NULL,
                    status TEXT DEFAULT 'active',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `;
            logs.push({ cmd: "strategic_notes", status: "ok" });
        } catch (e: any) { logs.push({ cmd: "strategic_notes", error: e.message }); }

        try {
            await sql`
                CREATE TABLE IF NOT EXISTS shopify_cache (
                    key TEXT PRIMARY KEY,
                    data JSONB NOT NULL,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `;
            logs.push({ cmd: "shopify_cache", status: "ok" });
        } catch (e: any) { logs.push({ cmd: "shopify_cache", error: e.message }); }

        try {
            await sql`
                CREATE TABLE IF NOT EXISTS pnl_categories (
                    id TEXT PRIMARY KEY,
                    label TEXT NOT NULL,
                    is_expanded BOOLEAN DEFAULT true,
                    order_index INTEGER DEFAULT 0
                );
            `;
            logs.push({ cmd: "pnl_categories", status: "ok" });
        } catch (e: any) { logs.push({ cmd: "pnl_categories", error: e.message }); }

        try {
            await sql`
                CREATE TABLE IF NOT EXISTS pnl_items (
                    id TEXT PRIMARY KEY,
                    category_id TEXT REFERENCES pnl_categories(id) ON DELETE CASCADE,
                    label TEXT NOT NULL,
                    order_index INTEGER DEFAULT 0
                );
            `;
            logs.push({ cmd: "pnl_items", status: "ok" });
        } catch (e: any) { logs.push({ cmd: "pnl_items", error: e.message }); }

        try {
            await sql`
                CREATE TABLE IF NOT EXISTS pnl_values (
                    item_id TEXT REFERENCES pnl_items(id) ON DELETE CASCADE,
                    period_id TEXT NOT NULL,
                    value DECIMAL NOT NULL DEFAULT 0,
                    PRIMARY KEY (item_id, period_id)
                );
            `;
            logs.push({ cmd: "pnl_values", status: "ok" });
        } catch (e: any) { logs.push({ cmd: "pnl_values", error: e.message }); }

        // Seeds
        try {
            await sql`
                INSERT INTO pnl_categories (id, label, order_index) VALUES
                ('servicios', 'Servicios Básicos', 1),
                ('logistica', 'Logística y Operaciones', 2),
                ('marketing', 'Marketing y Publicidad', 3),
                ('rrhh', 'Recursos Humanos', 4),
                ('bancos', 'VALORES CUOTA BANCOS', 5)
                ON CONFLICT (id) DO NOTHING;
            `;
            logs.push({ cmd: "seed_categories", status: "ok" });
        } catch (e: any) { logs.push({ cmd: "seed_categories", error: e.message }); }

        try {
            await sql`
                INSERT INTO pnl_items (id, category_id, label, order_index) VALUES
                ('arriendo', 'servicios', 'Arriendo', 1),
                ('luz', 'servicios', 'Luz', 2),
                ('envio-gratis', 'logistica', '📦 Subsidio Envío Gratis', 1),
                ('embalaje', 'logistica', 'Packaging y Bolsas', 2),
                ('facebook-ads', 'marketing', 'Facebook / IG Ads', 1),
                ('influencers', 'marketing', 'Canjes e Influencers', 2),
                ('vendedora', 'rrhh', 'Sueldo Vendedora', 1),
                ('itau', 'bancos', 'Banco ITAU', 1)
                ON CONFLICT (id) DO NOTHING;
            `;
            logs.push({ cmd: "seed_items", status: "ok" });
        } catch (e: any) { logs.push({ cmd: "seed_items", error: e.message }); }

        // Verify tables
        const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;

        return NextResponse.json({
            success: true,
            logs,
            foundTables: tables.map(t => t.table_name)
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
