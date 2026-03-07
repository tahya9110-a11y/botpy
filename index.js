const { 
    Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle 
} = require('discord.js');

// Mengambil token dari environment (Untuk keamanan di Railway)
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Sistem penyimpanan sementara (Session) untuk data CS per user
const csSessions = new Map();

client.once('ready', () => {
    console.log(`🤖 Bot ${client.user.tag} berhasil online!`);
    console.log(`Created by tatang - Siap melayani !cs`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Command !cs
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
    // 1. Jika tombol "Buat Character Story" ditekan
    if (interaction.isButton() && interaction.customId === 'start_cs') {
        const selectMenu = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('select_server')
                .setPlaceholder('Pilih server tujuan...')
                .addOptions([
                    { label: 'SSRP', description: 'Buat CS untuk server State Side RP.', value: 'SSRP' },
                    { label: 'Virtual RP', description: 'Buat CS untuk server Virtual RP.', value: 'Virtual RP' },
                    { label: 'AARP', description: 'Buat CS untuk server Air Asia RP.', value: 'AARP' },
                    { label: 'GCRP', description: 'Buat CS untuk server Grand Country RP.', value: 'GCRP' },
                    { label: 'TEN ROLEPLAY', description: 'Buat CS untuk server 10RP.', value: '10RP' },
                    { label: 'CPRP', description: 'Buat CS untuk server Cyristal Pride RP.', value: 'CPRP' },
                    { label: 'Relative RP', description: 'Buat CS untuk server Relative RP.', value: 'Relative RP' },
                    { label: 'JGRP', description: 'Buat CS untuk server JGRP.', value: 'JGRP' },
                    { label: 'FMRP', description: 'Buat CS untuk server FAMERLONE RP.', value: 'FMRP' }
                ])
        );

        await interaction.reply({ 
            content: 'Pilih server di mana karaktermu akan bermain:', 
            components: [selectMenu], 
            ephemeral: true 
        });
    }

    // 2. Jika Server sudah dipilih dari Dropdown
    if (interaction.isStringSelectMenu() && interaction.customId === 'select_server') {
        const selectedServer = interaction.values[0];
        
        // Simpan sementara sesi server
        csSessions.set(interaction.user.id, { server: selectedServer });

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

        await interaction.reply({ 
            content: 'Pilih alur cerita untuk karaktermu:', 
            components: [buttons], 
            ephemeral: true 
        });
    }

    // 3. Jika tombol Sisi Baik / Sisi Jahat ditekan (Munculkan Modal 1)
    if (interaction.isButton() && (interaction.customId === 'side_good' || interaction.customId === 'side_bad')) {
        const side = interaction.customId === 'side_good' ? 'Good Side' : 'Bad Side';
        
        // Update session dengan side yang dipilih
        const session = csSessions.get(interaction.user.id) || {};
        session.side = side;
        csSessions.set(interaction.user.id, session);

        const modal = new ModalBuilder()
            .setCustomId('modal_step_1')
            .setTitle(`Detail Karakter (${side}) (1/2)`);

        // Input Fields (Max 5 per modal)
        const namaInput = new TextInputBuilder()
            .setCustomId('input_nama')
            .setLabel('Nama Lengkap Karakter (IC)')
            .setPlaceholder('Contoh: John Washington, Kenji Tanaka')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const levelInput = new TextInputBuilder()
            .setCustomId('input_level')
            .setLabel('Level Karakter')
            .setPlaceholder('Contoh: 1')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const genderInput = new TextInputBuilder()
            .setCustomId('input_gender')
            .setLabel('Jenis Kelamin')
            .setPlaceholder('Contoh: Laki-laki / Perempuan')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const dobInput = new TextInputBuilder()
            .setCustomId('input_dob')
            .setLabel('Tanggal Lahir')
            .setPlaceholder('Contoh: 17 Agustus 1995')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const cityInput = new TextInputBuilder()
            .setCustomId('input_city')
            .setLabel('Kota Asal')
            .setPlaceholder('Contoh: Chicago, Illinois')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(namaInput),
            new ActionRowBuilder().addComponents(levelInput),
            new ActionRowBuilder().addComponents(genderInput),
            new ActionRowBuilder().addComponents(dobInput),
            new ActionRowBuilder().addComponents(cityInput)
        );

        await interaction.showModal(modal);
    }

    // 4. Jika Modal Part 1 disubmit
    if (interaction.isModalSubmit() && interaction.customId === 'modal_step_1') {
        const session = csSessions.get(interaction.user.id);
        if (!session) return interaction.reply({ content: 'Sesi expired, silahkan mulai dari awal.', ephemeral: true });

        // Simpan data dari Part 1
        session.step1 = {
            nama: interaction.fields.getTextInputValue('input_nama'),
            level: interaction.fields.getTextInputValue('input_level'),
            gender: interaction.fields.getTextInputValue('input_gender'),
            dob: interaction.fields.getTextInputValue('input_dob'),
            city: interaction.fields.getTextInputValue('input_city')
        };
        csSessions.set(interaction.user.id, session);

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('continue_step_2')
                .setLabel('Lanjutkan ke Detail Cerita (2/2)')
                .setEmoji('➡️')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ 
            content: '✅ Detail dasar berhasil disimpan. Tekan tombol di bawah untuk melanjutkan.', 
            components: [button], 
            ephemeral: true 
        });
    }

    // 5. Tombol Lanjut ke Modal 2
    if (interaction.isButton() && interaction.customId === 'continue_step_2') {
        const session = csSessions.get(interaction.user.id);
        if (!session) return interaction.reply({ content: 'Sesi expired.', ephemeral: true });

        const modal = new ModalBuilder()
            .setCustomId('modal_step_2')
            .setTitle(`Detail Cerita (${session.side}) (2/2)`);

        const bakatInput = new TextInputBuilder()
            .setCustomId('input_bakat')
            .setLabel('Bakat/Keahlian Dominan Karakter')
            .setPlaceholder('Contoh: Penembak jitu, negosiator ulung...')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const kulturInput = new TextInputBuilder()
            .setCustomId('input_kultur')
            .setLabel('Kultur/Etnis (Opsional)')
            .setPlaceholder('Contoh: African-American, Hispanic...')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const ekstraInput = new TextInputBuilder()
            .setCustomId('input_ekstra')
            .setLabel('Detail Tambahan (Opsional)')
            .setPlaceholder('Contoh: Punya hutang, dikhianati geng lama, dll.')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false);

        modal.addComponents(
            new ActionRowBuilder().addComponents(bakatInput),
            new ActionRowBuilder().addComponents(kulturInput),
            new ActionRowBuilder().addComponents(ekstraInput)
        );

        await interaction.showModal(modal);
    }

    // 6. Jika Modal Part 2 disubmit (Selesai)
    if (interaction.isModalSubmit() && interaction.customId === 'modal_step_2') {
        const session = csSessions.get(interaction.user.id);
        if (!session) return interaction.reply({ content: 'Sesi expired.', ephemeral: true });

        // Ambil Data Part 2
        const bakat = interaction.fields.getTextInputValue('input_bakat');
        const kultur = interaction.fields.getTextInputValue('input_kultur') || 'Tidak disebutkan';
        const ekstra = interaction.fields.getTextInputValue('input_ekstra') || 'Tidak ada';

        // Di sini kamu bisa melakukan apapun dengan Datanya.
        // Contoh: Membuat embed final untuk dikirim ke channel.
        const resultEmbed = new EmbedBuilder()
            .setColor('#2b2d31')
            .setTitle(`📄 Character Story: ${session.step1.nama}`)
            .addFields(
                { name: 'Server', value: session.server, inline: true },
                { name: 'Sisi Cerita', value: session.side, inline: true },
                { name: 'Level', value: session.step1.level, inline: true },
                { name: 'Jenis Kelamin', value: session.step1.gender, inline: true },
                { name: 'Tanggal Lahir', value: session.step1.dob, inline: true },
                { name: 'Kota Asal', value: session.step1.city, inline: true },
                { name: 'Kultur/Etnis', value: kultur, inline: true },
                { name: 'Bakat/Keahlian', value: bakat },
                { name: 'Detail Tambahan', value: ekstra }
            )
            .setFooter({ text: 'Created By tatang.' })
            .setTimestamp();

        // Hapus session agar memory tidak penuh
        csSessions.delete(interaction.user.id);

        await interaction.reply({ content: '🎉 Character Story berhasil dibuat!', embeds: [resultEmbed] });
    }
});

// Login Bot
client.login(process.env.DISCORD_TOKEN);
