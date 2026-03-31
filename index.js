require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
    console.error("❌ TOKEN / CLIENT_ID belum di set!");
    process.exit(1);
}

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
});

// COMMAND TANPA LINK GAMBAR
const commands = [
    new SlashCommandBuilder()
        .setName('upload')
        .setDescription('Upload script/mod')
        .addStringOption(opt => opt.setName('judul').setDescription('Judul Script').setRequired(true))
        .addStringOption(opt => opt.setName('cmd').setDescription('Command game').setRequired(true))
        .addStringOption(opt => opt.setName('deskripsi').setDescription('Deskripsi').setRequired(true))
        .addStringOption(opt => opt.setName('author').setDescription('Author').setRequired(true))
        .addStringOption(opt => opt.setName('download').setDescription('Link download').setRequired(true))
        .addAttachmentOption(opt => 
            opt.setName('gambar')
            .setDescription('Upload gambar (optional)')
            .setRequired(false)
        )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

// REGISTER COMMAND
client.once('ready', async () => {
    console.log(`✅ Bot Aktif: ${client.user.tag}`);
    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('✅ Slash Commands OK!');
    } catch (err) {
        console.error(err);
    }
});

// HANDLE COMMAND
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'upload') {
        const jdl = interaction.options.getString('judul');
        const cmd = interaction.options.getString('cmd');
        const dsk = interaction.options.getString('deskripsi');
        const aut = interaction.options.getString('author');
        const dwn = interaction.options.getString('download');
        const img = interaction.options.getAttachment('gambar'); // FIX

        const tgl = new Date().toLocaleDateString('id-ID');

        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(jdl)
            .addFields(
                { name: 'Command', value: `\`${cmd}\`` },
                { name: 'Deskripsi', value: dsk },
                { name: 'Author', value: aut },
                { name: 'Download', value: dwn }
            )
            .setFooter({ text: `@tatang comunity | ${tgl}` });

        // Kalau ada gambar upload → tampilkan
        if (img) {
            embed.setImage(img.url);
        }

        await interaction.reply({ embeds: [embed] });
    }
});

client.login(TOKEN);
