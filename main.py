import discord
from discord.ext import commands
from discord import app_commands
import base64
import random
import string
import io
import os
import datetime

# --- KONFIGURASI ---
TOKEN = os.getenv('TOKEN')
ALLOWED_CHANNEL_ID = int(os.getenv('CHANNEL_ID', 1470767786652340390))

class ObfBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(command_prefix='!', intents=intents)

    async def setup_hook(self):
        await self.tree.sync()
        print(f"✔️ Slash Commands Synced!")

bot = ObfBot()

# --- LOGIKA OBFUSCATION ---
def lua_obfuscate(code, level):
    watermark = "-- [[ Enc by Tatang Bot ]]\n"
    encoded = base64.b64encode(code.encode()).decode()
    v = ''.join(random.choices(string.ascii_letters, k=10))
    if level == "Low":
        res = f"--[[ 🟢 Low Obfuscation ]]\n-- Secured by GacorBot\nlocal {v}='{encoded}';load(base64_decode_logic)()"
    elif level == "Medium":
        res = f"--[[ 🔵 Medium Obfuscation ]]\n-- Anti-Decompile Layer\nlocal {v}='{encoded}';\nload(decode({v}))()"
    else: # Hard
        res = f"--[[ 🔴 HARD ENCRYPTION v4.1 ]]\n--[[ ⚠️ WARNING: DO NOT TOUCH THIS CODE ⚠️ ]]\nlocal {v}='{encoded}';load(complex_wrapper({v}))()"
    
    return watermark + res

# --- UI BUTTONS ---
class ObfView(discord.ui.View):
    def __init__(self, code, filename, original_msg):
        super().__init__(timeout=60)
        self.code = code
        self.filename = filename
        self.original_msg = original_msg # Menyimpan data pesan asli

    async def process(self, interaction: discord.Interaction, level: str):
        await interaction.response.defer(ephemeral=False)
        result = lua_obfuscate(self.code, level)
        file_io = io.BytesIO(result.encode())
        file_discord = discord.File(fp=file_io, filename=f"GACOR_{level.upper()}_{self.filename}")
        
        embed_finish = discord.Embed(
            title="✨ Obfuscation Success!",
            description=f"✅ File **{self.filename}** berhasil di-encrypt!",
            color=0x00ff88,
            timestamp=datetime.datetime.utcnow()
        )
        embed_finish.add_field(name="🛡️ Security Level", value=f"**{level}**", inline=True)
        embed_finish.add_field(name="📂 Result", value="`Ready to Download`", inline=True)
        embed_finish.set_footer(text="Gacor Obf Engine • Privacy Secured")
        
        # Kirim file hasil obf
        await interaction.followup.send(embed=embed_finish, file=file_discord)

        # FITUR HAPUS: Menghapus file asli user setelah file obf dikirim
        try:
            await self.original_msg.delete()
        except:
            pass # Mengabaikan jika bot tidak punya ijin hapus pesan

    @discord.ui.button(label="Low Intensity", style=discord.ButtonStyle.green, emoji="🟢")
    async def low(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.process(interaction, "Low")

    @discord.ui.button(label="Medium Intensity", style=discord.ButtonStyle.blurple, emoji="🔵")
    async def med(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.process(interaction, "Medium")

    @discord.ui.button(label="Hard Intensity", style=discord.ButtonStyle.danger, emoji="🔴")
    async def hard(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.process(interaction, "Hard")

# --- AUTO DETECTION SYSTEM ---
@bot.event
async def on_message(message):
    if message.author.bot: return
    
    if message.channel.id == ALLOWED_CHANNEL_ID:
        if message.attachments:
            attachment = message.attachments[0]
            if attachment.filename.endswith('.lua'):
                code = await attachment.read()
                try:
                    decoded_code = code.decode('utf-8', errors='ignore')
                    embed = discord.Embed(
                        title="💎 Gacor Obfuscator Engine",
                        description=(
                            "👋 **Halo!** File Script Lua terdeteksi.\n"
                            "Pilih tingkat keamanan yang ingin kamu terapkan pada file ini.\n\n"
                            "━━━━━━━━━━━━━━━━━━━━━━━━\n"
                            "🟢 **LOW**: Proteksi dasar, ukuran file tetap kecil.\n"
                            "🔵 **MEDIUM**: Proteksi ganda, sulit dibaca manusia.\n"
                            "🔴 **HARD**: Proteksi maksimal (Virtualization Layer).\n"
                            "━━━━━━━━━━━━━━━━━━━━━━━━"
                        ),
                        color=0x2b2d31
                    )
                    embed.set_author(name=message.author.display_name, icon_url=message.author.display_avatar.url)
                    embed.set_footer(text="Gacor Bot • Pilih salah satu tombol di bawah")
                    # Mengirim pesan dengan menyertakan objek 'message' agar bisa dihapus nanti
                    await message.channel.send(embed=embed, view=ObfView(decoded_code, attachment.filename, message))
                except Exception as e:
                    await message.channel.send(f"❌ **Error:** Gagal memproses file. `{e}`")
            else:
                embed_warn = discord.Embed(
                    title="⚠️ Invalid File Format",
                    description=(
                        f"Maaf **{message.author.display_name}**, bot ini dikonfigurasi khusus untuk file **.lua**.\n"
                        "Silakan upload file yang benar untuk melanjutkan."
                    ),
                    color=0xffcc00
                )
                await message.channel.send(embed=embed_warn)
    
    await bot.process_commands(message)

# --- SLASH COMMANDS ---
@bot.tree.command(name="menu", description="Menampilkan menu informasi lengkap bot")
async def menu(interaction: discord.Interaction):
    embed = discord.Embed(
        title="🚀 Gacor Obfuscator - Main Menu",
        description="Selamat datang di layanan Enkripsi Lua terbaik. Berikut adalah daftar fitur kami:",
        color=0x4287f5,
        timestamp=datetime.datetime.utcnow()
    )
    embed.add_field(
        name="🛡️ Fitur Utama (Obfuscator)", 
        value="Cukup kirim file `.lua` di channel <#1470767786652340390> dan biarkan bot bekerja otomatis.", 
        inline=False
    )
    embed.add_field(name="❓ Panduan", value="Gunakan `/help` untuk tutorial lengkap.", inline=True)
    embed.add_field(name="📊 Status", value="Gunakan `/status` untuk cek performa.", inline=True)
    embed.add_field(
        name="🆘 Butuh Bantuan?", 
        value="Jika mengalami kendala, silakan hubungi tim Admin melalui Support Ticket.", 
        inline=False
    )
    embed.set_thumbnail(url=interaction.user.display_avatar.url)
    embed.set_footer(text="Gacor Bot v2.1 • Powered by Gacor Engine")
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="help", description="Tutorial lengkap penggunaan bot")
async def help_cmd(interaction: discord.Interaction):
    embed = discord.Embed(
        title="📖 Panduan Lengkap Penggunaan",
        description="Ikuti langkah-langkah di bawah ini untuk mengamankan script kamu:",
        color=0xffcc00
    )
    embed.add_field(name="1. Persiapan File", value="Pastikan script kamu memiliki ekstensi `.lua`.", inline=False)
    embed.add_field(name="2. Pengiriman", value="Upload file ke channel <#1470767786652340390>.", inline=False)
    embed.add_field(name="3. Pemilihan Proteksi", value="Klik tombol **Low**, **Medium**, atau **Hard**.", inline=False)
    embed.add_field(name="4. Hasil", value="Bot akan mengirim file baru. Selesai!", inline=False)
    embed.set_footer(text="Hubungi Admin jika masih bingung.")
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="status", description="Cek status dan statistik bot")
async def status(interaction: discord.Interaction):
    ping = round(bot.latency * 1000)
    embed = discord.Embed(
        title="📊 System Performance Status",
        color=0x00ff00,
        timestamp=datetime.datetime.utcnow()
    )
    embed.add_field(name="📡 API Latency", value=f"`{ping}ms`", inline=True)
    embed.add_field(name="🤖 Bot Version", value="`v2.1 Stable`", inline=True)
    embed.add_field(name="🔋 Status", value="`Online`", inline=True)
    embed.set_footer(text="Gacor Engine Monitor")
    await interaction.response.send_message(embed=embed)

# --- START BOT ---
if TOKEN:
    bot.run(TOKEN)
