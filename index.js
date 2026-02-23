import { Client, GatewayIntentBits } from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let mode = "normal";

function getPersonalityPrompt(mode) {
  if (mode === "toxic")
    return "Kamu adalah bot discord savage. Roast lucu tapi jangan SARA atau hina fisik.";
  if (mode === "sadboy")
    return "Kamu adalah bot sadboy yang dramatis dan puitis.";
  if (mode === "warnet")
    return "Kamu adalah bocah warnet 2016. Banyak wkwk, anjir, bang.";
  return "Kamu adalah bot discord lucu dan santai.";
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Ganti mode
  if (message.content.startsWith("!mode ")) {
    mode = message.content.split(" ")[1];
    message.reply("Mode diganti ke: " + mode);
    return;
  }

  // Auto trigger kata
  if (message.content.toLowerCase().includes("skill issue")) {
    message.reply("Fix banget sih, tapi kamu permanent issue 😭");
    return;
  }

  // Jika mention bot
  if (message.mentions.has(client.user)) {
    try {
      const prompt = getPersonalityPrompt(mode);

      const result = await model.generateContent([
        prompt,
        message.content
      ]);

      const response = result.response.text();

      if (response.length > 2000) {
        message.reply(response.substring(0, 1999));
      } else {
        message.reply(response);
      }

    } catch (err) {
      console.error(err);
      message.reply("AI lagi error bang 😭");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
