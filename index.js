import 'dotenv/config'
import fetch from 'node-fetch'
import {
  Client,
  GatewayIntentBits,
  Events,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder
} from 'discord.js'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
})

const CHANNEL_ID = process.env.CHANNEL_ID

client.once(Events.ClientReady, () => {
  console.log(`✅ Bot Online: ${client.user.tag}`)
})

/* ================================
   MESSAGE COMMAND !cs
================================ */
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return
  if (message.channel.id !== CHANNEL_ID) return
  if (message.content.toLowerCase() !== '!cs') return

  await message.delete().catch(() => {})

  const embed = new EmbedBuilder()
    .setTitle('📝 Panel Pembuatan Character Story')
    .setDescription('Tekan tombol di bawah untuk membuat CS.')
    .setColor(0x5865F2)

  const button = new ButtonBuilder()
    .setCustomId('start_cs')
    .setLabel('Buat Character Story')
    .setStyle(ButtonStyle.Primary)

  await message.channel.send({
    embeds: [embed],
    components: [{ type: 1, components: [button] }]
  })
})

/* ================================
   INTERACTIONS
================================ */
client.on(Events.InteractionCreate, async (interaction) => {

  /* BUTTON */
  if (interaction.isButton() && interaction.customId === 'start_cs') {

    const select = new StringSelectMenuBuilder()
      .setCustomId('select_server')
      .setPlaceholder('Pilih Server')
      .addOptions([
        { label: 'AARP', value: 'AARP' },
        { label: 'SSRP', value: 'SSRP' },
        { label: 'Virtual RP', value: 'VIRTUAL' },
        { label: 'GCRP', value: 'GCRP' },
        { label: 'TEN RP', value: 'TENRP' }
      ])

    await interaction.update({
      content: 'Pilih server tujuan:',
      embeds: [],
      components: [{ type: 1, components: [select] }]
    })
  }

  /* SELECT SERVER */
  if (interaction.isStringSelectMenu() && interaction.customId === 'select_server') {

    const server = interaction.values[0]

    const modal = new ModalBuilder()
      .setCustomId(`step1_${server}`)
      .setTitle('Detail Karakter (1/2)')

    const nama = new TextInputBuilder()
      .setCustomId('nama')
      .setLabel('Nama Lengkap (IC)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)

    const level = new TextInputBuilder()
      .setCustomId('level')
      .setLabel('Level Karakter')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)

    const kota = new TextInputBuilder()
      .setCustomId('kota')
      .setLabel('Kota Asal')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)

    modal.addComponents(
      { type: 1, components: [nama] },
      { type: 1, components: [level] },
      { type: 1, components: [kota] }
    )

    await interaction.showModal(modal)
  }

  /* STEP 1 SUBMIT */
  if (interaction.isModalSubmit() && interaction.customId.startsWith('step1_')) {

    const server = interaction.customId.split('_')[1]

    const data = {
      server,
      nama: interaction.fields.getTextInputValue('nama'),
      level: interaction.fields.getTextInputValue('level'),
      kota: interaction.fields.getTextInputValue('kota')
    }

    const modal2 = new ModalBuilder()
      .setCustomId(`step2_${encodeURIComponent(JSON.stringify(data))}`)
      .setTitle('Detail Cerita (2/2)')

    const bakat = new TextInputBuilder()
      .setCustomId('bakat')
      .setLabel('Bakat Dominan')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)

    const tambahan = new TextInputBuilder()
      .setCustomId('tambahan')
      .setLabel('Detail Tambahan')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)

    modal2.addComponents(
      { type: 1, components: [bakat] },
      { type: 1, components: [tambahan] }
    )

    await interaction.showModal(modal2)
  }

  /* FINAL SUBMIT */
  if (interaction.isModalSubmit() && interaction.customId.startsWith('step2_')) {

    await interaction.deferReply({ ephemeral: true })

    const prev = JSON.parse(decodeURIComponent(interaction.customId.replace('step2_', '')))

    const bakat = interaction.fields.getTextInputValue('bakat')
    const tambahan = interaction.fields.getTextInputValue('tambahan') || '-'

    const prompt = `
Buat Character Story RP server ${prev.server}

Nama: ${prev.nama}
Level: ${prev.level}
Kota Asal: ${prev.kota}
Bakat: ${bakat}
Detail Tambahan: ${tambahan}

Format:
- Ringkasan
- Latar Belakang
- Motivasi
- Keahlian
- Scene Roleplay
`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3-70b-8192',
        messages: [
          { role: 'system', content: 'Kamu adalah pembuat Character Story profesional.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 1200
      })
    })

    const result = await response.json()
    const text = result.choices[0].message.content

    const embed = new EmbedBuilder()
      .setTitle(`Character Story - ${prev.nama}`)
      .setDescription(text.substring(0, 4000))
      .setColor(0x2b2d31)

    await interaction.editReply({ embeds: [embed] })
  }

})

client.login(process.env.DISCORD_TOKEN)
