"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../ui/Card';
import { ShoppingBag, ChevronDown, ChevronRight, Plus, X, Edit2, Check, RefreshCw, Calendar, HelpCircle, ArrowUpRight, ArrowDownRight, TrendingUp, Trash2, Landmark, History } from 'lucide-react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { BrainCircuit, X as CloseIcon } from 'lucide-react';
import { ReportModal } from '../ui/ReportModal';

type Periodicity = 'monthly' | 'quarterly' | 'yearly';

interface PnlItem {
    id: string;
    label: string;
    values: Record<string, number>;
}

interface PnlCategory {
    id: string;
    label: string;
    items: PnlItem[];
    isExpanded: boolean;
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function CommercialPillar() {
    const [periodicity, setPeriodicity] = useState<Periodicity>('monthly');
    const [selectedYear, setSelectedYear] = useState(2025);
    const [editingCell, setEditingCell] = useState<{ itemId: string, periodId: string, type: 'cost' | 'bank' | 'category' } | null>(null);
    const [showSalesBreakdown, setShowSalesBreakdown] = useState(false);

    // Management state
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAddingItem, setIsAddingItem] = useState<string | null>(null);
    const [newItemName, setNewItemName] = useState('');

    const [tempEditValue, setTempEditValue] = useState('');
    const [isLoadingShopify, setIsLoadingShopify] = useState(true);
    const [shopifyStatus, setShopifyStatus] = useState<'connected' | 'error' | 'disconnected'>('disconnected');

    const [categories, setCategories] = useState<PnlCategory[]>([]);
    const [bankCategory, setBankCategory] = useState<PnlCategory | null>(null);

    const [salesData, setSalesData] = useState<Record<string, any>>({});
    const [channelData, setChannelData] = useState<{ ecommerce: number; pos: number }>({ ecommerce: 0, pos: 0 });
    const [topProduct, setTopProduct] = useState({ title: 'Cargando...', rev: 0 });

    // AI Report States
    const [report, setReport] = useState<string | null>(null);
    const [showReport, setShowReport] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);

    useEffect(() => {
        fetchShopifyData();
        fetchPnlStructureAndValues();
        fetchContextData();
    }, []);

    const fetchPnlStructureAndValues = async () => {
        try {
            // 1. Fetch Structure
            const structRes = await fetch('/api/pnl/structure');
            const structJson = await structRes.json();

            // 2. Fetch Values
            const valRes = await fetch('/api/pnl/values');
            const valJson = await valRes.json();

            if (structJson.success && valJson.success) {
                const values = valJson.data;
                const fullStructure = structJson.data.map((cat: any) => ({
                    ...cat,
                    items: cat.items.map((item: any) => ({
                        ...item,
                        values: values[item.id] || {}
                    }))
                }));

                const banks = fullStructure.find((c: any) => c.id === 'bancos');
                const others = fullStructure.filter((c: any) => c.id !== 'bancos');

                setCategories(others);
                setBankCategory(banks || null);
            }
        } catch (e) {
            console.error("Error loading P&L from DB", e);
        }
    };

    const fetchContextData = async () => {
        try {
            const res = await fetch('/api/shopify/analytics/executive?period=mtd');
            const json = await res.json();
            if (json.success && json.data) {
                const channels = json.data.channelData;
                const topP = json.data.topProducts?.[0];

                let ecom = 0, pos = 0;
                channels.forEach((c: any) => {
                    if (c.name === 'Ecommerce') ecom = c.value;
                    if (c.name === 'Tienda Física') pos = c.value;
                });

                setChannelData({ ecommerce: ecom, pos: pos });
                if (topP) setTopProduct({ title: topP.title, rev: topP.rev });
            }
        } catch (e) {
            console.error("Error fetching context data", e);
        }
    };

    const fetchShopifyData = async () => {
        setIsLoadingShopify(true);
        try {
            const res = await fetch('/api/shopify/pnl');
            const json = await res.json();
            if (json.success) {
                setSalesData(json.data);
                setShopifyStatus(Object.keys(json.data).length > 0 ? 'connected' : 'disconnected');
            } else {
                setShopifyStatus('error');
            }
        } catch (e) {
            setShopifyStatus('error');
        } finally {
            setIsLoadingShopify(false);
        }
    };

    const visiblePeriods = useMemo(() => {
        if (periodicity === 'monthly') {
            return MONTH_NAMES.map((name, i) => ({
                id: `${selectedYear}-${(i + 1).toString().padStart(2, '0')}`,
                label: name
            }));
        }
        if (periodicity === 'quarterly') {
            return [1, 2, 3, 4].map(q => ({
                id: `Q${q}-${selectedYear}`,
                label: `Trim ${q}`
            }));
        }
        if (periodicity === 'yearly') {
            return [2024, 2025, 2026].map(year => ({
                id: `${year}`,
                label: `${year}`
            }));
        }
        return [];
    }, [periodicity, selectedYear]);

    const getPeriodValues = (pId: string, sourceValues: Record<string, number>) => {
        if (pId.includes('Q')) {
            const parts = pId.split('-');
            const quarter = parseInt(parts[0].substring(1, 2));
            const year = parts[1];
            const startMonth = (quarter - 1) * 3 + 1;
            const endMonth = quarter * 3;
            let sum = 0;
            for (let m = startMonth; m <= endMonth; m++) {
                const mKey = `${year}-${m.toString().padStart(2, '0')}`;
                sum += sourceValues[mKey] || 0;
            }
            return sum;
        }
        if (pId.length === 4) {
            let sum = 0;
            Object.keys(sourceValues).forEach(mKey => {
                if (mKey.startsWith(pId)) sum += sourceValues[mKey];
            });
            return sum;
        }
        return sourceValues[pId] || 0;
    };

    const processedData = useMemo(() => {
        return visiblePeriods.map(p => {
            let stats = { ventas: 0, cost: 0, totalBruto: 0, taxes: 0, shipping: 0, refunds: 0 };

            if (p.id.includes('Q')) {
                const quarter = parseInt(p.id.substring(1, 2));
                const year = p.id.split('-')[1];
                const months = [(quarter - 1) * 3 + 1, (quarter - 1) * 3 + 2, quarter * 3].map(m => `${year}-${m.toString().padStart(2, '0')}`);
                months.forEach(mId => {
                    const row = salesData[mId];
                    if (row) {
                        stats.ventas += row.ventas;
                        stats.cost += row.cost;
                        stats.totalBruto += row.totalBruto;
                        stats.taxes += row.taxes;
                        stats.shipping += row.shipping;
                        stats.refunds += row.refunds;
                    }
                });
            } else if (p.id.length === 4) {
                Object.keys(salesData).forEach(mId => {
                    if (mId.startsWith(p.id)) {
                        const row = salesData[mId];
                        stats.ventas += row.ventas;
                        stats.cost += row.cost;
                        stats.totalBruto += row.totalBruto;
                        stats.taxes += row.taxes;
                        stats.shipping += row.shipping;
                        stats.refunds += row.refunds;
                    }
                });
            } else {
                const row = salesData[p.id];
                if (row) {
                    stats.ventas = row.ventas;
                    stats.cost = row.cost;
                    stats.totalBruto = row.totalBruto;
                    stats.taxes = row.taxes;
                    stats.shipping = row.shipping;
                    stats.refunds = row.refunds;
                }
            }

            const mgProducto = stats.ventas - stats.cost;
            const totalCostosOperacionales = categories.reduce((acc, cat) => acc + cat.items.reduce((sum, item) => sum + getPeriodValues(p.id, item.values), 0), 0);
            const subtotalBancos = bankCategory ? bankCategory.items.reduce((acc, bank) => acc + getPeriodValues(p.id, bank.values), 0) : 0;
            const ebitda = mgProducto - totalCostosOperacionales;
            const cajaTeorica = ebitda - subtotalBancos;

            return { ...p, ...stats, mgProducto, totalCostosOperacionales, ebitda, subtotalBancos, cajaTeorica };
        });
    }, [visiblePeriods, salesData, categories, bankCategory]);

    const handleEditClick = (itemId: string, periodId: string, currentValue: number, type: 'cost' | 'bank' | 'category') => {
        if (periodId.includes('Q') || periodId.length === 4) return;
        setEditingCell({ itemId, periodId, type });
        setTempEditValue(currentValue.toString());
    };

    const saveEditValue = async () => {
        if (!editingCell) return;
        const value = parseFloat(tempEditValue) || 0;
        const { itemId, periodId, type } = editingCell;

        // Persist to Neon
        try {
            await fetch('/api/pnl/values', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_id: itemId, period_id: periodId, value })
            });

            if (type === 'cost') {
                setCategories(prev => prev.map(cat => ({
                    ...cat,
                    items: cat.items.map(item => item.id === itemId ? { ...item, values: { ...item.values, [periodId]: value } } : item)
                })));
            } else if (type === 'bank') {
                setBankCategory(prev => prev ? {
                    ...prev,
                    items: prev.items.map(item => item.id === itemId ? { ...item, values: { ...item.values, [periodId]: value } } : item)
                } : null);
            }
        } catch (e) {
            console.error("Error saving P&L value", e);
        }
        setEditingCell(null);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            maximumFractionDigits: 0
        }).format(val);
    };

    const generateAIReport = async () => {
        setGeneratingReport(true);
        setShowReport(true);
        try {
            // Filter out future empty months to avoid AI hallucinations
            const activePeriods = processedData.filter(p => p.ventas > 0 || p.cost > 0 || p.totalCostosOperacionales > 0);

            const context = {
                financial_summary: activePeriods.slice(-3), // Last 3 active periods for trend
                categories: categories.map(c => ({ label: c.label, items: c.items.map(i => i.label) })),
                top_product: topProduct,
                channels: channelData
            };

            const res = await fetch('/api/ai/executive-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dashboardData: context, type: 'commercial' })
            });

            const json = await res.json();
            if (json.success) setReport(json.report);
            else setReport("Error: " + json.error);
        } catch (e) {
            setReport("Error técnico al conectar con el CFO Digital.");
        } finally {
            setGeneratingReport(false);
        }
    };

    // Management Methods
    const addCategory = async () => {
        if (!newCategoryName.trim()) return;
        const id = `cat-${Date.now()}`;

        try {
            await fetch('/api/pnl/structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'category', id, label: newCategoryName })
            });
            setCategories([...categories, { id, label: newCategoryName, items: [], isExpanded: true }]);
        } catch (e) {
            console.error(e);
        }
        setNewCategoryName('');
        setIsAddingCategory(false);
    };

    const deleteCategory = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar esta categoría y todos sus ítems?')) {
            try {
                await fetch(`/api/pnl/structure?type=category&id=${id}`, { method: 'DELETE' });
                setCategories(categories.filter(c => c.id !== id));
            } catch (e) {
                console.error(e);
            }
        }
    };

    const addItem = async (categoryId: string) => {
        if (!newItemName.trim()) return;
        const id = `item-${Date.now()}`;

        try {
            await fetch('/api/pnl/structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'item', id, label: newItemName, category_id: categoryId })
            });

            if (categoryId === 'bancos') {
                setBankCategory(prev => prev ? {
                    ...prev,
                    items: [...prev.items, { id, label: newItemName, values: {} }]
                } : null);
            } else {
                setCategories(categories.map(cat => {
                    if (cat.id === categoryId) {
                        return { ...cat, items: [...cat.items, { id, label: newItemName, values: {} }] };
                    }
                    return cat;
                }));
            }
        } catch (e) {
            console.error(e);
        }
        setNewItemName('');
        setIsAddingItem(null);
    };

    const deleteItem = async (categoryId: string, itemId: string) => {
        try {
            await fetch(`/api/pnl/structure?type=item&id=${itemId}`, { method: 'DELETE' });
            if (categoryId === 'bancos') {
                setBankCategory(prev => prev ? {
                    ...prev,
                    items: prev.items.filter(i => i.id !== itemId)
                } : null);
            } else {
                setCategories(categories.map(cat => {
                    if (cat.id === categoryId) {
                        return { ...cat, items: cat.items.filter(i => i.id !== itemId) };
                    }
                    return cat;
                }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const totalVentasAnual = processedData.reduce((a, b) => a + b.ventas, 0);
    const avgMargen = totalVentasAnual > 0 ? (processedData.reduce((a, b) => a + b.mgProducto, 0) / totalVentasAnual) * 100 : 0;

    return (
        <div style={{ padding: '0px', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '100%', overflow: 'hidden', animation: 'fadeIn 0.5s ease-out' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                .pnl-container { background: var(--bg-primary); border-radius: 20px; border: 1px solid var(--border-color); overflow: hidden; box-shadow: var(--shadow-sm); }
                .table-wrapper { overflow-x: auto; position: relative; max-width: 100%; scrollbar-width: thin; }
                .pnl-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.8125rem; }
                .pnl-table th, .pnl-table td { padding: 12px 16px; border-bottom: 1px solid var(--border-color); white-space: nowrap; }
                .sticky-col { position: sticky; left: 0; background: var(--bg-primary); z-index: 10; border-right: 1px solid var(--border-color); min-width: 280px; max-width: 300px; white-space: normal; }
                .header-row th { background: var(--bg-tertiary); font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
                .editable-cell:hover { background: rgba(139, 92, 246, 0.04); cursor: pointer; }
                .category-row { background: var(--bg-secondary); font-weight: 700; }
                .summary-row { background: rgba(139, 92, 246, 0.03); font-weight: 800; }
                .kpi-card { padding: 16px !important; }
                .kpi-value { font-size: 1.25rem !important; margin-top: 4px !important; }
                .compact-btn { padding: 8px 16px; font-size: 0.8rem; font-weight: 700; border-radius: 10px; cursor: pointer; transition: 0.2s; border: 1px solid var(--border-color); }
                .compact-btn:hover { opacity: 0.8; }
                .action-icon { opacity: 0; transition: 0.2s; cursor: pointer; color: var(--text-tertiary); }
                tr:hover .action-icon { opacity: 1; }
                .action-icon:hover { color: var(--danger); }
                .add-row { background: transparent; transition: 0.2s; }
                .add-row:hover { background: rgba(139, 92, 246, 0.02); }
                .bank-section { border-top: 3px solid var(--info-light); margin-top: 2px; }
            `}</style>

            {/* Action Bar (Header) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--bg-tertiary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                        <Landmark size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Pilar Comercial (P&L)</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>Rentabilidad, flujo de caja y estrategia de ingresos</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => setShowReport(true)}
                        title="Ver historial de reportes"
                        style={{
                            padding: '10px 18px',
                            borderRadius: '30px',
                            background: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-color)'
                        }}
                    >
                        <History size={16} />
                    </button>
                    <button
                        onClick={generateAIReport}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '30px',
                            background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                        }}
                    >
                        <BrainCircuit size={16} /> AUDITORÍA CFO (IA)
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '6px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                        <Calendar size={18} style={{ color: 'var(--text-secondary)' }} />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            style={{ border: 'none', background: 'transparent', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', outline: 'none', color: 'var(--text-primary)' }}
                        >
                            <option value={2024}>Año 2024</option>
                            <option value={2025}>Año 2025</option>
                            <option value={2026}>Año 2026</option>
                        </select>
                    </div>
                    <button onClick={fetchShopifyData} className="compact-btn" style={{ background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <RefreshCw size={14} className={isLoadingShopify ? 'animate-spin' : ''} />
                        Sincronizar Datos
                    </button>
                </div>
            </div>

            {/* Premium Strategic Banner */}
            <div style={{
                padding: '36px 40px',
                background: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
                borderRadius: '30px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(244, 63, 94, 0.4)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(80px)' }}></div>

                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                                PERFORMANCE COCKPIT
                            </div>
                            <span style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 500 }}>Inteligencia Comercial Aplicada</span>
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 12px 0', letterSpacing: '-1px' }}>Estrategia de Ingresos</h2>
                        <p style={{ margin: 0, fontSize: '1.15rem', opacity: 0.95, fontWeight: 400, maxWidth: '750px', lineHeight: '1.5' }}>
                            Atilio, la <strong>{channelData.pos > channelData.ecommerce ? `Tienda Física (${channelData.pos}%)` : `Web (${channelData.ecommerce}%)`}</strong> sostiene tu negocio, y el <strong>{topProduct.title}</strong> lidera en volumen frente a toda la línea. Es el momento perfecto para usar el margen retenido y acelerar áreas clave.
                        </p>
                    </div>
                </div>
            </div>

            {/* Strategic KPI Cards Based on Discovery */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <Card
                    title={`Ventas Netas (${selectedYear})`}
                    value={formatCurrency(totalVentasAnual)}
                    icon={<TrendingUp size={20} style={{ color: 'var(--success)' }} />}
                    style={{ borderLeft: '4px solid var(--success)' }}
                />
                <Card
                    title="Margen Producto Promedio"
                    value={`${avgMargen.toFixed(1)}%`}
                    icon={<Landmark size={20} style={{ color: avgMargen >= 65 ? 'var(--success)' : (avgMargen >= 50 ? 'var(--warning)' : 'var(--danger)') }} />}
                    style={{ borderLeft: `4px solid ${avgMargen >= 65 ? 'var(--success)' : (avgMargen >= 50 ? 'var(--warning)' : 'var(--danger)')}` }}
                >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: avgMargen >= 65 ? 'var(--success)' : (avgMargen >= 50 ? 'var(--warning)' : 'var(--danger)') }}></div>
                        Meta: 65% - 70% (Excelente)
                    </div>
                </Card>
                <Card
                    title={channelData.pos > channelData.ecommerce ? "Dependencia Tienda Física" : "Dependencia Ecommerce"}
                    value={`${Math.max(channelData.pos, channelData.ecommerce)}%`}
                    icon={<ArrowUpRight size={20} style={{ color: 'var(--warning)' }} />}
                    style={{ borderLeft: '4px solid var(--warning)' }}
                >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Riesgo de concentración de canal</div>
                </Card>
                <Card
                    title="Producto Motor"
                    value={topProduct.title.length > 15 ? `${topProduct.title.substring(0, 15)}...` : topProduct.title}
                    icon={<ShoppingBag size={20} style={{ color: '#ec4899' }} />}
                    style={{ borderLeft: '4px solid #ec4899' }}
                >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Alto volumen / Ticket acelerador</div>
                </Card>
            </div>

            {/* P&L Table Container */}
            <div className="pnl-container">
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Estado de Resultados (P&L) - Mi Cielo {selectedYear}</h3>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500, marginTop: '4px' }}>Sincronización híbrida: Ingresos (Shopify API) / Costos (Gestión Manual)</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button onClick={() => setIsAddingCategory(true)} className="compact-btn" style={{ background: 'var(--brand-primary)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Plus size={14} /> Nueva Categoría
                        </button>
                        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-tertiary)', padding: '3px', borderRadius: '8px' }}>
                            {['monthly', 'quarterly', 'yearly'].map((p) => (
                                <button key={p} onClick={() => setPeriodicity(p as Periodicity)} style={{
                                    padding: '6px 14px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                                    background: periodicity === p ? 'var(--bg-primary)' : 'transparent',
                                    color: periodicity === p ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                    transition: '0.2s',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}>
                                    {p === 'monthly' ? 'Mensual' : p === 'quarterly' ? 'Trimestral' : 'Anual'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="pnl-table">
                        <thead>
                            <tr className="header-row">
                                <th className="sticky-col">Estructura de Resultados</th>
                                {visiblePeriods.map(p => <th key={p.id} style={{ textAlign: 'right' }}>{p.label}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {/* SALES SECTION */}
                            <tr className="summary-row" onClick={() => setShowSalesBreakdown(!showSalesBreakdown)} style={{ cursor: 'pointer' }}>
                                <td className="sticky-col" style={{ background: 'inherit', fontWeight: 800 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {showSalesBreakdown ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        VENTAS NETAS (SIN IVA)
                                    </div>
                                </td>
                                {processedData.map(d => <td key={d.id} style={{ textAlign: 'right', color: 'var(--brand-primary)' }}>{formatCurrency(d.ventas)}</td>)}
                            </tr>

                            {showSalesBreakdown && (
                                <>
                                    <tr style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                        <td className="sticky-col" style={{ paddingLeft: '32px' }}>Total Facturado (Shopify)</td>
                                        {processedData.map(d => <td key={d.id} style={{ textAlign: 'right' }}>{formatCurrency(d.totalBruto)}</td>)}
                                    </tr>
                                    <tr style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
                                        <td className="sticky-col" style={{ paddingLeft: '32px' }}>IVA (19%)</td>
                                        {processedData.map(d => <td key={d.id} style={{ textAlign: 'right' }}>-{formatCurrency(d.taxes)}</td>)}
                                    </tr>
                                    <tr style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                        <td className="sticky-col" style={{ paddingLeft: '32px' }}>Shipping Recaudado</td>
                                        {processedData.map(d => <td key={d.id} style={{ textAlign: 'right' }}>-{formatCurrency(d.shipping)}</td>)}
                                    </tr>
                                </>
                            )}

                            <tr style={{ color: 'var(--danger)' }}>
                                <td className="sticky-col" style={{ fontWeight: 600 }}>COSTO MERCADERÍA (COGS)</td>
                                {processedData.map(d => <td key={d.id} style={{ textAlign: 'right' }}>-{formatCurrency(d.cost)}</td>)}
                            </tr>

                            <tr style={{ background: 'var(--bg-tertiary)', fontWeight: 800 }}>
                                <td className="sticky-col" style={{ background: 'inherit' }}>MARGEN PRODUCTO ($)</td>
                                {processedData.map(d => <td key={d.id} style={{ textAlign: 'right' }}>{formatCurrency(d.mgProducto)}</td>)}
                            </tr>
                            <tr style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: '0.75rem' }}>
                                <td className="sticky-col">% MARGEN PRODUCTO</td>
                                {processedData.map(d => {
                                    const mPercent = d.ventas > 0 ? (d.mgProducto / d.ventas) * 100 : 0;
                                    const dotColor = mPercent >= 65 ? 'var(--success)' : (mPercent >= 50 ? 'var(--warning)' : 'var(--danger)');
                                    return (
                                        <td key={d.id} style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: mPercent === 0 ? 'transparent' : dotColor }}></div>
                                                {mPercent.toFixed(1)}%
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>

                            {/* COST CATEGORIES */}
                            {categories.map(cat => (
                                <React.Fragment key={cat.id}>
                                    <tr className="category-row">
                                        <td className="sticky-col" style={{ background: 'inherit' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }} onClick={() => setCategories(cats => cats.map(c => c.id === cat.id ? { ...c, isExpanded: !c.isExpanded } : c))}>
                                                    {cat.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    {cat.label}
                                                </div>
                                                <Trash2 size={12} className="action-icon" onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }} />
                                            </div>
                                        </td>
                                        {processedData.map(p => {
                                            const total = cat.items.reduce((s, item) => s + getPeriodValues(p.id, item.values), 0);
                                            return <td key={p.id} style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{formatCurrency(total)}</td>;
                                        })}
                                    </tr>
                                    {cat.isExpanded && (
                                        <>
                                            {cat.items.map(item => (
                                                <tr key={item.id} style={{ fontSize: '0.78rem' }}>
                                                    <td className="sticky-col" style={{ paddingLeft: '32px', color: 'var(--text-secondary)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            {item.label}
                                                            <X size={12} className="action-icon" onClick={() => deleteItem(cat.id, item.id)} />
                                                        </div>
                                                    </td>
                                                    {visiblePeriods.map(p => {
                                                        const val = getPeriodValues(p.id, item.values);
                                                        const isEditing = editingCell?.itemId === item.id && editingCell?.periodId === p.id;
                                                        return isEditing ? (
                                                            <td key={p.id} style={{ textAlign: 'right', padding: '4px' }}>
                                                                <input autoFocus value={tempEditValue} onChange={e => setTempEditValue(e.target.value)} onBlur={saveEditValue} onKeyDown={e => e.key === 'Enter' && saveEditValue()} style={{ width: '100px', textAlign: 'right', padding: '2px 6px', border: '1px solid var(--brand-primary)', borderRadius: '4px', outline: 'none', fontSize: '0.78rem' }} />
                                                            </td>
                                                        ) : (
                                                            <td key={p.id} onClick={() => handleEditClick(item.id, p.id, val, 'cost')} className="editable-cell" style={{ textAlign: 'right', color: 'var(--text-tertiary)' }}>
                                                                {formatCurrency(val)}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                            <tr className="add-row">
                                                <td className="sticky-col" style={{ paddingLeft: '32px' }}>
                                                    {isAddingItem === cat.id ? (
                                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                            <input autoFocus placeholder="Nombre ítem..." value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(cat.id)} style={{ padding: '2px 6px', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.75rem', width: '100%' }} />
                                                            <Check size={14} style={{ color: 'var(--success)', cursor: 'pointer' }} onClick={() => addItem(cat.id)} />
                                                            <X size={14} style={{ color: 'var(--danger)', cursor: 'pointer' }} onClick={() => setIsAddingItem(null)} />
                                                        </div>
                                                    ) : (
                                                        <div onClick={() => setIsAddingItem(cat.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--brand-primary)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                                                            <Plus size={10} /> Añadir ítem
                                                        </div>
                                                    )}
                                                </td>
                                                {visiblePeriods.map(p => <td key={p.id}></td>)}
                                            </tr>
                                        </>
                                    )}
                                </React.Fragment>
                            ))}
                            {isAddingCategory && (
                                <tr className="category-row add-row" style={{ background: 'var(--bg-tertiary)' }}>
                                    <td className="sticky-col" style={{ background: 'inherit' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input
                                                autoFocus
                                                placeholder="Nombre de la categoría..."
                                                value={newCategoryName}
                                                onChange={e => setNewCategoryName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && addCategory()}
                                                style={{ padding: '4px 8px', border: '1px solid var(--brand-primary)', borderRadius: '6px', fontSize: '0.85rem', width: '200px', outline: 'none' }}
                                            />
                                            <Check size={16} style={{ color: 'var(--success)', cursor: 'pointer' }} onClick={() => addCategory()} />
                                            <X size={16} style={{ color: 'var(--danger)', cursor: 'pointer' }} onClick={() => { setIsAddingCategory(false); setNewCategoryName(''); }} />
                                        </div>
                                    </td>
                                    {visiblePeriods.map(p => <td key={p.id}></td>)}
                                </tr>
                            )}

                            {/* COST TOTALS & EBITDA */}
                            <tr style={{ background: 'var(--bg-tertiary)', fontWeight: 800 }}>
                                <td className="sticky-col" style={{ background: 'inherit' }}>TOTAL COSTOS SIN IVA ($)</td>
                                {processedData.map(d => <td key={d.id} style={{ textAlign: 'right' }}>{formatCurrency(d.totalCostosOperacionales)}</td>)}
                            </tr>
                            <tr style={{ background: 'var(--success-bg)', fontWeight: 800, fontSize: '0.9rem', borderTop: '2px solid var(--success)' }}>
                                <td className="sticky-col" style={{ background: 'inherit', color: 'var(--success)' }}>UTILIDAD (EBITDA) ($)</td>
                                {processedData.map(d => <td key={d.id} style={{ textAlign: 'right', color: 'var(--success)' }}>{formatCurrency(d.ebitda)}</td>)}
                            </tr>
                            <tr style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.75rem', background: 'rgba(34, 197, 94, 0.05)' }}>
                                <td className="sticky-col">% MARGEN EBITDA</td>
                                {processedData.map(d => (
                                    <td key={d.id} style={{ textAlign: 'right' }}>
                                        {d.ventas > 0 ? ((d.ebitda / d.ventas) * 100).toFixed(1) : '0'}%
                                    </td>
                                ))}
                            </tr>

                            {/* BANK SECTION */}
                            {bankCategory && (
                                <>
                                    <tr className="category-row bank-section" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
                                        <td className="sticky-col" style={{ background: 'inherit' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setBankCategory(prev => prev ? { ...prev, isExpanded: !prev.isExpanded } : null)}>
                                                {bankCategory.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                <Landmark size={14} />
                                                VALORES CUOTA BANCOS
                                            </div>
                                        </td>
                                        {processedData.map(d => <td key={d.id} style={{ textAlign: 'right' }}>{formatCurrency(d.subtotalBancos)}</td>)}
                                    </tr>
                                    {bankCategory.isExpanded && (
                                        <>
                                            {bankCategory.items.map(item => (
                                                <tr key={item.id} style={{ fontSize: '0.78rem' }}>
                                                    <td className="sticky-col" style={{ paddingLeft: '32px', color: 'var(--info)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            {item.label}
                                                            <X size={12} className="action-icon" onClick={() => deleteItem('bancos', item.id)} />
                                                        </div>
                                                    </td>
                                                    {visiblePeriods.map(p => {
                                                        const val = getPeriodValues(p.id, item.values);
                                                        const isEditing = editingCell?.itemId === item.id && editingCell?.periodId === p.id;
                                                        return isEditing ? (
                                                            <td key={p.id} style={{ textAlign: 'right', padding: '4px' }}>
                                                                <input autoFocus value={tempEditValue} onChange={e => setTempEditValue(e.target.value)} onBlur={saveEditValue} onKeyDown={e => e.key === 'Enter' && saveEditValue()} style={{ width: '100px', textAlign: 'right', padding: '2px 6px', border: '1px solid var(--info)', borderRadius: '4px', outline: 'none', fontSize: '0.78rem' }} />
                                                            </td>
                                                        ) : (
                                                            <td key={p.id} onClick={() => handleEditClick(item.id, p.id, val, 'bank')} className="editable-cell" style={{ textAlign: 'right', color: 'var(--info)' }}>
                                                                {formatCurrency(val)}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                            <tr className="add-row">
                                                <td className="sticky-col" style={{ paddingLeft: '32px' }}>
                                                    {isAddingItem === 'bancos' ? (
                                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                            <input autoFocus placeholder="Nombre crédito..." value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem('bancos')} style={{ padding: '2px 6px', border: '1px solid var(--info)', borderRadius: '4px', fontSize: '0.75rem', width: '100%' }} />
                                                            <Check size={14} style={{ color: 'var(--success)', cursor: 'pointer' }} onClick={() => addItem('bancos')} />
                                                            <X size={14} style={{ color: 'var(--danger)', cursor: 'pointer' }} onClick={() => setIsAddingItem(null)} />
                                                        </div>
                                                    ) : (
                                                        <div onClick={() => setIsAddingItem('bancos')} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--info)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                                                            <Plus size={10} /> Añadir cuota banco
                                                        </div>
                                                    )}
                                                </td>
                                                {visiblePeriods.map(p => <td key={p.id}></td>)}
                                            </tr>
                                        </>
                                    )}
                                </>
                            )}

                            <tr style={{ background: 'var(--info-bg)', fontWeight: 800 }}>
                                <td className="sticky-col" style={{ background: 'inherit', color: 'var(--info)' }}>SUBTOTAL BANCOS ($)</td>
                                {processedData.map(d => <td key={d.id} style={{ textAlign: 'right', color: 'var(--info)' }}>{formatCurrency(d.subtotalBancos)}</td>)}
                            </tr>

                            {/* FINAL CAJA */}
                            <tr style={{ background: 'var(--text-primary)', color: '#fff', fontWeight: 900, fontSize: '1.05rem' }}>
                                <td className="sticky-col" style={{ background: 'inherit' }}>CAJA TEÓRICA FINAL</td>
                                {processedData.map(d => <td key={d.id} style={{ textAlign: 'right' }}>{formatCurrency(d.cajaTeorica)}</td>)}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Analysis Chart */}
            <div className="pnl-container" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '20px' }}>Evolución de Rendimiento {selectedYear}</h3>
                <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={processedData}>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)', fontSize: '0.8rem' }} formatter={v => formatCurrency(v as number)} />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '0.75rem' }} />
                            <Bar dataKey="ventas" name="Ventas" fill="var(--brand-primary)" barSize={35} radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke="var(--success)" strokeWidth={3} dot={{ r: 4, fill: 'var(--success)', strokeWidth: 2, stroke: '#fff' }} />
                            <Line type="monotone" dataKey="cajaTeorica" name="Caja" stroke="var(--text-primary)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* AI Report Modal */}
            <ReportModal
                isOpen={showReport}
                onClose={() => setShowReport(false)}
                report={report}
                isGenerating={generatingReport}
                type="commercial"
                title="Informe Estratégico CFO"
                subtitle="Inteligencia Financiera y Rentabilidad"
            />
        </div>
    );
}
