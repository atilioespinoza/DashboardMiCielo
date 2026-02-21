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

  const cacheKey = `brands_mix_v7_${startDate}_${endDate || 'now'}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return NextResponse.json({ success: true, data: cachedData, cached: true });
  }

  try {
    const query = `
          query GetBrandSales($cursor: String) {
            orders(first: 250, after: $cursor, query: "created_at:>=${startDate} ${endDate ? `created_at:<=${endDate}` : ''} status:any") {
              pageInfo { hasNextPage endCursor }
              edges {
                node {
                  cancelledAt
                  sourceName
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

    // Channel stats
    const channelStats = {
      online: { miCielo: 0, resold: 0, total: 0 },
      pos: { miCielo: 0, resold: 0, total: 0 }
    };

    allOrders.forEach(({ node }: any) => {
      if (node.cancelledAt) return;

      const source = (node.sourceName || '').toLowerCase();
      const isPos = source.includes('pos');
      const channel = isPos ? 'pos' : 'online';

      node.lineItems.edges.forEach(({ node: item }: any) => {
        const vendor = item.variant?.product?.vendor || "Desconocido";
        let isMiCielo = vendor.toUpperCase() === "MI CIELO" || vendor.toUpperCase() === "MICIELO";

        const productTitle = item.variant?.product?.title || item.title;
        const variantTitle = item.variant?.title && item.variant?.title !== 'Default Title' ? ` (${item.variant?.title})` : '';
        let fullName = `${productTitle}${variantTitle}`;

        const upperName = fullName.toUpperCase();
        if (upperName.includes("MOCHILA PRIMERA ETAPA")) fullName = "Mochila Primera Etapa (Total)";
        else if (upperName.includes("UPA GO!")) fullName = "Upa Go! (Total)";
        else if (upperName.includes("TODDLER") && (upperName.includes("MOCHILA") || upperName.includes("MOSHILA"))) fullName = "Mochila Toddler (Total)";
        else if (upperName.includes("CUBRE PORTEO")) fullName = "Cubre Porteo (Total)";
        else if (upperName.includes("MOCHILA DE PORTEO BABY") || upperName.includes("MOCHILA BABY")) fullName = "Mochila Baby (Total)";
        else if (upperName.includes("UPA MAMI")) fullName = "Upa Mami (Total)";
        else if (upperName.includes("COLUMPIO ERGONÓMICO") || upperName.includes("COLUMPIO ERGONOMICO")) fullName = "Columpio Ergonómico (Total)";

        if (fullName === "Mochila Primera Etapa (Total)" ||
          fullName === "Upa Go! (Total)" ||
          fullName === "Mochila Toddler (Total)" ||
          fullName === "Cubre Porteo (Total)" ||
          fullName === "Mochila Baby (Total)" ||
          fullName === "Upa Mami (Total)" ||
          fullName === "Columpio Ergonómico (Total)") {
          isMiCielo = true;
        }

        const price = parseFloat(item.originalUnitPriceSet?.shopMoney?.amount || "0") / 1.19;
        const lineSales = price * item.quantity;

        if (isMiCielo) {
          salesMiCielo += lineSales;
          productsMiCielo[fullName] = (productsMiCielo[fullName] || 0) + lineSales;
          channelStats[channel].miCielo += lineSales;
        } else {
          salesResold += lineSales;
          productsResold[fullName] = (productsResold[fullName] || 0) + lineSales;
          channelStats[channel].resold += lineSales;
        }
        channelStats[channel].total += lineSales;
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
      },
      channels: {
        online: channelStats.online,
        pos: channelStats.pos
      }
    };

    await setCache(cacheKey, finalData, 21600);

    return NextResponse.json({ success: true, data: finalData, cached: false });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
