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

// Setup Groq API
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Session per user
const csSessions = new Map();

client.once('ready', () => {
    console.log(`🤖 Bot ${client.user.tag} berhasil online!`);
    console.log(`Created by tatang - Siap melayani !cs atau !setupcs`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === '!cs' || message.content.toLowerCase() === '!setupcs') {
        const embed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle('📝 Panel Pembuatan Character Story')
            .setDescription('Tekan tombol di bawah untuk memulai proses pembuatan **Character Story (CS)** yang lebih detail dan sesuai keinginanmu.\n\n**Alur Baru yang Lebih Detail**\n\n1. Pilih Server\n2. Pilih Sisi Cerita (Baik/Jahat)\n3. Isi Detail Lengkap Karakter (Nama, Kultur, Bakat, dll.)')
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
    // 1. Tombol Buat Character Story
    if (interaction.isButton() && interaction.customId === 'start_cs') {
        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_server')
                .setPlaceholder('Pilih server tujuan...')
                .addOptions([
                    { label: 'SSRP', description: 'Buat CS untuk server State Side RP.', value: 'SSRP' },
                    { label: 'Virtual RP', description: 'Buat CS untuk server Virtual RP.', value: 'Virtual RP' },
                    { label: 'AARP', description: 'Buat CS untuk server Arsy Asia RP.', value: 'AARP' },
                    { label: 'GCRP', description: 'Buat CS untuk server Grand Country RP.', value: 'GCRP' },
                    { label: 'TEN ROLEPLAY', description: 'Buat CS untuk server 10RP.', value: 'TEN ROLEPLAY' },
                    { label: 'CPRP', description: 'Buat CS untuk server Cyristal Pride RP.', value: 'CPRP' },
                    { label: 'Relative RP', description: 'Buat CS untuk server Relative RP.', value: 'Relative RP' },
                    { label: 'JGRP', description: 'Buat CS untuk server JGRP.', value: 'JGRP' },
                    { label: 'FMRP', description: 'Buat CS untuk server FAMERLONE RP.', value: 'FMRP' }
                ])
        );

        // Pesan publik dengan mention user
        await interaction.reply({ 
            content: `<@${interaction.user.id}> Pilih server di mana karaktermu akan bermain:`, 
            components: [selectMenu]
        });
    }

    // 2. Memilih Server dari Dropdown
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_server') {
        csSessions.set(interaction.user.id, { server: interaction.values[0] });

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('side_good')
                .setLabel('😇 Sisi Baik (Goodside)')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('side_bad')
                .setLabel('😈 Sisi Jahat (Badside)')
                .setStyle(ButtonStyle.Danger)
        );

        // Pesan publik
        await interaction.reply({ 
            content: `<@${interaction.user.id}> Kamu memilih server **${interaction.values[0]}**. Sekarang, pilih alur cerita untuk karaktermu:`, 
            components: [buttons]
        });
    }

    // 3. Memilih Sisi Baik/Jahat -> Membuka Modal 1
    if (interaction.isButton() && (interaction.customId === 'side_good' || interaction.customId === 'side_bad')) {
        const side = interaction.customId === 'side_good' ? 'Good Side' : 'Bad Side';
        
        const session = csSessions.get(interaction.user.id) || {};
        session.side = side;
        csSessions.set(interaction.user.id, session);

        const modal = new ModalBuilder()
            .setCustomId('modal_step_1')
            .setTitle(`Detail Karakter (${side}) (1/2)`);

        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_nama').setLabel('Nama Lengkap Karakter (IC)').setPlaceholder('Contoh: John Washington, Kenji Tanaka').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_level').setLabel('Level Karakter').setPlaceholder('Contoh: 1').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_gender').setLabel('Jenis Kelamin').setPlaceholder('Contoh: Laki-laki / Perempuan').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_dob').setLabel('Tanggal Lahir').setPlaceholder('Contoh: 17 Agustus 1995').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_city').setLabel('Kota Asal').setPlaceholder('Contoh: Chicago, Illinois').setStyle(TextInputStyle.Short).setRequired(true))
        );

        await interaction.showModal(modal);
    }

    // 4. Submit Modal 1 -> Muncul Tombol Lanjut ke Modal 2
    if (interaction.isModalSubmit() && interaction.customId === 'modal_step_1') {
        const session = csSessions.get(interaction.user.id);
        if (!session) return interaction.reply({ content: `<@${interaction.user.id}> Sesi expired, silakan ulangi command dari awal.` });

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

        // Pesan publik
        await interaction.reply({ 
            content: `<@${interaction.user.id}> ✅ Detail dasar berhasil disimpan. Tekan tombol di bawah untuk melanjutkan pengisian detail cerita.`, 
            components: [button]
        });
    }

    // 5. Klik Tombol Lanjut -> Membuka Modal 2
    if (interaction.isButton() && interaction.customId === 'to_step_2') {
        const session = csSessions.get(interaction.user.id);
        if (!session) return interaction.reply({ content: `<@${interaction.user.id}> Sesi expired.` });

        const modal = new ModalBuilder()
            .setCustomId('modal_step_2')
            .setTitle(`Detail Cerita (${session.side}) (2/2)`);

        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_bakat').setLabel('Bakat/Keahlian Dominan Karakter').setPlaceholder('Contoh: Penembak jitu, negosiator ulung,\n. . .').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_kultur').setLabel('Kultur/Etnis (Opsional)').setPlaceholder('Contoh: African-American, Hispanic,\n. . .').setStyle(TextInputStyle.Short).setRequired(false)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('in_ekstra').setLabel('Detail Tambahan (Opsional)').setPlaceholder('Contoh: Punya hutang, dikhianati geng lama, dll.').setStyle(TextInputStyle.Paragraph).setMaxLength(4000).setRequired(false))
        );

        await interaction.showModal(modal);
    }

    // 6. Final Submit Modal 2 -> Proses Groq AI
    if (interaction.isModalSubmit() && interaction.customId === 'modal_step_2') {
        // deferReply() tanpa ephemeral berarti loadingnya "Bot is thinking..." akan terlihat oleh publik
        await interaction.deferReply(); 

        const session = csSessions.get(interaction.user.id);
        const bakat = interaction.fields.getTextInputValue('in_bakat');
        const kultur = interaction.fields.getTextInputValue('in_kultur') || 'Tidak disebutkan secara spesifik';
        const ekstra = interaction.fields.getTextInputValue('in_ekstra') || 'Tidak ada detail tambahan';

        try {
            const promptContext = `Tuliskan Character Story GTA Roleplay untuk karakter berikut:
            Nama: ${session.data.nama} (Gender: ${session.data.gender})
            TTL: ${session.data.dob}, Kota Asal: ${session.data.city}
            Alur: ${session.side}, Bakat: ${bakat}, Kultur: ${kultur}, Tambahan: ${ekstra}.
            Tulis dalam 3-4 paragraf yang sangat rapi dan mendalam menggunakan Bahasa Indonesia yang naratif. JANGAN berikan teks pengantar, langsung berikan ceritanya saja.`;

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
                .setFooter({ text: 'Created By Tatang' })
                .setTimestamp();

            await interaction.editReply({ 
                content: `🎉 Character Story milik <@${interaction.user.id}> berhasil di-generate oleh AI!`, 
                embeds: [finalEmbed] 
            });
            csSessions.delete(interaction.user.id); // Bersihkan sesi
        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: `<@${interaction.user.id}> ❌ Waduh, layanan AI sedang bermasalah atau gagal dihubungi. Coba lagi nanti.` });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
