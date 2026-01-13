import streamlit as st
from mqtt_manager import get_mqtt_manager
from utils import inject_custom_css, render_glass_card
from streamlit_autorefresh import st_autorefresh
import json

st.set_page_config(page_title="Integrations | Alex", layout="wide")
inject_custom_css()
st_autorefresh(interval=1000, key="integrations_refresh")

mqtt = get_mqtt_manager()

st.title("Integrations")

services = [
    {"name": "Gmail", "icon": "📧", "cmd": "AUTH:GMAIL"},
    {"name": "Google Calendar", "icon": "📅", "cmd": "AUTH:CALENDAR"},
    {"name": "Google Drive", "icon": "💾", "cmd": "AUTH:DRIVE"},
    {"name": "Spotify", "icon": "🎵", "cmd": "AUTH:SPOTIFY"},
]

cols = st.columns(2)

# Check for Auth URL response
auth_response = mqtt.get_latest("/user2/0")
auth_url = None
if auth_response:
    if isinstance(auth_response, dict):
        auth_url = auth_response.get("auth_url")
    elif isinstance(auth_response, str):
        try:
            data = json.loads(auth_response)
            auth_url = data.get("auth_url")
        except:
            pass

if auth_url:
    st.success("Authentication Link Generated!")
    st.link_button("👉 Click to Authorize", auth_url)

row_idx = 0
for i, service in enumerate(services):
    with cols[i % 2]:
        with st.container():
            st.markdown(f"""
            <div class="glass-card">
                <h3>{service['icon']} {service['name']}</h3>
                <p>Status: Unknown</p>
            </div>
            """, unsafe_allow_html=True)
            if st.button(f"Connect {service['name']}", key=service['cmd']):
                mqtt.publish("/user1/0", service['cmd'])
                st.info("Request sent...")

# WhatsApp is special (external)
st.markdown("---")
st.markdown("### 💬 WhatsApp")
st.link_button("Manage WhatsApp Integration", "https://waha.lumyx.my.id")
