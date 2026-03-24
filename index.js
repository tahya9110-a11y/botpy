const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// ================= PENGATURAN BOT =================
// Kamu wajib memasukkan variabel ini di tab "Variables" Railway nanti
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || "ISI_TOKEN_BOT_KAMU_DI_SINI_JIKA_TEST_LOKAL";
const OWNER_ID = process.env.OWNER_ID || "ISI_ID_DISCORD_KAMU"; 
const PORT = process.env.PORT || 3000;

// ================= DATABASE LOKAL =================
const dbFile = './database.json';
function loadDB() {
    if (!fs.existsSync(dbFile)) return {};
    return JSON.parse(fs.readFileSync(dbFile, 'utf8'));
}
function saveDB(data) {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 4));
}

// ================= WEB API (EXPRESS) =================
const app = express();
app.get('/api/check', (req, res) => {
    const token = req.query.token;
    if (!token) return res.send("INVALID");

    const db = loadDB();
    const tokenData = db[token];

    if (!tokenData) return res.send("INVALID");
    if (tokenData.status === "KILLED") return res.send("KILLED");

    // Cek Expired (24 Jam = 86400000 ms)
    const now = Date.now();
    if (now - tokenData.createdAt > 86400000) {
        tokenData.status = "EXPIRED";
        saveDB(db);
        return res.send("INVALID"); // Expired dianggap invalid oleh script
    }

    return res.send("VALID");
});

app.listen(PORT, () => console.log(`[WEB API] Menyala di port ${PORT}`));

// ================= DISCORD BOT =================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

client.on('ready', () => {
    console.log(`[BOT] Login sebagai ${client.user.tag}`);
});

// Perintah Text (/setup dan /hapus)
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Command untuk memunculkan Menu Button
    if (message.content === '!setup' && message.author.id === OWNER_ID) {
        const embed = new EmbedBuilder()
            .setTitle('🔐 Autojob Script Authentication')
            .setDescription('Silakan klik tombol di bawah untuk mendapatkan Token Script. Token berlaku selama 24 jam.')
            .setColor('#00bfff');

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('claim_token')
                    .setLabel('Claim Token')
                    .setEmoji('🔑')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('cek_token')
                    .setLabel('Cek Status Token')
                    .setEmoji('ℹ️')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.channel.send({ embeds: [embed], components: [row] });
        return;
    }

    // Command Hapus/Kill Token (Hanya Owner)
    if (message.content.startsWith('/hapus')) {
        if (message.author.id !== OWNER_ID) {
            return message.reply("❌ Kamu bukan Owner!");
        }

        const args = message.content.split(' ');
        const targetToken = args[1];

        if (!targetToken) return message.reply("❌ Format salah! Gunakan: `/hapus <token>`");

        const db = loadDB();
        if (!db[targetToken]) {
            return message.reply("❌ Token tidak ditemukan di database.");
        }

        db[targetToken].status = "KILLED";
        saveDB(db);
        return message.reply(`✅ Token \`${targetToken}\` berhasil dihapus dan script user akan hancur (Self-Destruct) saat mengecek API!`);
    }
});

// Menangani klik tombol
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const db = loadDB();
    const userId = interaction.user.id;

    if (interaction.customId === 'claim_token') {
        // Cek apakah user sudah punya token aktif
        let existingToken = Object.keys(db).find(t => db[t].userId === userId && db[t].status === "VALID");
        
        if (existingToken) {
            const now = Date.now();
            if (now - db[existingToken].createdAt <= 86400000) {
                return interaction.reply({ 
                    content: `❌ Kamu sudah memiliki token yang masih aktif:\n\`${existingToken}\``, 
                    ephemeral: true 
                });
            }
        }

        // Buat token baru
        const rawToken = uuidv4().split('-')[0].toUpperCase(); 
        const newToken = `AARP-${rawToken}`; // Format: AARP-ABCD

        db[newToken] = {
            userId: userId,
            status: "VALID",
            createdAt: Date.now()
        };
        saveDB(db);

        await interaction.reply({
            content: `✅ **Token Berhasil Dibuat!**\nMasukkan token ini ke dalam script:\n\`${newToken}\`\n\n*(Token kedaluwarsa dalam 24 jam)*`,
            ephemeral: true // Hanya user yang klik yang bisa melihat
        });
    }

    if (interaction.customId === 'cek_token') {
        let userTokens = Object.keys(db).filter(t => db[t].userId === userId);
        if (userTokens.length === 0) {
            return interaction.reply({ content: "❌ Kamu belum pernah claim token.", ephemeral: true });
        }

        let latestToken = userTokens[userTokens.length - 1]; // Ambil yang terakhir
        let data = db[latestToken];
        let status = data.status;

        // Cek manual jika valid tapi sudah lewat waktu
        if (status === "VALID" && (Date.now() - data.createdAt > 86400000)) {
            status = "EXPIRED";
        }

        await interaction.reply({
            content: `ℹ️ **Informasi Token Terakhirmu:**\nToken: \`${latestToken}\`\nStatus: **${status}**`,
            ephemeral: true
        });
    }
});

client.login(DISCORD_TOKEN);
