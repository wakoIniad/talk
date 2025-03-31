import axios, { AxiosError }  from "axios";
//import { GuildMember } from "discord.js";
import { NextRequest, NextResponse, } from "next/server";

const DISCORD_API_TOKEN = process.env.DISCORD_API_TOKEN;

//const fetch = require('node-fetch');

//const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'; // ここにBotのトークンを設定
//const MESSAGE_CONTENT = 'Hello! This is a test message from the bot.';

async function getDMChannels() {
    const config = {
      'headers': {
          'Authorization': `Bot ${DISCORD_API_TOKEN}`,
          'Content-Type': 'application/json'
      }
    }
    const response = await axios.get('https://discord.com/api/v10/users/@me/channels', config);
    console.log(response.data)
    const channels = response.data;
    return channels;
}

async function sendMessage(channelId, message) {
    const config = {
      'headers': {
        'Authorization': `Bot ${DISCORD_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    const data = { content: message };
    await axios.post(`https://discord.com/api/v10/channels/${channelId}/messages`,
      data,
      config
    );
}

async function sendMessageProcess(message) {
    try {
        const channels = await getDMChannels();
        for (const channel of channels) {
            await sendMessage(channel.id, message);
            console.log(`Message sent to DM channel ${channel.id}`);
        }
    } catch (error) {
        console.error('Error:', error);
    }
};
const BROADCAST_CHANNEL_NAME = "和田家";
async function broadcastMessage(message) {
  const guilds = await GetServerChannels();
  for(const guild of guilds) {
    if(guild.guildId === "1356362520062988480") {
      for(const channel of guild.channels) {
        if(channel.name === "受信用") {
          sendMessage(channel.id, message);
        }
      }
    }
  }
}
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
  try {
    const params = await request.json();
    broadcastMessage(params.message);
    return NextResponse.json(
      { response: "success" },
      { status: 200 },
    );
  } catch(e) {
    return NextResponse.json(
      { response: "failed" },
      { status: 500 },
    );
  }
}


const TOKEN = process.env.DISCORD_API_TOKEN; // 環境変数からトークンを取得
async function GetServerChannels() {
    try {
        // 1. Botが参加しているサーバー一覧を取得
        const guildsResponse = await axios.get("https://discord.com/api/v10/users/@me/guilds", {
            headers: {
                Authorization: `Bot ${TOKEN}`
            }
        });

        const guilds = guildsResponse.data;

        let allChannels = [];

        // 2. 各サーバーのチャンネル一覧を取得
        for (const guild of guilds) {
            const channelsResponse = await axios.get(`https://discord.com/api/v10/guilds/${guild.id}/channels`, {
                headers: {
                    Authorization: `Bot ${TOKEN}`
                }
            });

            const channels = channelsResponse.data;

            allChannels.push({
                guildId: guild.id,
                guildName: guild.name,
                channels: channels.map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    type: channel.type
                }))
            });
        }

        return allChannels
    } catch (error) {
        return [];
    }
}
