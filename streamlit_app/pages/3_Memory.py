import streamlit as st
from mqtt_manager import get_mqtt_manager
from utils import inject_custom_css
from streamlit_autorefresh import st_autorefresh
import json
import pandas as pd

st.set_page_config(page_title="Memory Core | Alex", layout="wide")
inject_custom_css()
st_autorefresh(interval=2000, key="memory_refresh")

mqtt = get_mqtt_manager()

st.title("Memory Core")

if 'memory_init' not in st.session_state:
    mqtt.publish("memory/base/request", "1")
    mqtt.publish("memory/activity/search", "all") # Assuming 'all' returns recent
    mqtt.publish("history/1", "get") # Trigger history update
    st.session_state['memory_init'] = True

tabs = st.tabs(["📜 Live History", "📊 Activity Log", "🧠 Base Memory"])

with tabs[0]:
    st.caption("Real-time conversation feed")
    history_raw = mqtt.get_latest("history/1")
    if history_raw:
        # Assuming history is a list of objects {role: "user"|"assistant", content: "..."}
        try:
            history = history_raw if isinstance(history_raw, list) else json.loads(history_raw)
            for msg in history:
                with st.chat_message(msg.get("role", "user")):
                    st.write(msg.get("content", ""))
        except:
            st.write(history_raw)
    else:
        st.info("No history loaded.")

with tabs[1]:
    st.caption("System events and actions")
    activity_raw = mqtt.get_latest("memory/activity/response")
    if activity_raw:
        try:
            activities = activity_raw if isinstance(activity_raw, list) else json.loads(activity_raw)
            df = pd.DataFrame(activities)
            st.dataframe(df, use_container_width=True)
        except:
            st.write(activity_raw)

with tabs[2]:
    st.caption("Core Facts & Identity")
    base_raw = mqtt.get_latest("memory/base/response")
    col1, col2 = st.columns(2)
    
    if base_raw:
        data = base_raw
        if isinstance(base_raw, str):
            try:
                data = json.loads(base_raw)
            except:
                pass
        
        # Display as JSON tree
        st.json(data)
