@echo off
echo Starting Alex Streamlit WebApp...
if not exist "venv\Scripts\python.exe" (
cc    echo Please ensure the venv is created in d:\alex\venv
    pause
    exit /b
)
echo Using venv python...
venv\Scripts\python.exe -m streamlit run streamlit_app\Alex.py
pause
