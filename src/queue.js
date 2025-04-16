import { Queue } from "bullmq";
import { config } from "dotenv";
config();

export const downloadQueue = new Queue("yt-download", {
  connection: {
    host: process.env.REDIS_HOST || "redis",
    port: process.env.REDIS_PORT || 6379,
  },
});
