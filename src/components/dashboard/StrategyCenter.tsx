"use client";

import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Circle, Plus, Trash2, ChevronDown, ChevronRight, Check } from 'lucide-react';

interface Task {
    id: string;
    strategy_id: string;
    title: string;
    is_completed: boolean;
}

interface Strategy {
    id: string;
    title: string;
    description: string;
    pillar: string;
    status: 'active' | 'completed' | 'paused';
    tasks: Task[];
}

export const StrategyCenter = ({ pillar }: { pillar: string }) => {
    const [strategies, setStrategies] = useState<Strategy[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // New Strategy State
    const [isAddingStrategy, setIsAddingStrategy] = useState(false);
    const [newStrategyTitle, setNewStrategyTitle] = useState('');

    // New Task State
    const [addingTaskTo, setAddingTaskTo] = useState<string | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    useEffect(() => {
        fetchStrategies();
    }, [pillar]);

    const fetchStrategies = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/strategy?pillar=${pillar}`);
            const json = await res.json();
            if (json.success) {
                setStrategies(json.data);
                // Expand first active strategy by default if none are expanded
                if (json.data.length > 0 && expandedIds.size === 0) {
                    const firstActive = json.data.find((s: Strategy) => s.status === 'active');
                    if (firstActive) {
                        setExpandedIds(new Set([firstActive.id]));
                    }
                }
            }
        } catch (e) {
            console.error("Failed to fetch strategies", e);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpand = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const newSet = new Set(expandedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedIds(newSet);
    };

    const handleAddStrategy = async () => {
        if (!newStrategyTitle.trim()) return;

        const newStrategy = {
            id: `strat-${Date.now()}`,
            title: newStrategyTitle,
            pillar: pillar,
            description: '',
            status: 'active',
            tasks: []
        };

        // Optimistic update
        setStrategies([newStrategy as unknown as Strategy, ...strategies]);
        setNewStrategyTitle('');
        setIsAddingStrategy(false);
        setExpandedIds(new Set([...Array.from(expandedIds), newStrategy.id]));

        try {
            await fetch('/api/strategy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStrategy)
            });
            fetchStrategies(); // Refresh to get real IDs and dates
        } catch (e) {
            console.error(e);
            fetchStrategies(); // Revert on failure
        }
    };

    const handleDeleteStrategy = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("¿Eliminar estrategia y todas sus tareas?")) return;

        setStrategies(strategies.filter(s => s.id !== id));
        try {
            await fetch(`/api/strategy?id=${id}`, { method: 'DELETE' });
        } catch (e) {
            console.error(e);
            fetchStrategies();
        }
    };

    const handleStatusChange = async (id: string, status: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setStrategies(strategies.map(s => s.id === id ? { ...s, status: status as any } : s));
        try {
            await fetch('/api/strategy', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
        } catch (e) {
            console.error(e);
            fetchStrategies();
        }
    };

    const handleAddTask = async (strategyId: string) => {
        if (!newTaskTitle.trim()) return;

        const newTask = {
            id: `task-${Date.now()}`,
            strategy_id: strategyId,
            title: newTaskTitle,
            is_completed: false
        };

        // Optimistic update
        setStrategies(strategies.map(s => {
            if (s.id === strategyId) {
                return { ...s, tasks: [...s.tasks, newTask] };
            }
            return s;
        }));

        setNewTaskTitle('');
        setAddingTaskTo(null);

        try {
            await fetch('/api/strategy/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTask)
            });
            fetchStrategies(); // Refresh to get DB ID
        } catch (e) {
            console.error(e);
            fetchStrategies();
        }
    };

    const toggleTask = async (taskId: string, strategyId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;

        setStrategies(strategies.map(s => {
            if (s.id === strategyId) {
                return { ...s, tasks: s.tasks.map(t => t.id === taskId ? { ...t, is_completed: newStatus } : t) };
            }
            return s;
        }));

        try {
            await fetch('/api/strategy/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId, is_completed: newStatus })
            });
        } catch (e) {
            console.error(e);
            fetchStrategies();
        }
    };

    const deleteTask = async (taskId: string, strategyId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setStrategies(strategies.map(s => {
            if (s.id === strategyId) {
                return { ...s, tasks: s.tasks.filter(t => t.id !== taskId) };
            }
            return s;
        }));

        try {
            await fetch(`/api/strategy/tasks?id=${taskId}`, { method: 'DELETE' });
        } catch (e) {
            console.error(e);
            fetchStrategies();
        }
    };

    const isAllCompleted = (strategy: Strategy) => {
        if (strategy.tasks.length === 0) return false;
        return strategy.tasks.every(t => t.is_completed);
    };

    const getProgress = (strategy: Strategy) => {
        if (strategy.tasks.length === 0) return 0;
        const completed = strategy.tasks.filter(t => t.is_completed).length;
        return Math.round((completed / strategy.tasks.length) * 100);
    };

    if (isLoading) {
        return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Cargando Panel de Estrategia...</div>;
    }

    return (
        <div style={{ background: 'var(--bg-primary)', borderRadius: '20px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                        <Target size={18} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Centro de Acción y Estrategia</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '2px 0 0 0' }}>Convierte el análisis del pilar en ejecución táctica</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddingStrategy(true)}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '12px',
                        background: 'var(--brand-primary)',
                        color: 'white',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    <Plus size={16} /> Nueva Iniciativa
                </button>
            </div>

            {/* Input para nueva estrategia */}
            {isAddingStrategy && (
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'rgba(139, 92, 246, 0.03)' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <input
                            autoFocus
                            placeholder="Ej: Aumentar Ticket Promedio en Ecommerce..."
                            value={newStrategyTitle}
                            onChange={e => setNewStrategyTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddStrategy()}
                            style={{ flex: 1, minWidth: '200px', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--brand-primary)', outline: 'none', fontSize: '0.9rem', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                        <button onClick={handleAddStrategy} style={{ padding: '12px 20px', borderRadius: '12px', background: 'var(--brand-primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Guardar Iniciativa</button>
                        <button onClick={() => setIsAddingStrategy(false)} style={{ padding: '12px 20px', borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                </div>
            )}

            {/* Lista de Estrategias */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {strategies.length === 0 && !isAddingStrategy ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
                        <Target size={40} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                        <p style={{ fontWeight: 600, margin: 0 }}>No hay iniciativas activas en este pilar.</p>
                        <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>Crea una nueva estrategia para empezar a trazar tareas y objetivos.</p>
                    </div>
                ) : null}

                {strategies.map(strategy => {
                    const isExpanded = expandedIds.has(strategy.id);
                    const progress = getProgress(strategy);
                    const allDone = isAllCompleted(strategy);

                    return (
                        <div key={strategy.id} style={{
                            border: `1px solid ${allDone ? 'var(--success)' : 'var(--border-color)'}`,
                            borderRadius: '16px',
                            background: strategy.status === 'completed' || allDone ? 'var(--success-bg)' : 'var(--bg-primary)',
                            overflow: 'hidden',
                            transition: 'all 0.2s ease'
                        }}>
                            {/* Strategy Header */}
                            <div
                                onClick={() => toggleExpand(strategy.id)}
                                style={{
                                    padding: '16px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    cursor: 'pointer',
                                    borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none',
                                    flexWrap: 'wrap',
                                    gap: '12px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
                                    <div style={{ color: allDone ? 'var(--success)' : 'var(--text-tertiary)' }}>
                                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{
                                            margin: 0,
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            color: allDone ? 'var(--success)' : 'var(--text-primary)',
                                            textDecoration: strategy.status === 'completed' ? 'line-through' : 'none',
                                            opacity: strategy.status === 'completed' ? 0.6 : 1
                                        }}>
                                            {strategy.title}
                                        </h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                                            {/* Progress Bar */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '120px' }}>
                                                <div style={{ height: '6px', flex: 1, background: 'var(--bg-tertiary)', borderRadius: '10px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${progress}%`, height: '100%', background: allDone ? 'var(--success)' : 'var(--brand-primary)', transition: 'width 0.3s ease' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-tertiary)', width: '30px' }}>{progress}%</span>
                                            </div>

                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', padding: '2px 8px', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                                                {strategy.tasks.length} Tareas
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <select
                                        value={strategy.status}
                                        onChange={(e) => handleStatusChange(strategy.id, e.target.value, e as any)}
                                        onClick={e => e.stopPropagation()}
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-primary)',
                                            fontSize: '0.75rem',
                                            color: 'var(--text-secondary)',
                                            outline: 'none',
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                    >
                                        <option value="active">🟢 Activa</option>
                                        <option value="paused">🟡 Pausada</option>
                                        <option value="completed">✅ Completada</option>
                                    </select>
                                    <button
                                        onClick={(e) => handleDeleteStrategy(strategy.id, e)}
                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                                        title="Eliminar Estrategia"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Task List */}
                            {isExpanded && (
                                <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderTop: 'none' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {strategy.tasks.map(task => (
                                            <div key={task.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                padding: '10px 14px',
                                                background: task.is_completed ? 'var(--success-bg)' : 'var(--bg-primary)',
                                                borderRadius: '12px',
                                                border: `1px solid ${task.is_completed ? 'var(--success)' : 'var(--border-color)'}`,
                                                opacity: task.is_completed ? 0.7 : 1,
                                                transition: 'all 0.2s ease'
                                            }}>
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); toggleTask(task.id, strategy.id, task.is_completed); }}
                                                    style={{ cursor: 'pointer', color: task.is_completed ? 'var(--success)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    {task.is_completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                                </div>
                                                <span style={{
                                                    flex: 1,
                                                    fontSize: '0.85rem',
                                                    color: task.is_completed ? 'var(--success)' : 'var(--text-primary)',
                                                    textDecoration: task.is_completed ? 'line-through' : 'none',
                                                    fontWeight: task.is_completed ? 600 : 500
                                                }}>
                                                    {task.title}
                                                </span>
                                                <button
                                                    onClick={(e) => deleteTask(task.id, strategy.id, e)}
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px', opacity: 0.5 }}
                                                    onMouseOver={e => e.currentTarget.style.opacity = '1'}
                                                    onMouseOut={e => e.currentTarget.style.opacity = '0.5'}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Add Task Input */}
                                        {addingTaskTo === strategy.id ? (
                                            <div style={{ display: 'flex', gap: '8px', padding: '4px 0', marginTop: '4px' }}>
                                                <input
                                                    autoFocus
                                                    placeholder="Describe la tarea técnica o táctica..."
                                                    value={newTaskTitle}
                                                    onChange={e => setNewTaskTitle(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleAddTask(strategy.id)}
                                                    style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--brand-primary)', outline: 'none', fontSize: '0.85rem', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                                />
                                                <button onClick={() => handleAddTask(strategy.id)} style={{ padding: '0 16px', borderRadius: '10px', background: 'var(--brand-primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Añadir</button>
                                                <button onClick={() => setAddingTaskTo(null)} style={{ padding: '0 16px', borderRadius: '10px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontWeight: 700 }}>X</button>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => setAddingTaskTo(strategy.id)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    padding: '12px 14px',
                                                    color: 'var(--brand-primary)',
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer',
                                                    fontWeight: 700,
                                                    background: 'rgba(139, 92, 246, 0.05)',
                                                    borderRadius: '12px',
                                                    marginTop: '4px',
                                                    border: '1px dashed rgba(139, 92, 246, 0.3)'
                                                }}
                                            >
                                                <Plus size={16} /> <span>Añadir nueva tarea táctica</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
