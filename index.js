require('dotenv').config(); // Load environment variables untuk testing lokal (opsional di Railway)
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');

// Mengambil Token dan Client ID dari Environment Variables
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
    console.error("❌ ERROR: TOKEN atau CLIENT_ID belum diatur di Environment Variables!");
    process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// --- SETUP SLASH COMMANDS ---
const commands = [
    new SlashCommandBuilder()
        .setName('upload')
        .setDescription('Upload script atau mod ke server menggunakan embed')
        .addStringOption(option => 
            option.setName('judul')
            .setDescription('Judul Mod / Script (Contoh: AutoFishingNexotis)')
            .setRequired(true))
        .addStringOption(option => 
            option.setName('cmd')
            .setDescription('Command di dalam game (Contoh: /fish)')
            .setRequired(true))
        .addStringOption(option => 
            option.setName('deskripsi')
            .setDescription('Deskripsi singkat mod')
            .setRequired(true))
        .addStringOption(option => 
            option.setName('author')
            .setDescription('Credit / Nama pembuat')
            .setRequired(true))
        .addStringOption(option => 
            option.setName('download')
            .setDescription('Link download (Harus berupa link https://...)')
            .setRequired(true))
        .addStringOption(option => 
            option.setName('gambar')
            .setDescription('Link gambar/screenshot (Harus berakhiran .png/.jpg)')
            .setRequired(true))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once('ready', async () => {
    console.log(`✅ Bot TATANG COMUNITY sudah online sebagai ${client.user.tag}!`);
    try {
        console.log('🔄 Mulai meregistrasi (/) commands...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ Berhasil memuat (/) commands!');
    } catch (error) {
        console.error('❌ Gagal memuat slash commands:', error);
    }
});

// --- LOGIKA SAAT COMMAND DIJALANKAN ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'upload') {
        const judul = interaction.options.getString('judul');
        const cmd = interaction.options.getString('cmd');
        const deskripsi = interaction.options.getString('deskripsi');
        const author = interaction.options.getString('author');
        const downloadLink = interaction.options.getString('download');
        const gambar = interaction.options.getString('gambar');

        // Format tanggal otomatis
        const date = new Date();
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;

        // Buat Discord Embed
        const uploadEmbed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(judul)
            .addFields(
                { name: 'Command', value: `\`${cmd}\`` },
                { name: 'Deskripsi', value: deskripsi },
                { name: 'Author', value: author },
                { name: 'Download', value: `[klik untuk download](${downloadLink})` }
            )
            .setImage(gambar)
            .setFooter({ text: `@tatang comunity | Today ${formattedDate}` });

        await interaction.reply({ embeds: [uploadEmbed] });
    }
});

client.login(TOKEN);
