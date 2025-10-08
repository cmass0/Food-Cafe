@echo off
setlocal
set PORT=9222
set USER_DATA_DIR=%TEMP%\edge-mcp
start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=%PORT% --user-data-dir="%USER_DATA_DIR%"
if %ERRORLEVEL% neq 0 start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --remote-debugging-port=%PORT% --user-data-dir="%USER_DATA_DIR%"
