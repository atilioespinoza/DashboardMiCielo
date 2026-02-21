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

    useEffect(() => {
        const fetchProjections = async () => {
            try {
                const res = await fetch('/api/shopify/analytics/projections?months=6');
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
    }, []);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
    };

    if (loading) {
        return (
            <div className="animate-pulse flex flex-col gap-6">
                <div className="h-40 bg-[var(--bg-tertiary)] rounded-3xl"></div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="h-80 bg-[var(--bg-tertiary)] rounded-3xl"></div>
                    <div className="h-80 bg-[var(--bg-tertiary)] rounded-3xl"></div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[32px] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <TrendingUp size={120} />
                    </div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Predictivo</span>
                            <span className="text-white/80 text-sm font-medium">Fase 1: Regresión Lineal</span>
                        </div>
                        <h2 className="text-3xl font-black mb-2 tracking-tight">Proyección Mensual</h2>
                        <p className="text-indigo-100 text-lg max-w-md leading-relaxed">
                            Basado en los últimos 6 meses de ventas, estimamos un cierre para este período de:
                        </p>
                        <div className="mt-6 flex items-baseline gap-4">
                            <span className="text-5xl font-black tracking-tighter">
                                {formatCurrency(data.overall.currentMonthEstimate)}
                            </span>
                            <div className="flex items-center gap-1 text-emerald-300 font-bold bg-emerald-400/20 px-3 py-1 rounded-xl">
                                <Activity size={16} />
                                <span>IA Ready</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px] shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-[var(--text-tertiary)] mb-2 font-bold text-xs uppercase tracking-widest">
                            <Target size={16} /> Margen Proyectado
                        </div>
                        <div className="text-3xl font-black text-[var(--text-primary)]">
                            {formatCurrency(data.overall.currentMarginEstimate)}
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-[var(--text-tertiary)]">Confianza estadística:</span>
                            <span className="font-bold text-indigo-500">Media</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Projections Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card title="Tendencia Histórica y Proyección">
                    <div className="h-[300px] w-100 mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.overall.history}>
                                <defs>
                                    <linearGradient id="projGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="var(--border-color)" strokeDasharray="3 3" opacity={0.5} />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: 'var(--text-tertiary)', fontWeight: 600 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                                    tickFormatter={(v) => `$${v / 1000000}M`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '16px' }}
                                    formatter={(v: number | undefined) => [formatCurrency(v || 0), 'Facturación']}
                                />
                                <Area type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={4} fill="url(#projGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card title="Análisis Pareto 80/20" icon={<BarChart3 size={18} />}>
                    <div className="mt-4 space-y-4">
                        <div className="flex gap-4 items-center p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                            <div className="p-3 bg-indigo-600 text-white rounded-xl">
                                <Package size={24} />
                            </div>
                            <div>
                                <div className="text-xl font-black text-indigo-950">
                                    {data.paretoAnalysis.topProductsCount} de {data.paretoAnalysis.totalProductsCount}
                                </div>
                                <div className="text-sm text-indigo-700 font-medium">Productos generan el 80% del valor</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {data.paretoAnalysis.products.slice(0, 5).map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold truncate max-w-[200px]">{p.name}</span>
                                        <div className="flex items-center gap-2">
                                            {p.trend > 0 ?
                                                <span className="flex items-center text-[10px] font-black text-emerald-500"><ArrowUpRight size={12} /> CRECIENTE</span> :
                                                <span className="flex items-center text-[10px] font-black text-rose-500"><ArrowDownRight size={12} /> BAJANDO</span>
                                            }
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-indigo-600">{formatCurrency(p.projectedSales)}</div>
                                        <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">Proyección Mes</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Detailed Products Table/List */}
            <Card title="Comportamiento Estadístico por Producto (Top 20%)">
                <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--border-color)]">
                                <th className="pb-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Producto</th>
                                <th className="pb-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Pronóstico Vta</th>
                                <th className="pb-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Margen Est.</th>
                                <th className="pb-4 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider text-right">Trend Histórico</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.paretoAnalysis.products.map((p, i) => (
                                <tr key={i} className="border-b border-[var(--border-color)] group hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                                    <td className="py-4">
                                        <div className="font-bold text-sm text-[var(--text-primary)]">{p.name}</div>
                                    </td>
                                    <td className="py-4 font-black text-sm">{formatCurrency(p.projectedSales)}</td>
                                    <td className="py-4 text-sm text-emerald-600 font-bold">{formatCurrency(p.projectedMargin)}</td>
                                    <td className="py-4 text-right">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black uppercase">
                                            {p.trend > 0 ? '+' : ''}{Math.round(p.trend / 1000)}k / mes
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
