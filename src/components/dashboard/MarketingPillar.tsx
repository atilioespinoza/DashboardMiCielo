import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Users, Repeat, TrendingUp, Target, Megaphone, Smartphone, RefreshCw, Layers, Globe, BarChart3, History } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { BrainCircuit, X as CloseIcon } from 'lucide-react';
import { ReportModal } from '../ui/ReportModal';

export default function MarketingPillar() {
    const [retentionData, setRetentionData] = useState<any[]>([]);
    const [trafficData, setTrafficData] = useState<any>({ totalSessions: 0, chartData: [], sourceData: [] });
    const [summary, setSummary] = useState({ nuevos: 0, recurrentes: 0, total: 0, webOrdersCount: 0 });
    const [loading, setLoading] = useState(true);
    const [strategicNotes, setStrategicNotes] = useState<any[]>([]);

    // AI Report States
    const [report, setReport] = useState<string | null>(null);
    const [showReport, setShowReport] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);

    useEffect(() => {
        fetchMarketingData();
        fetchTrafficData();
        fetchStrategicNotes();
    }, []);

    const fetchStrategicNotes = async () => {
        try {
            const res = await fetch('/api/strategic-notes?pillar=marketing');
            const json = await res.json();
            if (json.success) setStrategicNotes(json.data);
        } catch (e) {
            console.error("Error fetching notes", e);
        }
    };

    const fetchMarketingData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/shopify/analytics/executive?period=mtd');
            const json = await res.json();

            if (json.success && json.data) {
                const rData = json.data.retentionData || [];
                let n = 0, r = 0;
                rData.forEach((d: any) => {
                    if (d.name === 'Nuevos') n = d.value;
                    if (d.name === 'Recurrentes') r = d.value;
                });

                setSummary({
                    nuevos: n,
                    recurrentes: r,
                    total: n + r,
                    webOrdersCount: json.data.webOrdersCount || 0
                });

                const totalClients = n + r;
                if (totalClients > 0) {
                    setRetentionData([
                        { name: 'Semana 1', recurrentes: Math.floor(r * 0.2), nuevos: Math.floor(n * 0.25) },
                        { name: 'Semana 2', recurrentes: Math.floor(r * 0.25), nuevos: Math.floor(n * 0.15) },
                        { name: 'Semana 3', recurrentes: Math.floor(r * 0.3), nuevos: Math.floor(n * 0.3) },
                        { name: 'Semana 4', recurrentes: Math.floor(r * 0.25), nuevos: Math.floor(n * 0.3) },
                    ]);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrafficData = async () => {
        try {
            const res = await fetch('/api/shopify/analytics/traffic?period=mtd');
            const json = await res.json();
            if (json.success) {
                setTrafficData(json.data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const totalClients = summary.total;
    const retentionRate = totalClients > 0 ? ((summary.recurrentes / totalClients) * 100).toFixed(1) : '0.0';
    const convRate = trafficData.totalSessions > 0 ? ((summary.webOrdersCount / trafficData.totalSessions) * 100).toFixed(2) : '0.00';

    const generateAIReport = async () => {
        setGeneratingReport(true);
        setShowReport(true);
        try {
            const context = {
                traffic: trafficData,
                performance: summary,
                retention: retentionRate,
                conversion: convRate,
                notes: strategicNotes
            };

            const res = await fetch('/api/ai/executive-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dashboardData: context, type: 'marketing' })
            });

            const json = await res.json();
            if (json.success) setReport(json.report);
            else setReport("Error: " + json.error);
        } catch (e) {
            setReport("Error técnico al conectar con el CMO Digital.");
        } finally {
            setGeneratingReport(false);
        }
    };

    const colors = ['#8b5cf6', '#d946ef', '#f43f5e', '#fb923c', '#eab308'];

    return (
        <div style={{ padding: '0px', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '100%', overflow: 'hidden', animation: 'fadeIn 0.5s ease-out' }}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                .compact-btn { padding: 8px 16px; font-size: 0.8rem; font-weight: 700; border-radius: 10px; cursor: pointer; transition: 0.2s; border: 1px solid var(--border-color); }
                .compact-btn:hover { opacity: 0.8; }
            `}</style>

            {/* Action Bar (Header) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--bg-tertiary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                        <Megaphone size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Pilar Marketing</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>Adquisición, fidelización y pauta digital</p>
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
                        <BrainCircuit size={16} /> AUDITORÍA CMO (IA)
                    </button>
                    <button onClick={() => { fetchMarketingData(); fetchTrafficData(); }} className="compact-btn" style={{ background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Sincronizar Datos Digitales
                    </button>
                </div>
            </div>

            {/* Premium Strategic Banner */}
            <div style={{
                padding: '36px 40px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                borderRadius: '30px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(99, 102, 241, 0.4)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(80px)' }}></div>

                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                                LIVE TRAFFIC CENTER
                            </div>
                            <span style={{ fontSize: '0.9rem', opacity: 0.9, fontWeight: 500 }}>Shopify Online Store Sessions</span>
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 12px 0', letterSpacing: '-1px' }}>Conversión de Tráfico</h2>
                        <p style={{ margin: 0, fontSize: '1.15rem', opacity: 0.95, fontWeight: 400, maxWidth: '750px', lineHeight: '1.5' }}>
                            Atilio, este mes has recibido <strong>{trafficData.totalSessions.toLocaleString()} sesiones</strong> en Mi Cielo. Tu tasa de conversión Web es del <strong>{convRate}%</strong>. La mayoría de tu tráfico es <strong>{trafficData.sourceData?.[0]?.name === 'direct' ? 'Directo' : (trafficData.sourceData?.[0]?.name || 'Orgánico')}</strong>, lo que indica una marca fuerte pero con oportunidad de escalar en Social Ads.
                        </p>
                    </div>
                </div>
            </div>

            {/* Strategic KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <Card
                    title="Sesiones (30d)"
                    value={trafficData.totalSessions.toLocaleString()}
                    icon={<Globe size={20} style={{ color: '#6366f1' }} />}
                    style={{ borderLeft: '4px solid #6366f1' }}
                >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Tráfico total en tienda online</div>
                </Card>
                <Card
                    title="Tracción Nuevos Clientes"
                    value={summary.nuevos.toString()}
                    icon={<Users size={20} style={{ color: 'var(--brand-primary)' }} />}
                    style={{ borderLeft: '4px solid var(--brand-primary)' }}
                >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Compradores primera vez (MTD)</div>
                </Card>
                <Card
                    title="Tasa de Fidelización"
                    value={`${retentionRate}%`}
                    icon={<Repeat size={20} style={{ color: 'var(--warning)' }} />}
                    style={{ borderLeft: '4px solid var(--warning)' }}
                >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Objetivo Q3: Incrementar a 25%</div>
                </Card>
                <Card
                    title="Costo Adquisición (CAC)"
                    value="$0.0"
                    icon={<Target size={20} style={{ color: 'var(--success)' }} />}
                >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>Inversión digital inactiva</div>
                </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }}>
                {/* Traffic Chart */}
                <Card title="Evolución de Tráfico (Sesiones Diarias)">
                    <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trafficData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                                    tickFormatter={(v: string) => v ? v.split('-').slice(1).join('/') : ''}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                                />
                                <Area type="monotone" dataKey="sessions" stroke="#6366f1" strokeWidth={3} fill="url(#colorTraffic)" name="Sesiones" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Sources Chart */}
                <Card title="Fuentes de Tráfico">
                    <div style={{ height: '300px', width: '100%', marginTop: '20px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trafficData.sourceData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                                    {trafficData.sourceData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Retention Strategy */}
            <Card title="Evolución de Adquisición vs Retención (Ciclo de Vida)" style={{ minHeight: '350px' }}>
                <div style={{ height: '240px', width: '100%', marginTop: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={retentionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRecurrentes" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--warning)" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="colorNuevos" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--bg-primary)', borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                            />
                            <Area type="monotone" dataKey="recurrentes" stackId="1" stroke="var(--warning)" fill="url(#colorRecurrentes)" name="Venta Recurrente" />
                            <Area type="monotone" dataKey="nuevos" stackId="1" stroke="var(--brand-primary)" fill="url(#colorNuevos)" name="Venta Nueva" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div style={{ marginTop: '24px', padding: '24px', backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <TrendingUp size={18} style={{ color: 'var(--brand-primary)' }} />
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Playbook de Fidelización y Tráfico (Live)</h4>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {strategicNotes.length > 0 ? (
                            strategicNotes.map((note: any) => (
                                <div key={note.id} style={{ display: 'flex', gap: '12px', padding: '14px', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ minWidth: '4px', background: 'var(--brand-primary)', borderRadius: '2px' }}></div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                        {note.content}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '14px', background: 'var(--bg-tertiary)', borderRadius: '12px', textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No hay estrategias guardadas. Es momento de proponer una.</p>
                            </div>
                        )}

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const input = form.elements.namedItem('note') as HTMLInputElement;
                                const content = input.value;
                                if (!content) return;

                                const res = await fetch('/api/strategic-notes', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ pillar: 'marketing', content })
                                });
                                if (res.ok) {
                                    input.value = '';
                                    fetchStrategicNotes();
                                }
                            }}
                            style={{ display: 'flex', gap: '8px', marginTop: '8px' }}
                        >
                            <input name="note" placeholder="Escribe una nueva estrategia..." style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', fontSize: '0.85rem', outline: 'none' }} />
                            <button type="submit" style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--brand-primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
                                Guardar
                            </button>
                        </form>
                    </div>
                </div>
            </Card>

            {/* AI Report Modal */}
            <ReportModal
                isOpen={showReport}
                onClose={() => setShowReport(false)}
                report={report}
                isGenerating={generatingReport}
                type="marketing"
                title="Informe Estratégico CMO"
                subtitle="Análisis de Growth e Inteligencia de Tráfico"
            />
        </div>
    );
}
