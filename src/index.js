import express from "express";
import { downloadQueue } from "./queue.js";
import { fetchMetadata } from "./metadata.js";
import { QueueEvents } from "bullmq";
import { Server } from "socket.io";
import { createServer } from "http";
import { redis } from "./redisClient.js";
import { downloadWithSocket } from "./downloader.js";
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import path from "path";
import fs from "fs";
import rateLimit from "express-rate-limit";
import "./cleanup.js";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());
app.use(express.static("downloads"));

//Test page for socket.io
app.get("/", (_, res) => res.sendFile(process.cwd() + "/client.html"));

io.on("connection", (socket) => {
  console.log("Socket Connected:", socket.id);

  socket.on("download", ({ url, format_id, audio_only }) => {
    console.log("New download:", url);
    downloadWithSocket(url, socket, {
      format_id,
      audioOnly: audio_only,
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket Disconnected:", socket.id);
  });
});
const PORT = process.env.PORT || 8000;
server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Max 10 requests
  message: "Chill out! Too many requests.",
});

app.use("/api/", limiter);

const queueEvents = new QueueEvents("yt-download", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
});

app.get("/api/download", async (req, res) => {
  const { url, format_id, audio_only } = req.query;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  const job = await downloadQueue.add("yt-job", {
    url,
    audioOnly: audio_only === "true",
  });
  res.json({ task_id: job.id });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use("/downloads", express.static(path.join(__dirname, "downloads")));

app.get("/api/status/:id", async (req, res) => {
  const redisData = await redis.get(`task:${req.params.id}`);
  if (!redisData) return res.status(404).json({ error: "Task not found" });

  res.json(JSON.parse(redisData));
});

app.get("/api/file/:id", (req, res) => {
  const id = req.params.id;
  const files = fs.readdirSync("downloads");
  const file = files.find((f) => f.startsWith(id));
  if (!file) return res.status(404).json({ error: "File not found" });

  res.download(path.join("downloads", file));
});

app.get("/api/metadata", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    const meta = await fetchMetadata(url);
    res.json(meta);
  } catch (err) {
    res.status(500).json({ error: "failed to fetch metadata" });
  }
});
