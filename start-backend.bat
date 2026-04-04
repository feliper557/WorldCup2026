@echo off
cd /d "%~dp0api"
func start --port 7071 --cors "*"
