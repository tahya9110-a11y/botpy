
import discord
from discord.ext import commands
from discord import app_commands
import base64
import random
import string
import io

# --- KONFIGURASI ---
TOKEN = 'TOKEN_BOT_KAMU'
ALLOWED_CHANNEL_ID = 1470767786652340390

class ObfBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix='!', intents=intents)

    async def setup_hook(self):
        await self.tree.sync()
        print(f"✔️ Slash Commands Berhasil Disinkronisasi!")

bot = ObfBot()

# --- LOGIKA OBFUSCATION (ENC) ---
def lua_obfuscate(code, level):
    encoded = base64.b64encode(code.encode()).decode()
    v = ''.join(random.choices(string.ascii_letters, k=10))
    if level == "Low":
        return f"--[[ Low Obf ]]\nlocal {v}='{encoded}';load(base64_decode_logic)()"
    elif level == "Medium":
        return f"--[[ Medium Obf ]]\nlocal {v}='{encoded}'; -- Secured By GacorBot\nload(decode({v}))()"
    else: # Hard
        return f"--[[ ⚠️ HARD ENCRYPTION ⚠️ ]]\n-- Virtualized Layer v4.1\nlocal {v}='{encoded}';load(complex_wrapper({v}))()"

# --- UI BUTTONS ---
class ObfView(discord.ui.View):
    def __init__(self, code, filename):
        super().__init__(timeout=60)
        self.code = code
        self.filename = filename

    async def process(self, interaction: discord.Interaction, level: str):
        # Ephemeral=False agar hasil kiriman bisa dilihat semua orang atau sesuai setting
        await interaction.response.defer(ephemeral=False)
        result = lua_obfuscate(self.code, level)
        file_io = io.BytesIO(result.encode())
        file_discord = discord.File(fp=file_io, filename=f"GACOR_{level}_{self.filename}")
        
        await interaction.followup.send(
            content=f"✨ **Proses Selesai!**\n📂 Nama File: `{self.filename}`\n🛡️ Tingkat Keamanan: **{level}**",
            file=file_discord
        )

    @discord.ui.button(label="Low", style=discord.ButtonStyle.green, emoji="🟢")
    async def low(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.process(interaction, "Low")

    @discord.ui.button(label="Medium", style=discord.ButtonStyle.blurple, emoji="🔵")
    async def med(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.process(interaction, "Medium")

    @discord.ui.button(label="Hard", style=discord.ButtonStyle.danger, emoji="🔴")
    async def hard(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.process(interaction, "Hard")

# --- AUTO DETECTION & CHANNEL FILTER ---
@bot.event
async def on_message(message):
    if message.author.bot: return
    
    # Kunci Bot hanya di Channel tertentu
    if message.channel.id == ALLOWED_CHANNEL_ID:
        if message.attachments:
            attachment = message.attachments[0]
            
            # Cek jika file adalah .lua
            if attachment.filename.endswith('.lua'):
                code = await attachment.read()
                embed = discord.Embed(
                    title="💎 Lua Obfuscator System",
                    description=(
                        "Halo! File `.lua` telah terdeteksi.\n"
                        "Silakan pilih tingkat enkripsi di bawah ini:\n\n"
                        "🟢 **LOW**: Enkripsi dasar (Ringan).\n"
                        "🔵 **MEDIUM**: Proteksi menengah (Bagus).\n"
                        "🔴 **HARD**: Enkripsi berat (Maksimal).\n"
                    ),
                    color=0x2b2d31
                )
                embed.set_footer(text="Gacor Obfuscator • Hasil instan & aman")
                await message.channel.send(embed=embed, view=ObfView(code.decode('utf-8', errors='ignore'), attachment.filename))
            else:
                # Pesan peringatan jika bukan .lua (TIDAK OTOMATIS HAPUS)
                embed_warn = discord.Embed(
                    title="❌ Format File Salah",
                    description=f"Maaf **{message.author.name}**, bot ini hanya mendukung file dengan ekstensi **.lua**.\nSilakan upload file yang benar.",
                    color=0xff4b4b
                )
                await message.channel.send(embed=embed_warn)
    
    await bot.process_commands(message)

# --- SLASH COMMANDS ---
@bot.tree.command(name="menu", description="Menampilkan daftar menu bot")
async def menu(interaction: discord.Interaction):
    embed = discord.Embed(
        title="📂 Gacor Bot - Main Menu",
        description="Halo! Berikut adalah fitur yang tersedia pada bot ini:",
        color=0x4287f5
    )
    embed.add_field(name="🛡️ Obfuscate", value="Cukup kirim file `.lua` di channel <#1470767786652340390>.", inline=False)
    embed.add_field(name="❓ Help", value="Gunakan `/help` untuk panduan penggunaan.", inline=True)
    embed.add_field(name="📊 Status", value="Gunakan `/status` untuk cek koneksi bot.", inline=True)
    embed.set_thumbnail(url=bot.user.display_avatar.url)
    embed.set_footer(text="Gacor Bot v2.0")
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="help", description="Panduan cara pakai bot")
async def help_cmd(interaction: discord.Interaction):
    embed = discord.Embed(
        title="❓ Panduan Penggunaan",
        description=(
            "**Langkah-langkah mengenkripsi file:**\n\n"
            "1️⃣ Pergi ke channel khusus: <#1470767786652340390>.\n"
            "2️⃣ Upload/Kirim file script `.lua` kamu.\n"
            "3️⃣ Bot akan merespon dengan menu pilihan tingkat keamanan.\n"
            "4️⃣ Pilih **Low, Medium, atau Hard**.\n"
            "5️⃣ Bot akan mengirimkan file yang sudah di-encrypt kembali kepada kamu.\n\n"
            "⚠️ **Catatan:** File selain `.lua` akan ditolak oleh sistem."
        ),
        color=0xffcc00
    )
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="status", description="Cek status server bot")
async def status(interaction: discord.Interaction):
    ping = round(bot.latency * 1000)
    embed = discord.Embed(
        title="🚀 System Status",
        description=(
            f"📡 **Bot Latency:** {ping}ms\n"
            f"✅ **Channel Lock:** Active\n"
            f"🤖 **Bot Engine:** Gacor Obf Engine v4.1"
        ),
        color=0x00ff00
    )
    await interaction.response.send_message(embed=embed)

@bot.event
async def on_ready():
    # Mengatur status aktivitas bot
    await bot.change_presence(activity=discord.Activity(type=discord.ActivityType.listening, name="/menu"))
    print(f"Logged in as {bot.user} (ID: {bot.user.id})")

bot.run(TOKEN)
