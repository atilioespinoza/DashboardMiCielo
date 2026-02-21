"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Package, AlertTriangle, Truck, Clock, CheckCircle2, ArrowRight, RefreshCw, Box, HelpCircle, TrendingUp, History, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { BrainCircuit, X as CloseIcon } from 'lucide-react';
import { ReportModal } from '../ui/ReportModal';

interface OpData {
    inventory: {
        totalProducts: number;
        lowStock: any[];
        outOfStock: any[];
        totalVariants: number;
        topInventory: any[];
    };
    fulfillment: {
        pendingCount: number;
        recentPending: any[];
    };
}

const PARETO_PERIODS = [
    { id: 'mtd', label: 'Mes en Curso (MTD)', start: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`, end: '' },
    { id: 'ytd', label: 'Ene - Hoy (YTD)', start: `${new Date().getFullYear()}-01-01`, end: '' },
    { id: 'last12', label: 'Últimos 12 meses', start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: '' },
    { id: '2025', label: 'Año 2025', start: '2025-01-01', end: '2025-12-31' },
    { id: '2024', label: 'Año 2024', start: '2024-01-01', end: '2024-12-31' },
    { id: 'all', label: 'Todo el Histórico', start: '2024-01-01', end: '' },
    { id: '90days', label: 'Últimos 90 días', start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], end: '' },
    { id: 'cyber2025', label: 'CyberDay 2025', start: '2025-06-02', end: '2025-06-04' },
    { id: 'cyber2024', label: 'CyberDay 2024', start: '2024-06-03', end: '2024-06-05' },
    { id: 'custom', label: 'Personalizado', start: '', end: '' },
];

export default function OperationalPillar() {
    const [data, setData] = useState<OpData | null>(null);
    const [paretoData, setParetoData] = useState<any>(null);
    const [brandsData, setBrandsData] = useState<any>(null);
    const [inventoryHealth, setInventoryHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'inventory' | 'pareto' | 'rotation'>('inventory');
    const [selectedPeriod, setSelectedPeriod] = useState(PARETO_PERIODS[0]);
    const [customStartDate, setCustomStartDate] = useState('2025-01-01');
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

    // AI Report States
    const [report, setReport] = useState<string | null>(null);
    const [showReport, setShowReport] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, [selectedPeriod]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const start = selectedPeriod.id === 'custom' ? customStartDate : selectedPeriod.start;
            const end = selectedPeriod.id === 'custom' ? customEndDate : selectedPeriod.end;
            const paretoUrl = `/api/shopify/analytics/pareto?startDate=${start}${end ? `&endDate=${end}` : ''}`;
            const brandsUrl = `/api/shopify/analytics/brands?startDate=${start}${end ? `&endDate=${end}` : ''}`;

            const [opRes, paretoRes, healthRes, brandsRes] = await Promise.all([
                fetch('/api/shopify/operations'),
                fetch(paretoUrl),
                fetch('/api/shopify/analytics/inventory-health'),
                fetch(brandsUrl)
            ]);

            const [opJson, paretoJson, healthJson, brandsJson] = await Promise.all([
                opRes.json(),
                paretoRes.json(),
                healthRes.json(),
                brandsRes.json()
            ]);

            if (opJson.success) setData(opJson.data);
            if (paretoJson.success) setParetoData(paretoJson.data);
            if (healthJson.success) setInventoryHealth(healthJson.data);
            if (brandsJson.success) setBrandsData(brandsJson.data);
        } catch (e) {
            console.error("Error fetching data", e);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
    };

    const generateAIReport = async () => {
        setGeneratingReport(true);
        setShowReport(true);
        try {
            const context = {
                operations: data,
                pareto: paretoData?.summary,
                health: inventoryHealth?.summary
            };

            const res = await fetch('/api/ai/executive-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dashboardData: context, type: 'operational' })
            });

            const json = await res.json();
            if (json.success) setReport(json.report);
            else setReport("Error: " + json.error);
        } catch (e) {
            setReport("Error técnico al conectar con el COO Digital.");
        } finally {
            setGeneratingReport(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <RefreshCw className="animate-spin" size={32} style={{ marginBottom: '12px' }} />
                <p>Cargando datos operativos de Shopify...</p>
            </div>
        );
    }

    const inventoryChartData = data?.inventory.lowStock.slice(0, 8).map(v => ({
        name: v.fullName.length > 25 ? v.fullName.substring(0, 22) + '...' : v.fullName,
        stock: v.inventory,
        fullName: v.fullName
    })) || [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease-out' }}>
            {/* Action Bar (Header) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--bg-tertiary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                        <Package size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Pilar Operacional</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>Análisis logístico y cadena de suministro</p>
                    </div>
                </div>

                <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', gap: '8px' }}>
                    <button
                        onClick={() => setShowReport(true)}
                        title="Ver historial de reportes"
                        style={{
                            padding: '10px 18px',
                            borderRadius: '10px',
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
                            padding: '8px 16px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <BrainCircuit size={14} /> AUDITORÍA COO (IA)
                    </button>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {[
                            { id: 'inventory', label: 'Resumen Logístico' },
                            { id: 'pareto', label: 'Análisis Pareto (80/20)' },
                            { id: 'rotation', label: 'Rotación y Salud' }
                        ].map((v) => (
                            <button
                                key={v.id}
                                onClick={() => setView(v.id as any)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    color: view === v.id ? 'white' : 'var(--text-secondary)',
                                    backgroundColor: view === v.id ? 'var(--brand-primary)' : 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Premium Strategic Banner */}
            <div style={{
                padding: '36px 40px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
                borderRadius: '30px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(59, 130, 246, 0.4)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(80px)' }}></div>

                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                                SUPPLY CHAIN
                            </div>
                            <span style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 500 }}>Live Sync: Shopify</span>
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 12px 0', letterSpacing: '-1px' }}>Control de Mando</h2>
                        <p style={{ margin: 0, fontSize: '1.2rem', opacity: 0.9, fontWeight: 400, maxWidth: '600px', lineHeight: '1.4' }}>
                            {data?.inventory.outOfStock.length === 0 ? (
                                <span>Excelente, no tienes productos agotados en este momento. Tienes {data?.fulfillment.pendingCount} pedidos pendientes de despacho.</span>
                            ) : (
                                <span>Alerta: tienes <strong>{data?.inventory.outOfStock.length}</strong> productos sin stock y <strong>{data?.fulfillment.pendingCount}</strong> despachos pendientes.</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {view === 'inventory' ? (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                        <Card
                            title="Pedidos Pendientes"
                            value={data?.fulfillment.pendingCount.toString() || "0"}
                            icon={<Clock size={20} style={{ color: 'var(--warning)' }} />}
                            style={{ borderLeft: '4px solid var(--warning)' }}
                        />
                        <Card
                            title="Quiebres de Stock (SKUs)"
                            value={data?.inventory.outOfStock.length.toString() || "0"}
                            icon={<AlertTriangle size={20} style={{ color: 'var(--danger)' }} />}
                            style={{ borderLeft: '4px solid var(--danger)' }}
                        />
                        <Card
                            title="Alertas Reposición"
                            value={data?.inventory.lowStock.length.toString() || "0"}
                            icon={<Package size={20} style={{ color: 'var(--brand-primary)' }} />}
                        />
                        <Card
                            title="Variantes Activas"
                            value={data?.inventory.totalVariants.toString() || "0"}
                            icon={<Box size={20} style={{ color: 'var(--success)' }} />}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
                        <Card title="Alertas de Reposición (Próximos a Quiebre)">
                            <div style={{ height: '350px', width: '100%', marginTop: '20px' }}>
                                {inventoryChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={inventoryChartData} layout="vertical" margin={{ left: 40, right: 30 }}>
                                            <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border-color)" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: '11px', fill: 'var(--text-secondary)' }} width={140} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                                                formatter={(val) => [`${val} unidades`, 'Stock Disponible']}
                                            />
                                            <Bar dataKey="stock" radius={[0, 4, 4, 0]} barSize={20}>
                                                {inventoryChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.stock <= 2 ? 'var(--danger)' : 'var(--warning)'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--success)' }}>
                                        <CheckCircle2 size={48} style={{ marginBottom: '12px' }} />
                                        <p style={{ fontWeight: 600 }}>¡Todo en orden!</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card title="Últimos Pedidos por Despachar">
                            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {data?.fulfillment.recentPending && data.fulfillment.recentPending.length > 0 ? (
                                    data.fulfillment.recentPending.map((order: any) => (
                                        <div key={order.id} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{order.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{new Date(order.date).toLocaleDateString('es-CL')}</div>
                                            </div>
                                            <ArrowRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--success)' }}>
                                        <Truck size={40} style={{ opacity: 0.5, marginBottom: '12px' }} />
                                        <p>No hay despachos pendientes.</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </>
            ) : view === 'pareto' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <Clock size={16} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Horizonte de Análisis:</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {PARETO_PERIODS.map(period => (
                                <button
                                    key={period.id}
                                    onClick={() => setSelectedPeriod(period)}
                                    style={{
                                        padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
                                        background: selectedPeriod.id === period.id ? 'var(--brand-primary)' : 'var(--bg-primary)',
                                        color: selectedPeriod.id === period.id ? '#fff' : 'var(--text-secondary)',
                                    }}
                                >
                                    {period.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedPeriod.id === 'custom' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '-8px' }}>
                            <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }} />
                            <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }} />
                            <button onClick={fetchAllData} style={{ padding: '6px 16px', background: 'var(--brand-primary)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>Analizar Rango</button>
                        </div>
                    )}

                    {/* Brands Mix Analysis (Control de Mando de Ingresos) */}
                    {brandsData && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                            <Card title="Distribución de Ingresos" icon={<PieChartIcon size={18} style={{ color: 'var(--text-primary)' }} />} style={{ borderTop: '4px solid var(--text-primary)' }}>
                                <div style={{ height: '220px', width: '100%', marginTop: '20px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Fabricación Propia', value: brandsData.mix.miCielo.total, fill: '#ec4899' },
                                                    { name: 'Reventa (Otras)', value: brandsData.mix.resold.total, fill: '#4f46e5' }
                                                ]}
                                                innerRadius={60}
                                                outerRadius={85}
                                                paddingAngle={5}
                                                dataKey="value"
                                                animationDuration={1000}
                                            >
                                                <Cell key="cell-0" fill="#ec4899" />
                                                <Cell key="cell-1" fill="#4f46e5" />
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                                                formatter={(v: number | undefined) => [formatCurrency(v || 0), 'Ingresos']}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ec4899' }}></div> Mi Cielo
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4f46e5' }}></div> Otras Marcas
                                    </div>
                                </div>
                            </Card>

                            <Card title={`Fabricación Propia (Mi Cielo)`} icon={<PieChartIcon size={18} style={{ color: '#ec4899' }} />} style={{ borderTop: '4px solid #ec4899' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ec4899' }}>{brandsData.mix.miCielo.percentage.toFixed(1)}%</div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{formatCurrency(brandsData.mix.miCielo.total)}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>ventas contribuidas</div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-tertiary)', marginBottom: '12px', textTransform: 'uppercase' }}>Top Ventas (Propio)</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {brandsData.mix.miCielo.top.map((p: any, i: number) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                                <div style={{ fontWeight: 600 }}>{p.name.length > 25 ? p.name.substring(0, 25) + '...' : p.name}</div>
                                                <div style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{formatCurrency(p.sales)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            <Card title={`Productos en Reventa (Otras Marcas)`} icon={<Package size={18} style={{ color: 'var(--brand-primary)' }} />} style={{ borderTop: '4px solid var(--brand-primary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--brand-primary)' }}>{brandsData.mix.resold.percentage.toFixed(1)}%</div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{formatCurrency(brandsData.mix.resold.total)}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>ventas contribuidas</div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-tertiary)', marginBottom: '12px', textTransform: 'uppercase' }}>Top Ventas (Reventa)</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {brandsData.mix.resold.top.map((p: any, i: number) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                                <div style={{ fontWeight: 600 }}>{p.name.length > 25 ? p.name.substring(0, 25) + '...' : p.name}</div>
                                                <div style={{ fontWeight: 800, color: 'var(--text-secondary)' }}>{formatCurrency(p.sales)}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Canal vs Tipo de Producto Analysis */}
                    {brandsData?.channels && (
                        <Card title="Canal de Venta vs Mix de Productos" icon={<TrendingUp size={18} />} style={{ borderTop: '4px solid var(--success)' }}>
                            <div style={{ padding: '20px 0' }}>
                                <div style={{ height: '300px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={[
                                                {
                                                    name: 'Online (Web)',
                                                    Propio: brandsData.channels.online.miCielo,
                                                    Reventa: brandsData.channels.online.resold
                                                },
                                                {
                                                    name: 'Tienda (POS)',
                                                    Propio: brandsData.channels.pos.miCielo,
                                                    Reventa: brandsData.channels.pos.resold
                                                }
                                            ]}
                                            layout="vertical"
                                            margin={{ left: 20, right: 30, top: 10, bottom: 10 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" />
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} style={{ fontSize: '0.8rem', fontWeight: 700 }} />
                                            <Tooltip
                                                formatter={(value: any) => formatCurrency(value)}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                                            />
                                            <Bar dataKey="Propio" stackId="a" fill="#ec4899" radius={[0, 0, 0, 0]} barSize={40} />
                                            <Bar dataKey="Reventa" stackId="a" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
                                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Dominio Online</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '4px' }}>
                                            {((brandsData.channels.online.miCielo / (brandsData.channels.online.total || 1)) * 100).toFixed(1)}% <span style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: 600 }}>Propio</span>
                                        </div>
                                    </div>
                                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Dominio Tienda</div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '4px' }}>
                                            {((brandsData.channels.pos.miCielo / (brandsData.channels.pos.total || 1)) * 100).toFixed(1)}% <span style={{ fontSize: '0.8rem', color: '#ec4899', fontWeight: 600 }}>Propio</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <Card title="Pareto Ventas: Productos que generan el 80%">
                            <table style={{ width: '100%', textAlign: 'left', fontSize: '0.85rem', marginTop: '16px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '8px' }}>Producto</th>
                                        <th style={{ textAlign: 'right', padding: '8px' }}>Venta</th>
                                        <th style={{ textAlign: 'right', padding: '8px' }}>% Acum.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paretoData?.paretoSales.map((p: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: p.isPareto ? 'rgba(139, 92, 246, 0.02)' : 'transparent' }}>
                                            <td style={{ padding: '12px 8px', fontWeight: p.isPareto ? 700 : 400 }}>{p.name}</td>
                                            <td style={{ textAlign: 'right', padding: '12px 8px' }}>{formatCurrency(p.sales)}</td>
                                            <td style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 700 }}>{p.cumPercentage.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                        <Card title="Pareto Margen: Productos que generan el 80%">
                            <table style={{ width: '100%', textAlign: 'left', fontSize: '0.85rem', marginTop: '16px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '8px' }}>Producto</th>
                                        <th style={{ textAlign: 'right', padding: '8px' }}>Margen</th>
                                        <th style={{ textAlign: 'right', padding: '8px' }}>% Acum.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paretoData?.paretoMargin.map((p: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: p.isPareto ? 'rgba(16, 185, 129, 0.02)' : 'transparent' }}>
                                            <td style={{ padding: '12px 8px', fontWeight: p.isPareto ? 700 : 400 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {p.name}
                                                    {p.name.toUpperCase().includes('GIFT CARD') ? (
                                                        <div
                                                            title="Este es un producto de prepago (Gift Card). Es normal que el margen sea del 100% al momento de la venta."
                                                            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 900 }}
                                                        >
                                                            GIFT CARD
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Alert: If margin equals sales (cost is 0) */}
                                                            {Math.abs(p.sales - p.margin) < 1 && (
                                                                <div
                                                                    title="ALERTA CRÍTICA: Costo no informado en Shopify. El margen es igual a la venta."
                                                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 900 }}
                                                                >
                                                                    <AlertTriangle size={12} /> COSTO 0
                                                                </div>
                                                            )}
                                                            {/* Alert: If margin percentage is suspiciously low (<50%) */}
                                                            {p.margin / p.sales < 0.5 && Math.abs(p.sales - p.margin) > 1 && (
                                                                <div
                                                                    title="ADVERTENCIA: Margen inferior al 50%. Revisar costos en Shopify."
                                                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 900 }}
                                                                >
                                                                    <HelpCircle size={12} /> MARGEN BAJO
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '12px 8px' }}>{formatCurrency(p.margin)}</td>
                                            <td style={{ textAlign: 'right', padding: '12px 8px', fontWeight: 700 }}>{p.cumPercentage.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>

                    <Card title="Estrategia" style={{ background: 'var(--brand-primary)', color: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '10px' }}>
                            <HelpCircle size={32} />
                            <div>
                                <h4 style={{ margin: 0 }}>Conclusión Estratégica</h4>
                                <p style={{ margin: '4px 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
                                    Solo <strong>{paretoData?.summary.topProductsCount}</strong> productos generan el 80% de tus ingresos.
                                    Asegura stock prioritario.
                                </p>
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                    <strong>Nota de Cálculo:</strong> Margen neto (Venta - Costo). Sin comisiones ni envíos.
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                        <Card title="Riesgo Quiebre (Sellers)" value={inventoryHealth?.summary.criticalStockouts.toString() || "0"} icon={<AlertTriangle size={20} style={{ color: 'var(--danger)' }} />} style={{ borderLeft: '4px solid var(--danger)' }} />
                        <Card title="Stock Inmovilizado" value={inventoryHealth?.summary.deadStock.toString() || "0"} icon={<Box size={20} style={{ color: 'var(--warning)' }} />} style={{ borderLeft: '4px solid var(--warning)' }} />
                        <Card title="Rotación Promedio" value={inventoryHealth?.summary.avgRotation || "0"} icon={<RefreshCw size={20} style={{ color: 'var(--success)' }} />} />
                        <Card title="Potencial GMROI" value="Fuerte" icon={<TrendingUp size={20} style={{ color: 'var(--brand-primary)' }} />} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <Card title="🔥 Alta Rotación: Riesgo de Quiebre Inmediato">
                            <table style={{ width: '100%', textAlign: 'left', fontSize: '0.85rem', marginTop: '16px' }}>
                                <tbody>
                                    {inventoryHealth?.health.filter((r: any) => r.status === 'CRITICAL' || r.status === 'LOW').slice(0, 8).map((r: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '10px 0', fontWeight: 600 }}>{r.name}</td>
                                            <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 700 }}>{r.daysOfCover} d.</td>
                                            <td style={{ textAlign: 'right', fontSize: '0.75rem' }}>{r.velocity}/día</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                        <Card title="❄️ Baja Rotación: Candidatos a Liquidación">
                            <table style={{ width: '100%', textAlign: 'left', fontSize: '0.85rem', marginTop: '16px' }}>
                                <tbody>
                                    {inventoryHealth?.health.filter((r: any) => r.status === 'DEAD' || (parseFloat(r.turnover) < 0.2 && r.stock > 10)).slice(0, 8).map((r: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                            <td style={{ padding: '10px 0', fontWeight: 600 }}>{r.name}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.stock} u.</td>
                                            <td style={{ textAlign: 'right', color: 'var(--warning)' }}>Rot: {r.turnover}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </Card>
                    </div>

                    <Card title="Análisis de Eficiencia GMROI" style={{ background: 'var(--success-bg)', border: '1px solid var(--success-light)' }}>
                        <div style={{ padding: '8px' }}>
                            <p style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                                El <strong>GMROI</strong> mide la utilidad por cada peso invertido en stock.
                                Libera caja liquidando productos de "Baja Rotación" e inyecta ese capital en los de "Alta Rotación".
                            </p>
                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--success-light)', fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                                ⚠️ <strong>Nota:</strong> Los productos "(GB)" han sido excluidos. Tienen stock real pero inconsistencias en Shopify. Pendiente regularizar stock y darlos de baja para limpiar métricas.
                            </div>
                        </div>
                    </Card>
                </div>
            )}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* AI Report Modal */}
            <ReportModal
                isOpen={showReport}
                onClose={() => setShowReport(false)}
                report={report}
                isGenerating={generatingReport}
                type="operational"
                title="Informe Estratégico COO"
                subtitle="Gestión de Inventario y Operaciones"
            />
        </div>
    );
}
