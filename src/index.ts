export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  ADMIN_SECRET: string;
  GEMINI_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // ==========================================
    // 1. PUBLIC API: Fetch all products from D1
    // ==========================================
    if (request.method === "GET" && url.pathname === "/api/products") {
      const categoryQuery = url.searchParams.get("category");
      const favoritesOnly = url.searchParams.get("favoritesOnly");

      let query = "SELECT * FROM products";
      const params: any[] = [];

      if (categoryQuery) {
        query += " WHERE category = ?";
        params.push(categoryQuery);
      }
      
      query += " ORDER BY reviewCount DESC";

      const { results } = await env.DB.prepare(query).bind(...params).all();
      
      let finalResults = results;
      
      if (favoritesOnly === 'true') {
         // Keep only the #1 product for each subCategory
         const seenSubCategories = new Set();
         finalResults = results.filter((p: any) => {
           const key = `${p.category}-${p.subCategory}`;
           if (!seenSubCategories.has(key)) {
             seenSubCategories.add(key);
             return true;
           }
           return false;
         });
      }

      return new Response(JSON.stringify(finalResults), {
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
    // SECURITY CHECK FOR ADMIN ROUTES
    // ==========================================
    if (url.pathname.startsWith("/api/admin/")) {
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || authHeader !== `Bearer ${env.ADMIN_SECRET}`) {
        return new Response(JSON.stringify({ error: "Unauthorized. Invalid Password." }), { 
          status: 401, 
          headers: { "Content-Type": "application/json" } 
        });
      }
    }

    // ==========================================
    // 3. ADMIN API: Generate AI Prose with Gemini
    // ==========================================
    if (request.method === "POST" && url.pathname === "/api/admin/generate") {
      try {
        const { productName, category, originalText } = await request.json();
        
        let prompt = "";
        if (originalText && originalText.trim().length > 0) {
          prompt = `Rewrite the following text into a fun, punchy, 2-sentence review (under 40 words) explaining why the ${productName} (${category}) is a winner. Make sure the tone is compliant with Amazon's affiliate policies (focus on value, avoid false guarantees). Refer to yourself as 'The Sheep' or use a sheep/herd metaphor.\n\nOriginal text to rewrite:\n"${originalText}"`;
        } else {
          prompt = `Write a fun, punchy, 2-sentence review (under 40 words) about why the ${productName} (${category}) is a winner and the best product in its class. Make sure the tone is compliant with Amazon's affiliate policies. Refer to yourself as 'The Sheep' or use a sheep/herd metaphor.`;
        }

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-goog-api-key': env.GEMINI_API_KEY || ''
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        const data = await geminiResponse.json();
        
        if (!geminiResponse.ok) {
           throw new Error(data.error?.message || "Google API returned an error.");
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Error generating text.";

        return new Response(JSON.stringify({ text }), {
          headers: { "Content-Type": "application/json" }
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    // ==========================================
    // 4. ADMIN API: Create, Update, or Delete Product
    // ==========================================
    if (request.method === "DELETE" && url.pathname.startsWith("/api/admin/products/")) {
      try {
        const id = parseInt(url.pathname.split("/").pop() || "0", 10);
        if (id) {
          await env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(id).run();
        }
        return new Response(JSON.stringify({ success: true, message: "Product deleted." }), { headers: { "Content-Type": "application/json" } });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    if (request.method === "POST" && url.pathname === "/api/admin/products") {
      try {
        const formData = await request.formData();
        
        const idStr = formData.get("id")?.toString();
        const id = idStr ? parseInt(idStr, 10) : null;
        
        const category = formData.get("category")?.toString() || "";
        const subCategory = formData.get("subCategory")?.toString() || "";
        const productName = formData.get("productName")?.toString() || "";
        const reviewCountStr = formData.get("reviewCount")?.toString() || "0";
        const reviewCount = parseInt(reviewCountStr, 10) || 0;
        const affiliateLink = formData.get("affiliateLink")?.toString() || "";
        const sheepTake = formData.get("sheepTake")?.toString() || "";
        const imageFile = formData.get("image") as File | null;
        let imageURL = formData.get("existingImageURL")?.toString() || "";
        const remoteImageURL = formData.get("remoteImageURL")?.toString() || "";

        if (!id && (!imageFile || !imageFile.name) && !remoteImageURL) {
          return new Response(JSON.stringify({ error: "Missing image file or remote image URL for new product" }), { 
            status: 400, headers: { "Content-Type": "application/json" } 
          });
        }

        // If a new image was uploaded, process it
        if (imageFile && imageFile.name && imageFile.size > 0) {
          const uniqueId = crypto.randomUUID();
          const extension = imageFile.name.split('.').pop() || 'png';
          const imageName = `${uniqueId}.${extension}`;
          
          await env.IMAGES.put(imageName, imageFile.stream(), {
            httpMetadata: { contentType: imageFile.type }
          });

          imageURL = `/images/${imageName}`;
        } else if (remoteImageURL) {
          const imgResponse = await fetch(remoteImageURL, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
          });
          if (!imgResponse.ok) {
            throw new Error(`Failed to fetch image from URL (${imgResponse.status}): ${imgResponse.statusText}`);
          }
          const contentType = imgResponse.headers.get("content-type") || "image/jpeg";
          let extension = "jpg";
          if (contentType.includes("png")) {
            extension = "png";
          } else if (contentType.includes("webp")) {
            extension = "webp";
          } else if (contentType.includes("gif")) {
            extension = "gif";
          }
          
          const uniqueId = crypto.randomUUID();
          const imageName = `${uniqueId}.${extension}`;
          
          if (!imgResponse.body) {
            throw new Error("No image body content returned from URL");
          }
          
          await env.IMAGES.put(imageName, imgResponse.body, {
            httpMetadata: { contentType }
          });

          imageURL = `/images/${imageName}`;
        }

        if (id) {
          // Update existing record
          await env.DB.prepare(
            `UPDATE products SET category = ?, subCategory = ?, productName = ?, reviewCount = ?, imageURL = ?, affiliateLink = ?, sheepTake = ? WHERE id = ?`
          ).bind(
            category, subCategory, productName, reviewCount, imageURL, affiliateLink, sheepTake, id
          ).run();
        } else {
          // Insert new record
          await env.DB.prepare(
            `INSERT INTO products (category, subCategory, productName, reviewCount, imageURL, affiliateLink, sheepTake) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            category, subCategory, productName, reviewCount, imageURL, affiliateLink, sheepTake
          ).run();
        }

        return new Response(JSON.stringify({ success: true, message: id ? "Product updated!" : "Product published!" }), {
          headers: { "Content-Type": "application/json" }
        });
        
      } catch (err: any) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500, headers: { "Content-Type": "application/json" }
        });
      }
    }

    return new Response("Endpoint Not Found", { status: 404 });
  }
};
