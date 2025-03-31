const WebSocket = require('ws');

const BOT_TOKEN = "MTM1NjM1NzY3Mzk1OTk1MjQ5NA.G2f-5K.9obPV7ju5m-PUgzMgiHQeBaI_Z0txbNOqvIc_k"; // ここにBotのトークンを設定
const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';

let heartbeatInterval;
const ws = new WebSocket(GATEWAY_URL);

ws.on('open', () => {
    console.log('Connected to Discord Gateway');
});

ws.on('message', (data) => {
    const payload = JSON.parse(data);
    const { t, op, d } = payload;

    if (op === 10) { // HELLO event
        heartbeatInterval = d.heartbeat_interval;
        sendHeartbeat();

        ws.send(JSON.stringify({
            op: 2, // IDENTIFY
            d: {
                token: BOT_TOKEN,
                intents: 0,
                properties: {
                    os: 'linux',
                    browser: 'node',
                    device: 'node'
                }
            }
        }));
    }

    if (t === 'READY') {
        console.log(`Logged in as ${d.user.username}`);
    }
});

ws.on('close', () => {
    console.log('Disconnected from Discord Gateway');
    clearInterval(heartbeatInterval);
});

function sendHeartbeat() {
    ws.send(JSON.stringify({ op: 1, d: null }));
    setInterval(() => {
        ws.send(JSON.stringify({ op: 1, d: null }));
    }, heartbeatInterval);
}
