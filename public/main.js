const CATEGORIES = [
  "Movies, Music & Games", "Electronics", "Computers", "Smart Home",
  "Home, Garden & Tools", "Pets", "Food & Grocery", "Beauty & Health",
  "Toys, Kids & Baby", "Handmade", "Sports & Outdoors", "Automotive",
  "Industrial and Scientific"
];

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const currentCategory = urlParams.get('category');
  
  const navContainer = document.getElementById('category-nav-container');
  const headerContainer = document.getElementById('page-header-container');
  const gridContainer = document.getElementById('product-grid');

  if (!currentCategory) {
    // HOME PAGE
    // 1. Render Category Navigation
    const navDiv = document.createElement('div');
    navDiv.className = 'category-nav';
    CATEGORIES.forEach(cat => {
      const a = document.createElement('a');
      a.href = `/?category=${encodeURIComponent(cat)}`;
      a.className = 'category-btn';
      a.textContent = cat;
      navDiv.appendChild(a);
    });
    navContainer.appendChild(navDiv);

    headerContainer.innerHTML = `<h2 class="page-title">✨ Cross-Category Flock Favorites</h2>`;

    // Fetch top 1 from all categories
    fetch('/api/products?favoritesOnly=true')
      .then(res => res.json())
      .then(data => renderGrid(data, true))
      .catch(err => console.error(err));

  } else {
    // CATEGORY PAGE
    headerContainer.innerHTML = `
      <a href="/" class="back-btn">← Back to All Categories</a>
      <h2 class="page-title">${currentCategory}</h2>
    `;

    fetch(`/api/products?category=${encodeURIComponent(currentCategory)}`)
      .then(res => res.json())
      .then(data => renderGrid(data, false))
      .catch(err => console.error(err));
  }

  function renderGrid(data, isCrossCategory) {
    gridContainer.innerHTML = ''; // Clear existing
    if (data.length === 0) {
      gridContainer.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">No products found in this category yet. Check back soon!</p>';
      return;
    }

    data.forEach((product, index) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      
      let badgeText = "Crowd-Approved";
      if (isCrossCategory) {
        badgeText = "🏆 Category Leader";
      } else {
        if (index === 0) badgeText = "🏆 The Flock Favorite";
        else if (index === 1) badgeText = "🥈 Most Reviewed Runner-Up";
        else if (index === 2) badgeText = "🥉 Reviewed by the Herd";
      }

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
      gridContainer.appendChild(card);
    });
  }
});
