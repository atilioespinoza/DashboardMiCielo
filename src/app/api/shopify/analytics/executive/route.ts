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
    const getChileDateStr = (date: Date) => {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
    };

    const getShopifyISO = (dateStr: string, timeStr: string) => {
      // Create a date roughly around that day to check Chile's offset (to handle DST changes natively)
      const d = new Date(dateStr + "T12:00:00Z");
      const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Santiago', timeZoneName: 'shortOffset' }).formatToParts(d);
      const tzPart = parts.find(p => p.type === 'timeZoneName')?.value; // e.g. "GMT-3"
      let offset = "-03:00";
      if (tzPart && tzPart !== 'GMT') {
        offset = tzPart.replace('GMT', '');
        if (!offset.includes(':')) offset += ':00';
        if (offset.length === 5) offset = offset[0] + '0' + offset.substring(1); // e.g. "-3:00" -> "-03:00"
      }
      return `${dateStr}T${timeStr}${offset}`;
    };

    // Get the current Date in Chile time (to avoid server UTC giving us "tomorrow" if it's late night)
    const chileNowStr = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false }).format(new Date());
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));

    let currentStart = new Date(now);
    let currentEnd = new Date(now);
    let prevStart = new Date(now);
    let prevEnd = new Date(now);
    let periodLabel = "";

    if (period === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      currentStart = new Date(now.getFullYear(), now.getMonth(), diff);
      currentEnd = new Date(now);

      prevStart = new Date(currentStart);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(currentEnd);
      prevEnd.setDate(prevEnd.getDate() - 7);
      periodLabel = "Esta Semana";
    } else if (period === 'last_7d') {
      currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 7);
      currentEnd = new Date(now);

      prevStart = new Date(currentStart);
      prevStart.setDate(prevStart.getDate() - 7);
      prevEnd = new Date(currentStart);
      periodLabel = "Últimos 7 días";
    } else {
      // mtd
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = new Date(now);

      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      periodLabel = now.toLocaleString('es-CL', { month: 'long' });
    }

    const currentStartISO = getShopifyISO(getChileDateStr(currentStart), "00:00:00");
    const prevStartISO = getShopifyISO(getChileDateStr(prevStart), "00:00:00");
    const prevEndISO = getShopifyISO(getChileDateStr(prevEnd), "23:59:59");

    const prevMonthStartFull = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEndFull = new Date(now.getFullYear(), now.getMonth(), 0);
    const prevMonthStartFullISO = getShopifyISO(getChileDateStr(prevMonthStartFull), "00:00:00");
    const prevMonthEndFullISO = getShopifyISO(getChileDateStr(prevMonthEndFull), "23:59:59");

    const todayStart = getShopifyISO(getChileDateStr(now), "00:00:00");

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
      todayQuery: `created_at:>="${todayStart}" status:any`,
      currentQuery: `created_at:>="${currentStartISO}" status:any`,
      prevMonthQuery: `created_at:>="${prevMonthStartFullISO}" created_at:<="${prevMonthEndFullISO}" status:any`,
      prevPeriodQuery: `created_at:>="${prevStartISO}" created_at:<="${prevEndISO}" status:any`
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

      const createdAtDate = new Date(node.createdAt);
      const chileFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' });
      const dateKey = chileFormatter.format(createdAtDate);
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

    // If mtd, show the whole month.
    if (period === 'mtd') {
      const targetYear = now.getFullYear();
      const targetMonth = now.getMonth() + 1;
      for (let i = 1; i <= chartDays; i++) {
        const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        chartData.push({
          name: `${i}`,
          value: dailyRevMap[dateStr] || (i <= now.getDate() ? 0 : null)
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
