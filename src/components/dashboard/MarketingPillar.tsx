import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Users, Repeat, TrendingUp, Target, Megaphone, Smartphone, RefreshCw, Layers, Globe, BarChart3, History, MapPin, Package, Star, Settings, Check } from 'lucide-react';
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

    // AI Context Settings
    const [showContextModal, setShowContextModal] = useState(false);
    const [aiContext, setAiContext] = useState('');
    const [savingContext, setSavingContext] = useState(false);
    const [loadingContext, setLoadingContext] = useState(false);

    // Geography States
    const [geoData, setGeoData] = useState<any>(null);
    const [geoLoading, setGeoLoading] = useState(true);

    useEffect(() => {
        fetchMarketingData();
        fetchTrafficData();
        fetchStrategicNotes();
        fetchGeographyData();
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

    const fetchGeographyData = async () => {
        setGeoLoading(true);
        try {
            const res = await fetch('/api/shopify/analytics/geography');
            const json = await res.json();
            if (json.success) {
                setGeoData(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setGeoLoading(false);
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

    const loadAIContext = async () => {
        setLoadingContext(true);
        try {
            const res = await fetch('/api/ai/context?role=marketing');
            const data = await res.json();
            if (data.success) {
                setAiContext(data.context || '');
            }
        } catch (e) {
            console.error("Failed to load AI context", e);
        } finally {
            setLoadingContext(false);
        }
    };

    const saveAIContext = async () => {
        setSavingContext(true);
        try {
            await fetch('/api/ai/context', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'marketing', content: aiContext })
            });
            setShowContextModal(false);
        } catch (e) {
            console.error("Failed to save AI context", e);
            alert("Error al guardar contexto.");
        } finally {
            setSavingContext(false);
        }
    };

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
                    <button
                        onClick={() => { setShowContextModal(true); loadAIContext(); }}
                        title="Configurar Reglas del CMO (IA)"
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
                        <Settings size={16} />
                    </button>
                    <button onClick={() => { fetchMarketingData(); fetchTrafficData(); fetchGeographyData(); }} className="compact-btn" style={{ background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <RefreshCw size={14} className={loading || geoLoading ? 'animate-spin' : ''} />
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

            {/* Geography Map Integration */}
            <Card title="Mapa de Calor de Ventas (Chile)" icon={<MapPin size={18} style={{ color: 'var(--brand-primary)' }} />} style={{ borderTop: '4px solid var(--brand-primary)' }}>
                {geoLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 10px auto' }} />
                        Mapeando despachos en Chile...
                    </div>
                ) : geoData?.cities ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1.5fr)', gap: '32px', marginTop: '16px' }}>

                        {/* City Ranking List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                Top 10 Ciudades
                            </div>
                            {geoData.cities.slice(0, 10).map((city: any, i: number) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i < 3 ? 'var(--brand-primary)' : 'var(--bg-tertiary)', color: i < 3 ? '#fff' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>
                                        #{i + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{city.name}</span>
                                            <span style={{ fontWeight: 900, color: 'var(--text-primary)' }}>{(city.percentage).toFixed(1)}%</span>
                                        </div>
                                        <div style={{ height: '6px', width: '100%', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${city.percentage}%`, background: i < 3 ? 'var(--brand-primary)' : 'var(--text-tertiary)', borderRadius: '3px' }}></div>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px', fontWeight: 600 }}>
                                            {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(city.sales)} • {city.quantity} unidades
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Top Products by City Insight */}
                        <div style={{ background: 'var(--bg-tertiary)', borderRadius: '16px', padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <Package size={18} style={{ color: 'var(--brand-primary)' }} />
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Preferencias Locales</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {geoData.cities.slice(0, 5).map((city: any, i: number) => (
                                    <div key={i}>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Star size={14} style={{ color: '#eab308' }} /> {city.name}</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {city.topProducts.map((p: any, j: number) => (
                                                <div key={j} style={{ padding: '4px 10px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                                    {p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name} <span style={{ opacity: 0.5, marginLeft: '4px' }}>({p.quantity})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--brand-primary)', fontWeight: 600, lineHeight: 1.5 }}>
                                    <strong>💡 Insight Estratégico:</strong> Usa esta información para segmentar tus campañas de Facebook Ads. Si {geoData.cities[0]?.name} lidera las compras de {geoData.cities[0]?.topProducts[0]?.name}, lanza un anuncio exclusivo de ese producto para esa zona.
                                </p>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No hay datos geográficos disponibles.</div>
                )}
            </Card >

            {/* Strategic KPI Cards */}
            < div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
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
            </div >

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

            {/* AI Context Settings Modal */}
            {showContextModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--bg-primary)', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '600px',
                        boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--brand-primary)', padding: '10px', borderRadius: '12px' }}>
                                    <BrainCircuit size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Reglas y Contexto del CMO</h3>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>Añade reglas de negocio para el reporte de Marketing.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowContextModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                <CloseIcon size={24} />
                            </button>
                        </div>

                        {loadingContext ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                                <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
                            </div>
                        ) : (
                            <textarea
                                value={aiContext}
                                onChange={(e) => setAiContext(e.target.value)}
                                placeholder="Ej: Las campañas de Facebook Ads del Q3 se centraron en awareness. Ignora el CAC alto..."
                                style={{
                                    width: '100%', height: '200px', padding: '16px', borderRadius: '12px',
                                    border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'inherit',
                                    outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                            <button
                                onClick={() => setShowContextModal(false)}
                                style={{ padding: '10px 20px', borderRadius: '30px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveAIContext}
                                disabled={savingContext || loadingContext}
                                style={{
                                    padding: '10px 24px', borderRadius: '30px', background: 'var(--brand-primary)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                {savingContext ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
                                Guardar Reglas
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
