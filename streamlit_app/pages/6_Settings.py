import streamlit as st
from mqtt_manager import get_mqtt_manager
from utils import inject_custom_css

st.set_page_config(page_title="Settings | Alex", layout="wide")
inject_custom_css()

mqtt = get_mqtt_manager()

st.title("Settings")

st.markdown("### System Status")
st.json({
    "Broker": "HiveMQ Cloud",
    "Protocol": "MQTT v5 (WSS)",
    "Connected": mqtt.connected,
    "Client ID": mqtt.client._client_id if mqtt.client else "None"
})

st.markdown("### Debug")
if st.checkbox("Show Raw MQTT Buffer"):
    st.write(mqtt.message_buffer)

st.markdown("### Appearance")
st.info("Streamlit manages themes via the top-right menu. Select 'Settings' -> 'Theme' to toggle Light/Dark mode.")
