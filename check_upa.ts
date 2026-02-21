import dotenv from 'dotenv';
dotenv.config();

async function check() {
    const shop = process.env.SHOPIFY_SHOP_NAME;
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-01';

    const query = `
      query {
        products(first: 50, query: "title:*Upa Go*") {
          edges {
            node {
              title
              status
              variants(first: 50) {
                edges {
                  node {
                    title
                    inventoryQuantity
                  }
                }
              }
            }
          }
        }
      }
    `;

    const resp = await fetch(\`https://\${shop}/admin/api/\${apiVersion}/graphql.json\`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken!,
        },
        body: JSON.stringify({ query }),
    });

    const result: any = await resp.json();
    console.log(JSON.stringify(result, null, 2));
}

check();
