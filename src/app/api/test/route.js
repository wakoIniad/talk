// app/api/discord/guilds/route.js
import axios from "axios";
import { NextResponse } from "next/server";

const TOKEN = process.env.DISCORD_API_TOKEN; // 環境変数からトークンを取得

export async function GET() {
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

        return NextResponse.json(allChannels, { status: 200 });
    } catch (error) {
        console.error("エラー:", error.response?.data || error.message);
        return NextResponse.json({ error: "Failed to fetch data from Discord API" }, { status: 500 });
    }
}
