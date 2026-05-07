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
        
        // Determine badge text based on rank
        let badgeText = "Crowd-Approved";
        if (index === 0) badgeText = "🏆 The Flock Favorite";
        else if (index === 1) badgeText = "🥈 Most Reviewed Runner-Up";
        else if (index === 2) badgeText = "🥉 Reviewed by the Herd";

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
    })
    .catch(err => console.error('Error loading data:', err));
});
