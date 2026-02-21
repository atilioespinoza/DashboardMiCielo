import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '2024-01-01';
    const endDate = searchParams.get('endDate');

    const shop = process.env.SHOPIFY_SHOP_NAME;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01';

    if (!accessToken) {
        return NextResponse.json({ success: false, message: "No API token" }, { status: 401 });
    }

    const cacheKey = `pareto_${startDate}_${endDate || 'now'}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
        return NextResponse.json({ success: true, data: cachedData, cached: true });
    }

    try {
        const query = `
      query GetParetoData($cursor: String) {
        orders(first: 250, after: $cursor, query: "created_at:>=${startDate} ${endDate ? `created_at:<=${endDate}` : ''} status:any") {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              cancelledAt
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
        let iterations = 0;

        // Limit to 4 iterations (1000 orders) for performance, usually enough for Pareto
        while (hasNextPage && iterations < 4) {
            const resp: Response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
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

        const productStats: Record<string, { name: string, sales: number, margin: number, quantity: number }> = {};

        allOrders.forEach(({ node }: any) => {
            if (node.cancelledAt) return;

            node.lineItems.edges.forEach(({ node: item }: any) => {
                const productTitle = item.variant?.product?.title || item.title;
                const variantTitle = item.variant?.title !== 'Default Title' ? ` (${item.variant?.title})` : '';
                let fullName = `${productTitle}${variantTitle}`;

                // --- Aggregation Logic ---
                const upperName = fullName.toUpperCase();
                if (upperName.includes("MOCHILA PRIMERA ETAPA")) {
                    fullName = "Mochila Primera Etapa (Total)";
                } else if (upperName.includes("UPA GO!")) {
                    fullName = "Upa Go! (Total)";
                } else if (upperName.includes("TODDLER") && (upperName.includes("MOCHILA") || upperName.includes("MOSHILA"))) {
                    fullName = "Mochila Toddler (Total)";
                }
                // -------------------------

                const price = parseFloat(item.originalUnitPriceSet.shopMoney.amount) / 1.19; // Net price
                const cost = parseFloat(item.variant?.inventoryItem?.unitCost?.amount || "0") / 1.19; // Net cost

                const lineSales = price * item.quantity;
                const lineMargin = (price - cost) * item.quantity;

                if (!productStats[fullName]) {
                    productStats[fullName] = { name: fullName, sales: 0, margin: 0, quantity: 0 };
                }

                productStats[fullName].sales += lineSales;
                productStats[fullName].margin += lineMargin;
                productStats[fullName].quantity += item.quantity;
            });
        });

        const sortedBySales = Object.values(productStats).sort((a, b) => b.sales - a.sales);
        const totalSales = sortedBySales.reduce((acc, p) => acc + p.sales, 0);

        const sortedByMargin = Object.values(productStats).sort((a, b) => b.margin - a.margin);
        const totalMargin = sortedByMargin.reduce((acc, p) => acc + p.margin, 0);

        // Calculate Pareto for Sales
        let cumSales = 0;
        let salesParetoReached = false;
        const paretoSales = sortedBySales.map((p, index) => {
            cumSales += p.sales;
            const currentPercentage = (cumSales / totalSales);
            const isPareto = !salesParetoReached;
            if (currentPercentage >= 0.8) salesParetoReached = true;

            return {
                ...p,
                cumPercentage: currentPercentage * 100,
                isPareto: isPareto
            };
        });

        // Calculate Pareto for Margin
        let cumMargin = 0;
        let marginParetoReached = false;
        const paretoMargin = sortedByMargin.map((p, index) => {
            cumMargin += p.margin;
            const currentPercentage = (cumMargin / totalMargin);
            const isPareto = !marginParetoReached;
            if (currentPercentage >= 0.8) marginParetoReached = true;

            return {
                ...p,
                cumPercentage: currentPercentage * 100,
                isPareto: isPareto
            };
        });

        const finalData = {
            totalSales,
            totalMargin,
            paretoSales: paretoSales.filter(p => p.isPareto).slice(0, 30),
            paretoMargin: paretoMargin.filter(p => p.isPareto).slice(0, 30),
            summary: {
                topProductsCount: paretoSales.filter(p => p.isPareto).length,
                totalProductsCount: sortedBySales.length
            }
        };

        await setCache(cacheKey, finalData, 21600); // 6 hours

        return NextResponse.json({
            success: true,
            data: finalData,
            cached: false
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
