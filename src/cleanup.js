import fs from "fs";
import path from "path";
import cron from "node-cron";

const MAX_AGE_MINUTES = parseInt(process.env.MAX_AGE_MINUTES) || 60;

const cron_schedule = cron.schedule("*/30 * * * *", () => {
  const now = Date.now();
  const dir = path.resolve("downloads");
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);
    const age = (now - stats.mtimeMs) / (1000 * 60); // in minutes

    if (age > MAX_AGE_MINUTES) {
      fs.unlinkSync(fullPath);
      console.log(`Deleted old file: ${file}`);
    }
  }
});
