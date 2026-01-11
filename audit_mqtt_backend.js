const mqtt = require('mqtt');

// Configuration
const BROKER_URL = 'wss://broker.hivemq.com:8883/mqtt';
const OPTIONS = {
    username: 'davinn',
    password: 'Loana123*',
    rejectUnauthorized: false,
    clientId: 'alex_auditor_' + Math.random().toString(16).substr(2, 8) // Random ID
};

console.log("🔍 STARTING FULL MQTT BACKEND AUDIT (v4.0 STRICT)...");
console.log(`Target: ${BROKER_URL}`);

const client = mqtt.connect('mqtts://broker.hivemq.com:8883', OPTIONS);
const results = {
    connection: false,
    dashboard_data: 'PENDING',
    dashboard_heartbeat: 'PENDING',
    memory_search: 'PENDING',
    memory_stats: 'PENDING',
    note_status: 'PENDING',
    history: 'PENDING'
};

let pendingTests = 5;

function checkDone() {
    if (pendingTests <= 0) {
        console.log("\n✅ AUDIT COMPLETE. Preparing Report...");
        console.log(JSON.stringify(results, null, 2));
        client.end();
        process.exit(0);
    }
}

client.on('connect', () => {
    console.log("✅ Broker Connected");
    results.connection = true;

    // Subscribe to ALL response topics
    const topics = [
        'dashboard/response',
        'alex/dashboard/state/response',
        'memory/activity/response',
        'memory/stats/response',
        'note/status', // Note: Correct topic is /note/status but guide says /note/status. Let's try both or strict guide. Guide: /note/status
        '/note/status',
        'history/1',
        'gacor/1'
    ];

    client.subscribe(topics, async (err) => {
        if (err) console.error("Sub Error", err);

        // 1. Test Dashboard Data
        console.log("👉 Testing Dashboard Data (dashboard/request)...");
        client.publish('dashboard/request', 'GET');

        // 2. Test Heartbeat
        console.log("👉 Testing Heartbeat (alex/dashboard/state/request)...");
        client.publish('alex/dashboard/state/request', 'ping');

        // 3. Test Memory Search
        console.log("👉 Testing Memory Search (memory/activity/search)...");
        client.publish('memory/activity/search', JSON.stringify({ query: "*", limit: 3 }));

        // 4. Test Memory Stats
        console.log("👉 Testing Memory Stats (memory/stats/request)...");
        client.publish('memory/stats/request', 'GET');

        // 5. Test History
        console.log("👉 Testing History (history/2)...");
        client.publish('history/2', 'check_history');
    });
});

client.on('message', (topic, message) => {
    const payload = message.toString();
    const start = Date.now(); // Rough latency metric not perfectly accurate here but okay for ack

    console.log(`\n📥 RECEIVED [${topic}]`);

    // Validate JSON
    let data;
    try {
        data = JSON.parse(payload);
        // console.log("   Payload valid JSON");
    } catch (e) {
        console.error("   ❌ INVALID JSON");
        return;
    }

    if (topic === 'dashboard/response') {
        if (data.weather && data.integrations) {
            results.dashboard_data = 'PASS';
            console.log("   ✅ Valid Dashboard Data");
        } else {
            results.dashboard_data = 'FAIL (Schema Mismatch)';
            console.error("   ❌ Missing keys:", Object.keys(data));
        }
        pendingTests--;
    }
    else if (topic === 'alex/dashboard/state/response') {
        if (typeof data.is_active === 'boolean') {
            results.dashboard_heartbeat = 'PASS';
            console.log("   ✅ Valid Heartbeat");
        } else {
            results.dashboard_heartbeat = 'FAIL';
        }
        pendingTests--;
    }
    else if (topic === 'memory/activity/response') {
        if (Array.isArray(data)) {
            results.memory_search = 'PASS';
            console.log(`   ✅ Valid Activity Search (${data.length} items)`);
        } else {
            results.memory_search = 'FAIL (Not Array)';
        }
        pendingTests--;
    }
    else if (topic === 'memory/stats/response') {
        if (typeof data.total_activities === 'number') {
            results.memory_stats = 'PASS';
            console.log("   ✅ Valid Memory Stats");
        } else {
            results.memory_stats = 'FAIL';
        }
        pendingTests--;
    }
    else if (topic === 'history/1') {
        if (Array.isArray(data.enriched_events) || data.sessions) { // v4 guide says enriched_events
            results.history = 'PASS';
            console.log("   ✅ Valid History");
        } else {
            // Fallback check based on potential different structure
            if (data.quick_stats) {
                results.history = 'PASS (Stats)';
                console.log("   ✅ Valid History (Stats)");
            } else {
                results.history = 'FAIL';
                console.log("   Payload:", Object.keys(data));
            }
        }
        pendingTests--;
    }

    checkDone();
});

// Timeout
setTimeout(() => {
    if (pendingTests > 0) {
        console.log("\n⚠️ TIMEOUT: Some tests did not receive responses.");
        console.log(JSON.stringify(results, null, 2));
        process.exit(1);
    }
}, 10000);
