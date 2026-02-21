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

    const cacheKey = `geography_v1_${startDate}_${endDate || 'now'}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
        return NextResponse.json({ success: true, data: cachedData, cached: true });
    }

    try {
        const query = `
      query GetGeographicSales($cursor: String) {
        orders(first: 250, after: $cursor, query: "created_at:>=${startDate} ${endDate ? `created_at:<=${endDate}` : ''} status:any") {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              cancelledAt
              shippingAddress {
                city
                countryCodeV2
                province
              }
              lineItems(first: 50) {
                edges {
                  node {
                    title
                    quantity
                    originalUnitPriceSet { shopMoney { amount } }
                    variant {
                      title
                      product { title }
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

        while (hasNextPage && iterations < 15) { // Increased iterations to ensure we get enough data
            const resp: Response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
                body: JSON.stringify({ query, variables: { cursor } }),
            });
            const result: any = await resp.json();
            if (result.errors) throw new Error(result.errors[0].message);

            allOrders = [...allOrders, ...result.data.orders.edges];
            hasNextPage = result.data.orders.pageInfo.hasNextPage;
            cursor = result.data.orders.pageInfo.endCursor;
            iterations++;
        }

        const cityStats: Record<string, { totalSales: number, totalQuantity: number, products: Record<string, { sales: number, quantity: number }> }> = {};
        let totalSalesChile = 0;

        allOrders.forEach(({ node }: any) => {
            if (node.cancelledAt) return; // Skip cancelled orders

            const address = node.shippingAddress;
            if (!address || address.countryCodeV2 !== 'CL' || !address.city) return; // Only Chile and valid cities

            // Normalize city name
            const rawCity = address.city.toUpperCase().trim();
            let city = rawCity;
            // Basic normalization for common typos/variations (add more as needed based on actual data)
            if (rawCity.includes('SANTIAGO') || rawCity === 'STGO') city = 'SANTIAGO';
            else if (rawCity.includes('CONCEPCION') || rawCity.includes('CONCEPCI')) city = 'CONCEPCIÓN';
            else if (rawCity.includes('VALPARAISO') || rawCity.includes('VALPARA')) city = 'VALPARAÍSO';
            else if (rawCity.includes('VINA DEL MAR') || rawCity.includes('VIÑA')) city = 'VIÑA DEL MAR';
            else if (rawCity.includes('ANTOFAGASTA')) city = 'ANTOFAGASTA';
            else if (rawCity.includes('TEMUCO')) city = 'TEMUCO';
            else if (rawCity.includes('PUERTO MONTT')) city = 'PUERTO MONTT';

            if (!cityStats[city]) {
                cityStats[city] = { totalSales: 0, totalQuantity: 0, products: {} };
            }

            node.lineItems.edges.forEach(({ node: item }: any) => {
                const productTitle = item.variant?.product?.title || item.title;
                // Clean up title logic similar to Brands Mix to group variations
                let fullName = productTitle.toUpperCase();
                if (fullName.includes("MOCHILA PRIMERA ETAPA")) fullName = "Mochila Primera Etapa";
                else if (fullName.includes("UPA GO!")) fullName = "Upa Go!";
                else if (fullName.includes("TODDLER") && (fullName.includes("MOCHILA") || fullName.includes("MOSHILA"))) fullName = "Mochila Toddler";
                else if (fullName.includes("CUBRE PORTEO")) fullName = "Cubre Porteo";
                else if (fullName.includes("MOCHILA DE PORTEO BABY") || fullName.includes("MOCHILA BABY")) fullName = "Mochila Baby";
                else if (fullName.includes("UPA MAMI")) fullName = "Upa Mami";
                else if (fullName.includes("COLUMPIO ERGONÓMICO") || fullName.includes("COLUMPIO ERGONOMICO")) fullName = "Columpio Ergonómico";
                else fullName = productTitle; // Fallback to original

                const price = parseFloat(item.originalUnitPriceSet?.shopMoney?.amount || "0") / 1.19; // Net price
                const lineSales = price * item.quantity;

                cityStats[city].totalSales += lineSales;
                cityStats[city].totalQuantity += item.quantity;
                totalSalesChile += lineSales;

                if (!cityStats[city].products[fullName]) {
                    cityStats[city].products[fullName] = { sales: 0, quantity: 0 };
                }
                cityStats[city].products[fullName].sales += lineSales;
                cityStats[city].products[fullName].quantity += item.quantity;
            });
        });

        // Format final data into arrays and sort
        const cityRanking = Object.entries(cityStats)
            .map(([name, stats]) => {
                const topProducts = Object.entries(stats.products)
                    .map(([prodName, prodStats]) => ({ name: prodName, ...prodStats }))
                    .sort((a, b) => b.sales - a.sales)
                    .slice(0, 3); // Keep top 3 products per city

                return {
                    name,
                    sales: stats.totalSales,
                    quantity: stats.totalQuantity,
                    percentage: totalSalesChile > 0 ? (stats.totalSales / totalSalesChile) * 100 : 0,
                    topProducts
                };
            })
            .sort((a, b) => b.sales - a.sales) // Sort cities by total sales descending
            .slice(0, 15); // Return top 15 cities

        const finalData = {
            totalSalesChile,
            cities: cityRanking
        };

        await setCache(cacheKey, finalData, 43200); // Cache for 12 hours

        return NextResponse.json({ success: true, data: finalData, cached: false });

    } catch (error: any) {
        console.error("Geography API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
