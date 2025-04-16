# 🎬 YouTube Downloader & Queue Processor

This project is a full-stack YouTube video downloader built with **Node.js**, **Express**, **Socket.IO**, **BullMQ**, **Redis**, and **yt-dlp**. It supports real-time progress updates, async job queueing, and concurrent video processing. Perfect for downloading and managing multiple videos efficiently.

---

## 🚀 Features

- ✅ Download videos from YouTube using `yt-dlp`
- 📁 Files saved to a `/downloads` folder and exposed via HTTP
- ⚡ Real-time progress updates via Socket.IO
- 📦 Queue system using BullMQ and Redis
- 🧹 Automatic cleanup of old files with a cron job
- 🐳 Docker-ready for deployment

---

## 🧠 How It Works

1. User submits a YouTube URL via frontend (or API).
2. The backend enqueues a job using BullMQ.
3. A background `worker.js` downloads the video using `yt-dlp`.
4. Progress is sent in real time via WebSocket.
5. When complete, the user gets a direct download link.

---

## 🛠 Tech Stack

- Node.js + Express
- BullMQ (Redis-backed job queue)
- Redis
- yt-dlp
- Socket.IO
- Docker / Docker Compose

---

## 📦 Getting Started

### 1. Clone the project

```bash
git clone https://github.com/your-username/yt-downloader.git
cd yt-downloader
```
