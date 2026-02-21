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

        const report = await generateSpecializedReport(type as any, dashboardData);

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
