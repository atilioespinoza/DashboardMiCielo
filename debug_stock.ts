const shop = process.env.SHOPIFY_SHOP_NAME;
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
const query = \`{
  products(first: 50, query: "title:Upa Go") {
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
}\`;

fetch(\`https://\${shop}/admin/api/2024-01/graphql.json\`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
  body: JSON.stringify({ query })
}).then(r => r.json()).then(d => console.log(JSON.stringify(d, null, 2)));
