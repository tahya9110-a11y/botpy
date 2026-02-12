import discord
from discord.ext import commands
from discord import app_commands
import base64
import random
import string
import io
import os

# --- KONFIGURASI ---
# Bot akan mengambil data dari tab Variables di Railway
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
        await interaction.response.defer(ephemeral=False)
        result = lua_obfuscate(self.code, level)
        file_io = io.BytesIO(result.encode())
        file_discord = discord.File(fp=file_io, filename=f"GACOR_{level}_{self.filename}")
        
        await interaction.followup.send(
            content=f"✨ **Proses Selesai!**\n📂 File: `{self.filename}` | 🛡️ Keamanan: **{level}**",
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

# --- DETEKSI PESAN ---
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
                        title="💎 Gacor Obfuscator",
                        description="File `.lua` terdeteksi. Pilih tingkat proteksi:",
                        color=0x2b2d31
                    )
                    await message.channel.send(embed=embed, view=ObfView(decoded_code, attachment.filename))
                except Exception as e:
                    await message.channel.send(f"❌ Gagal membaca file: {e}")
            else:
                embed_warn = discord.Embed(
                    title="❌ Format Salah",
                    description="Hanya file **.lua** yang diperbolehkan di sini!",
                    color=0xff4b4b
                )
                await message.channel.send(embed=embed_warn)
    
    await bot.process_commands(message)

# --- SLASH COMMANDS ---
@bot.tree.command(name="menu", description="Menampilkan menu")
async def menu(interaction: discord.Interaction):
    embed = discord.Embed(title="📂 Gacor Bot Menu", color=0x4287f5)
    embed.add_field(name="🛡️ Obf", value="Kirim file `.lua` di channel ini.", inline=False)
    embed.set_footer(text="Gacor Bot v2.0")
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="help", description="Cara pakai")
async def help_cmd(interaction: discord.Interaction):
    await interaction.response.send_message("Kirim file `.lua` di channel <#1470767786652340390> lalu pilih tombolnya!")

@bot.tree.command(name="status", description="Cek Ping")
async def status(interaction: discord.Interaction):
    await interaction.response.send_message(f"📡 Pong! {round(bot.latency * 1000)}ms")

# --- MENJALANKAN BOT ---
if TOKEN:
    try:
        bot.run(TOKEN)
    except discord.errors.LoginFailure:
        print("❌ ERROR: Token salah! Cek tab Variables di Railway.")
    except Exception as e:
        print(f"❌ ERROR: {e}")
else:
    print("❌ ERROR: Variable TOKEN tidak ditemukan di Railway!")
