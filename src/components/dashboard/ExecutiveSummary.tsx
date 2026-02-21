"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import {
    DollarSign, Target, TrendingUp,
    ShoppingBag, Users, Activity, Wallet, Calendar,
    AlertCircle, Package, Star, ArrowRight, UserPlus, RotateCcw,
    ChevronDown, Clock, RefreshCw
} from 'lucide-react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, ComposedChart, Line, Area,
    PieChart, Pie
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { BrainCircuit, X, History } from 'lucide-react';
import { ReportModal } from '../ui/ReportModal';

export default function ExecutiveSummary() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('mtd');

    // AI Report States
    const [report, setReport] = useState<string | null>(null);
    const [showReport, setShowReport] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/shopify/analytics/executive?period=${period}`);
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            }
        } catch (e) {
            console.error("Error fetching executive data", e);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const generateAIReport = async () => {
        setGeneratingReport(true);
        setShowReport(true);
        try {
            // Recopilar datos adicionales del P&L para un informe más rico
            const pnlStructRes = await fetch('/api/pnl/structure');
            const pnlValRes = await fetch('/api/pnl/values');
            const pnlStruct = await pnlStructRes.json();
            const pnlValues = await pnlValRes.json();

            const fullContext = {
                analytics: data,
                financials: {
                    structure: pnlStruct.success ? pnlStruct.data : [],
                    values: pnlValues.success ? pnlValues.data : {}
                }
            };

            const res = await fetch('/api/ai/executive-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dashboardData: fullContext })
            });
            const json = await res.json();
            if (json.success) {
                setReport(json.report);
            } else {
                setReport("Error al generar el informe: " + json.error);
            }
        } catch (e) {
            console.error("AI Report Error", e);
            setReport("Error técnico al conectar con la IA.");
        } finally {
            setGeneratingReport(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
    };

    if (loading && !data) {
        return (
            <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div className="animate-pulse" style={{ width: '100%', maxWidth: '900px', height: '150px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '24px' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px', width: '100%', maxWidth: '900px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse" style={{ height: '120px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '16px' }}></div>
                    ))}
                </div>
                <p style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>Sincronizando período...</p>
            </div>
        );
    }

    const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#10b981'];
    const RETENTION_COLORS = ['#818cf8', '#6366f1'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease-out' }}>

            {/* Header with Period Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--bg-tertiary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                        <Activity size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Vistazo General</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>Análisis de rendimiento estratégico</p>
                    </div>
                </div>

                <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '14px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    {[
                        { id: 'mtd', label: 'Este Mes' },
                        { id: 'this_week', label: 'Esta Semana' },
                        { id: 'last_7d', label: 'Últimos 7 días' }
                    ].map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setPeriod(p.id)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '10px',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: period === p.id ? 'white' : 'var(--text-secondary)',
                                backgroundColor: period === p.id ? 'var(--brand-primary)' : 'transparent',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Proactive Alerts Bar */}
            {(data?.alerts?.unfulfilled > 0 || data?.alerts?.stockouts > 0) && (
                <div style={{
                    display: 'flex', gap: '16px', flexWrap: 'wrap',
                    padding: '16px 24px', backgroundColor: 'var(--danger-bg)',
                    borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444', alignItems: 'center'
                }}>
                    <AlertCircle size={20} />
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.5px' }}>ALERTA OPERATIVA:</span>
                    {data?.alerts?.unfulfilled > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'white', padding: '6px 14px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 800, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            {data.alerts.unfulfilled} Pedidos pendientes
                        </div>
                    )}
                    {data?.alerts?.stockouts > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'white', padding: '6px 14px', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 800, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            {data.alerts.stockouts} Sin stock
                        </div>
                    )}
                </div>
            )}

            {/* Strategic Header Banner */}
            <div style={{
                padding: '40px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                borderRadius: '30px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(79, 70, 229, 0.4)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'rgba(255,255,100,0.1)', borderRadius: '50%', filter: 'blur(80px)' }}></div>

                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                                LIVE COCKPIT
                            </div>
                            <span style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 500 }}>{data?.periodLabel}</span>
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 12px 0', letterSpacing: '-1.5px' }}>Monitor de Gestión</h2>
                        <p style={{ margin: 0, fontSize: '1.25rem', opacity: 0.9, fontWeight: 400, maxWidth: '600px', lineHeight: '1.4' }}>
                            Hola Atilio, las ventas en <strong>{data?.periodLabel}</strong> suman <strong>{formatCurrency(data?.mtdRevenue || 0)}</strong>.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.15)',
                            backdropFilter: 'blur(10px)',
                            padding: '24px 36px',
                            borderRadius: '26px',
                            border: '1px solid rgba(255,255,255,0.3)',
                            textAlign: 'right',
                            minWidth: '200px'
                        }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, opacity: 0.8, marginBottom: '6px', letterSpacing: '1px' }}>VENTAS HOY</div>
                            <div style={{ fontSize: '2.4rem', fontWeight: 900, letterSpacing: '-0.5px' }}>{formatCurrency(data?.dailySales || 0)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                <Card
                    title="Ventas del Período"
                    value={formatCurrency(data?.mtdRevenue || 0)}
                    trend={Number(data?.revenueGrowthMtd?.toFixed(1))}
                    icon={<DollarSign size={22} />}
                >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>comparado vs período anterior</div>
                </Card>

                <Card
                    title="Ticket Promedio"
                    value={formatCurrency(data?.mtdTicket || 0)}
                    icon={<Target size={22} />}
                >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>eficiencia por transacción</div>
                </Card>

                <Card
                    title="Meta Cierre Mes"
                    value={data?.progressToPrevMonth ? `${data.progressToPrevMonth.toFixed(1)}%` : "0%"}
                    icon={<TrendingUp size={22} style={{ color: '#10b981' }} />}
                >
                    <div style={{ marginTop: '12px', width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(data?.progressToPrevMonth || 0, 100)}%`, height: '100%', background: 'var(--success)', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>objetivo vs facturación total mes pasado</div>
                </Card>

                <Card title="Salud de Marca" icon={<UserPlus size={22} />}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Fidelización:</span>
                            <span style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>{data?.retentionData[1]?.value}% Vol.</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Alertas:</span>
                            <span style={{ fontWeight: 800, color: data?.alerts?.unfulfilled > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                {data?.alerts?.unfulfilled > 0 ? `${data.alerts.unfulfilled} Pend.` : 'OK'}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Visualizations and Top Products */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                <Card title={`Evolución: ${data?.periodLabel}`}>
                    <div style={{ height: '380px', width: '100%', marginTop: '24px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={data?.chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="var(--border-color)" opacity={0.3} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontWeight: 700 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `$${v / 1000}k`}
                                    tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontWeight: 700 }}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: '1px solid var(--border-color)',
                                        boxShadow: '0 15px 35px rgba(0,0,0,0.08)',
                                        padding: '16px',
                                        backgroundColor: 'rgba(255,255,255,0.95)',
                                        backdropFilter: 'blur(8px)'
                                    }}
                                    itemStyle={{ fontWeight: 800, fontSize: '14px' }}
                                    formatter={(val: any) => [formatCurrency(val), 'Ventas']}
                                />
                                <Bar dataKey="value" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={period === 'mtd' ? 8 : 40} />
                                <Area type="monotone" dataKey="value" fill="url(#lineGradient)" stroke="none" />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#4f46e5"
                                    strokeWidth={4}
                                    dot={{ r: 0 }}
                                    activeDot={{ r: 8, strokeWidth: 0, fill: '#4f46e5' }}
                                    animationDuration={1500}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Top Products Ranking */}
                <Card title="Top 5 del Período" icon={<Star size={18} />}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                        {data?.topProducts.length > 0 ? data.topProducts.map((p: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: i < 4 ? '1px solid var(--border-color)' : 'none' }}>
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '10px',
                                    backgroundColor: 'var(--bg-tertiary)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                                }}>
                                    {p.img ? <img src={p.img} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Package size={22} color="var(--text-tertiary)" />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{p.qty} unidades</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--brand-primary)' }}>{formatCurrency(p.rev)}</div>
                                </div>
                            </div>
                        )) : (
                            <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Sin datos en este rango.</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Market Insights */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px' }}>
                <Card title="Fidelización (Revenue)" icon={<RotateCcw size={18} />}>
                    <div style={{ height: '220px', width: '100%', marginTop: '10px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data?.retentionData}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                    animationDuration={1000}
                                >
                                    {data?.retentionData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={RETENTION_COLORS[index % RETENTION_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                                    formatter={(v) => [`${v}%`, 'Volumen']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 800 }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: RETENTION_COLORS[0] }}></div> Nuevos
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 800 }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: RETENTION_COLORS[1] }}></div> Recurrentes
                        </div>
                    </div>
                </Card>

                <Card title="Mix por Canal">
                    <div style={{ height: '220px', width: '100%', marginTop: '15px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data?.channelData} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: '11px', fontWeight: 800 }} width={80} />
                                <Bar dataKey="value" radius={[0, 15, 15, 0]} barSize={34}>
                                    {data?.channelData.map((e: any, i: number) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px' }}
                                    formatter={(v) => [`${v}%`, 'Participación']}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center', fontStyle: 'italic' }}>
                        {data?.channelData[0]?.value > 50 ? 'Dominancia de tienda física' : 'Equilibrio de canales'}
                    </div>
                </Card>

                <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    padding: '36px',
                    borderRadius: '28px',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: '18px',
                    boxShadow: '0 12px 30px rgba(16, 185, 129, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <Wallet size={80} style={{ position: 'absolute', right: '-15px', bottom: '-15px', opacity: 0.15 }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <RotateCcw size={20} />
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, opacity: 0.9 }}>META DE CIERRE</span>
                    </div>
                    <div style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-1px' }}>{data?.progressToPrevMonth?.toFixed(1)}%</div>
                    <div style={{ fontSize: '1rem', opacity: 0.95, lineHeight: '1.5', fontWeight: 500 }}>
                        {data?.progressToPrevMonth >= 100 ? '¡META SUPERADA!' : `A este ritmo, superarás la facturación de enero en breve.`}
                    </div>
                </div>
            </div>

            {/* Modern Footer Reference */}
            <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '26px',
                padding: '28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '24px',
                boxShadow: 'var(--shadow-sm)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ padding: '14px', background: 'rgba(79, 70, 229, 0.08)', color: '#4f46e5', borderRadius: '16px' }}>
                        <Calendar size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1rem', fontWeight: 800 }}>Referencia Comercial</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>
                            El mes anterior cerró con <strong>{formatCurrency(data?.prevMonthTotal || 0)}</strong>.
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
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
                        <BrainCircuit size={16} /> INFORME CEO (IA)
                    </button>
                    <div style={{ padding: '10px 24px', borderRadius: '30px', background: 'var(--bg-tertiary)', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                        SYNC: OK
                    </div>
                </div>
                <button onClick={() => fetchData()} style={{ padding: '10px 24px', borderRadius: '30px', background: '#4f46e5', color: 'white', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> ACTUALIZAR
                </button>
            </div>

            {/* AI Report Modal */}
            <ReportModal
                isOpen={showReport}
                onClose={() => setShowReport(false)}
                report={report}
                isGenerating={generatingReport}
                type="executive"
                title="Informe Estratégico CEO"
                subtitle="Visión Global y Salud del Negocio"
            />

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div >
    );
}
