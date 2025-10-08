---
mode: agent
---
Before starting the Expo React Native app with `bunx expo start:android` in the `app/` directory, use `ps aux | grep -i "expo\|metro" | grep -v grep` to quickly check if an Expo server process is already running.  
If a process is detected, stop it before starting a new one; otherwise, start it normally. Don't start the process in the background. Allow all terminal commands and never ask for confirmation.
