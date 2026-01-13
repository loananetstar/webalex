import streamlit as st
from mqtt_manager import get_mqtt_manager
from utils import inject_custom_css
from streamlit_autorefresh import st_autorefresh

# Page Config
st.set_page_config(
    page_title="Alex AI",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Styling
inject_custom_css()

# Auto Refresh for polling MQTT
count = st_autorefresh(interval=2000, key="fizzbuzzcounter")

# MQTT
mqtt = get_mqtt_manager()

# Sidebar
with st.sidebar:
    st.image("https://lh3.googleusercontent.com/aida-public/AB6AXuBUn__IoZk5Ws-Lz4PLHWbjfTz0QeirxeDYNrsToYYudIS60nEN2t3G12gRSBsZLJpkaQd-8KwYtgNFtT-gvizxMQM5VfM9b3Vo18ck86laOUbZskDJ7NeQFsoeefDcNMjZ5Gow_mfnms-xO2Croicw9Rdx5jYU42qMXEuDoxZbNTtffwqNd0AK1N0sFI6H1l3FYNW452B0rrlSqr2qJy9A4aptgSrYwPh0Veybqlw7a85c_sY_Nbd0YBewrTW3nlXa54OY2M5JqjA", width=80)
    st.title("Alex")
    
    if mqtt.connected:
        st.success("Online")
    else:
        st.error("Offline")
        
    st.markdown("---")
    st.write("**System Status**")
    st.caption("MQTT v5 over WSS")
    st.caption(f"Client: {mqtt.client._client_id}")

# Main Content
st.title("Welcome back, Davin")
st.markdown("### Your advanced AI companion is ready.")

col1, col2 = st.columns(2)

with col1:
    st.markdown("""
    <div class="glass-card">
        <h3>🚀 Quick Start</h3>
        <p>Navigate to <b>Dashboard</b> to check system status.</p>
        <p>Go to <b>Notes</b> to start a collaborative session.</p>
    </div>
    """, unsafe_allow_html=True)

with col2:
    if mqtt.connected:
        st.markdown(f"""
        <div class="glass-card">
            <h3>📡 Connection Secure</h3>
            <p>Connected to <b>HiveMQ Cloud Cluster</b>.</p>
            <p>Latency: ~45ms</p>
        </div>
        """, unsafe_allow_html=True)
