import { NextResponse } from 'next/server';

export async function GET() {
  const shop = process.env.SHOPIFY_SHOP_NAME;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01';

  if (!accessToken) {
    return NextResponse.json({ success: false, message: "No API token" }, { status: 401 });
  }

  try {
    // 1. Fetch sales for the last 90 days to calculate velocity
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const salesQuery = `
          query GetSalesVelocity($cursor: String) {
            orders(first: 250, after: $cursor, query: "created_at:>=${ninetyDaysAgo} status:any") {
              pageInfo { hasNextPage endCursor }
              edges {
                node {
                  cancelledAt
                  lineItems(first: 50) {
                    edges {
                      node {
                        quantity
                        originalUnitPriceSet { shopMoney { amount } }
                        variant { 
                            id
                            sku
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

    // 2. Fetch ALL inventory levels
    const inventoryQuery = `
          query GetAllInventory($cursor: String) {
            products(first: 50, after: $cursor) {
              pageInfo { hasNextPage endCursor }
              edges {
                node {
                  title
                  variants(first: 20) {
                    edges {
                      node {
                        id
                        title
                        sku
                        inventoryQuantity
                        inventoryItem { unitCost { amount } }
                        price
                      }
                    }
                  }
                }
              }
            }
          }
        `;

    // Fetch Sales
    let allOrders: any[] = [];
    let hasNextPage = true;
    let cursor = null;
    while (hasNextPage) {
      const resp: Response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
        body: JSON.stringify({ query: salesQuery, variables: { cursor } }),
      });
      const json: any = await resp.json();
      allOrders = [...allOrders, ...json.data.orders.edges];
      hasNextPage = json.data.orders.pageInfo.hasNextPage;
      cursor = json.data.orders.pageInfo.endCursor;
    }

    // Fetch Inventory
    let allInventory: any[] = [];
    hasNextPage = true;
    cursor = null;
    while (hasNextPage) {
      const respInv: Response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
        body: JSON.stringify({ query: inventoryQuery, variables: { cursor } }),
      });
      const jsonInv: any = await respInv.json();
      allInventory = [...allInventory, ...jsonInv.data.products.edges];
      hasNextPage = jsonInv.data.products.pageInfo.hasNextPage;
      cursor = jsonInv.data.products.pageInfo.endCursor;
    }

    // Process Data
    const stats: Record<string, any> = {};

    // Aggregate Sales Stats
    allOrders.forEach(({ node }: any) => {
      if (node.cancelledAt) return;
      node.lineItems.edges.forEach(({ node: item }: any) => {
        if (!item.variant) return;
        const vid = item.variant.id;
        if (!stats[vid]) {
          stats[vid] = {
            name: `${item.variant.product.title} (${item.variant.title})`,
            sold90: 0,
            velocity: 0,
            stock: 0,
            cost: parseFloat(item.variant.inventoryItem?.unitCost?.amount || "0"),
            marginTotal: 0
          };
        }
        stats[vid].sold90 += item.quantity;
        const priceNet = parseFloat(item.originalUnitPriceSet.shopMoney.amount) / 1.19;
        const costNet = stats[vid].cost / 1.19;
        stats[vid].marginTotal += (priceNet - costNet) * item.quantity;
      });
    });

    // Mix with Inventory and calculate health
    const result: any[] = [];
    allInventory.forEach(({ node: product }: any) => {
      product.variants.edges.forEach(({ node: variant }: any) => {
        const vid = variant.id;
        const s = stats[vid] || { name: `${product.title} (${variant.title})`, sold90: 0, marginTotal: 0 };

        const stock = variant.inventoryQuantity;
        const sold90 = s.sold90;
        const velocity = sold90 / 90; // Average units per day
        const doc = velocity > 0 ? stock / velocity : (stock > 0 ? 999 : 0); // Days of Cover
        const turnover = stock > 0 ? sold90 / stock : (sold90 > 0 ? 999 : 0);

        // --- Filter (GB) products as requested ---
        if (!s.name.includes("(GB)")) {
          // GMROI calculation: (Total Margin / Inventory Cost Value)
          const invValue = stock * parseFloat(variant.inventoryItem?.unitCost?.amount || "0");
          const gmroi = invValue > 0 ? s.marginTotal / invValue : 0;

          result.push({
            id: vid,
            name: s.name,
            stock,
            sold90,
            velocity: velocity.toFixed(2),
            daysOfCover: Math.round(doc),
            turnover: turnover.toFixed(2),
            gmroi: gmroi.toFixed(2),
            status: doc < 15 && velocity > 0 ? 'CRITICAL' : (doc < 30 && velocity > 0 ? 'LOW' : (sold90 === 0 && stock > 0 ? 'DEAD' : 'OK'))
          });
        }
        // ------------------------------------------
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        health: result.sort((a, b) => b.sold90 - a.sold90),
        summary: {
          criticalStockouts: result.filter(r => r.status === 'CRITICAL').length,
          deadStock: result.filter(r => r.status === 'DEAD').length,
          avgRotation: (result.reduce((acc, r) => acc + parseFloat(r.turnover), 0) / result.length).toFixed(2)
        }
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
