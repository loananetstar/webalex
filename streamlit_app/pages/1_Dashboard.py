import streamlit as st
from mqtt_manager import get_mqtt_manager
from utils import inject_custom_css, render_glass_card
from streamlit_autorefresh import st_autorefresh
import json

st.set_page_config(page_title="Dashboard | Alex", layout="wide")
inject_custom_css()
st_autorefresh(interval=1000, key="dashboard_refresh")

mqtt = get_mqtt_manager()

st.title("Dashboard")

# Request Data on Load (Debounced efficiently by checking if we have recent data, handling in pure python loop is better but here we just blast it once per session or rely on cached)
if 'dashboard_init' not in st.session_state:
    mqtt.publish("dashboard/request", "get")
    mqtt.publish("alex/dashboard/state/request", "1")
    mqtt.publish("device/battery/request", "1")
    st.session_state['dashboard_init'] = True

# --- Agent Status Section ---
col_status, col_weather = st.columns([2, 1])

with col_status:
    # Fetch Data
    agent_state_raw = mqtt.get_latest("alex/dashboard/state")
    agent_state = "UNKNOWN"
    if agent_state_raw:
        if isinstance(agent_state_raw, dict):
            agent_state = agent_state_raw.get("state", "UNKNOWN")
        else:
            # Handle plain string if legacy
            try:
                msg = json.loads(agent_state_raw)
                agent_state = msg.get("state", "UNKNOWN")
            except:
                agent_state = str(agent_state_raw)

    st.markdown("### Agent Status")
    
    # Visual Indicator
    if agent_state == "listening" or agent_state == "FACE_VERIFIED":
        st.success(f"Agent Active: {agent_state}")
    else:
        st.warning(f"Agent Standby: {agent_state}")

    # Controls
    c1, c2 = st.columns(2)
    with c1:
        if st.button("🔴 Stop Agent (AGENTOFF)", use_container_width=True):
            mqtt.publish("/agent/1", "AGENTOFF")
            st.toast("Sent AGENTOFF command")
    with c2:
        if st.button("🟢 Start Agent (AGENTON)", use_container_width=True):
            mqtt.publish("/agent/1", "AGENTON")
            st.toast("Sent AGENTON command")

with col_weather:
    st.markdown("### Environment")
    dash_data = mqtt.get_latest("dashboard/response")
    
    weather_txt = "Loading..."
    temp_txt = "--"
    
    if dash_data and isinstance(dash_data, dict):
        w = dash_data.get("weather", {})
        weather_txt = w.get("condition", "Unknown")
        temp_txt = f"{w.get('temperature', 0)}°C"

    render_glass_card(f"""
        <div style="text-align: center;">
            <span style="font-size: 2em;">⛅</span>
            <h4>{weather_txt}</h4>
            <h1>{temp_txt}</h1>
        </div>
    """)

# --- Battery & System ---
st.markdown("---")
st.markdown("### System Health")
batt_data = mqtt.get_latest("device/battery/response")
batt_level = 100
is_charging = False

if batt_data:
    if isinstance(batt_data, dict):
        batt_level = batt_data.get("level", 100)
        is_charging = batt_data.get("charging", False)

m1, m2, m3 = st.columns(3)
m1.metric("Battery Level", f"{batt_level}%", f"{'⚡ Charging' if is_charging else 'Discharging'}")
m2.metric("MQTT Latency", "45ms", "Stable")
m3.metric("Uptime", "12h 30m")

# --- Recent Activity (Mockup based on feed) ---
st.markdown("### Recent Activity")
hist_raw = mqtt.get_latest("history/1") # Assuming history feeds here too or we mocked it
# For now, just placeholder
st.info("Waiting for recent activity feed...")

