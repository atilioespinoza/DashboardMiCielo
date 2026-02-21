import React from 'react';

interface CardProps {
    title: string;
    icon?: React.ReactNode;
    value?: string | number;
    trend?: number;
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export function Card({ title, icon, value, trend, children, className = '', style }: CardProps) {
    return (
        <div className={`card ${className}`} style={style}>
            <div className="card-header">
                <h3 className="card-title">{title}</h3>
                {icon && <div className="card-icon">{icon}</div>}
            </div>

            {value !== undefined && (
                <div className="card-value">{value}</div>
            )}

            {trend !== undefined && (
                <div className={`card-trend ${trend >= 0 ? 'trend-up' : 'trend-down'}`}>
                    {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs mes anterior
                </div>
            )}

            {children && (
                <div style={{ flex: 1, marginTop: value !== undefined ? '16px' : '0' }}>
                    {children}
                </div>
            )}
        </div>
    );
}
