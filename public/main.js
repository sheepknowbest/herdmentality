document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/products')
    .then(response => response.json())
    .then(data => {
      // Sort by reviewCount descending to ensure the "Herd Leader" is first
      data.sort((a, b) => b.reviewCount - a.reviewCount);
      
      const gridContainer = document.getElementById('product-grid');
      
      data.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        card.innerHTML = `
          <div class="card-label">${product.category} &gt; ${product.subCategory}</div>
          <a href="${product.affiliateLink}" target="_blank" rel="noopener noreferrer" class="card-image-link">
            <img src="${product.imageURL}" alt="${product.productName}" class="card-image" loading="lazy">
          </a>
          <h3 class="card-title">
            <a href="${product.affiliateLink}" target="_blank" rel="noopener noreferrer">${index === 0 ? '🏆 ' : ''}${product.productName}</a>
          </h3>
          <div class="sheeps-take">
            <div class="sheeps-take-title">The Sheep's Take</div>
            <p>${product.sheepTake}</p>
          </div>
          <a href="${product.affiliateLink}" target="_blank" rel="noopener noreferrer" class="cta-button">View on Amazon</a>
        `;
        
        gridContainer.appendChild(card);
      });
    })
    .catch(err => console.error('Error loading data:', err));
});
