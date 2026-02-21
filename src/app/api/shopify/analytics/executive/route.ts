import { NextResponse, NextRequest } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get('period') || 'mtd'; // 'mtd', 'this_week', 'last_7d'

  // CHECK CACHE FIRST
  const cacheKey = `executive_${period}`;
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return NextResponse.json({ success: true, data: cachedData, source: 'cache' });
  }

  const shop = process.env.SHOPIFY_SHOP_NAME;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01';

  if (!accessToken) {
    return NextResponse.json({ success: false, message: "No API token" }, { status: 401 });
  }

  try {
    const now = new Date();
    let currentStart = new Date();
    let currentEnd = new Date();
    let prevStart = new Date();
    let prevEnd = new Date();
    let periodLabel = "";

    if (period === 'this_week') {
      // Current week (starting Monday)
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
      currentStart = new Date(now.setDate(diff));
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date();

      // Previous week for comparison
      prevStart = new Date(currentStart);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(currentEnd);
      prevEnd.setDate(prevEnd.getDate() - 7);
      periodLabel = "Esta Semana";
    } else if (period === 'last_7d') {
      currentStart = new Date();
      currentStart.setDate(currentStart.getDate() - 7);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd = new Date();

      prevStart = new Date(currentStart);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(currentStart);
      prevEnd.setMilliseconds(-1);
      periodLabel = "Últimos 7 días";
    } else {
      // Default: mtd
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = new Date();

      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      periodLabel = now.toLocaleString('es-CL', { month: 'long' });
    }

    const currentStartISO = currentStart.toISOString();
    const prevStartISO = prevStart.toISOString();
    const prevEndISO = prevEnd.toISOString();

    // Previous full month (always needed for the fixed goal card)
    const prevMonthStartFull = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEndFull = new Date(now.getFullYear(), now.getMonth(), 0);
    const prevMonthStartFullISO = prevMonthStartFull.toISOString();
    const prevMonthEndFullISO = prevMonthEndFull.toISOString();

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();

    const query = `
      query GetExecutiveData($todayQuery: String!, $currentQuery: String!, $prevMonthQuery: String!, $prevPeriodQuery: String!) {
        todayOrders: orders(first: 250, query: $todayQuery) {
          edges {
            node {
              totalPriceSet { shopMoney { amount } }
            }
          }
        }
        currentPeriod: orders(first: 250, query: $currentQuery) {
          edges {
            node {
              totalPriceSet { shopMoney { amount } }
              sourceName
              createdAt
              customer {
                numberOfOrders
              }
              lineItems(first: 50) {
                edges {
                  node {
                    title
                    quantity
                    originalUnitPriceSet { shopMoney { amount } }
                    image { url }
                  }
                }
              }
            }
          }
        }
        prevMonthFull: orders(first: 250, query: $prevMonthQuery) {
          edges {
            node {
              totalPriceSet { shopMoney { amount } }
            }
          }
        }
        prevPeriod: orders(first: 250, query: $prevPeriodQuery) {
          edges {
            node {
              totalPriceSet { shopMoney { amount } }
            }
          }
        }
        unfulfilledOrders: orders(first: 50, query: "fulfillment_status:unfulfilled OR fulfillment_status:partial") {
          edges {
            node { id }
          }
        }
        outOfStock: products(first: 50, query: "inventory_total:<=0") {
          edges {
            node { id }
          }
        }
      }
    `;

    const variables = {
      todayQuery: `created_at:>=${todayStart} status:any`,
      currentQuery: `created_at:>=${currentStartISO} status:any`,
      prevMonthQuery: `created_at:>=${prevMonthStartFullISO} created_at:<=${prevMonthEndFullISO} status:any`,
      prevPeriodQuery: `created_at:>=${prevStartISO} created_at:<=${prevEndISO} status:any`
    };

    const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();
    if (result.errors) throw new Error(result.errors[0].message);

    const { todayOrders, currentPeriod, prevMonthFull, prevPeriod, unfulfilledOrders, outOfStock } = result.data;

    const dailySales = todayOrders.edges.reduce((acc: number, edge: any) => acc + parseFloat(edge.node.totalPriceSet.shopMoney.amount), 0);

    let currentRevenue = 0;
    let webOrdersCount = 0;
    const channelSales: Record<string, number> = { pos: 0, web: 0, other: 0 };
    const dailyRevMap: Record<string, number> = {};
    let newCustomerRev = 0;
    let recurringCustomerRev = 0;
    const productMap: Record<string, { qty: number, rev: number, img: string }> = {};

    currentPeriod.edges.forEach(({ node }: any) => {
      const amount = parseFloat(node.totalPriceSet.shopMoney.amount);
      currentRevenue += amount;

      const source = node.sourceName ? node.sourceName.toLowerCase() : 'other';
      const isWeb = source === 'web' || source === 'online_store' || source === 'shopify_draft_order';

      if (source === 'pos' || source === 'retail') {
        channelSales.pos += amount;
      } else if (isWeb) {
        channelSales.web += amount;
        webOrdersCount++;
      } else {
        channelSales.other += amount;
      }

      const dateKey = node.createdAt.split('T')[0];
      dailyRevMap[dateKey] = (dailyRevMap[dateKey] || 0) + amount;

      if (node.customer && node.customer.numberOfOrders > 1) recurringCustomerRev += amount;
      else newCustomerRev += amount;

      node.lineItems.edges.forEach((itemEdge: any) => {
        const item = itemEdge.node;
        const itemRev = parseFloat(item.originalUnitPriceSet.shopMoney.amount) * item.quantity;
        if (!productMap[item.title]) {
          productMap[item.title] = { qty: 0, rev: 0, img: item.image?.url || '' };
        }
        productMap[item.title].qty += item.quantity;
        productMap[item.title].rev += itemRev;
      });
    });

    const topProducts = Object.entries(productMap)
      .map(([title, data]) => ({ title, ...data }))
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 5);

    const currentTicket = currentPeriod.edges.length > 0 ? currentRevenue / currentPeriod.edges.length : 0;
    const prevPeriodRevenue = prevPeriod.edges.reduce((acc: number, edge: any) => acc + parseFloat(edge.node.totalPriceSet.shopMoney.amount), 0);
    const revenueGrowth = prevPeriodRevenue > 0 ? ((currentRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100 : 0;

    const prevMonthTotal = prevMonthFull.edges.reduce((acc: number, edge: any) => acc + parseFloat(edge.node.totalPriceSet.shopMoney.amount), 0);

    // Chart Data (for selected period)
    const chartData = [];
    let chartDays = 0;
    if (period === 'mtd') chartDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    else chartDays = 31; // fallback or just show the active ones

    // If mtd, show the whole month. If week, just the week.
    if (period === 'mtd') {
      for (let i = 1; i <= chartDays; i++) {
        const dateStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        chartData.push({
          name: `${i}`,
          value: dailyRevMap[dateStr] || (new Date(dateStr) <= new Date() ? 0 : null)
        });
      }
    } else {
      // For week or last 7d, show the specific dates
      const daysToScan = period === 'this_week' ? 7 : 7;
      let scanDate = new Date(currentStart);
      for (let i = 0; i < daysToScan; i++) {
        const ds = scanDate.toISOString().split('T')[0];
        chartData.push({
          name: scanDate.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' }),
          value: dailyRevMap[ds] || 0
        });
        scanDate.setDate(scanDate.getDate() + 1);
      }
    }

    const responseData = {
      periodLabel,
      dailySales,
      mtdRevenue: currentRevenue,
      revenueGrowthMtd: revenueGrowth,
      mtdTicket: currentTicket,
      ticketGrowth: 0, // Simplified for now
      channelData: [
        { name: 'Ecommerce', value: Math.round((channelSales.web / (currentRevenue || 1)) * 100) },
        { name: 'Tienda Física', value: Math.round((channelSales.pos / (currentRevenue || 1)) * 100) },
      ].filter(c => c.value > 0),
      chartData,
      topProducts,
      retentionData: [
        { name: 'Nuevos', value: Math.round((newCustomerRev / (currentRevenue || 1)) * 100) },
        { name: 'Recurrentes', value: Math.round((recurringCustomerRev / (currentRevenue || 1)) * 100) },
      ],
      webOrdersCount,
      alerts: {
        unfulfilled: unfulfilledOrders.edges.length,
        stockouts: outOfStock.edges.length
      },
      prevMonthTotal,
      progressToPrevMonth: (currentRevenue / (prevMonthTotal || 1)) * 100
    };

    // Save to Cache (async, doesn't block response) 3600 seconds = 1 hour
    setCache(cacheKey, responseData, 3600);

    return NextResponse.json({
      success: true,
      data: responseData,
      source: 'shopify_graphql'
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
