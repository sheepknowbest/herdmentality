export interface Env {
  // Bindings can be declared here
}

interface Mouse {
  name: string;
  price: number;
  rating: number;
  reviewCount: number;
  url: string;
}

const db: Mouse[] = [
  { name: "Logitech G600 MMO Gaming Mouse", price: 39.99, rating: 4.6, reviewCount: 25432, url: "https://amazon.com/g600" },
  { name: "Redragon M908 Impact RGB", price: 32.99, rating: 4.5, reviewCount: 18402, url: "https://amazon.com/redragon-m908" },
  { name: "UtechSmart Venus Pro", price: 49.99, rating: 4.4, reviewCount: 12534, url: "https://amazon.com/utechsmart" },
  { name: "Corsair Scimitar RGB Elite", price: 79.99, rating: 4.4, reviewCount: 8931, url: "https://amazon.com/scimitar" },
  { name: "Razer Naga X Wired", price: 59.99, rating: 4.5, reviewCount: 6521, url: "https://amazon.com/naga-x" },
  { name: "ROCCAT Kone XP", price: 89.99, rating: 4.4, reviewCount: 4321, url: "https://amazon.com/kone-xp" },
  { name: "SteelSeries Aerox 9 Wireless", price: 149.99, rating: 4.1, reviewCount: 3210, url: "https://amazon.com/aerox-9" },
  { name: "EVGA X15 MMO", price: 39.99, rating: 4.2, reviewCount: 2314, url: "https://amazon.com/evga-x15" },
  { name: "ASUS ROG Spatha X", price: 149.99, rating: 4.3, reviewCount: 1543, url: "https://amazon.com/rog-spatha" },
  { name: "Razer Naga V2 Pro", price: 179.99, rating: 4.5, reviewCount: 1452, url: "https://amazon.com/naga-v2-pro" }
];

function getTop5Mice(): Mouse[] {
  return [...db].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const top5 = getTop5Mice();
    const acceptHeader = request.headers.get("Accept") || "";
    const url = new URL(request.url);

    // Return JSON if requested via Accept header or /api path
    if (acceptHeader.includes("application/json") || url.pathname.startsWith('/api')) {
      return new Response(JSON.stringify(top5), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Modern HTML Leaderboard with white/orange theme and 🐑 favicon
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sheep Know Best - MMO Mice Leaderboard</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐑</text></svg>">
  <style>
    :root {
      --primary: #FF7F50; /* Orange */
      --bg: #FAFAFA;
      --card-bg: #FFFFFF;
      --text: #333333;
      --shadow: rgba(0, 0, 0, 0.1);
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    h1 {
      color: var(--primary);
      text-align: center;
      margin-bottom: 0.5rem;
    }
    p.subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 2rem;
    }
    .leaderboard {
      width: 100%;
      max-width: 600px;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .card {
      background-color: var(--card-bg);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px var(--shadow);
      display: flex;
      align-items: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 12px var(--shadow);
    }
    .rank {
      font-size: 2rem;
      font-weight: bold;
      color: var(--primary);
      margin-right: 1.5rem;
      min-width: 40px;
      text-align: center;
    }
    .details {
      flex-grow: 1;
    }
    .name {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
      text-decoration: none;
      color: var(--text);
    }
    .name a {
      color: inherit;
      text-decoration: none;
    }
    .name a:hover {
      color: var(--primary);
    }
    .stats {
      font-size: 0.9rem;
      color: #777;
    }
    .price {
      font-weight: bold;
      color: #27ae60;
    }
  </style>
</head>
<body>
  <h1>🐑 Sheep Know Best</h1>
  <p class="subtitle">Top 5 MMO Gaming Mice by Popularity</p>
  <div class="leaderboard">
    ${top5.map((mouse, index) => `
      <div class="card">
        <div class="rank">#${index + 1}</div>
        <div class="details">
          <h2 class="name"><a href="${mouse.url}" target="_blank">${mouse.name}</a></h2>
          <div class="stats">
            <span class="price">$${mouse.price}</span> &bull; 
            ⭐ ${mouse.rating} &bull; 
            📝 ${mouse.reviewCount.toLocaleString()} reviews
          </div>
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });
  },
};
