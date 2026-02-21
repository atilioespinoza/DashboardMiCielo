const shop = process.env.SHOP;
const token = process.env.TOKEN;

const query = JSON.stringify({
  query: \`query {
    products(first: 5, query: "title:\\"Upa Go! de Mi Cielo\\"") {
      edges {
        node {
          title
          variants(first: 20) {
            edges {
              node {
                title
                inventoryItem {
                  inventoryLevels(first: 5) {
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
  }\`
});

const options = {
  hostname: shop,
  path: '/admin/api/2024-01/graphql.json',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': token,
    'Content-Length': query.length
  }
};

const http = require('https');
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', (e) => console.error(e));
req.write(query);
req.end();
