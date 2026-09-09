@echo off

start "" cmd /k "npm start"

timeout /t 5 /nobreak > null

start chrome http://localhost:3000/