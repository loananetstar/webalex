import paho.mqtt.client as mqtt
import streamlit as st
import json
import time
import threading
from typing import Dict, Any, Optional

# Configuration
BROKER = "33d2caf18f7944cbb4ea3a8d2b8cba30.s1.eu.hivemq.cloud"
PORT = 8883 # SSL Port
WS_PATH = "/mqtt" # Not used for TCP/SSL client, but good to know
USERNAME = "davinn"
PASSWORD = "Loana123*"

class MQTTManager:
    def __init__(self):
        self.client = mqtt.Client(client_id=f"streamlit_alex_{int(time.time())}", protocol=mqtt.MQTTv5)
        self.client.username_pw_set(USERNAME, PASSWORD)
        self.client.tls_set()  # Enable SSL/TLS
        
        # Callbacks
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        
        # Data Store (Thread-safe-ish for simple reads)
        self.message_buffer: Dict[str, Any] = {}
        self.connected = False
        
        # Start
        try:
            self.client.connect(BROKER, PORT, 60)
            self.client.loop_start() # Run in background thread
        except Exception as e:
            print(f"Connection Failed: {e}")

    def on_connect(self, client, userdata, flags, rc, properties=None):
        if rc == 0:
            self.connected = True
            print("✅ MQTT Connected!")
            # Subscribe to all relevant topics
            topics = [
                ("/user2/0", 1),
                ("/note/status", 1),
                ("gacor/1", 1),
                ("alex/dashboard/state", 1),
                ("dashboard/response", 1),
                ("history/1", 1),
                ("memory/activity/response", 1),
                ("memory/stats/response", 1),
                ("memory/base/response", 1),
                ("memory/context/response", 1),
                ("/agent/status", 1),
                ("agent/voice/list/response", 1),
                ("agent/voice/status", 1),
                ("agent/summary/realtime", 1),
                ("device/battery/response", 1)
            ]
            client.subscribe(topics)
        else:
            print(f"❌ Connection failed with code {rc}")

    def on_message(self, client, userdata, msg):
        try:
            payload = msg.payload.decode()
            topic = msg.topic
            # Try parsing JSON, otherwise store string
            try:
                data = json.loads(payload)
            except json.JSONDecodeError:
                data = payload
            
            # Update buffer
            self.message_buffer[topic] = data
            # print(f"Received {topic}") 
        except Exception as e:
            print(f"Error processing message: {e}")

    def on_disconnect(self, client, userdata, rc, properties=None): # Added extra args for v5
        print("Disconnected")
        self.connected = False

    def publish(self, topic: str, payload: Any):
        if not self.connected:
            return False
        
        if isinstance(payload, (dict, list)):
            payload = json.dumps(payload)
        
        info = self.client.publish(topic, payload)
        return info.rc == mqtt.MQTT_ERR_SUCCESS

    def get_latest(self, topic: str) -> Optional[Any]:
        return self.message_buffer.get(topic)

@st.cache_resource
def get_mqtt_manager():
    return MQTTManager()
