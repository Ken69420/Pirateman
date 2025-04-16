import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
export const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  },
});

redis.on("error", (err) => console.error("Redis error:", err));

await redis.connect();
