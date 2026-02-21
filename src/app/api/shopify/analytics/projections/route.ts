import { NextResponse } from 'next/server';
import * as ss from 'simple-statistics';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const monthsBack = parseInt(searchParams.get('months') || '6');

    const shop = process.env.SHOPIFY_SHOP_NAME;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01';

    if (!accessToken) {
        return NextResponse.json({ success: false, message: "No API token" }, { status: 401 });
    }

    // Calcular fecha de inicio (6 meses atrás para tener tendencia)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);
    const startDateStr = startDate.toISOString().split('T')[0];

    try {
        const query = `
      query GetHistoricalSales($cursor: String) {
        orders(first: 250, after: $cursor, query: "created_at:>=${startDateStr} status:any") {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              createdAt
              cancelledAt
              totalPriceSet { shopMoney { amount } }
              lineItems(first: 50) {
                edges {
                  node {
                    title
                    quantity
                    originalUnitPriceSet { shopMoney { amount } }
                    variant { 
                        title
                        product { title }
                        inventoryItem { unitCost { amount } } 
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

        let allOrders: any[] = [];
        let hasNextPage = true;
        let cursor = null;

        // Obtenemos historial (limitado a 2000 órdenes para el MVP)
        let iterations = 0;
        while (hasNextPage && iterations < 8) {
            const resp = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': accessToken,
                },
                body: JSON.stringify({ query, variables: { cursor } }),
            });

            const result: any = await resp.json();
            if (result.errors) throw new Error(result.errors[0].message);

            allOrders = [...allOrders, ...result.data.orders.edges];
            hasNextPage = result.data.orders.pageInfo.hasNextPage;
            cursor = result.data.orders.pageInfo.endCursor;
            iterations++;
        }

        const dailyData: Record<string, { sales: number, margin: number }> = {};
        const productHistorical: Record<string, Record<string, { sales: number, margin: number }>> = {};

        allOrders.forEach(({ node }: any) => {
            if (node.cancelledAt) return;
            const date = node.createdAt.split('T')[0];
            const month = date.substring(0, 7); // YYYY-MM

            if (!dailyData[month]) dailyData[month] = { sales: 0, margin: 0 };

            node.lineItems.edges.forEach(({ node: item }: any) => {
                const productTitle = item.variant?.product?.title || item.title;
                const variantTitle = item.variant?.title !== 'Default Title' ? ` (${item.variant?.title})` : '';
                let fullName = `${productTitle}${variantTitle}`;

                // Agrupación (Consistente con Pareto)
                const upperName = fullName.toUpperCase();
                if (upperName.includes("MOCHILA PRIMERA ETAPA")) fullName = "Mochila Primera Etapa (Total)";
                else if (upperName.includes("UPA GO!")) fullName = "Upa Go! (Total)";
                else if (upperName.includes("TODDLER") && (upperName.includes("MOCHILA") || upperName.includes("MOSHILA"))) fullName = "Mochila Toddler (Total)";

                const price = parseFloat(item.originalUnitPriceSet.shopMoney.amount) / 1.19;
                const cost = parseFloat(item.variant?.inventoryItem?.unitCost?.amount || "0") / 1.19;
                const lineSales = price * item.quantity;
                const lineMargin = (price - cost) * item.quantity;

                dailyData[month].sales += lineSales;
                dailyData[month].margin += lineMargin;

                if (!productHistorical[fullName]) productHistorical[fullName] = {};
                if (!productHistorical[fullName][month]) productHistorical[fullName][month] = { sales: 0, margin: 0 };

                productHistorical[fullName][month].sales += lineSales;
                productHistorical[fullName][month].margin += lineMargin;
            });
        });

        // 1. Análisis de Pareto para identificar el 20% top
        const productStats = Object.keys(productHistorical).map(name => {
            const months = Object.values(productHistorical[name]);
            return {
                name,
                totalSales: months.reduce((acc, m) => acc + m.sales, 0),
                totalMargin: months.reduce((acc, m) => acc + m.margin, 0),
                avgMonthlySales: months.reduce((acc, m) => acc + m.sales, 0) / months.length
            };
        }).sort((a, b) => b.totalSales - a.totalSales);

        const totalHistoricalSales = productStats.reduce((acc, p) => acc + p.totalSales, 0);
        let cumSales = 0;
        const paretoProducts = productStats.filter(p => {
            cumSales += p.totalSales;
            return (cumSales / totalHistoricalSales) <= 0.85; // Un poco más del 80% para margen de maniobra
        });

        // 2. Proyecciones (Regresión Lineal Simple)
        const project = (history: { month: string, val: number }[]) => {
            if (history.length < 2) return history.length > 0 ? history[history.length - 1].val : 0;
            const points = history.map((h, i) => [i, h.val]);
            const lre = ss.linearRegression(points);
            const line = ss.linearRegressionLine(lre);
            const nextIdx = history.length;
            const projection = line(nextIdx);
            return projection > 0 ? projection : 0;
        };

        const monthsPresent = Object.keys(dailyData).sort();
        const totalSalesHistory = monthsPresent.map(m => ({ month: m, val: dailyData[m].sales }));
        const totalMarginHistory = monthsPresent.map(m => ({ month: m, val: dailyData[m].margin }));

        const projections = {
            totalSales: project(totalSalesHistory),
            totalMargin: project(totalMarginHistory),
            byProduct: paretoProducts.map(p => {
                const history = monthsPresent.map(m => ({
                    month: m,
                    val: productHistorical[p.name][m]?.sales || 0
                }));
                const marginHistory = monthsPresent.map(m => ({
                    month: m,
                    val: productHistorical[p.name][m]?.margin || 0
                }));
                return {
                    name: p.name,
                    projectedSales: project(history),
                    projectedMargin: project(marginHistory),
                    trend: ss.linearRegression(history.map((h, i) => [i, h.val])).m, // Pendiente
                    history: history // Devolver historial completo para gráficos individuales
                };
            })
        };

        return NextResponse.json({
            success: true,
            data: {
                timeframe: `${monthsBack} months`,
                overall: {
                    currentMonthEstimate: projections.totalSales,
                    currentMarginEstimate: projections.totalMargin,
                    history: totalSalesHistory
                },
                paretoAnalysis: {
                    topProductsCount: paretoProducts.length,
                    totalProductsCount: productStats.length,
                    products: projections.byProduct
                }
            }
        });

    } catch (error: any) {
        console.error("Projections Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
