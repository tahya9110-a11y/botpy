const { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js'); const express = require('express'); require('dotenv').config();

const token = process.env.DISCORD_TOKEN; const port = process.env.PORT || 3000;

if (!token) { console.error('DISCORD_TOKEN belum diisi.'); process.exit(1); }

const app = express(); app.get('/', (_, res) => res.send('Bot is running')); app.listen(port, () => console.log(Web server running on port ${port}));

const client = new Client({ intents: [GatewayIntentBits.Guilds], });

const uploads = new Map(); let nextId = 1;

function makeUploadId() { return String(nextId++).padStart(4, '0'); }

function buildCommands() { return [ new SlashCommandBuilder() .setName('upload') .setDescription('Buat postingan upload media') .addStringOption(opt => opt.setName('judul') .setDescription('Judul postingan') .setRequired(true) ) .addStringOption(opt => opt.setName('cmd') .setDescription('Command, contoh: /fish') .setRequired(true) ) .addStringOption(opt => opt.setName('deskripsi') .setDescription('Deskripsi singkat') .setRequired(true) ) .addStringOption(opt => opt.setName('download') .setDescription('Link download') .setRequired(true) ) .addStringOption(opt => opt.setName('credit') .setDescription('Credit / author') .setRequired(false) ) .addAttachmentOption(opt => opt.setName('media') .setDescription('Foto atau video') .setRequired(false) ) .setDMPermission(false),

new SlashCommandBuilder()
  .setName('listupload')
  .setDescription('Lihat data upload yang tersimpan')
  .setDMPermission(false),

new SlashCommandBuilder()
  .setName('hapusupload')
  .setDescription('Hapus data upload berdasarkan ID')
  .addStringOption(opt =>
    opt.setName('id')
      .setDescription('ID upload')
      .setRequired(true)
  )
  .setDMPermission(false),

].map(cmd => cmd.toJSON()); }

async function registerCommands() { const rest = new REST({ version: '10' }).setToken(token); const commands = buildCommands();

try { if (process.env.GUILD_ID) { await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID), { body: commands }); console.log('Slash commands registered to guild.'); } else { await rest.put(Routes.applicationCommands(client.user.id), { body: commands }); console.log('Slash commands registered globally.'); } } catch (error) { console.error('Failed to register commands:', error); } }

function buildUploadEmbed(data) { const embed = new EmbedBuilder() .setTitle(data.judul) .setColor(0x4f7cff) .addFields( { name: 'Command', value: \${data.cmd}`, inline: false }, { name: 'Deskripsi', value: data.deskripsi || '-', inline: false }, { name: 'Download', value: data.download ? klik untuk download: '-', inline: false }, { name: 'Credit', value: data.credit || '-', inline: false }, { name: 'ID', value:`${data.id}`, inline: true } ) .setFooter({ text: Uploaded by ${data.userTag}` }) .setTimestamp(new Date(data.createdAt));

if (data.mediaUrl) { if (data.mediaType === 'video') { embed.addFields({ name: 'Media', value: [Buka video](${data.mediaUrl}), inline: false }); } else { embed.setImage(data.mediaUrl); } }

return embed; }

client.once(Events.ClientReady, async () => { console.log(Logged in as ${client.user.tag}); await registerCommands(); });

client.on(Events.InteractionCreate, async (interaction) => { try { if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === 'upload') {
  const judul = interaction.options.getString('judul', true);
  const cmd = interaction.options.getString('cmd', true);
  const deskripsi = interaction.options.getString('deskripsi', true);
  const download = interaction.options.getString('download', true);
  const credit = interaction.options.getString('credit') || interaction.user.tag;
  const attachment = interaction.options.getAttachment('media');
  const id = makeUploadId();

  const mediaUrl = attachment?.url || null;
  const mediaType = attachment?.contentType?.startsWith('video/') ? 'video' : attachment ? 'image' : null;

  const data = {
    id,
    judul,
    cmd,
    deskripsi,
    download,
    credit,
    mediaUrl,
    mediaType,
    userTag: interaction.user.tag,
    createdAt: Date.now(),
  };

  uploads.set(id, data);

  const embed = buildUploadEmbed(data);
  const components = [];

  if (download && download !== '-') {
    components.push(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Download')
          .setStyle(ButtonStyle.Link)
          .setURL(download)
      )
    );
  }

  await interaction.reply({
    content: `Upload berhasil. ID: \`${id}\``,
    embeds: [embed],
    components,
  });
  return;
}

if (interaction.commandName === 'listupload') {
  const items = [...uploads.values()].sort((a, b) => Number(b.id) - Number(a.id));
  if (items.length === 0) {
    await interaction.reply({ content: 'Belum ada data upload.', ephemeral: true });
    return;
  }

  const text = items.slice(0, 20).map(item => {
    return `\`${item.id}\` | **${item.judul}** | ${item.cmd} | ${item.credit || '-'} `;
  }).join('\n');

  await interaction.reply({ content: `**Daftar upload**\n${text}`, ephemeral: true });
  return;
}

if (interaction.commandName === 'hapusupload') {
  const id = interaction.options.getString('id', true);
  if (!uploads.has(id)) {
    await interaction.reply({ content: `ID \`${id}\` tidak ditemukan.`, ephemeral: true });
    return;
  }

  uploads.delete(id);
  await interaction.reply({ content: `Data upload \`${id}\` berhasil dihapus.`, ephemeral: true });
  return;
}

} catch (error) { console.error(error);

const payload = { content: 'Terjadi error saat memproses command.', ephemeral: true };
if (interaction.replied || interaction.deferred) {
  await interaction.followUp(payload).catch(() => {});
} else {
  await interaction.reply(payload).catch(() => {});
}

} });

client.login(token);
