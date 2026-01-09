import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import mqtt from 'mqtt';

// MQTT Configuration from MQTT_PROTOCOL_GUIDE.txt
// Broker URL (WebSocket): wss://33d2caf18f7944cbb4ea3a8d2b8cba30.s1.eu.hivemq.cloud:8884/mqtt
// Username: davinn
// Password: Loana123*
const BROKER_URL = 'wss://33d2caf18f7944cbb4ea3a8d2b8cba30.s1.eu.hivemq.cloud:8884/mqtt';
const MQTT_USERNAME = 'davinn';
const MQTT_PASSWORD = 'Loana123*';

interface MqttContextType {
    isConnected: boolean;
    publish: (topic: string, message: string) => void;
    lastMessage: { topic: string; payload: string } | null;
    messages: Record<string, string>; // Store last message per topic
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

export const MqttProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [client, setClient] = useState<mqtt.MqttClient | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<{ topic: string; payload: string } | null>(null);
    const [messages, setMessages] = useState<Record<string, string>>({});

    // Refs to track connection state to prevent duplicate connections
    const clientRef = useRef<mqtt.MqttClient | null>(null);

    useEffect(() => {
        if (clientRef.current) return;

        console.log('Initializing MQTT Connection to HiveMQ Cloud...');
        const mqttClient = mqtt.connect(BROKER_URL, {
            username: MQTT_USERNAME,
            password: MQTT_PASSWORD,
            clean: true,
            connectTimeout: 4000,
            reconnectPeriod: 1000, // Try to reconnect every second if lost
            keepalive: 60,
            protocol: 'wss',
            clientId: 'alex_dashboard_' + Math.random().toString(16).substr(2, 8),
        });

        clientRef.current = mqttClient;

        mqttClient.on('connect', () => {
            console.log('✅ MQTT Connected to HiveMQ Cloud');
            setIsConnected(true);

            // Subscribe to ALL required topics from MQTT_PROTOCOL_GUIDE.txt Section 2
            const topics = [
                '/user2/0',                 // AUTH RESPONSE
                '/note/status',             // NOTE STATUS (Real-time)
                'gacor/1',                  // NOTE RESULT (Final summary)
                'alex/dashboard/state',     // DASHBOARD STATE (Heartbeat - every 5s)
                'dashboard/response',       // DASHBOARD DATA (On-demand)
                'history/1'                 // TIMELINE FEED (On-demand)
            ];

            mqttClient.subscribe(topics, { qos: 1 }, (err) => {
                if (err) {
                    console.error('❌ Subscription error:', err);
                } else {
                    console.log('📡 Subscribed to all topics:', topics);
                }
            });
        });

        mqttClient.on('message', (topic, payload) => {
            const payloadStr = payload.toString();
            console.log(`Received: ${topic} -> ${payloadStr}`);

            setLastMessage({ topic, payload: payloadStr });
            setMessages(prev => ({ ...prev, [topic]: payloadStr }));
        });

        mqttClient.on('reconnect', () => {
            console.log('MQTT Reconnecting...');
        });

        mqttClient.on('error', (err) => {
            console.error('MQTT Error:', err);
            setIsConnected(false);
        });

        mqttClient.on('offline', () => {
            console.log('MQTT Offline');
            setIsConnected(false);
        });

        setClient(mqttClient);

        return () => {
            // Cleanup only on unmount
            if (clientRef.current) {
                console.log('Ending MQTT connection');
                clientRef.current.end();
                clientRef.current = null;
            }
        };
    }, []);

    const publish = (topic: string, message: string) => {
        if (clientRef.current && clientRef.current.connected) {
            clientRef.current.publish(topic, message, { qos: 1 }, (error) => {
                if (error) {
                    console.error('Publish error:', error);
                } else {
                    console.log(`Published to ${topic}: ${message}`);
                }
            });
        } else {
            console.warn('Cannot publish: MQTT not connected. Queueing or ignoring.');
        }
    };

    return (
        <MqttContext.Provider value={{ isConnected, publish, lastMessage, messages }}>
            {children}
        </MqttContext.Provider>
    );
};

export const useMqtt = () => {
    const context = useContext(MqttContext);
    if (context === undefined) {
        throw new Error('useMqtt must be used within a MqttProvider');
    }
    return context;
};