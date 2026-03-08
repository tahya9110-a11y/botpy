const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');
const Groq = require('groq-sdk');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Setup AI
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Sesi penyimpanan data sementara (Aman untuk banyak user)
const csSessions = new Map();

client.once('ready', () => {
    console.log(`🤖 Bot ${client.user.tag} berhasil online!`);
    console.log(`✅ Server siap melayani command !cs (Created by tatang)`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Command !cs
    if (message.content.toLowerCase() === '!cs') {
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('📝 Panel Pembuatan Character Story')
            .setDescription('Tekan tombol di bawah untuk memulai proses pembuatan **Character Story (CS)** yang lebih detail dan sesuai keinginanmu.\n\n**Alur Baru yang Lebih Detail**\n1. Pilih Server\n2. Pilih Sisi Cerita (Baik/Jahat)\n3. Isi Detail Lengkap Karakter (Nama, Kultur, Bakat, dll.)')
            .setFooter({ text: 'Created By Tatang' });

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
    // 1. Klik Tombol "Buat Character Story"
    if (interaction.isButton() && interaction.customId === 'start_cs') {
        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_server')
                .setPlaceholder('Pilih server tujuan...')
                .addOptions([
                    { label: 'SSRP', description: 'Buat CS untuk server State Side RP', value: 'SSRP' },
                    { label: 'Virtual RP', description: 'Buat CS untuk server Virtual RP.', value: 'Virtual RP' },
                    { label: 'AARP', description: 'Buat CS untuk server Arsy Asia RP', value: 'AARP' },
                    { label: 'GCRP', description: 'Buat CS untuk server Grand Country RP.', value: 'GCRP' },
                    { label: 'TEN ROLEPLAY', description: 'Buat CS untuk server 10RP', value: 'TEN ROLEPLAY' },
                    { label: 'CPRP', description: 'Buat CS untuk server Crystal Pride RP', value: 'CPRP' },
                    { label: 'Relative RP', description: 'Buat CS untuk server Relative RP', value: 'Relative RP' },
                    { label: 'JGRP', description: 'Buat CS untuk server Jogja Gamers RP', value: 'JGRP' },
                    { label: 'FMRP', description: 'Buat CS untuk server FAMERLONE RP', value: 'FMRP' }
                ])
        );

        // Pesan publik, bisa dilihat semua orang
        await interaction.reply({ 
            content: 'Pilih server di mana karaktermu akan bermain:', 
            components: [selectMenu] 
        });
    }

    // 2. Klik/Pilih Server dari Dropdown Menu
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_server') {
        csSessions.set(interaction.user.id, { server: interaction.values[0] });

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('side_good')
                .setLabel('Sisi Baik (Goodside)')
                .setEmoji('😇')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('side_bad')
                .setLabel('Sisi Jahat (Badside)')
                .setEmoji('😈')
                .setStyle(ButtonStyle.Danger)
        );

        // Pesan publik
        await interaction.reply({ 
            content: 'Pilih alur cerita untuk karaktermu:', 
            components: [buttons] 
        });
    }

    // 3. Klik Tombol Sisi Cerita -> Tampilkan Modal 1
    if (interaction.isButton() && (interaction.customId === 'side_good' || interaction.customId === 'side_bad')) {
        const side = interaction.customId === 'side_good' ? 'Good Side' : 'Bad Side';
        
        const session = csSessions.get(interaction.user.id) || { server: 'Unknown' };
        session.side = side;
        csSessions.set(interaction.user.id, session);

        const modal = new ModalBuilder()
            .setCustomId('modal_step_1')
            .setTitle(`Detail Karakter (${side}) (1/2)`);

        // Placeholder disesuaikan 100% dengan foto
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_nama').setLabel('Nama Lengkap Karakter (IC)').setPlaceholder('Contoh: John Washington, Kenji Tanaka...').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_level').setLabel('Level Karakter').setPlaceholder('Contoh: 1').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_gender').setLabel('Jenis Kelamin').setPlaceholder('Contoh: Laki-laki / Perempuan').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_dob').setLabel('Tanggal Lahir').setPlaceholder('Contoh: 20 Desember 2006').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_city').setLabel('Kota Asal').setPlaceholder('Contoh: Chicago, Illinois').setStyle(TextInputStyle.Short).setRequired(true))
        );

        await interaction.showModal(modal);
    }

    // 4. Submit Modal 1 -> Kirim Tombol Lanjut
    if (interaction.isModalSubmit() && interaction.customId === 'modal_step_1') {
        const session = csSessions.get(interaction.user.id);
        if (!session) return interaction.reply({ content: 'Sesi pembuatan habis, silakan ketik !cs kembali.' });

        session.data = {
            nama: interaction.fields.getTextInputValue('in_nama'),
            level: interaction.fields.getTextInputValue('in_level'),
            gender: interaction.fields.getTextInputValue('in_gender'),
            dob: interaction.fields.getTextInputValue('in_dob'),
            city: interaction.fields.getTextInputValue('in_city')
        };

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('to_step_2')
                .setLabel('Lanjutkan ke Detail Cerita (2/2)')
                .setEmoji('➡️')
                .setStyle(ButtonStyle.Primary)
        );

        // Sesuai dengan foto 101955
        await interaction.reply({ 
            content: '✅ Detail dasar berhasil disimpan. Tekan tombol di bawah untuk melanjutkan pengisian detail cerita.', 
            components: [button]
        });
    }

    // 5. Klik Tombol Lanjut -> Tampilkan Modal 2
    if (interaction.isButton() && interaction.customId === 'to_step_2') {
        const session = csSessions.get(interaction.user.id);
        if (!session) return interaction.reply({ content: 'Sesi pembuatan habis, silakan ketik !cs kembali.' });

        const modal = new ModalBuilder()
            .setCustomId('modal_step_2')
            .setTitle(`Detail Cerita (${session.side}) (2/2)`);

        // Placeholder disesuaikan 100% dengan foto
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_bakat').setLabel('Bakat/Keahlian Dominan Karakter').setPlaceholder('Contoh: Penembak jitu, negosiator ulung,...').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_kultur').setLabel('Kultur/Etnis (Opsional)').setPlaceholder('Contoh: African-American, Hispanic,...').setStyle(TextInputStyle.Short).setRequired(false)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_ekstra').setLabel('Detail Tambahan (Opsional)').setPlaceholder('Contoh: Punya hutang, dikhianati geng lama...').setStyle(TextInputStyle.Paragraph).setRequired(false))
        );

        await interaction.showModal(modal);
    }

    // 6. Submit Modal 2 -> Proses AI dan Tampilkan Hasil
    if (interaction.isModalSubmit() && interaction.customId === 'modal_step_2') {
        // deferReply wajib ada agar proses generate AI tidak timeout/error
        await interaction.deferReply(); 

        const session = csSessions.get(interaction.user.id);
        if (!session || !session.data) {
            return interaction.editReply({ content: '❌ Terjadi kesalahan sesi. Silakan ulangi !cs' });
        }

        const bakat = interaction.fields.getTextInputValue('in_bakat');
        const kultur = interaction.fields.getTextInputValue('in_kultur') || '-';
        const ekstra = interaction.fields.getTextInputValue('in_ekstra') || '-';

        try {
            const promptContext = `Tuliskan Character Story GTA Roleplay untuk karakter bernama ${session.data.nama} (Gender: ${session.data.gender}). Tanggal Lahir: ${session.data.dob}, Asal Kota: ${session.data.city}. 
            Sisi Cerita: ${session.side}, Bakat Dominan: ${bakat}, Kultur/Etnis: ${kultur}, Detail Tambahan: ${ekstra}.
            Buat cerita masa lalunya dalam 3 paragraf panjang bahasa Indonesia formal bergaya naratif (novel). Langsung berikan ceritanya tanpa kata pengantar apapun.`;

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: 'user', content: promptContext }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7
            });

            const story = chatCompletion.choices[0].message.content;

            const finalEmbed = new EmbedBuilder()
                .setColor(session.side === 'Good Side' ? '#2ecc71' : '#e74c3c')
                .setTitle(`📄 Character Story: ${session.data.nama}`)
                .setDescription(story.substring(0, 4000))
                .addFields(
                    { name: '🌐 Server', value: session.server, inline: true },
                    { name: '🎭 Sisi Cerita', value: session.side, inline: true },
                    { name: '📈 Level', value: session.data.level, inline: true }
                )
                .setFooter({ text: 'Created By Tatang' }); // Teks footer 100% sama dengan gambar

            await interaction.editReply({ embeds: [finalEmbed] });
            
            // Hapus data agar RAM tetap ringan
            csSessions.delete(interaction.user.id);
        } catch (error) {
            console.error('Groq AI Error:', error);
            await interaction.editReply({ content: '❌ Gagal membuat cerita karena server AI sedang sibuk. Coba beberapa saat lagi.' });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
