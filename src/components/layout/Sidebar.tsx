import React from 'react';
import { Home, TrendingUp, Package, Users, Settings, Bell, Search, Menu } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  activePillar: string;
  setActivePillar: (pillar: string) => void;
}

export default function Sidebar({ isOpen, activePillar, setActivePillar }: SidebarProps) {
  const navItems = [
    { id: 'executive', label: 'Resumen Ejecutivo', icon: <Home className="nav-icon" size={20} /> },
    { id: 'commercial', label: 'Pilar Comercial', icon: <TrendingUp className="nav-icon" size={20} /> },
    { id: 'operational', label: 'Pilar Operacional', icon: <Package className="nav-icon" size={20} /> },
    { id: 'marketing', label: 'Pilar Marketing', icon: <Users className="nav-icon" size={20} /> },
    { id: 'projections', label: 'Proyecciones', icon: <TrendingUp className="nav-icon" size={20} /> },
  ];

  return (
    <aside className={`dashboard-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', backgroundColor: 'var(--brand-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
          MC
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Mi Cielo</h1>
      </div>

      <div style={{ padding: '0 16px', marginBottom: '24px' }}>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, paddingLeft: '12px', marginBottom: '8px' }}>
          Métricas
        </div>
        <nav>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePillar === item.id ? 'active' : ''}`}
              onClick={() => setActivePillar(item.id)}
              style={{ width: 'calc(100% - 32px)', textAlign: 'left' }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ marginTop: 'auto', padding: '0 16px 24px 16px' }}>
        <button className="nav-item" style={{ width: 'calc(100% - 32px)', textAlign: 'left' }}>
          <Settings className="nav-icon" size={20} />
          Configuración
        </button>
      </div>
    </aside>
  );
}
