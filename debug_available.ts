const shop = process.env.SHOP;
const accessToken = process.env.TOKEN;
async function check() {
    const query = \`
      query {
        products(first: 5, query: "title:\\"Upa Go! de Mi Cielo\\"") {
          edges {
            node {
              title
              variants(first: 50) {
                edges {
                  node {
                    title
                    inventoryItem {
                      inventoryLevels(first: 10) {
                        edges {
                          node {
                            quantities(names: ["available"]) {
                              name
                              quantity
                            }
                          }
                        }
                      }
                    }
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
    console.log(JSON.stringify(result, null, 2));
}
check();
