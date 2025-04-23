import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on("ready", () => {
  console.log(`🤖 Bot online as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith("!download")) return;

  const args = message.content.split(" ");
  const url = args[1];
  if (!url) return message.reply("Please provide a URL to download.");

  message.reply("Queueing your video...");

  try {
    //Call download Queue API
    const response = await fetch(
      `http://localhost:8000/api/download?url=${encodeURIComponent(url)}`
    );
    const { task_id } = await response.json();

    //Poll for the status
    const interval = setInterval(async () => {
      const statusRes = await fetch(
        `http://localhost:8000/api/status/${task_id}`
      );
      if (!statusRes.ok) return;

      const status = await statusRes.json();
      if (status.status === "done") {
        clearInterval(interval);
        message.reply(
          `Done! Your video is ready for download: [Download Link](http://localhost:8000/downloads/${status.file_name})`
        );
      }
    }, 5000);
  } catch (err) {
    console.error(err);
    message.reply("Failed to process your request.");
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
