import { sql } from './db';

// Get cached data if it exists and is not expired
export async function getCache(key: string) {
    try {
        const result = await sql`
            SELECT data FROM shopify_cache 
            WHERE key = ${key} AND expires_at > NOW()
        `;
        if (result.length > 0) {
            return result[0].data;
        }
        return null;
    } catch (e) {
        console.error("Cache GET Error:", e);
        return null; // Return null so the app continues by fetching from source
    }
}

// Set cache data with expiration time (in seconds)
export async function setCache(key: string, data: any, ttlSeconds: number = 3600) {
    try {
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
        const jsonData = JSON.stringify(data);
        await sql`
            INSERT INTO shopify_cache (key, data, expires_at)
            VALUES (${key}, ${jsonData}::jsonb, ${expiresAt})
            ON CONFLICT (key) DO UPDATE SET 
                data = EXCLUDED.data, 
                expires_at = EXCLUDED.expires_at,
                updated_at = NOW()
        `;
    } catch (e) {
        console.error("Cache SET Error:", e);
    }
}
