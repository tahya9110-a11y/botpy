const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');
const Groq = require('groq-sdk');
require('dotenv').config();

// Inisialisasi Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Inisialisasi Groq AI
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Session storage
const csSessions = new Map();

client.once('ready', () => {
    console.log(`✅ Bot Online: ${client.user.tag}`);
    console.log(`🛠️ Provider: Groq AI | Credit: tatang`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === '!cs') {
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('📝 Panel Pembuatan Character Story')
            .setDescription('Tekan tombol di bawah untuk memulai proses pembuatan **Character Story (CS)** yang lebih detail dan sesuai keinginanmu.\n\n**Alur Baru yang Lebih Detail**\n1. Pilih Server\n2. Pilih Sisi Cerita (Baik/Jahat)\n3. Isi Detail Lengkap Karakter (Nama, Kultur, Bakat, dll.)')
            .setFooter({ text: 'Created By tatang.' });

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('start_cs')
                .setLabel('Buat Character Story')
                .setEmoji('📝')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [button] });
    }
});

client.on('interactionCreate', async (interaction) => {
    // Tombol Start
    if (interaction.isButton() && interaction.customId === 'start_cs') {
        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_server')
                .setPlaceholder('Pilih server tujuan...')
                .addOptions([
                    { label: 'SSRP', description: 'Server State Side RP', value: 'SSRP' },
                    { label: 'Virtual RP', description: 'Server Virtual RP', value: 'Virtual RP' },
                    { label: 'AARP', description: 'Server Arsy Asia RP', value: 'AARP' },
                    { label: 'GCRP', description: 'Server Grand Country RP', value: 'GCRP' },
                    { label: 'JGRP', description: 'Server Jogjagamers RP', value: 'JGRP' }
                ])
        );
        await interaction.reply({ content: 'Pilih server di mana karaktermu akan bermain:', components: [selectMenu], ephemeral: true });
    }

    // Dropdown Server
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_server') {
        csSessions.set(interaction.user.id, { server: interaction.values[0] });
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('side_good').setLabel('Sisi Baik (Goodside)').setEmoji('😇').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('side_bad').setLabel('Sisi Jahat (Badside)').setEmoji('😈').setStyle(ButtonStyle.Danger)
        );
        await interaction.reply({ content: 'Pilih alur cerita untuk karaktermu:', components: [buttons], ephemeral: true });
    }

    // Pilih Side -> Modal 1
    if (interaction.isButton() && (interaction.customId === 'side_good' || interaction.customId === 'side_bad')) {
        const side = interaction.customId === 'side_good' ? 'Good Side' : 'Bad Side';
        const session = csSessions.get(interaction.user.id);
        if(session) session.side = side;

        const modal = new ModalBuilder().setCustomId('modal_step_1').setTitle(`Detail Karakter (${side}) (1/2)`);
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_nama').setLabel('Nama Lengkap Karakter (IC)').setPlaceholder('John Washington').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_level').setLabel('Level Karakter').setPlaceholder('1').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_gender').setLabel('Jenis Kelamin').setPlaceholder('Laki-laki').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_dob').setLabel('Tanggal Lahir').setPlaceholder('17 Agustus 1995').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_city').setLabel('Kota Asal').setPlaceholder('Chicago, Illinois').setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
    }

    // Submit Modal 1 -> Button Modal 2
    if (interaction.isModalSubmit() && interaction.customId === 'modal_step_1') {
        const session = csSessions.get(interaction.user.id);
        session.data = {
            nama: interaction.fields.getTextInputValue('in_nama'),
            level: interaction.fields.getTextInputValue('in_level'),
            gender: interaction.fields.getTextInputValue('in_gender'),
            dob: interaction.fields.getTextInputValue('in_dob'),
            city: interaction.fields.getTextInputValue('in_city')
        };

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('to_step_2').setLabel('Lanjutkan ke Detail Cerita (2/2)').setEmoji('➡️').setStyle(ButtonStyle.Primary)
        );
        await interaction.reply({ content: '✅ Detail dasar berhasil disimpan. Tekan tombol di bawah untuk melanjutkan.', components: [button], ephemeral: true });
    }

    // Button ke Modal 2
    if (interaction.isButton() && interaction.customId === 'to_step_2') {
        const session = csSessions.get(interaction.user.id);
        const modal = new ModalBuilder().setCustomId('modal_step_2').setTitle(`Detail Cerita (${session.side}) (2/2)`);
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_bakat').setLabel('Bakat/Keahlian Dominan Karakter').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_kultur').setLabel('Kultur/Etnis (Opsional)').setStyle(TextInputStyle.Short).setRequired(false)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_ekstra').setLabel('Detail Tambahan (Opsional)').setStyle(TextInputStyle.Paragraph).setRequired(false))
        );
        await interaction.showModal(modal);
    }

    // Final Submit -> Groq AI Generation
    if (interaction.isModalSubmit() && interaction.customId === 'modal_step_2') {
        await interaction.deferReply({ ephemeral: true }); // Beri waktu AI berpikir

        const session = csSessions.get(interaction.user.id);
        const bakat = interaction.fields.getTextInputValue('in_bakat');
        const kultur = interaction.fields.getTextInputValue('in_kultur') || 'Umum';
        const ekstra = interaction.fields.getTextInputValue('in_ekstra') || 'Tidak ada';

        try {
            const prompt = `Buatkan cerita latar belakang karakter (Character Story) untuk roleplay GTA 5. 
            Nama: ${session.data.nama}, Asal: ${session.data.city}, Lahir: ${session.data.dob}, Gender: ${session.data.gender}.
            Sisi Cerita: ${session.side}, Bakat: ${bakat}, Kultur: ${kultur}, Tambahan: ${ekstra}.
            Buat cerita dalam 3 paragraf panjang (minimal 300 kata), gunakan bahasa Indonesia yang formal dan naratif.`;

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
            });

            const story = chatCompletion.choices[0].message.content;

            const finalEmbed = new EmbedBuilder()
                .setColor(session.side === 'Good Side' ? '#2ecc71' : '#e74c3c')
                .setTitle(`📄 Character Story - ${session.data.nama}`)
                .setDescription(story.substring(0, 4000)) // Discord limit
                .addFields(
                    { name: 'Server', value: session.server, inline: true },
                    { name: 'Origin', value: session.data.city, inline: true },
                    { name: 'Side', value: session.side, inline: true }
                )
                .setFooter({ text: 'Created By tatang' });

            await interaction.editReply({ content: '🎉 Cerita berhasil dibuat oleh AI!', embeds: [finalEmbed] });
            csSessions.delete(interaction.user.id);
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Terjadi kesalahan pada layanan AI Groq.' });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
