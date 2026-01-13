import streamlit as st
from mqtt_manager import get_mqtt_manager
from utils import inject_custom_css
from streamlit_autorefresh import st_autorefresh
import json

st.set_page_config(page_title="Personalization | Alex", layout="wide")
inject_custom_css()
st_autorefresh(interval=1000, key="personalization_refresh")

mqtt = get_mqtt_manager()
st.title("Personalization")

if 'voice_init' not in st.session_state:
    mqtt.publish("agent/voice/list", "get")
    st.session_state['voice_init'] = True

voices_raw = mqtt.get_latest("agent/voice/list/response")
voices = []

if voices_raw:
    if isinstance(voices_raw, list):
        voices = voices_raw
    else:
        try:
            voices = json.loads(voices_raw)
        except:
             # Fallback mock
             voices = ["Puck", "Charon", "Kore", "Fenrir", "Aoede"]

st.subheader("Voice Selection")
st.write("Choose your agent's voice personality.")

if not voices:
    st.warning("Fetching voices...")
else:
    # 3 Column Grid
    cols = st.columns(3)
    for idx, voice in enumerate(voices):
        with cols[idx % 3]:
            # Using radio or button? Button is better for "Set Action"
            if st.button(f"🗣 {voice}", use_container_width=True):
                mqtt.publish("agent/voice/set", voice)
                st.toast(f"Voice set to {voice}")

# Current Status
status = mqtt.get_latest("agent/voice/status")
if status:
    st.success(f"Response: {status}")
