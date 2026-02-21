import { NextResponse, NextRequest } from 'next/server';
import { generateExecutiveReport } from '@/lib/ai';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { dashboardData } = body;

        if (!dashboardData) {
            return NextResponse.json({ success: false, error: "Datos del dashboard requeridos" }, { status: 400 });
        }

        const report = await generateExecutiveReport(dashboardData);

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
