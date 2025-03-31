import axios, { AxiosError }  from "axios";
import { GuildMember } from "discord.js";
import { NextRequest, NextResponse, } from "next/server";

const DISCORD_API_TOKEN = process.env.DISCORD_API_TOKEN;
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
  ]
});


client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
});
async function sendDM(message) {
  for (const guild of client.guilds.cache.values()) {
    try {
      // メンバーを取得
      const members = await guild.members.fetch();

      // 各メンバーにDMを送信
      members.forEach(async (member) => {
        if (!member.user.bot) { // BOT には送らない
          try {
            await member.send(message);
            console.log(`Sent DM to ${member.user.tag} ${message}`);
          } catch (error) {
            console.error(`Could not send DM to ${member.user.tag}:`, error);
          }
        }
      });
    } catch (error) {
      console.error(`Failed to fetch members for guild ${guild.name}:`, error);
    }
  }
}

client.login(DISCORD_API_TOKEN);
export function GET(request) {
  // GET /api/users リクエストの処理
  const params = request.nextUrl.searchParams;
  const query = params.get("query");

  return NextResponse.json(
    { response: "Test response." },
    { status: 200 },
  );
}
export async function POST(request) {
  // POST /api/users リクエストの処理
  const params = await request.json();
  sendDM(params.message);
}
