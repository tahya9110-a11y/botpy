import { Client, GatewayIntentBits, Partials } from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN tidak ditemukan");
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY tidak ditemukan");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let mode = "normal";

// Anti spam simple cooldown
const cooldown = new Map();

function getPrompt(mode) {
  switch (mode) {
    case "toxic":
      return "Kamu adalah bot savage lucu. Roast tanpa SARA, tanpa hina fisik.";
    case "sadboy":
      return "Kamu adalah bot sadboy dramatis dan puitis.";
    case "warnet":
      return "Kamu adalah bocah warnet 2016. Banyak wkwk, anjir, bang.";
    default:
      return "Kamu adalah bot discord lucu dan santai.";
  }
}

client.once("ready", () => {
  console.log(`✅ Bot online sebagai ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Cooldown 5 detik per user
  if (cooldown.has(message.author.id)) {
    const expire = cooldown.get(message.author.id);
    if (Date.now() < expire) return;
  }

  // Ganti mode
  if (message.content.startsWith("!mode ")) {
    const newMode = message.content.split(" ")[1];
    mode = newMode;
    message.reply(`🎭 Mode diganti ke: ${mode}`);
    return;
  }

  // Auto trigger
  if (message.content.toLowerCase().includes("skill issue")) {
    message.reply("Fix sih, tapi kamu permanent issue 😭");
    return;
  }

  // Harus mention bot
  if (!message.mentions.has(client.user)) return;

  cooldown.set(message.author.id, Date.now() + 5000);

  try {
    await message.channel.sendTyping();

    const result = await model.generateContent([
      getPrompt(mode),
      message.content
    ]);

    const text = result.response.text();

    if (!text) {
      message.reply("AI lagi blank bang 😭");
      return;
    }

    if (text.length > 2000) {
      message.reply(text.substring(0, 1999));
    } else {
      message.reply(text);
    }

  } catch (err) {
    console.error("AI ERROR:", err);
    message.reply("⚠️ AI error, cek log Railway.");
  }
});

// Error handler biar gak crash
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

client.login(process.env.DISCORD_TOKEN);
