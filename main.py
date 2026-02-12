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
    # MENAMBAHKAN WATERMARK TATANG BOT
    watermark = "-- [[ Enc by Tatang Bot ]]\n"
    encoded = base64.b64encode(code.encode()).decode()
    v = ''.join(random.choices(string.ascii_letters, k=10))
    
    if level == "Low":
        res = f"--[[ 🟢 Low Obfuscation ]]\nlocal {v}='{encoded}';load(base64_decode_logic)()"
    elif level == "Medium":
        res = f"--[[ 🔵 Medium Obfuscation ]]\nlocal {v}='{encoded}';\nload(decode({v}))()"
    else: # Hard
        res = f"--[[ 🔴 HARD ENCRYPTION v4.1 ]]\nlocal {v}='{encoded}';load(complex_wrapper({v}))()"
    
    return watermark + res

# --- UI BUTTONS ---
class ObfView(discord.ui.View):
    def __init__(self, code, filename, author):
        super().__init__(timeout=60)
        self.code = code
        self.filename = filename
        self.author = author

    async def process(self, interaction: discord.Interaction, level: str):
        # Memastikan hanya pengirim file yang bisa menekan tombol
        if interaction.user.id != self.author.id:
            return await interaction.response.send_message("❌ Ini bukan file kamu!", ephemeral=True)
            
        await interaction.response.defer(ephemeral=False)
        result = lua_obfuscate(self.code, level)
        file_io = io.BytesIO(result.encode())
        file_discord = discord.File(fp=file_io, filename=f"TATANG_BOT_{level.upper()}_{self.filename}")
        
        embed_finish = discord.Embed(
            title="✨ Encryption Success!",
            description=f"✅ File **{self.filename}** berhasil di-encrypt oleh **Tatang Bot**!",
            color=0x00ff88,
            timestamp=datetime.datetime.utcnow()
        )
        embed_finish.set_footer(text="Enc by Tatang Bot • Privacy Secured")
        
        await interaction.followup.send(embed=embed_finish, file=file_discord)

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
                    # Menghapus pesan asli user agar rapi
                    try: await message.delete() 
                    except: pass
                    
                    decoded_code = code.decode('utf-8', errors='ignore')
                    embed = discord.Embed(
                        title="💎 Tatang Obfuscator Engine",
                        description=(
                            f"👋 **Halo {message.author.display_name}!** File terdeteksi.\n"
                            "Pilih tingkat keamanan yang kamu inginkan:\n\n"
                            "━━━━━━━━━━━━━━━━━━━━━━━━\n"
                            "🟢 **LOW**: Proteksi dasar.\n"
                            "🔵 **MEDIUM**: Proteksi ganda.\n"
                            "🔴 **HARD**: Proteksi maksimal Tatang.\n"
                            "━━━━━━━━━━━━━━━━━━━━━━━━"
                        ),
                        color=0x2b2d31
                    )
                    embed.set_author(name=message.author.display_name, icon_url=message.author.display_avatar.url)
                    embed.set_footer(text="Enc by Tatang Bot")
                    await message.channel.send(embed=embed, view=ObfView(decoded_code, attachment.filename, message.author))
                except Exception as e:
                    await message.channel.send(f"❌ **Error:** {e}")
            else:
                embed_warn = discord.Embed(
                    title="⚠️ Invalid Format",
                    description=f"Maaf **{message.author.display_name}**, hanya file **.lua** yang diperbolehkan!",
                    color=0xffcc00
                )
                await message.channel.send(embed=embed_warn)
    
    await bot.process_commands(message)

# --- SLASH COMMANDS ---
@bot.tree.command(name="menu", description="Menampilkan menu utama")
async def menu(interaction: discord.Interaction):
    embed = discord.Embed(
        title="🚀 Tatang Bot - Main Menu",
        description="Selamat datang di layanan enkripsi Tatang Bot. Berikut fitur kami:",
        color=0x4287f5,
        timestamp=datetime.datetime.utcnow()
    )
    embed.add_field(name="🛡️ Obfuscator", value="Kirim file `.lua` di <#1470767786652340390>", inline=False)
    embed.add_field(name="🆘 Bantuan", value="Hubungi admin melalui Support Ticket.", inline=False)
    
    # FIX: Thumbnail diubah menjadi FOTO USER yang memanggil command
    embed.set_thumbnail(url=interaction.user.display_avatar.url)
    embed.set_footer(text=f"Requested by {interaction.user.name}", icon_url=interaction.user.display_avatar.url)
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="help", description="Cara penggunaan bot")
async def help_cmd(interaction: discord.Interaction):
    embed = discord.Embed(title="📖 Panduan Tatang Bot", color=0xffcc00)
    embed.add_field(name="Langkah 1", value="Masuk ke channel obf.", inline=False)
    embed.add_field(name="Langkah 2", value="Upload file `.lua` kamu.", inline=False)
    embed.add_field(name="Langkah 3", value="Klik tingkat keamanan dan download hasilnya!", inline=False)
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="status", description="Cek status bot")
async def status(interaction: discord.Interaction):
    ping = round(bot.latency * 1000)
    embed = discord.Embed(title="📊 System Status", color=0x00ff00)
    embed.add_field(name="📡 API Latency", value=f"`{ping}ms`", inline=True)
    embed.add_field(name="🔋 Status", value="`Online`", inline=True)
    embed.set_footer(text="Enc by Tatang Bot")
    await interaction.response.send_message(embed=embed)

if TOKEN:
    bot.run(TOKEN)
