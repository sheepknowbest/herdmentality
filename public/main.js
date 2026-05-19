const CATEGORIES = [
  "Video Games", "Electronics", "Computers", "Smart Home",
  "Home", "Garden", "Tools", "Pets", "Food & Grocery", 
  "Beauty", "Health", "Toys", "Handmade", "Sports", 
  "Outdoors", "Automotive", "Industrial and Scientific", "Clothing"
];

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const currentCategory = urlParams.get('category');
  
  const navContainer = document.getElementById('category-nav-container');
  const headerContainer = document.getElementById('page-header-container');
  const gridContainer = document.getElementById('product-grid');
  const mainContainer = gridContainer.parentElement;

  if (!currentCategory) {
    // HOME PAGE
    // 1. Render Category Navigation as a sleek grid
    const navWrapper = document.createElement('div');
    navWrapper.className = 'category-nav-wrapper';
    
    const navTitle = document.createElement('h2');
    navTitle.className = 'category-nav-title';
    navTitle.textContent = 'Browse Categories';
    navWrapper.appendChild(navTitle);

    const navDiv = document.createElement('div');
    navDiv.className = 'category-nav';
    CATEGORIES.forEach(cat => {
      const a = document.createElement('a');
      a.href = `/?category=${encodeURIComponent(cat)}`;
      a.className = 'category-btn';
      a.textContent = cat;
      navDiv.appendChild(a);
    });
    navWrapper.appendChild(navDiv);
    navContainer.appendChild(navWrapper);

    headerContainer.innerHTML = `<h2 class="page-title">✨ Flock Favorites</h2>`;

    // Fetch top 1 from all subcategories
    fetch('/api/products?favoritesOnly=true')
      .then(res => res.json())
      .then(data => {
        gridContainer.innerHTML = '';
        if (data.length === 0) {
           gridContainer.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">No products found. Check back soon!</p>';
           return;
        }

        // Render straight into the single grid
        data.forEach(p => {
          const badgeText = `🏆 #1 Most Reviewed<br><span style="font-size: 0.85em; font-weight: normal; opacity: 0.9;">in ${p.subCategory}</span>`;
          const card = createProductCard(p, badgeText);
          gridContainer.appendChild(card);
        });
      })
      .catch(err => console.error(err));

  } else {
    // CATEGORY PAGE
    headerContainer.innerHTML = `
      <a href="/" class="back-btn">← Back to All Categories</a>
      <h2 class="page-title">${currentCategory}</h2>
    `;

    fetch(`/api/products?category=${encodeURIComponent(currentCategory)}`)
      .then(res => res.json())
      .then(data => {
        gridContainer.style.display = 'none';

        if (data.length === 0) {
          mainContainer.innerHTML += '<p style="text-align:center;">No products found in this category yet. Check back soon!</p>';
          return;
        }

        // Group by Sub-Category
        const grouped = {};
        data.forEach(p => {
          if (!grouped[p.subCategory]) grouped[p.subCategory] = [];
          grouped[p.subCategory].push(p);
        });

        // Render a section for each sub-category
        for (const [subCatName, products] of Object.entries(grouped)) {
          const section = document.createElement('div');
          section.className = 'category-section';
          
          const title = document.createElement('h2');
          title.className = 'category-section-title';
          title.textContent = subCatName;
          section.appendChild(title);

          const grid = document.createElement('div');
          grid.className = 'grid-container';
          
          // Products are already sorted by reviewCount DESC from the API
          products.forEach((p, index) => {
            let badgeText = "Crowd-Approved";
            if (index === 0) badgeText = "🏆 #1 Most Reviewed";
            else if (index === 1) badgeText = "🥈 Highly Reviewed";
            else if (index === 2) badgeText = "🥉 Crowd-Approved";

            const card = createProductCard(p, badgeText);
            grid.appendChild(card);
          });

          section.appendChild(grid);
          mainContainer.appendChild(section);
        }

      })
      .catch(err => console.error(err));
  }

  function createProductCard(product, badgeText) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    card.innerHTML = `
      <div class="review-badge">${badgeText}</div>
      <div class="card-label">${product.category} &gt; ${product.subCategory}</div>
      <a href="${product.affiliateLink}" target="_blank" rel="noopener noreferrer" class="card-image-link">
        <img src="${product.imageURL}" alt="${product.productName}" class="card-image" loading="lazy">
      </a>
      <h3 class="card-title">
        <a href="${product.affiliateLink}" target="_blank" rel="noopener noreferrer">${product.productName}</a>
      </h3>
      <div class="sheeps-take">
        <div class="sheeps-take-title">The Sheep's Take</div>
        <p>${product.sheepTake}</p>
      </div>
      <a href="${product.affiliateLink}" target="_blank" rel="noopener noreferrer" class="primary-button">View on Amazon</a>
    `;
    return card;
  }
});
