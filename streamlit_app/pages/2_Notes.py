import streamlit as st
from mqtt_manager import get_mqtt_manager
from utils import inject_custom_css
from streamlit_autorefresh import st_autorefresh
import json

st.set_page_config(page_title="Smart Notes | Alex", layout="wide")
inject_custom_css()
st_autorefresh(interval=1000, key="notes_refresh")

mqtt = get_mqtt_manager()

st.title("Smart Notes System")

# --- Controls ---
c1, c2, c3 = st.columns([1, 1, 2])

with c1:
    if st.button("🎤 Start Recording", type="primary", use_container_width=True):
        mqtt.publish("/note/1", "NOTEON")
        st.toast("Recording Started...")
        st.session_state['recording'] = True

with c2:
    if st.button("⏹ Stop & Process", use_container_width=True):
        mqtt.publish("/note/1", "NOTEOFF")
        st.toast("Processing started...")
        st.session_state['recording'] = False

# --- Status Monitor ---
status_msg = mqtt.get_latest("/note/status")
if status_msg:
    if isinstance(status_msg, dict):
        # Format: {"status": "processing", "progress": 50, "step": "Generating Flashcards"}
        # Adjust based on actual payload schema
        progress = status_msg.get("progress", 0)
        message = status_msg.get("message", "Ready")
        
        st.info(f"Status: {message}")
        if isinstance(progress, (int, float)):
             st.progress(int(progress) if progress > 1 else int(progress * 100))
    else:
        st.write(f"Raw Status: {status_msg}")

# --- Artifact Visualization ---
st.markdown("---")
st.subheader("Generated Artifacts")

final_payload = mqtt.get_latest("gacor/1")

if final_payload:
    # Payload is likely a JSON with keys keys for artifacts
    data = final_payload
    if isinstance(data, str):
        try:
            data = json.loads(data)
        except:
            st.error("Invalid JSON in gacor/1")
            data = {}

    # Create Tabs
    tabs = st.tabs(["📝 Summary", "🗂 Flashcards", "❓ Quiz", "🗺 Mindmap", "🧠 Cornell"])

    with tabs[0]:
        # Summary
        summary = data.get("summary_md", data.get("summary", "**No summary available**"))
        st.markdown(summary)

    with tabs[1]:
        # Flashcards
        cards = data.get("flashcards", [])
        if cards:
            for idx, card in enumerate(cards):
                # Handle different flashcard formats (front/back or question/answer)
                q = card.get("front", card.get("question", f"Card {idx+1}"))
                a = card.get("back", card.get("answer", "No answer"))
                
                with st.expander(f"📌 {q}"):
                    st.markdown(f"**Answer:** {a}")
        else:
            st.info("No flashcards generated.")

    with tabs[2]:
        # Quiz
        quiz = data.get("quiz", [])
        if quiz:
            for i, q in enumerate(quiz):
                st.markdown(f"**Q{i+1}: {q.get('question', '')}**")
                options = q.get('options', [])
                answer = st.radio(f"Select answer for Q{i+1}", options, key=f"q_{i}")
                
                if st.button(f"Check Answer {i+1}"):
                    correct = q.get('correct_answer', '')
                    if answer == correct:
                        st.success("Correct!")
                    else:
                        st.error(f"Incorrect. The answer was: {correct}")
                st.markdown("---")
        else:
            st.info("No quiz generated.")

    with tabs[3]:
        # Mindmap (Mermaid)
        mermaid_code = data.get("mindmap", "")
        if mermaid_code:
            # Simple mermaid rendering
            st.markdown(f"```mermaid\n{mermaid_code}\n```")
            # Note: Native mermaid support needs a component, but st.markdown supports it in some versions or extensions.
            # We included streamlit-mermaid in requirements? No, I added it to my mental list but maybe not requirements.
            # I added `streamlit-mermaid` to requirements.txt in Step 53.
            import streamlit_mermaid as st_mermaid
            st_mermaid.st_mermaid(mermaid_code, height="500px")
        else:
            st.info("No mindmap generated.")

    with tabs[4]:
        # Cornell
        cornell = data.get("cornell", {})
        c1, c2 = st.columns([1, 2])
        with c1:
            st.markdown("### Cues/Keywords")
            for cue in cornell.get("cues", []):
                st.markdown(f"- **{cue}**")
        with c2:
            st.markdown("### Notes")
            st.markdown(cornell.get("notes", "No notes"))
            
        st.markdown("### Summary")
        st.info(cornell.get("summary", ""))

else:
    st.info("No data received yet. Start a recording to generate notes.")
