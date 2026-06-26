const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

if (!TOKEN) { console.error('[ERROR] TOKEN missing'); process.exit(1); }
if (!CHANNEL_ID) { console.error('[ERROR] CHANNEL_ID missing'); process.exit(1); }

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
let connection = null;

async function joinChannel() {
  const channel = client.channels.cache.get(CHANNEL_ID);
  if (!channel || !channel.isVoiceBased()) return console.error('[ERROR] Channel not found');
  connection = joinVoiceChannel({ channelId: channel.id, guildId: channel.guild.id, adapterCreator: channel.guild.voiceAdapterCreator, selfDeaf: true, selfMute: true });
  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try { await Promise.race([entersState(connection, VoiceConnectionStatus.Signalling, 5_000), entersState(connection, VoiceConnectionStatus.Connecting, 5_000)]); }
    catch { connection.destroy(); setTimeout(joinChannel, 3000); }
  });
  connection.on(VoiceConnectionStatus.Ready, () => console.log(`[INFO] Connected: ${channel.name}`));
}

client.once('clientReady', async () => { console.log(`[INFO] ${client.user.tag}`); await joinChannel(); });
client.on('error', (err) => console.error('[ERROR]', err.message));
client.login(TOKEN);
