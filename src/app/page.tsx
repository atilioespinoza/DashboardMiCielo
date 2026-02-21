"use client";

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import ExecutiveSummary from '@/components/dashboard/ExecutiveSummary';
import CommercialPillar from '@/components/dashboard/CommercialPillar';
import OperationalPillar from '@/components/dashboard/OperationalPillar';
import MarketingPillar from '@/components/dashboard/MarketingPillar';

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePillar, setActivePillar] = useState('executive');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderContent = () => {
    switch (activePillar) {
      case 'executive':
        return <ExecutiveSummary />;
      case 'commercial':
        return <CommercialPillar />;
      case 'operational':
        return <OperationalPillar />;
      case 'marketing':
        return <MarketingPillar />;
      default:
        return <ExecutiveSummary />;
    }
  };

  const getPillarLabel = () => {
    switch (activePillar) {
      case 'executive': return 'Resumen Ejecutivo';
      case 'commercial': return 'Pilar Comercial (Ventas & P&L)';
      case 'operational': return 'Pilar Operacional (Inventario)';
      case 'marketing': return 'Pilar Marketing (Clientes)';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        isOpen={isSidebarOpen}
        activePillar={activePillar}
        setActivePillar={setActivePillar}
      />

      <main className="dashboard-main">
        <Header
          toggleSidebar={toggleSidebar}
          activePillarLabel={getPillarLabel()}
        />

        <div className="dashboard-content">
          {renderContent()}
        </div>
      </main>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 5 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
