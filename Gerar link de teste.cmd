@echo off
powershell.exe -NoLogo -NoProfile -File "%~dp0scripts\gerar-link-teste.ps1"
if errorlevel 1 pause
