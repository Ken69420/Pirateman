import { Worker } from "bullmq";
import { downloadVideo } from "./downloader.js";
import { config } from "dotenv";
config();

const worker = new Worker(
  "yt-download",
  async (job) => {
    const { url, format_id, audioOnly } = job.data;
    const id = await downloadVideo(url, { format_id, audioOnly });
    return { id };
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: 6379,
    },
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} done!`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});
