export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // ==========================================
    // 1. PUBLIC API: Fetch all products from D1
    // ==========================================
    if (request.method === "GET" && url.pathname === "/api/products") {
      const { results } = await env.DB.prepare(
        "SELECT * FROM products ORDER BY reviewCount DESC"
      ).all();

      return new Response(JSON.stringify(results), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ==========================================
    // 2. PUBLIC API: Serve Images from R2
    // ==========================================
    if (request.method === "GET" && url.pathname.startsWith("/images/")) {
      const imageName = url.pathname.replace("/images/", "");
      const object = await env.IMAGES.get(imageName);
      
      if (!object) {
        return new Response("Image not found", { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);

      return new Response(object.body, { headers });
    }

    // ==========================================
    // 3. ADMIN API: Upload Image & Create Product
    // ==========================================
    if (request.method === "POST" && url.pathname === "/api/admin/products") {
      try {
        const formData = await request.formData();
        
        const category = formData.get("category")?.toString() || "";
        const subCategory = formData.get("subCategory")?.toString() || "";
        const productName = formData.get("productName")?.toString() || "";
        const reviewCountStr = formData.get("reviewCount")?.toString() || "0";
        const reviewCount = parseInt(reviewCountStr, 10) || 0;
        const affiliateLink = formData.get("affiliateLink")?.toString() || "";
        const sheepTake = formData.get("sheepTake")?.toString() || "";
        const imageFile = formData.get("image") as File | null;

        if (!imageFile || !imageFile.name) {
          return new Response(JSON.stringify({ error: "Missing image file" }), { 
            status: 400, headers: { "Content-Type": "application/json" } 
          });
        }

        // Generate a safe unique filename to avoid overwrites
        const uniqueId = crypto.randomUUID();
        const extension = imageFile.name.split('.').pop() || 'png';
        const imageName = `${uniqueId}.${extension}`;
        
        // Upload the raw file stream directly into the R2 Bucket
        await env.IMAGES.put(imageName, imageFile.stream(), {
          httpMetadata: { contentType: imageFile.type }
        });

        // Generate the public URL that points to our GET /images/ endpoint
        const imageURL = `/images/${imageName}`;

        // Insert the new product record into the D1 SQL database
        await env.DB.prepare(
          `INSERT INTO products (category, subCategory, productName, reviewCount, imageURL, affiliateLink, sheepTake) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          category, 
          subCategory, 
          productName, 
          reviewCount, 
          imageURL, 
          affiliateLink, 
          sheepTake
        ).run();

        return new Response(JSON.stringify({ success: true, message: "Product successfully published!" }), {
          headers: { "Content-Type": "application/json" }
        });
        
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // Note: Cloudflare's 'assets' binding will serve static files like index.html 
    // before this fetch handler is ever hit. If we arrive here, it's a 404.
    return new Response("Endpoint Not Found", { status: 404 });
  }
};
