const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');

// ================= KONFIGURASI =================
const TOKEN_DISCORD = 'MTQ4NDA3NDA5NDc2MzgzNTM5Mg.GMhdXE.scuO9YccbDKidbWWh3OGzlbSv3kHX4siyImkwI'; 
const ADMIN_ROLE_ID = '1466470849266848009'; // Role yang bisa reset token
const PORT = 3000;

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const app = express();
app.use(cors());

let tokenData = {
    key: "TATANG-INITIAL-TOKEN",
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 Jam
};

// Fungsi Generate Token Baru
function generateNewToken() {
    const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
    tokenData.key = `TATANG-${randomStr}`;
    tokenData.expires = Date.now() + (24 * 60 * 60 * 1000); // Set ulang 24 jam
    return tokenData.key;
}

// Cek dan update token otomatis jika sudah expired
function checkExpiration() {
    if (Date.now() > tokenData.expires) {
        generateNewToken();
    }
}

// ================= API UNTUK LUA =================
app.get('/api/verify', (req, res) => {
    checkExpiration();
    const userToken = req.query.token;
    
    if (userToken === tokenData.key) {
        res.json({ valid: true, message: "Akses Diterima" });
    } else {
        res.json({ valid: false, message: "Token Invalid atau Expired" });
    }
});

app.listen(PORT, () => console.log(`API Server berjalan di port ${PORT}`));

// ================= DISCORD BOT =================
client.on('ready', () => console.log(`Bot Discord ${client.user.tag} Online!`));

client.on('messageCreate', async (message) => {
    if (message.content === '!token') {
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Tatang Community - Security System')
            .setDescription('Silakan claim token kamu untuk menggunakan script AutoJob. \n\n⚠️ **Catatan:**\n- Token berganti setiap 24 Jam.\n- Jangan bagikan token ini ke orang lain.')
            .setFooter({ text: 'Tatang AutoJob System' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('claim_token')
                .setLabel('Claim Token')
                .setEmoji('🔑')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cek_token')
                .setLabel('Cek Status Token')
                .setEmoji('🔍')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('reset_token')
                .setLabel('Reset Token (Admin)')
                .setEmoji('🛑')
                .setStyle(ButtonStyle.Danger)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    checkExpiration();

    if (interaction.customId === 'claim_token') {
        await interaction.reply({ 
            content: `🔑 **Token Script Kamu:** \`${tokenData.key}\`\n\n*Copy token di atas dan masukkan ke dalam menu login script di ingame.*`, 
            ephemeral: true 
        });
    }

    if (interaction.customId === 'cek_token') {
        const timeLeft = Math.floor((tokenData.expires - Date.now()) / (1000 * 60 * 60));
        await interaction.reply({ 
            content: `✅ Token saat ini masih valid.\n⏳ **Sisa waktu aktif:** Kurang lebih ${timeLeft} Jam lagi sebelum diganti otomatis.`, 
            ephemeral: true 
        });
    }

    if (interaction.customId === 'reset_token') {
        // Cek Role Admin
        if (!interaction.member.roles.cache.has(ADMIN_ROLE_ID)) {
            return interaction.reply({ content: '❌ Kamu tidak memiliki izin untuk mereset token!', ephemeral: true });
        }

        const newToken = generateNewToken();
        await interaction.reply({ 
            content: `🛑 **Sistem Di-reset!**\nToken lama telah dimatikan. Semua player harus mengambil token baru.\n\n🔑 Token Baru: \`${newToken}\``, 
            ephemeral: false 
        });
    }
});

client.login(TOKEN_DISCORD);
