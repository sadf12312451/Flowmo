@echo off
call "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul
set PATH=C:\Users\admin\.cargo\bin;%PATH%
cd /d D:\my\flowmo
pnpm tauri dev
