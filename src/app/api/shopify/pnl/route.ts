import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export async function GET() {
  const cacheKey = 'shopify_pnl_data';
  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return NextResponse.json({ success: true, data: cachedData, source: 'cache' });
  }

  const shop = process.env.SHOPIFY_SHOP_NAME;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!accessToken || accessToken === "") {
    return NextResponse.json({
      success: false,
      message: "Credenciales de Shopify no configuradas",
      data: {}
    });
  }

  try {
    const query = `
      query GetOrders($cursor: String) {
        orders(first: 250, after: $cursor, reverse: true, sortKey: CREATED_AT, query: "created_at:>=2024-01-01 status:any") {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              createdAt
              cancelledAt
              totalPriceSet { shopMoney { amount } }
              subtotalPriceSet { shopMoney { amount } }
              totalTaxSet { shopMoney { amount } }
              totalShippingPriceSet { shopMoney { amount } }
              totalRefundedSet { shopMoney { amount } }
              lineItems(first: 50) {
                edges {
                  node {
                    quantity
                    variant { inventoryItem { unitCost { amount } } }
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

    while (hasNextPage && iterations < 20) {
      const resp = await fetch(`https://${shop}/admin/api/${process.env.SHOPIFY_API_VERSION || '2024-01'}/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({ query, variables: { cursor } }),
      });

      const resJson: any = await resp.json();
      if (resJson.errors) throw new Error(resJson.errors[0].message);

      const pageOrders = resJson.data.orders.edges;
      allOrders = [...allOrders, ...pageOrders];

      hasNextPage = resJson.data.orders.pageInfo.hasNextPage;
      cursor = resJson.data.orders.pageInfo.endCursor;
      iterations++;
      if (!hasNextPage) break;
    }

    const dataByPeriod: Record<string, { ventas: number, cost: number, totalBruto: number, taxes: number, shipping: number, refunds: number }> = {};

    allOrders.forEach(({ node }: any) => {
      if (node.cancelledAt) return;

      const date = new Date(node.createdAt);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const periodId = `${year}-${month}`;

      if (!dataByPeriod[periodId]) {
        dataByPeriod[periodId] = { ventas: 0, cost: 0, totalBruto: 0, taxes: 0, shipping: 0, refunds: 0 };
      }

      const total = parseFloat(node.totalPriceSet.shopMoney.amount);
      const subtotal = parseFloat(node.subtotalPriceSet.shopMoney.amount);
      const taxes = parseFloat(node.totalTaxSet.shopMoney.amount);
      const shipping = parseFloat(node.totalShippingPriceSet?.shopMoney?.amount || "0");
      const refunds = parseFloat(node.totalRefundedSet.shopMoney.amount);

      // netSales for P&L: (Subtotal - Refunds_attributed_to_subtotal) / 1.19
      // For simplicity, we use Subtotal / 1.19 and track others for reconciliation
      const netSales = subtotal / 1.19;

      let totalCost = 0;
      node.lineItems.edges.forEach(({ node: item }: any) => {
        const costWithIva = parseFloat(item.variant?.inventoryItem?.unitCost?.amount || "0");
        const netCost = costWithIva / 1.19; // Subtracting VAT from cost
        totalCost += netCost * item.quantity;
      });

      dataByPeriod[periodId].ventas += netSales;
      dataByPeriod[periodId].cost += totalCost;
      dataByPeriod[periodId].totalBruto += total;
      dataByPeriod[periodId].taxes += taxes;
      dataByPeriod[periodId].shipping += shipping;
      dataByPeriod[periodId].refunds += refunds;
    });

    // Cache the processed historical data for 2 hours (7200 seconds)
    setCache(cacheKey, dataByPeriod, 7200);

    return NextResponse.json({
      success: true,
      data: dataByPeriod,
      source: 'shopify_graphql'
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
