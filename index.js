require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    REST, 
    Routes, 
    SlashCommandBuilder,
    ChannelType
} = require('discord.js');

// ENV
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
    console.error("❌ TOKEN / CLIENT_ID belum di set!");
    process.exit(1);
}

// CLIENT
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds] 
});

// COMMAND
const commands = [
    new SlashCommandBuilder()
        .setName('upload')
        .setDescription('Upload script/mod ke channel')
        .addChannelOption(opt =>
            opt.setName('channel')
            .setDescription('Pilih channel tujuan')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption(opt => 
            opt.setName('judul')
            .setDescription('Judul Script')
            .setRequired(true)
        )
        .addStringOption(opt => 
            opt.setName('cmd')
            .setDescription('Command game')
            .setRequired(true)
        )
        .addStringOption(opt => 
            opt.setName('deskripsi')
            .setDescription('Deskripsi script')
            .setRequired(true)
        )
        .addStringOption(opt => 
            opt.setName('credit')
            .setDescription('Credit pembuat')
            .setRequired(true)
        )
        .addStringOption(opt => 
            opt.setName('download')
            .setDescription('Link download')
            .setRequired(true)
        )
        .addAttachmentOption(opt =>
            opt.setName('gambar')
            .setDescription('Upload gambar (optional)')
            .setRequired(false)
        )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

// READY
client.once('ready', async () => {
    console.log(`✅ Bot Aktif: ${client.user.tag}`);
    try {
        console.log('🔄 Register Slash Command...');
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        console.log('✅ Slash Command berhasil!');
    } catch (err) {
        console.error('❌ Gagal register:', err);
    }
});

// INTERACTION
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'upload') {
        try {
            const channel = interaction.options.getChannel('channel');
            const jdl = interaction.options.getString('judul');
            const cmd = interaction.options.getString('cmd');
            const dsk = interaction.options.getString('deskripsi');
            const credit = interaction.options.getString('credit');
            const dwn = interaction.options.getString('download');
            const img = interaction.options.getAttachment('gambar');

            const tgl = new Date().toLocaleDateString('id-ID');

            const embed = new EmbedBuilder()
                .setColor('#ffffff')
                .setTitle(`**${jdl}**`) // BOLD TITLE
                .addFields(
                    { name: 'Command', value: `\`${cmd}\`` },
                    { name: 'Deskripsi', value: dsk },
                    { name: 'Credit', value: credit }, // ganti dari author
                    { name: 'Download', value: `[klik untuk download](${dwn})` }
                )
                .setFooter({ text: `@tatang comunity | ${tgl}` });

            if (img) {
                embed.setImage(img.url);
            }

            // kirim ke channel tujuan
            await channel.send({ embeds: [embed] });

            // notif ke user
            await interaction.reply({
                content: `✅ Berhasil dikirim ke ${channel}`,
                ephemeral: true
            });

        } catch (err) {
            console.error("❌ ERROR:", err);
            await interaction.reply({
                content: "❌ Terjadi error!",
                ephemeral: true
            });
        }
    }
});

// LOGIN
client.login(TOKEN);
