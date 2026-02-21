import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthsBack = parseInt(searchParams.get('months') || '12');

  const shop = process.env.SHOPIFY_SHOP_NAME;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01';

  if (!accessToken) {
    return NextResponse.json({ success: false, message: "No API token" }, { status: 401 });
  }

  const cacheKey = `brands_mix_v3_${monthsBack}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return NextResponse.json({ success: true, data: cachedData, cached: true });
  }

  try {
    const sinceDate = new Date(Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const query = `
          query GetBrandSales($cursor: String) {
            orders(first: 250, after: $cursor, query: "created_at:>=${sinceDate} status:any") {
              pageInfo { hasNextPage endCursor }
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
                          product { title vendor }
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

    while (hasNextPage && iterations < 10) {
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

    let salesMiCielo = 0;
    let salesResold = 0;
    const productsMiCielo: Record<string, number> = {};
    const productsResold: Record<string, number> = {};

    allOrders.forEach(({ node }: any) => {
      if (node.cancelledAt) return;
      node.lineItems.edges.forEach(({ node: item }: any) => {
        const vendor = item.variant?.product?.vendor || "Desconocido";
        let isMiCielo = vendor.toUpperCase() === "MI CIELO" || vendor.toUpperCase() === "MICIELO";

        const productTitle = item.variant?.product?.title || item.title;
        const variantTitle = item.variant?.title && item.variant?.title !== 'Default Title' ? ` (${item.variant?.title})` : '';
        let fullName = `${productTitle}${variantTitle}`;

        // Aggregation Logic typical of the project
        const upperName = fullName.toUpperCase();
        if (upperName.includes("MOCHILA PRIMERA ETAPA")) fullName = "Mochila Primera Etapa (Total)";
        else if (upperName.includes("UPA GO!")) fullName = "Upa Go! (Total)";
        else if (upperName.includes("TODDLER") && (upperName.includes("MOCHILA") || upperName.includes("MOSHILA"))) fullName = "Mochila Toddler (Total)";
        else if (upperName.includes("CUBRE PORTEO")) fullName = "Cubre Porteo (Total)";

        // Force MiCielo for core manufactured products regardless of vendor tag
        if (fullName === "Mochila Primera Etapa (Total)" ||
          fullName === "Upa Go! (Total)" ||
          fullName === "Mochila Toddler (Total)" ||
          fullName === "Cubre Porteo (Total)") {
          isMiCielo = true;
        }

        const price = parseFloat(item.originalUnitPriceSet?.shopMoney?.amount || "0") / 1.19;
        const lineSales = price * item.quantity;

        if (isMiCielo) {
          salesMiCielo += lineSales;
          productsMiCielo[fullName] = (productsMiCielo[fullName] || 0) + lineSales;
        } else {
          salesResold += lineSales;
          productsResold[fullName] = (productsResold[fullName] || 0) + lineSales;
        }
      });
    });

    const topMiCielo = Object.entries(productsMiCielo)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, sales]) => ({ name, sales }));

    const topResold = Object.entries(productsResold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, sales]) => ({ name, sales }));

    const totalSales = salesMiCielo + salesResold;

    const finalData = {
      totalSales,
      mix: {
        miCielo: {
          total: salesMiCielo,
          percentage: totalSales > 0 ? (salesMiCielo / totalSales) * 100 : 0,
          top: topMiCielo
        },
        resold: {
          total: salesResold,
          percentage: totalSales > 0 ? (salesResold / totalSales) * 100 : 0,
          top: topResold
        }
      }
    };

    await setCache(cacheKey, finalData, 21600);

    return NextResponse.json({ success: true, data: finalData, cached: false });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
