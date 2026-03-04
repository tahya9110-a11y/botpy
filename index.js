import 'dotenv/config';
import fetch from 'node-fetch';
import {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder
} from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,    // <- untuk messageCreate
    GatewayIntentBits.MessageContent    // <- pastikan enabled di dev portal
  ],
  partials: [Partials.Channel],
});

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

/** Message-based command handler: !cs hanya di CHANNEL_ID */
client.on(Events.MessageCreate, async (message) => {
  try {
    if (message.author.bot) return;
    const channelId = process.env.CHANNEL_ID || '1478645745069457428';
    if (message.channel.id !== channelId) return; // hanya channel khusus
    const content = message.content.trim();
    if (content.toLowerCase() === '!cs') {
      // opsional: hapus pesan perintah agar channel bersih
      try { await message.delete().catch(()=>{}); } catch(e) {}

      const embed = new EmbedBuilder()
        .setTitle('📝 Panel Pembuatan Character Story')
        .setDescription('Tekan tombol untuk memulai proses pembuatan Character Story (CS).')
        .setColor(0x5865F2);

      const button = new ButtonBuilder()
        .setCustomId('open_server_select')
        .setLabel('Buat Character Story')
        .setStyle(ButtonStyle.Primary);

      await message.channel.send({ embeds: [embed], components: [{ type: 1, components: [button] }] });
    }
  } catch (err) {
    console.error('Message handler error:', err);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // --- sama persis seperti implementasi sebelumnya ---
    // handle chat input command /create-cs (jika masih ada)
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'create-cs') {
        const embed = new EmbedBuilder()
          .setTitle('📝 Panel Pembuatan Character Story')
          .setDescription('Tekan tombol untuk memulai proses pembuatan Character Story (CS).')
          .setColor(0x5865F2);

        const button = new ButtonBuilder()
          .setCustomId('open_server_select')
          .setLabel('Buat Character Story')
          .setStyle(ButtonStyle.Primary);

        await interaction.reply({ embeds: [embed], components: [{ type: 1, components: [button] }], ephemeral: true });
      }
      return;
    }

    // Button: open server select
    if (interaction.isButton()) {
      if (interaction.customId === 'open_server_select') {
        const select = new StringSelectMenuBuilder()
          .setCustomId('select_server')
          .setPlaceholder('Pilih server tujuan...')
          .addOptions([
            { label: 'AARP', value: 'AARP', description: 'Buat CS untuk server Air Asia RP.' },
            { label: 'SSRP', value: 'SSRP', description: 'Buat CS untuk server State Side RP.' },
            { label: 'Virtual RP', value: 'VIRTUAL', description: 'Buat CS untuk server Virtual RP.' },
            // tambahkan semua server yang kamu mau...
          ]);
        // update akan bekerja baik jika interaction awal berasal dari message (component) di channel
        await interaction.update({ content: 'Pilih server di mana karaktermu akan bermain:', components: [{ type: 1, components: [select] }], embeds: [] });
      }
      return;
    }

    // Select menu -> show modal step1 (sama logika)
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'select_server') {
        const server = interaction.values[0];
        const modal = new ModalBuilder()
          .setCustomId(`cs_modal_step1:${server}`)
          .setTitle('Detail Karakter (Good Side) (1/2)');

        const namaInput = new TextInputBuilder()
          .setCustomId('nama_ic')
          .setLabel('Nama Lengkap Karakter (IC)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Contoh: John Washington')
          .setRequired(true);

        const levelInput = new TextInputBuilder()
          .setCustomId('level')
          .setLabel('Level Karakter')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Contoh: 1')
          .setRequired(true);

        const cityInput = new TextInputBuilder()
          .setCustomId('kota_asal')
          .setLabel('Kota Asal')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Contoh: Chicago, Illinois')
          .setRequired(true);

        modal.addComponents(
          { type: 1, components: [namaInput] },
          { type: 1, components: [levelInput] },
          { type: 1, components: [cityInput] }
        );

        await interaction.showModal(modal);
      }
      return;
    }

    // Modal submits and Groq call (sama seperti sebelumnya)
    if (interaction.isModalSubmit()) {
      const customId = interaction.customId;
      if (customId.startsWith('cs_modal_step1:')) {
        const server = customId.split(':')[1];
        const nama = interaction.fields.getTextInputValue('nama_ic');
        const level = interaction.fields.getTextInputValue('level');
        const kota = interaction.fields.getTextInputValue('kota_asal');

        const modal2 = new ModalBuilder()
          .setCustomId(`cs_modal_step2:${server}::${encodeURIComponent(JSON.stringify({ nama, level, kota }))}`)
          .setTitle('Detail Cerita (Good Side) (2/2)');

        const bakat = new TextInputBuilder()
          .setCustomId('bakat')
          .setLabel('Bakat/Keahlian Dominan')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Contoh: Penembak jitu, negosiator ulung')
          .setRequired(true);

        const kultur = new TextInputBuilder()
          .setCustomId('kultur')
          .setLabel('Kultur/Etnis (Opsional)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Contoh: African-American, Hispanic')
          .setRequired(false);

        const tambahan = new TextInputBuilder()
          .setCustomId('tambahan')
          .setLabel('Detail Tambahan (Opsional)')
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder('Contoh: Punya hutang, dikhinati geng lama, dll.')
          .setRequired(false);

        modal2.addComponents(
          { type: 1, components: [bakat] },
          { type: 1, components: [kultur] },
          { type: 1, components: [tambahan] }
        );

        await interaction.showModal(modal2);
        return;
      }

      if (customId.startsWith('cs_modal_step2:')) {
        const parts = customId.split(':');
        const server = parts[1];
        const prevJson = decodeURIComponent(parts[2] || '{}');
        const prev = JSON.parse(prevJson || '{}');

        const bakat = interaction.fields.getTextInputValue('bakat');
        const kultur = interaction.fields.getTextInputValue('kultur') || 'Tidak disebutkan';
        const tambahan = interaction.fields.getTextInputValue('tambahan') || '';

        const systemPrompt = `Kamu adalah pembuat Character Story profesional untuk RP server ${server}. Buat Character Story yang rapi, detail, dan bisa dipakai sebagai profil RP. Gunakan informasi berikut:\n\nNama: ${prev.nama}\nLevel: ${prev.level}\nKota Asal: ${prev.kota}\nBakat: ${bakat}\nKultur: ${kultur}\nDetail Tambahan: ${tambahan}\n\nFormat: Mulai dengan ringkasan 2 kalimat, lalu Detail Latar Belakang, Motivasi, Keahlian, Koneksi penting, dan contoh roleplay short scene.`;

        await interaction.deferReply({ ephemeral: true });

        const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3-8b-8192',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: 'Buatkan Character Story lengkap sesuai instruksi.' }
            ],
            max_tokens: 1000,
            temperature: 0.8
          })
        });

        if (!groqResp.ok) {
          const txt = await groqResp.text();
          await interaction.editReply(`Gagal memanggil Groq API: ${groqResp.status} — ${txt}`);
          return;
        }

        const data = await groqResp.json();
        let content = '';
        if (data.choices && data.choices[0]?.message?.content) {
          content = data.choices[0].message.content;
        } else if (data.text) {
          content = data.text;
        } else if (data.output?.[0]?.content) {
          content = data.output[0].content;
        } else {
          content = JSON.stringify(data).slice(0, 1900);
        }

        await interaction.editReply({ content: null, embeds: [new EmbedBuilder().setTitle(`Character Story — ${prev.nama}`).setDescription(content).setColor(0x2b2d31)] });
      }
      return;
    }
  } catch (err) {
    console.error('Interaction error:', err);
    try {
      if (interaction?.replied || interaction?.deferred) {
        await interaction.editReply({ content: 'Terjadi error. Cek console developer.' }).catch(() => {});
      } else {
        await interaction.reply({ content: 'Terjadi error. Cek console developer.', ephemeral: true }).catch(() => {});
      }
    } catch {}
  }
});

client.login(process.env.DISCORD_TOKEN);
