@echo off
echo 🔄 Auto-replacing illumination_data.json...
echo.

cd /d "%~dp0"
python auto_replace_file.py

echo.
echo Press any key to exit...
pause >nul
