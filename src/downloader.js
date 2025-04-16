import { spawn } from "node:child_process";
import { v4 as uuidv4 } from "uuid";
import { redis } from "./redisClient.js";

export const downloadWithSocket = (url, socket, options = {}) => {
  const id = uuidv4();
  const filename = `${id}.%(ext)s`;

  const args = [
    "--progress-template",
    "%(progress._percent_str)s|%(progress._speed_str)s|%(progress.eta)s",
    options.audioOnly ? "-x" : "",
    options.format_id ? `-f ${options.format_id}` : "-f best",
    "-o",
    `downloads/${filename}`,
    url,
  ].filter(Boolean);

  const ytdlp = spawn("yt-dlp", args); // ✅ THIS IS THE ACTUAL COMMAND

  // Emit initial status
  socket.emit("status", {
    task_id: id,
    status: "starting",
    progress: 0,
    speed: "0",
    eta: "n/a",
    filename,
  });

  ytdlp.stdout.on("data", (data) => {
    const line = data.toString().trim();
    const match = line.match(/(\d+\.?\d*)%?\|([\d.]+[KMG]?iB\/s)?\|([\d:]+)/);
    if (match) {
      const [, percent, speed = "0", eta = "n/a"] = match;
      socket.emit("status", {
        task_id: id,
        status: "downloading",
        progress: parseFloat(percent),
        speed,
        eta,
        filename,
      });
    }
  });

  ytdlp.stderr.on("data", (data) => {
    console.error(`[yt-dlp error]: ${data}`);
  });

  ytdlp.on("close", async (code) => {
    const finalStatus = code === 0 ? "completed" : "failed";
    const statusObj = {
      task_id: id,
      status: finalStatus,
      progress: 100,
      speed: "0",
      eta: "n/a",
      filename,
    };
    socket.emit("status", statusObj);
    await redis.set(`task:${id}`, JSON.stringify(statusObj), {
      EX: 3600, // 1 hour expiry
    });
  });

  return id;
};

export const downloadVideo = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    const filename = `${id}.%(ext)s`;

    const args = [
      "--progress-template",
      "%(progress._percent_str)s|%(progress._speed_str)s|%(progress.eta)s",
      options.audioOnly ? "-x" : "",
      options.format_id ? `-f ${options.format_id}` : "-f best",
      "-o",
      `downloads/${filename}`,
      url,
    ].filter(Boolean);

    const ytdlp = spawn("yt-dlp", args);

    ytdlp.stderr.on("data", (data) => {
      console.error(`[yt-dlp error]: ${data}`);
    });

    ytdlp.on("close", async (code) => {
      if (code === 0) {
        const statusObj = {
          task_id: id,
          status: "completed",
          progress: 100,
          speed: "0",
          eta: "n/a",
          filename,
        };
        await redis.set(`task:${id}`, JSON.stringify(statusObj), {
          EX: 3600,
        });
        resolve(id);
      } else {
        reject(new Error(`yt-dlp failed with code ${code}`));
      }
    });
  });
};
