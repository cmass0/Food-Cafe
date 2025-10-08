@echo off
setlocal
set PORT=9222
set USER_DATA_DIR=%TEMP%\chrome-mcp
REM Try common Chrome locations
start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --remote-debugging-port=%PORT% --user-data-dir="%USER_DATA_DIR%"
if %ERRORLEVEL% neq 0 start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --remote-debugging-port=%PORT% --user-data-dir="%USER_DATA_DIR%"
if %ERRORLEVEL% neq 0 start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --remote-debugging-port=%PORT% --user-data-dir="%USER_DATA_DIR%"
