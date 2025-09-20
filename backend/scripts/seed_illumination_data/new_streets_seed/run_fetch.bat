@echo off
echo 🔄 Fetching New Streets Data...
echo.

cd /d "%~dp0"

echo Setting environment variables...
set SUPABASE_URL=https://your-project.supabase.co
set SUPABASE_KEY=your-anon-key

echo.
echo ⚠️  Please update the SUPABASE_URL and SUPABASE_KEY in this batch file first!
echo.

echo Fetching streets data...
python fetch_new_streets.py

echo.
echo Fetching street segments data...
python fetch_new_street_segments.py

echo.
echo ✅ Done! Check the generated JSON files.
echo.
pause
