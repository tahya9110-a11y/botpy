require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, REST, Routes } = require('discord.js');
const express = require('express');
const cors = require('cors');
const { nanoid } = require('nanoid');
const Database = require('better-sqlite3');

// 1. Setup Database SQLite
const db = new Database('database.sqlite');
db.exec(`
  CREATE TABLE IF NOT EXISTS tokens (
    token TEXT PRIMARY KEY,
    user_id TEXT,
    hwid TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
  )
`);

// 2. Setup Express API untuk Script Lua
const app = express();
app.use(cors());
app.use(express.json());

// API Verifikasi Token dari Lua Moonloader
app.get('/api/verify', (req, res) => {
    const { token, hwid } = req.query;
    
    if (!token || !hwid) {
        return res.json({ status: 'error', message: 'Token atau HWID kosong!' });
    }

    const row = db.prepare('SELECT * FROM tokens WHERE token = ?').get(token);

    if (!row) {
        return res.json({ status: 'error', message: 'Token tidak ditemukan atau tidak valid.' });
    }
    
    // Jika belum ada HWID (Claim Pertama Kali)
    if (!row.hwid) {
        db.prepare('UPDATE tokens SET hwid = ? WHERE token = ?').run(hwid, token);
        return res.json({ status: 'success', message: 'Token berhasil diikat dengan PC ini!' });
    } 
    // Jika HWID tidak cocok
    else if (row.hwid !== hwid) {
        return res.json({ status: 'error', message: 'HWID tidak cocok! Hubungi Admin.' });
    }

    res.json({ status: 'success', message: 'Akses Diberikan. Selamat datang!' });
});

// 3. Setup Discord Bot
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const LOG_CHANNEL_ID = '1485999148682448906'; // Sesuai permintaan

client.once('ready', async () => {
    console.log(`[Tatang Community] Bot aktif sebagai ${client.user.tag}`);
    
    const commands = [
        { name: 'token', description: 'Claim token akses script kamu' },
        { name: 'paneltoken', description: 'Buka panel kontrol admin (Admin Only)' }
    ];
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        
        // COMMAND: /token (Untuk User)
        if (interaction.commandName === 'token') {
            const checkUser = db.prepare('SELECT * FROM tokens WHERE user_id = ?').get(interaction.user.id);
            if (checkUser) {
                return interaction.reply({ content: `❌ Kamu sudah memiliki token aktif: \`${checkUser.token}\``, ephemeral: true });
            }

            const newToken = `TATANG-${nanoid(8).toUpperCase()}`;
            // Set expired ke 24 Januari tahun depan (contoh)
            db.prepare('INSERT INTO tokens (token, user_id, expires_at) VALUES (?, ?, ?)')
              .run(newToken, interaction.user.id, '2027-01-24 00:00:00');

            const embedUser = new EmbedBuilder()
                .setTitle('🎟️ Claim Token Berhasil!')
                .setDescription(`Halo <@${interaction.user.id}>, ini token akses script kamu.\n\n\`${newToken}\`\n\n⚠️ *Jangan berikan token ini ke siapapun!*`)
                .setColor(0x00FF00)
                .setFooter({ text: 'Expired: 24 Januari' });

            await interaction.reply({ embeds: [embedUser], ephemeral: true });

            const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const embedLog = new EmbedBuilder()
                    .setTitle('📝 Log Claim Token')
                    .setDescription(`**User:** <@${interaction.user.id}>\n**Token:** ||${newToken}||\n**Waktu Claim:** <t:${Math.floor(Date.now() / 1000)}:F>\n**Expired:** 24 Januari`)
                    .setColor(0x00BFFF);
                logChannel.send({ embeds: [embedLog] });
            }
        }

        // COMMAND: /paneltoken (Untuk Admin)
        if (interaction.commandName === 'paneltoken') {
            if (!interaction.member.permissions.has('Administrator')) {
                return interaction.reply({ content: '❌ Akses ditolak. Hanya Admin.', ephemeral: true });
            }

            const embedPanel = new EmbedBuilder()
                .setTitle('🎛️ Panel Kontrol Token')
                .setDescription('Menu manajemen token untuk user\n(Self-Service):\n\n**♻️ Refund Token**\nGanti token lama dengan baru.\n\n**💻 Reset HWID**\nHapus status HWID.\n\n**🔍 Cek Token**\nLihat semua token aktif.')
                .setColor(0x2B2D31);

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_reset_token').setLabel('Reset Token').setEmoji('♻️').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('btn_reset_hwid').setLabel('Reset HWID').setEmoji('💻').setStyle(ButtonStyle.Primary)
            );
            
            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('btn_cek_token').setLabel('Cek Token').setEmoji('🔍').setStyle(ButtonStyle.Secondary)
            );

            await interaction.reply({ embeds: [embedPanel], components: [row1, row2] });
        }
    }

    // BUTTON HANDLERS (Logika Panel Admin/User)
    if (interaction.isButton()) {
        const userId = interaction.user.id;
        const userToken = db.prepare('SELECT * FROM tokens WHERE user_id = ?').get(userId);

        if (!userToken) {
            return interaction.reply({ content: '❌ Kamu belum melakukan claim token.', ephemeral: true });
        }

        if (interaction.customId === 'btn_cek_token') {
            return interaction.reply({ content: `✅ Token Aktif Kamu: \`${userToken.token}\`\n💻 Status HWID: ${userToken.hwid ? 'Terkunci' : 'Kosong'}`, ephemeral: true });
        }

        if (interaction.customId === 'btn_reset_hwid') {
            db.prepare('UPDATE tokens SET hwid = NULL WHERE user_id = ?').run(userId);
            return interaction.reply({ content: '💻 HWID berhasil di-reset! Silakan login ulang di script.', ephemeral: true });
        }

        if (interaction.customId === 'btn_reset_token') {
            const newToken = `TATANG-${nanoid(8).toUpperCase()}`;
            db.prepare('UPDATE tokens SET token = ?, hwid = NULL WHERE user_id = ?').run(newToken, userId);
            return interaction.reply({ content: `♻️ Token berhasil diganti!\nToken Baru: \`${newToken}\``, ephemeral: true });
        }
    }
});

app.listen(process.env.PORT || 3000, () => console.log('API Server berjalan...'));
client.login(process.env.DISCORD_TOKEN);
