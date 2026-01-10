const mqtt = require('mqtt');

// Configuration (Strictly matches Protocol Guide)
const BROKER_URL = 'wss://broker.hivemq.com:8883/mqtt';
const OPTIONS = {
    username: 'davinn',
    password: 'Loana123*',
    rejectUnauthorized: false
};

// Console Colors
const RESET = "\x1b[0m";
const BRIGHT = "\x1b[1m";
const FG_CYAN = "\x1b[36m";
const FG_GREEN = "\x1b[32m";
const FG_YELLOW = "\x1b[33m";
const FG_MAGENTA = "\x1b[35m";
const FG_RED = "\x1b[31m";

console.log(`${BRIGHT}${FG_CYAN}--- ALEX MQTT MONITOR (Full Log) ---${RESET}`);
console.log(`Connecting to ${BROKER_URL}...`);

const client = mqtt.connect('mqtts://broker.hivemq.com:8883', OPTIONS);

client.on('connect', () => {
    console.log(`${FG_GREEN}✅ CONNECTED to Broker${RESET}`);
    console.log(`${FG_CYAN}📡 Listening to ALL topics (#)${RESET}\n`);

    // Subscribe to everything
    client.subscribe('#', (err) => {
        if (err) console.error(`${FG_RED}❌ Sub Error:${RESET}`, err);
    });
});

client.on('message', (topic, message) => {
    const timestamp = new Date().toLocaleTimeString();
    let payload = message.toString();
    let prettyPayload = payload;
    let isJson = false;

    // Try to prettify JSON
    try {
        const parsed = JSON.parse(payload);
        prettyPayload = JSON.stringify(parsed, null, 2); // Indent JSON
        isJson = true;
    } catch (e) {
        // Not JSON, keep raw
    }

    // Determine color based on topic direction/category
    let color = FG_CYAN;
    if (topic.includes('request') || topic.includes('user1') || topic.includes('NOTEON')) color = FG_MAGENTA; // Frontend -> Backend
    else if (topic.includes('response') || topic.includes('user2') || topic.includes('gacor')) color = FG_GREEN; // Backend -> Frontend
    else if (topic.includes('status') || topic.includes('heartbeat')) color = FG_YELLOW; // Status

    // Shorten if too long and regular request
    if (!isJson && payload.length > 200) {
        prettyPayload = payload.substring(0, 200) + '... (truncated)';
    }

    console.log(`${BRIGHT}${color}[${timestamp}] ${topic}${RESET}`);
    console.log(prettyPayload);
    console.log(`${FG_CYAN}----------------------------------------${RESET}`);
});

client.on('error', (err) => {
    console.error(`${FG_RED}❌ MQTT Error:${RESET}`, err.message);
});
