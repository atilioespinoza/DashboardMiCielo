"use client";

import React, { useState } from 'react';
import { Search, Sparkles, TrendingUp, DollarSign, Package, Globe, MessageSquare } from 'lucide-react';

interface ProductIdea {
    id: string;
    name: string;
    description: string;
    viralPotential: { score: number; reason: string };
    costAndAvailability: { estimatedCost: string; source: string };
    localCompetition: { saturationLevel: string; estimatedResale: string };
    organicAudience: { communities: string; demand: string };
    logistics: { considerations: string };
    overallRecommendation: string;
}

export default function ProductFinder() {
    const [niche, setNiche] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<ProductIdea[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!niche.trim()) return;

        setLoading(true);
        setError(null);
        setResults(null);

        try {
            const response = await fetch('/api/ai/product-ideas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ niche }),
            });

            if (!response.ok) {
                throw new Error('Error al generar ideas de productos');
            }

            const data = await response.json();
            setResults(data.products);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    Analista de Tendencias Multicanal <Sparkles style={{ display: 'inline', color: 'var(--brand-primary)' }} />
                </h2>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                    Describe un nicho, problema o categoría. Nuestra IA cruzará datos simulando análisis en TikTok, AliExpress, Mercado Libre y Aduanas para encontrar tu próximo producto ganador.
                </p>
            </div>

            <div className="card" style={{ padding: '32px', marginBottom: '40px', background: 'linear-gradient(145deg, var(--bg-card), rgba(var(--brand-primary-rgb), 0.05))' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            placeholder="Ej. Artículos para mascotas que resuelven ansiedad..."
                            style={{
                                width: '100%',
                                padding: '16px 16px 16px 48px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: 'var(--bg-card)',
                                color: 'var(--text-primary)',
                                fontSize: '1.1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s, box-shadow 0.2s'
                            }}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '0 32px',
                            borderRadius: '12px',
                            backgroundColor: 'var(--brand-primary)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '1.1rem',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'transform 0.2s, opacity 0.2s'
                        }}
                    >
                        {loading ? (
                            <>Analizando...</>
                        ) : (
                            <>Generar Ideas</>
                        )}
                    </button>
                </form>
            </div>

            {error && (
                <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '24px', textAlign: 'center' }}>
                    {error}
                </div>
            )}

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '64px 0', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(var(--brand-primary-rgb), 0.2)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Sintetizando información de múltiples plataformas...</p>
                </div>
            )}

            {results && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                    {results.map((product) => (
                        <div key={product.id} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{product.name}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>{product.description}</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <TrendingUp size={20} style={{ color: '#8b5cf6', marginTop: '2px' }} />
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Potencial Viral (TikTok/IG)</strong>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Score: {product.viralPotential.score}/10 - {product.viralPotential.reason}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <Globe size={20} style={{ color: '#3b82f6', marginTop: '2px' }} />
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Origen (AliExpress)</strong>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Costo est.: {product.costAndAvailability.estimatedCost} ({product.costAndAvailability.source})</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <DollarSign size={20} style={{ color: '#10b981', marginTop: '2px' }} />
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Competencia (Mercado Libre)</strong>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Saturación: {product.localCompetition.saturationLevel}. Reventa est.: {product.localCompetition.estimatedResale}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <MessageSquare size={20} style={{ color: '#f59e0b', marginTop: '2px' }} />
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Audiencia (Orgánica)</strong>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Comunidad: {product.organicAudience.communities}. Demanda: {product.organicAudience.demand}</span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <Package size={20} style={{ color: '#ef4444', marginTop: '2px' }} />
                                    <div>
                                        <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Logística & Aduanas</strong>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{product.logistics.considerations}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                                <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>Recomendación del Analista:</strong>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>"{product.overallRecommendation}"</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
