import { NextResponse } from 'next/server';
import { getCache, setCache } from '@/lib/cache';

export async function GET() {
  const shop = process.env.SHOPIFY_SHOP_NAME;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01';

  if (!accessToken) {
    return NextResponse.json({ success: false, message: "No API token" }, { status: 401 });
  }

  const cacheKey = 'operations_data';
  const cachedData = await getCache(cacheKey);
  if (cachedData) {
    return NextResponse.json({ success: true, data: cachedData, cached: true });
  }

  try {
    const query = `
      query GetOperationalData {
        products(first: 100) {
          edges {
            node {
              id
              title
              variants(first: 50) {
                edges {
                  node {
                    id
                    title
                    inventoryQuantity
                  }
                }
              }
            }
          }
        }
        orders(first: 50, query: "fulfillment_status:unfulfilled OR fulfillment_status:partial") {
          edges {
            node {
              id
              name
              createdAt
              displayFulfillmentStatus
            }
          }
        }
      }
    `;

    const response = await fetch(`https://${shop}/admin/api/${apiVersion}/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error("Shopify GraphQL Errors:", result.errors);
      throw new Error(result.errors[0].message);
    }

    if (!result.data) {
      throw new Error("No data returned from Shopify");
    }

    // Process Inventory Alerts
    const allVariants: any[] = [];
    result.data.products?.edges.forEach(({ node: product }: any) => {
      product.variants.edges.forEach(({ node: variant }: any) => {
        allVariants.push({
          productTitle: product.title,
          variantTitle: variant.title,
          inventory: variant.inventoryQuantity,
          fullName: `${product.title} - ${variant.title}`
        });
      });
    });

    const lowStock = allVariants
      .filter(v => v.inventory > 0 && v.inventory <= 5)
      .sort((a, b) => a.inventory - b.inventory);

    const outOfStock = allVariants.filter(v => v.inventory <= 0);

    const pendingOrders = result.data.orders?.edges || [];
    const pendingFulfillments = pendingOrders.map(({ node }: any) => ({
      id: node.id,
      name: node.name,
      date: node.createdAt,
      status: node.displayFulfillmentStatus
    }));

    const finalData = {
      inventory: {
        totalProducts: result.data.products?.edges.length || 0,
        lowStock,
        outOfStock,
        totalVariants: allVariants.length,
        topInventory: allVariants.sort((a, b) => b.inventory - a.inventory).slice(0, 5)
      },
      fulfillment: {
        pendingCount: pendingOrders.length, // Using the count of local results as an approximation or just the length
        recentPending: pendingFulfillments
      }
    };

    await setCache(cacheKey, finalData, 21600); // 6 hours

    return NextResponse.json({
      success: true,
      data: finalData,
      cached: false
    });

  } catch (error: any) {
    console.error("Operations API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
