import { NextResponse, NextRequest } from 'next/server';
import { generateSpecializedReport } from '@/lib/ai';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { dashboardData, type = 'executive' } = body;

        if (!dashboardData) {
            return NextResponse.json({ success: false, error: "Datos del dashboard requeridos" }, { status: 400 });
        }

        // Si es reporte ejecutivo (CEO), buscar los últimos reportes de los otros pilares para consolidar
        let pillarReports = {};
        if (type === 'executive') {
            try {
                const results = await sql`
                    SELECT DISTINCT ON (report_type) report_type, content
                    FROM ai_reports
                    WHERE report_type IN ('commercial', 'operational', 'marketing')
                    ORDER BY report_type, created_at DESC
                `;

                // Formatear como objeto para pasar a la IA, truncando para no exceder límites de tokens
                pillarReports = results.reduce((acc: any, row: any) => {
                    // Truncar reporte a ~3000 caracteres para el contexto del CEO
                    acc[row.report_type] = row.content.length > 3000
                        ? row.content.substring(0, 3000) + "... [Reporte truncado para contexto]"
                        : row.content;
                    return acc;
                }, {});
            } catch (dbError) {
                console.error("Failed to fetch pillar reports for CEO context:", dbError);
            }
        }

        const report = await generateSpecializedReport(type as any, dashboardData, pillarReports);

        // Save to cloud (Neon)
        try {
            await sql`
                INSERT INTO ai_reports (report_type, content, data_snapshot)
                VALUES (${type}, ${report}, ${JSON.stringify(dashboardData)})
            `;
        } catch (dbError) {
            console.error("Failed to save report to DB:", dbError);
            // We still return the report even if saving fails
        }

        return NextResponse.json({
            success: true,
            report
        });
    } catch (error: any) {
        console.error("AI Report API Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Error interno del servidor"
        }, { status: 500 });
    }
}
