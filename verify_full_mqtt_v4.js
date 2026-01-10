
const mqtt = require('mqtt');

// Configuration
const BROKER_URL = 'wss://broker.hivemq.com:8883/mqtt';
const OPTIONS = {
    username: 'davinn',
    password: 'Loana123*',
    rejectUnauthorized: false
};

console.log('--- STARTING FULL MQTT v4.0 TEST ---');
console.log('Broker:', BROKER_URL);

const client = mqtt.connect('mqtts://broker.hivemq.com:8883', OPTIONS);

const SUBS = [
    '/user2/0',
    '/note/status',
    'gacor/1',
    'history/1',
    'dashboard/response',
    'alex/dashboard/state/response',
    'memory/activity/response',
    'memory/stats/response'
];

client.on('connect', () => {
    console.log('✅ CONNECTED to Broker');

    client.subscribe(SUBS, (err) => {
        if (!err) {
            console.log('✅ SUBSCRIBED to all response topics');
            startTests();
        } else {
            console.error('❌ Subscription Failed:', err);
        }
    });
});

client.on('message', (topic, message) => {
    console.log(`📩 RECEIVED [${topic}]: ${message.toString().substring(0, 50)}...`);
});

client.on('error', (err) => {
    console.error('❌ MQTT ERROR:', err.message);
    process.exit(1);
});

async function startTests() {
    // Helper wait
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // 1. Dashboard Heartbeat
    console.log('\n[1/8] Testing Heartbeat (topic: alex/dashboard/state/request)...');
    client.publish('alex/dashboard/state/request', 'ping');
    await wait(1000);

    // 2. Dashboard Data
    console.log('[2/8] Testing Dashboard Data (topic: dashboard/request)...');
    client.publish('dashboard/request', 'GET');
    await wait(1000);

    // 3. Memory Stats
    console.log('[3/8] Testing Memory Stats (topic: memory/stats/request)...');
    client.publish('memory/stats/request', 'get_stats');
    await wait(1000);

    // 4. Memory Search
    console.log('[4/8] Testing Activity Search (topic: memory/activity/search)...');
    client.publish('memory/activity/search', JSON.stringify({ query: "", limit: 1 }));
    await wait(1000);

    // 5. Auth Google
    console.log('[5/8] Testing Auth (topic: /user1/0)...');
    client.publish('/user1/0', 'AUTH:GOOGLE');
    await wait(1000);

    // 6. Agent Control
    console.log('[6/8] Testing Agent ON (topic: /agent/1)...');
    client.publish('/agent/1', 'AGENTON');
    await wait(1000);

    // 7. History
    console.log('[7/8] Testing History (topic: history/2)...');
    client.publish('history/2', 'check_history');
    await wait(1000);

    // 8. Note Control
    console.log('[8/8] Testing Note ON/OFF (topic: /note/1)...');
    client.publish('/note/1', 'NOTEON');
    await wait(2000);
    client.publish('/note/1', 'NOTEOFF');
    await wait(2000);

    console.log('\n--- TEST COMPLETE ---');
    console.log('Waiting 3s for any straggler messages...');
    setTimeout(() => {
        console.log('Exiting.');
        client.end();
        process.exit(0);
    }, 3000);
}
