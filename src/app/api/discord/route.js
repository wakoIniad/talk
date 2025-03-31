import axios, { AxiosError }  from "axios";
//import { GuildMember } from "discord.js";
import { NextRequest, NextResponse, } from "next/server";

const DISCORD_API_TOKEN = process.env.DISCORD_API_TOKEN;

const fetch = require('node-fetch');

const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'; // ここにBotのトークンを設定
const MESSAGE_CONTENT = 'Hello! This is a test message from the bot.';

async function getDMChannels() {
    const response = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'GET',
        headers: {
            'Authorization': `Bot ${BOT_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });
    const channels = await response.json();
    return channels;
}

async function sendMessage(channelId, message) {
    await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${BOT_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: message })
    });
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
  sendMessageProcess(params.message);
}
