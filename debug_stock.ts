import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    const shop = process.env.SHOPIFY_SHOP_NAME;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const query = \`
      query GetInventory {
        products(first: 250, query: "status:active") {
          edges {
            node {
              title
              variants(first: 100) {
                edges {
                  node {
                    title
                    inventoryQuantity
                    product { title }
                  }
                }
              }
            }
          }
        }
      }
    \`;

    const resp = await fetch(\`https://\${shop}/admin/api/2024-01/graphql.json\`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken!,
        },
        body: JSON.stringify({ query }),
    });

    const result: any = await resp.json();
    console.log("TOTAL PRODUCTS:", result.data?.products?.edges?.length);
    const stockMap: Record<string, number> = {};
    result.data?.products?.edges?.forEach(({ node: product }: any) => {
      product.variants.edges.forEach(({ node: variant }: any) => {
        const productTitle = variant.product?.title || product.title;
        const variantTitle = variant.title !== 'Default Title' ? \` (\${variant.title})\` : '';
        let fullName = \`\${productTitle}\${variantTitle}\`;

        const upperName = fullName.toUpperCase();
        if (upperName.includes("MOCHILA PRIMERA ETAPA")) fullName = "Mochila Primera Etapa (Total)";
        else if (upperName.includes("UPA GO!")) fullName = "Upa Go! (Total)";
        else if (upperName.includes("TODDLER") && (upperName.includes("MOCHILA") || upperName.includes("MOSHILA"))) fullName = "Mochila Toddler (Total)";

        stockMap[fullName] = (stockMap[fullName] || 0) + (variant.inventoryQuantity || 0);
      });
    });
    console.log("STOCK MAP TOP 10:");
    const top10 = Object.entries(stockMap).sort((a,b) => b[1]-a[1]).slice(0, 10);
    console.log(top10);
    console.log("UPA GO:", stockMap["Upa Go! (Total)"]);
    console.log("MOCHILA:", stockMap["Mochila Primera Etapa (Total)"]);
}
check();
