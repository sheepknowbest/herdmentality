DROP TABLE IF EXISTS products;

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    subCategory TEXT NOT NULL,
    productName TEXT NOT NULL,
    reviewCount INTEGER NOT NULL,
    imageURL TEXT NOT NULL,
    affiliateLink TEXT NOT NULL,
    sheepTake TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
