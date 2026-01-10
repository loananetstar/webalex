
import mqtt from 'mqtt';

// Configuration
const BROKER_URL = 'wss://broker.hivemq.com:8883/mqtt'; // HiveMQ Cloud WSS
// Or use TCP if running from node context which supports it, but the frontend uses WSS. 
// Standard node mqtt client often works better with TCP if available, but let's try the standard public broker URL.
// Wait, the frontend code uses 'broker.hivemq.com:8883' with protocol 'wss'.
// For Node.js 'mqtt' package, we can use 'mqtts://broker.hivemq.com:8883' or 'wss://...'
const OPTIONS = {
    username: 'davinn',
    password: 'Loana123*',
    rejectUnauthorized: false
};

const client = mqtt.connect('mqtts://broker.hivemq.com:8883', OPTIONS);

const REPORT = {
    connected: false,
    dashboard_heartbeat: null,
    dashboard_data: null,
    memory_stats: null,
    memory_activity: null,
    note_status: null
};

console.log('--- MQTT v4.0 Verification Script ---');
console.log('Connecting to Broker...');

client.on('connect', () => {
    console.log('✅ Connected to HiveMQ');
    REPORT.connected = true;

    // Subscribe to Responses
    client.subscribe('alex/dashboard/state/response');
    client.subscribe('dashboard/response');
    client.subscribe('memory/stats/response');
    client.subscribe('memory/activity/response');
    client.subscribe('/note/status');

    // 1. Test Heartbeat
    console.log('1. Sending Heartbeat Request (alex/dashboard/state/request)...');
    client.publish('alex/dashboard/state/request', 'ping');

    // 2. Test Dashboard Data
    console.log('2. Sending Dashboard Data Request (dashboard/request)...');
    client.publish('dashboard/request', 'GET');

    // 3. Test Memory Stats
    console.log('3. Sending Memory Stats Request (memory/stats/request)...');
    client.publish('memory/stats/request', 'get_stats');

    // 4. Test Memory Activity Search (Limit 1)
    console.log('4. Sending Activity Search Request (memory/activity/search)...');
    const searchPayload = JSON.stringify({
        query: "",
        activity_type: null,
        days_back: 1,
        limit: 1
    });
    client.publish('memory/activity/search', searchPayload);

    // Timeout to end test
    setTimeout(() => {
        finish();
    }, 10000);
});

client.on('message', (topic, message) => {
    const msg = message.toString();
    console.log(`📩 Received [${topic}]:`, msg.substring(0, 100) + (msg.length > 100 ? '...' : ''));

    if (topic === 'alex/dashboard/state/response') {
        REPORT.dashboard_heartbeat = "RECEIVED";
    }
    if (topic === 'dashboard/response') {
        REPORT.dashboard_data = "RECEIVED";
    }
    if (topic === 'memory/stats/response') {
        REPORT.memory_stats = "RECEIVED";
    }
    if (topic === 'memory/activity/response') {
        REPORT.memory_activity = "RECEIVED";
    }
});

client.on('error', (err) => {
    console.error('❌ MQTT Error:', err);
    process.exit(1);
});

function finish() {
    console.log('\n--- VERIFICATION REPORT ---');
    console.log(`Connection: ${REPORT.connected ? '✅ OK' : '❌ FAILED'}`);
    console.log(`Heartbeat:  ${REPORT.dashboard_heartbeat === 'RECEIVED' ? '✅ OK' : '❌ NO RESPONSE (Check Backend)'}`);
    console.log(`Dashboard:  ${REPORT.dashboard_data === 'RECEIVED' ? '✅ OK' : '❌ NO RESPONSE (Check Backend)'}`);
    console.log(`Mem Stats:  ${REPORT.memory_stats === 'RECEIVED' ? '✅ OK' : '❌ NO RESPONSE (Check Backend)'}`);
    console.log(`Mem Activ:  ${REPORT.memory_activity === 'RECEIVED' ? '✅ OK' : '❌ NO RESPONSE (Check Backend)'}`);

    console.log('---------------------------');
    client.end();
    process.exit(0);
}
