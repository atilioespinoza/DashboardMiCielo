require('dotenv').config({ path: '.env.local' });

async function test() {
    const context = {
        financial_summary: [
            { "id": "2025-12", "label": "diciembre", "ventas": 0, "cost": 0, "totalBruto": 0, "taxes": 0, "shipping": 0, "refunds": 0, "mgProducto": 0, "totalCostosOperacionales": 0, "ebitda": 0, "subtotalBancos": 0, "cajaTeorica": 0 },
            { "id": "2026-01", "label": "enero", "ventas": 2393902, "cost": 0, "totalBruto": 0, "taxes": 0, "shipping": 0, "refunds": 0, "mgProducto": 2393902, "totalCostosOperacionales": 0, "ebitda": 2393902, "subtotalBancos": 0, "cajaTeorica": 2393902 },
            { "id": "2026-02", "label": "febrero", "ventas": 1381549, "cost": 0, "totalBruto": 0, "taxes": 0, "shipping": 0, "refunds": 0, "mgProducto": 1381549, "totalCostosOperacionales": 0, "ebitda": 1381549, "subtotalBancos": 0, "cajaTeorica": 1381549 }
        ],
        categories: [],
        top_product: { "title": "Ajuar Completo Prematuro 00 - Distintos colores", "rev": 223930 },
        channels: { "ecommerce": 8, "pos": 92 }
    };
    try {
        const res = await fetch('http://localhost:3000/api/ai/executive-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dashboardData: context, type: 'commercial' })
        });
        const json = await res.json();
        console.log("SUCCESS:", json.success);
        console.log(json);
    } catch (e) {
        console.error("FAIL:", e);
    }
}
test();
