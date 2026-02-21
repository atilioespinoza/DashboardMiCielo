"use client";

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { BrainCircuit, X, Download, History, Clock, ChevronRight } from 'lucide-react';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: string | null;
    isGenerating: boolean;
    type: 'executive' | 'commercial' | 'operational' | 'marketing';
    title: string;
    subtitle: string;
}

export function ReportModal({ isOpen, onClose, report, isGenerating, type, title, subtitle }: ReportModalProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedOldReport, setSelectedOldReport] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && !isGenerating) {
            fetchHistory();
            if (!report) {
                setShowHistory(true);
            }
        }
    }, [isOpen, isGenerating, report]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await fetch(`/api/ai/reports?type=${type}`);
            const json = await res.json();
            if (json.success) setHistory(json.reports);
        } catch (e) {
            console.error("Error fetching history", e);
        } finally {
            setLoadingHistory(false);
        }
    };

    const loadOldReport = async (reportId: string) => {
        setLoadingHistory(true);
        try {
            const res = await fetch('/api/ai/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId })
            });
            const json = await res.json();
            if (json.success) {
                setSelectedOldReport(json.report.content);
                setShowHistory(false);
            }
        } catch (e) {
            console.error("Error loading old report", e);
        } finally {
            setLoadingHistory(false);
        }
    };

    const downloadReport = () => {
        const content = selectedOldReport || report;
        if (!content) return;

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Informe_${type}_${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    const currentContent = selectedOldReport || report;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{
                width: '100%', maxWidth: '950px', maxHeight: '90vh',
                backgroundColor: 'white', borderRadius: '32px',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)',
                border: '1px solid var(--border-color)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 32px', borderBottom: '1px solid var(--border-color)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(to right, #fafafa, #ffffff)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '12px', color: '#7c3aed' }}>
                            <BrainCircuit size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900 }}>{title}</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{subtitle}</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            style={{ padding: '10px 16px', background: 'var(--bg-tertiary)', borderRadius: '12px', color: 'var(--text-secondary)', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.8rem' }}
                        >
                            <History size={18} /> {showHistory ? 'Cerrar Historial' : 'Historial'}
                        </button>
                        <button
                            onClick={downloadReport}
                            disabled={!currentContent}
                            style={{ padding: '10px 16px', background: 'var(--bg-tertiary)', borderRadius: '12px', color: 'var(--text-secondary)', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.8rem' }}
                        >
                            <Download size={18} /> Descargar
                        </button>
                        <button
                            onClick={onClose}
                            style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '50%', color: 'var(--text-tertiary)', cursor: 'pointer', border: 'none' }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                    {/* History Sidebar */}
                    {showHistory && (
                        <div style={{
                            width: '300px', borderRight: '1px solid var(--border-color)',
                            background: 'var(--bg-secondary)', overflowY: 'auto', padding: '20px'
                        }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '16px', color: 'var(--text-secondary)' }}>REPORTES ANTERIORES</h4>
                            {loadingHistory && <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Cargando...</div>}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {history.map((h) => (
                                    <div
                                        key={h.id}
                                        onClick={() => loadOldReport(h.id)}
                                        style={{
                                            padding: '12px', borderRadius: '12px', background: 'white',
                                            border: '1px solid var(--border-color)', cursor: 'pointer',
                                            transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                                {new Date(h.created_at).toLocaleDateString()} - {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                                    </div>
                                ))}
                                {history.length === 0 && !loadingHistory && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>No hay reportes guardados.</div>}
                            </div>
                        </div>
                    )}

                    {/* Content Area */}
                    <div style={{
                        padding: '40px', overflowY: 'auto', flex: 1,
                        lineHeight: '1.8', color: 'var(--text-secondary)'
                    }}>
                        {isGenerating ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '60px 0' }}>
                                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                                <p style={{ fontWeight: 700, color: '#7c3aed' }}>Analizando datos exclusivos...</p>
                            </div>
                        ) : (
                            <div className="prose">
                                {selectedOldReport && (
                                    <div style={{ marginBottom: '20px', padding: '12px 20px', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.2)', color: '#4f46e5', fontSize: '0.85rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        Visualizando reporte del historial
                                        <button onClick={() => setSelectedOldReport(null)} style={{ background: 'white', border: '1px solid #4f46e5', borderRadius: '10px', padding: '4px 12px', cursor: 'pointer', fontSize: '0.75rem' }}>Ver último generado</button>
                                    </div>
                                )}
                                <ReactMarkdown>{currentContent || ""}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '20px 32px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-secondary)' }}>
                    <button
                        onClick={onClose}
                        style={{ padding: '12px 32px', borderRadius: '16px', background: 'var(--text-primary)', color: 'white', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                        Entendido
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
