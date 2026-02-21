import { NextResponse, NextRequest } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'mtd';

  // CHECK CACHE FIRST
  const cacheKey = `traffic_${period}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return NextResponse.json({ success: true, data: cachedData, source: 'cache' });
  }

  const shop = process.env.SHOPIFY_SHOP_NAME;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const apiVersion = '2026-01';

  if (!accessToken) {
    return NextResponse.json({ success: false, message: "No API token" }, { status: 401 });
  }

  try {
    let sinceClause = "-30d";
    if (period === 'mtd') {
      const now = new Date();
      const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      sinceClause = firstOfMonth; // ShopifyQL SINCE date format
    } else if (period === 'this_week') {
      sinceClause = "-7d";
    }

    const queryDaily = `
      {
        shopifyqlQuery(query: "FROM sessions SHOW sessions GROUP BY day SINCE ${sinceClause} UNTIL today") {
          tableData {
            rows
            columns { name }
          }
        }
      }
    `;

    const querySources = `
      {
        shopifyqlQuery(query: "FROM sessions SHOW sessions GROUP BY referrer_source SINCE ${sinceClause} UNTIL today") {
          tableData {
            rows
            columns { name }
          }
        }
      }
    `;

    const [resDaily, resSources] = await Promise.all([
      fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
        body: JSON.stringify({ query: queryDaily }),
      }).then(r => r.json()),
      fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
        body: JSON.stringify({ query: querySources }),
      }).then(r => r.json())
    ]);

    if (resDaily.errors || resSources.errors) {
      throw new Error(resDaily.errors?.[0]?.message || resSources.errors?.[0]?.message || "ShopifyQL error");
    }

    const dailyRows = resDaily.data.shopifyqlQuery.tableData?.rows || [];
    const sourceRows = resSources.data.shopifyqlQuery.tableData?.rows || [];

    const chartData = dailyRows.map((r: any) => ({
      name: r.day,
      sessions: parseInt(r.sessions)
    })).sort((a: any, b: any) => a.name.localeCompare(b.name));

    const sourceData = sourceRows.map((r: any) => ({
      name: r.referrer_source,
      value: parseInt(r.sessions)
    })).sort((a: any, b: any) => b.value - a.value);

    const totalSessions = sourceData.reduce((acc: number, curr: any) => acc + curr.value, 0);

    const responseData = {
      totalSessions,
      chartData,
      sourceData
    };

    setCache(cacheKey, responseData, 3600);

    return NextResponse.json({
      success: true,
      data: responseData,
      source: 'shopify_graphql'
    });

  } catch (error: any) {
    console.error("Traffic API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
