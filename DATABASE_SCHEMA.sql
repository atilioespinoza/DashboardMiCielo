-- SCHEMA FOR DASHBOARD MI CIELO (NEON / VERCEL POSTGRES)
-- Execute this in your Neon SQL Editor

-- 1. Table for Operational Goals (P&L Targets)
CREATE TABLE IF NOT EXISTS business_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'marketing', 'logistics', 'production', 'pnl'
    key TEXT NOT NULL UNIQUE, -- 'target_margin', 'max_cac', 'production_efficiency'
    value DECIMAL NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table for Strategic Playbooks (Actionable Notes)
CREATE TABLE IF NOT EXISTS strategic_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar TEXT NOT NULL, -- 'comercial', 'operacional', 'marketing'
    content TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- 'active', 'archived', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Cache for Shopify Analytics (To optimize loading speed)
CREATE TABLE IF NOT EXISTS shopify_cache (
    key TEXT PRIMARY KEY, -- e.g., 'executive_mtd', 'traffic_source_30d'
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tables for P&L Persistence
CREATE TABLE IF NOT EXISTS pnl_categories (
    id TEXT PRIMARY KEY, -- e.g., 'servicios', 'logistica'
    label TEXT NOT NULL,
    is_expanded BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pnl_items (
    id TEXT PRIMARY KEY, -- e.g., 'arriendo', 'luz'
    category_id TEXT REFERENCES pnl_categories(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS pnl_values (
    item_id TEXT REFERENCES pnl_items(id) ON DELETE CASCADE,
    period_id TEXT NOT NULL, -- e.g., '2025-01'
    value DECIMAL NOT NULL DEFAULT 0,
    PRIMARY KEY (item_id, period_id)
);

-- 5. Seed Initial P&L Structure (Based on your current design)
INSERT INTO pnl_categories (id, label, order_index) VALUES
('servicios', 'Servicios Básicos', 1),
('logistica', 'Logística y Operaciones', 2),
('marketing', 'Marketing y Publicidad', 3),
('rrhh', 'Recursos Humanos', 4),
('bancos', 'VALORES CUOTA BANCOS', 5)
ON CONFLICT (id) DO NOTHING;

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

-- Insert Initial Goals for the P&L Table
INSERT INTO business_goals (category, key, value, description) VALUES
('pnl', 'target_margin_percent', 0.25, 'Objetivo de margen de contribución ideal'),
('marketing', 'target_retention_rate', 0.25, 'Objetivo de tasa de recurrencia Q3'),
('logistics', 'max_delivery_cost_percent', 0.15, 'Costo máximo aceptable de logística sobre venta')
ON CONFLICT (key) DO NOTHING;
