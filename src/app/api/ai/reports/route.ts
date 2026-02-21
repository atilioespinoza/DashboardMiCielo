import { NextResponse, NextRequest } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    try {
        let reports;
        if (type) {
            reports = await sql`
                SELECT id, report_type, created_at 
                FROM ai_reports 
                WHERE report_type = ${type} 
                ORDER BY created_at DESC 
                LIMIT 10
            `;
        } else {
            reports = await sql`
                SELECT id, report_type, created_at 
                FROM ai_reports 
                ORDER BY created_at DESC 
                LIMIT 20
            `;
        }
        return NextResponse.json({ success: true, reports });
    } catch (error: any) {
        console.error("Fetch Reports Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { reportId } = await req.json();
        if (!reportId) return NextResponse.json({ success: false, error: "Report ID required" }, { status: 400 });

        const report = await sql`
            SELECT * FROM ai_reports WHERE id = ${reportId}
        `;

        if (report.length === 0) {
            return NextResponse.json({ success: false, error: "Report not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, report: report[0] });
    } catch (error: any) {
        console.error("Get Report Detail Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
