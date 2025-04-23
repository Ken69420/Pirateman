import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Create a new client instance with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Needed to read message content
    GatewayIntentBits.GuildPresences, // Needed for presence-related events (if needed)
  ],
});

// When the bot is ready (logged in and connected)
client.on("ready", () => {
  console.log(`🤖 Bot online as ${client.user.tag}`);
});

// Listen to new messages
client.on("messageCreate", async (message) => {
  // Ignore messages from bots or if message doesn't start with !download
  if (message.author.bot || !message.content.startsWith("!download")) return;

  // Extract URL from the message
  const args = message.content.split(" ");
  const url = args[1];
  if (!url) return message.reply("Please provide a URL to download.");

  // Notify user that the video is being queued
  message.reply("Queueing your video...");

  try {
    // Call download Queue API
    const response = await fetch(
      `http://app:8000/api/download?url=${encodeURIComponent(url)}`
    );
    const { task_id } = await response.json();

    // Poll for the download status
    const interval = setInterval(async () => {
      const statusRes = await fetch(`http://app:8000/api/status/${task_id}`);
      if (!statusRes.ok) return;

      const status = await statusRes.json();
      if (status.status === "done") {
        clearInterval(interval);
        message.reply(
          `Done! Your video is ready for download: [Download Link](http://app:8000/downloads/${status.file_name})`
        );
      }
    }, 5000); // Poll every 5 seconds
  } catch (err) {
    console.error(err);
    message.reply("Failed to process your request.");
  }
});

// Log the bot in with your Discord bot token
client.login(process.env.DISCORD_BOT_TOKEN);
