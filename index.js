import { Client, GatewayIntentBits, Partials } from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// =========================
// CHECK ENV
// =========================
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN tidak ditemukan");
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY tidak ditemukan");
  process.exit(1);
}

// =========================
// DISCORD SETUP
// =========================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// =========================
// GEMINI SETUP (AUTO FALLBACK)
// =========================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const modelList = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-1.0-pro"
];

let model;

async function initModel() {
  for (const name of modelList) {
    try {
      model = genAI.getGenerativeModel({ model: name });
      console.log("✅ Model aktif:", name);
      return;
    } catch (err) {
      console.log("❌ Model gagal:", name);
    }
  }
  console.error("❌ Tidak ada model yang bisa dipakai.");
  process.exit(1);
}

// =========================
// MODE SYSTEM
// =========================
let mode = "normal";

function getPrompt(mode) {
  switch (mode) {
    case "toxic":
      return "Kamu adalah bot savage lucu. Roast tanpa SARA dan tanpa hina fisik.";
    case "sadboy":
      return "Kamu adalah bot sadboy dramatis dan puitis.";
    case "warnet":
      return "Kamu adalah bocah warnet 2016. Banyak wkwk, anjir, bang.";
    default:
      return "Kamu adalah bot discord lucu dan santai.";
  }
}

// =========================
// COOLDOWN SYSTEM
// =========================
const cooldown = new Map();

// =========================
// READY EVENT
// =========================
client.once("ready", () => {
  console.log(`🚀 Bot online sebagai ${client.user.tag}`);
});

// =========================
// MESSAGE EVENT
// =========================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Cooldown 5 detik
  if (cooldown.has(message.author.id)) {
    if (Date.now() < cooldown.get(message.author.id)) return;
  }

  // Ganti mode
  if (message.content.startsWith("!mode ")) {
    mode = message.content.split(" ")[1];
    message.reply(`🎭 Mode diganti ke: ${mode}`);
    return;
  }

  // Trigger khusus
  if (message.content.toLowerCase().includes("skill issue")) {
    message.reply("Fix banget sih, tapi kamu permanent issue 😭");
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
    console.error("🔥 AI ERROR:", err);
    message.reply("⚠️ AI error, cek Railway logs.");
  }
});

// =========================
// ERROR HANDLER (ANTI CRASH)
// =========================
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// =========================
// START
// =========================
await initModel();
client.login(process.env.DISCORD_TOKEN);
