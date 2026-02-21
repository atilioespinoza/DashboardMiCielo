import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';

interface HeaderProps {
    toggleSidebar: () => void;
    activePillarLabel: string;
}

export default function Header({ toggleSidebar, activePillarLabel }: HeaderProps) {
    return (
        <header className="dashboard-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button onClick={toggleSidebar} style={{ color: 'var(--text-secondary)' }}>
                    <Menu size={24} />
                </button>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {activePillarLabel}
                </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ position: 'relative', display: 'none' /* Will hide on mobile, can make responsive later */ }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input
                        type="text"
                        placeholder="Buscar métricas..."
                        style={{
                            padding: '8px 12px 8px 36px',
                            borderRadius: '20px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            fontFamily: 'inherit',
                            width: '240px'
                        }}
                    />
                </div>

                <button style={{ color: 'var(--text-secondary)', position: 'relative' }}>
                    <Bell size={20} />
                    <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: 'var(--danger)', borderRadius: '50%' }}></span>
                </button>

                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--brand-primary-light)', backgroundImage: 'url("https://i.pravatar.cc/150?u=a042581f4e29026704d")', backgroundSize: 'cover' }}></div>
            </div>
        </header>
    );
}
