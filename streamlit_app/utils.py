import streamlit as st

def inject_custom_css():
    st.markdown("""
        <style>
            /* Force Dark Theme Variables */
            :root {
                --primary-color: #be185d;
                --background-color: #1a0b10;
                --secondary-background-color: #14080c;
                --text-color: #ffffff;
                --font: "Plus Jakarta Sans", sans-serif;
            }

            /* Main Content Background */
            .stApp {
                background: linear-gradient(180deg, #1a0b10 0%, #0f0508 100%);
                color: #ffffff;
            }
            
            /* Sidebar */
            [data-testid="stSidebar"] {
                background-color: #14080c;
                border-right: 1px solid #381a24;
            }
            [data-testid="stSidebar"] * {
                color: #fce7f3 !important;
            }
            
            /* Typography */
            h1, h2, h3, h4, h5, h6 {
                font-family: 'Plus Jakarta Sans', sans-serif !important;
                color: #ffffff !important;
            }
            p, div, label, span, li {
                font-family: 'Plus Jakarta Sans', sans-serif !important;
                color: #fce7f3; /* Dull white/pink */
            }
            
            /* Metrics & Cards */
            div.css-1r6slb0, div.stMetric {
                background-color: rgba(255, 255, 255, 0.03);
                border: 1px solid #381a24;
                border-radius: 1rem;
                padding: 1rem;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            }
            [data-testid="stMetricValue"] {
                color: #ffffff !important;
            }
            [data-testid="stMetricLabel"] {
                color: #be185d !important;
            }
            
            /* Buttons */
            .stButton > button {
                background-color: #381a24;
                color: #ffffff !important;
                border-radius: 0.75rem;
                border: 1px solid #502533;
                transition: all 0.2s;
            }
            .stButton > button:hover {
                background-color: #be185d;
                border-color: #be185d;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(190, 24, 93, 0.3);
            }
            .stButton > button:active {
                color: white !important;
            }
            
            /* Primary Button Override */
            .stButton > button[kind="primary"] {
                background-color: #be185d;
                border: none;
            }
            
            /* Expander */
            .streamlit-expanderHeader {
                background-color: #241217;
                border-radius: 0.5rem;
                color: white !important;
            }
            .streamlit-expanderContent {
                background-color: #1a0b10;
                border: 1px solid #381a24;
                color: white !important;
            }
            
            /* Tabs */
            .stTabs [data-baseweb="tab-list"] {
                gap: 10px;
            }
            .stTabs [data-baseweb="tab"] {
                background-color: #241217;
                border-radius: 8px 8px 0 0;
                color: #9d8a92;
                border: none;
            }
            .stTabs [aria-selected="true"] {
                background-color: #be185d !important;
                color: white !important;
            }
            
            /* JSON & Code */
            .stJson, .stCode {
                background-color: #0f0508 !important;
                border: 1px solid #381a24;
                border-radius: 8px;
            }

            /* Custom Classes */
            .glass-card {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 1.5rem;
                padding: 1.5rem;
                margin-bottom: 1rem;
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
            }
            
            /* Toast */
            .stToast {
                background-color: #381a24 !important;
                color: white !important;
            }
        </style>
    """, unsafe_allow_html=True)

def render_glass_card(content):
    st.markdown(f"""
        <div class="glass-card">
            {content}
        </div>
    """, unsafe_allow_html=True)
