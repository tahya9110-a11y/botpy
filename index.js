require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');

// Ambil Token & ID dari Environment Variables Railway
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
    console.error("❌ ERROR: TOKEN atau CLIENT_ID belum diatur di Variables Railway!");
    process.exit(1);
}

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
});

// --- DEFINISI COMMAND ---
const commands = [
    new SlashCommandBuilder()
        .setName('upload')
        .setDescription('Upload script atau mod ke server')
        .addStringOption(opt => opt.setName('judul').setDescription('Judul Script').setRequired(true))
        .addStringOption(opt => opt.setName('cmd').setDescription('Command game').setRequired(true))
        .addStringOption(opt => opt.setName('deskripsi').setDescription('Deskripsi mod').setRequired(true))
        .addStringOption(opt => opt.setName('author').setDescription('Nama pembuat').setRequired(true))
        .addStringOption(opt => opt.setName('download').setDescription('Link download').setRequired(true))
        .addStringOption(opt => opt.setName('gambar').setDescription('Link gambar/screenshot').setRequired(true))
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

// --- REGISTER COMMANDS & READY ---
client.once('ready', async () => {
    console.log(`✅ Bot Aktif: ${client.user.tag}`);
    try {
        console.log('🔄 Memperbarui Slash Commands...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ Slash Commands Berhasil Terpasang!');
    } catch (err) {
        console.error('❌ Gagal pasang Command:', err);
    }
});

// --- INTERACTION HANDLER ---
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'upload') {
        const jdl = interaction.options.getString('judul');
        const cmd = interaction.options.getString('cmd');
        const dsk = interaction.options.getString('deskripsi');
        const aut = interaction.options.getString('author');
        const dwn = interaction.options.getString('download');
        const img = interaction.options.getString('gambar');

        const tgl = new Date().toLocaleDateString('en-GB'); // Format DD/MM/YYYY

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(jdl)
            .addFields(
                { name: 'Command', value: `\`${cmd}\`` },
                { name: 'Deskripsi', value: dsk },
                { name: 'Author', value: aut },
                { name: 'Download', value: `[klik untuk download](${dwn})` }
            )
            .setImage(img)
            .setFooter({ text: `@tatang comunity | Today ${tgl}` });

        await interaction.reply({ embeds: [embed] }).catch(err => console.error("Gagal kirim embed:", err));
    }
});

// Login bot
client.login(TOKEN).catch(err => {
    console.error("❌ Gagal Login: Token salah atau masalah koneksi.");
});
