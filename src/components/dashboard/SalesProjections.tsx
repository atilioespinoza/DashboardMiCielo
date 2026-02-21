"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import {
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Target,
    Package,
    Activity,
    LineChart as LineIcon,
    BarChart3
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell
} from 'recharts';

interface ProjectionData {
    overall: {
        currentMonthEstimate: number;
        currentMarginEstimate: number;
        history: { month: string; val: number }[];
    };
    paretoAnalysis: {
        topProductsCount: number;
        totalProductsCount: number;
        products: {
            name: string;
            projectedSales: number;
            projectedMargin: number;
            trend: number;
            history: { month: string; val: number }[];
        }[];
    };
}

export default function SalesProjections() {
    const [data, setData] = useState<ProjectionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [months, setMonths] = useState(6);

    useEffect(() => {
        const fetchProjections = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/shopify/analytics/projections?months=${months}`);
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                }
            } catch (e) {
                console.error("Error fetching projections", e);
            } finally {
                setLoading(false);
            }
        };

        fetchProjections();
    }, [months]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', opacity: 0.6 }}>
                <div style={{ height: '160px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '24px', animation: 'pulse 1.5s infinite' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                    <div style={{ height: '320px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '24px', animation: 'pulse 1.5s infinite' }}></div>
                    <div style={{ height: '320px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '24px', animation: 'pulse 1.5s infinite' }}></div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease-out' }}>

            {/* Header / Summary Banner */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                <div style={{
                    padding: '40px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    borderRadius: '28px',
                    color: 'white',
                    boxShadow: '0 20px 40px -15px rgba(79, 70, 229, 0.4)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <TrendingUp size={140} style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                                PREDICTIVO
                            </div>
                            <span style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 500 }}>Fase 1: Regresión Lineal</span>
                        </div>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '0 0 8px 0', letterSpacing: '-1px' }}>Proyección Mensual</h2>
                        <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9, fontWeight: 400, maxWidth: '500px', lineHeight: '1.4' }}>
                            Basado en los últimos {months} meses de ventas, estimamos un cierre para este período de:
                        </p>
                        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                            <span style={{ fontSize: '3.2rem', fontWeight: 900, letterSpacing: '-2px' }}>
                                {formatCurrency(data.overall.currentMonthEstimate)}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '6px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 800 }}>
                                <Activity size={16} />
                                <span>IA READY</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{
                    padding: '32px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '28px',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '24px'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-tertiary)', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <Target size={16} /> Margen Proyectado
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                            {formatCurrency(data.overall.currentMarginEstimate)}
                        </div>
                    </div>
                    <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>Confianza estadística:</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>Media</span>
                    </div>
                </div>
            </div>

            {/* Main Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                <Card title="Tendencia Histórica y Proyección">
                    <div style={{ height: '300px', width: '100%', marginTop: '24px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.overall.history}>
                                <defs>
                                    <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="var(--border-color)" strokeDasharray="3 3" opacity={0.5} />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontWeight: 700 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: 'var(--text-tertiary)', fontWeight: 600 }}
                                    tickFormatter={(v) => `$${v / 1000000}M`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px' }}
                                    formatter={(v: number | undefined) => [formatCurrency(v || 0), 'Ventas']}
                                />
                                <Area type="monotone" dataKey="val" stroke="#4f46e5" strokeWidth={4} fill="url(#projGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card title="Análisis Pareto 80/20" icon={<BarChart3 size={18} />}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '20px', backgroundColor: 'rgba(79, 70, 229, 0.05)', borderRadius: '20px', border: '1px solid rgba(79, 70, 229, 0.1)' }}>
                            <div style={{ padding: '12px', backgroundColor: '#4f46e5', color: 'white', borderRadius: '14px' }}>
                                <Package size={24} />
                            </div>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                                    {data.paretoAnalysis.topProductsCount} de {data.paretoAnalysis.totalProductsCount}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Productos generan el 80% del valor comercial</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {data.paretoAnalysis.products.slice(0, 5).map((p, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '14px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid transparent', transition: 'all 0.2s' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '65%' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {p.trend > 0 ?
                                                <span style={{ display: 'flex', alignItems: 'center', fontSize: '9px', fontWeight: 900, color: 'var(--success)', letterSpacing: '0.5px' }}><ArrowUpRight size={12} /> CRECIENTE</span> :
                                                <span style={{ display: 'flex', alignItems: 'center', fontSize: '9px', fontWeight: 900, color: 'var(--danger)', letterSpacing: '0.5px' }}><ArrowDownRight size={12} /> BAJANDO</span>
                                            }
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#4f46e5' }}>{formatCurrency(p.projectedSales)}</div>
                                        <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 800 }}>Proyección Mes</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Top 5 Products Detailed Behavior */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '-8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Comportamiento Individual: Top 5 Productos
                </h3>
                <select
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    style={{
                        fontSize: '0.8rem',
                        color: 'var(--brand-primary)',
                        fontWeight: 800,
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        outline: 'none',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <option value={3}>Últimos 3 Meses</option>
                    <option value={6}>Últimos 6 Meses</option>
                    <option value={9}>Últimos 9 Meses</option>
                    <option value={12}>Últimos 12 Meses</option>
                    <option value={18}>Últimos 18 Meses</option>
                    <option value={24}>Últimos 24 Meses</option>
                </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {data.paretoAnalysis.products.slice(0, 5).map((p, i) => (
                    <Card key={i} title={p.name} style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#4f46e5' }}>{formatCurrency(p.projectedSales)}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Cierre Proyectado</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: p.trend > 0 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '2px', justifyContent: 'flex-end' }}>
                                    {p.trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {p.trend > 0 ? '+' : ''}{Math.round((p.trend / (p.projectedSales || 1)) * 100)}%
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Trend mensual</div>
                            </div>
                        </div>

                        <div style={{ height: '140px', width: '100%', marginTop: '10px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={p.history} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={p.trend > 0 ? '#10b981' : '#ef4444'} stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={p.trend > 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} stroke="var(--border-color)" strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis
                                        dataKey="month"
                                        hide={false}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 9, fill: 'var(--text-tertiary)', fontWeight: 700 }}
                                        tickFormatter={(val) => val.split('-')[1] === '01' ? val.split('-')[0] : val.split('-')[1]} // Simplifica MM o YYYY
                                    />
                                    <YAxis hide={true} domain={['dataMin', 'dataMax']} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)', padding: '10px', fontSize: '11px' }}
                                        formatter={(value: any, name: string | undefined) => {
                                            if (name === 'Venta Neto') return [formatCurrency(value), name];
                                            if (name === 'Unidades') return [value, name];
                                            return [value, name || ''];
                                        }}
                                        labelFormatter={(label) => `Mes: ${label}`}
                                        labelStyle={{ fontWeight: 800, marginBottom: '4px', color: 'var(--text-primary)' }}
                                    />
                                    <Area
                                        name="Venta Neto"
                                        type="monotone"
                                        dataKey="val"
                                        stroke={p.trend > 0 ? '#10b981' : '#ef4444'}
                                        fill={`url(#color-${i})`}
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 4, strokeWidth: 0, fill: p.trend > 0 ? '#10b981' : '#ef4444' }}
                                    />
                                    <Area
                                        name="Unidades"
                                        type="monotone"
                                        dataKey="qty"
                                        stroke="transparent"
                                        fill="transparent"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                                <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>Periodo:</span> {p.history[0]?.month} al {p.history[p.history.length - 1]?.month}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Detailed Products Table */}
            <Card title="Comportamiento Estadístico por Producto (Top 20%)">
                <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ paddingBottom: '16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Producto</th>
                                <th style={{ paddingBottom: '16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Pronóstico Vta</th>
                                <th style={{ paddingBottom: '16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Margen Est.</th>
                                <th style={{ paddingBottom: '16px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Trend Histórico</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.paretoAnalysis.products.map((p, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} className="table-row-hover">
                                    <td style={{ padding: '20px 0' }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{p.name}</div>
                                    </td>
                                    <td style={{ padding: '20px 0' }}>
                                        <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#4f46e5' }}>{formatCurrency(p.projectedSales)}</div>
                                    </td>
                                    <td style={{ padding: '20px 0' }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--success)' }}>{formatCurrency(p.projectedMargin)}</div>
                                    </td>
                                    <td style={{ padding: '20px 0', textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '30px', backgroundColor: 'var(--bg-tertiary)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}>
                                            {p.trend > 0 ? '+' : ''}{Math.round(p.trend / 1000)}k / mes
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 0.3; }
                    100% { opacity: 0.6; }
                }
                .table-row-hover:hover {
                    background-color: var(--bg-tertiary);
                    cursor: default;
                }
            `}</style>
        </div>
    );
}
