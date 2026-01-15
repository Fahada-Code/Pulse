# 🎵 Pulse — YouTube Music Desktop Widget

Pulse is a lightweight, always-on-top desktop widget that lets you control **YouTube Music** without switching tabs or disrupting your workflow. It provides live track information, playback controls, and visual feedback in a minimal, unobtrusive UI that stays accessible while you work, game, or multitask.

Pulse bridges the gap between web-based music playback and a native desktop experience using Electron and a browser extension, creating a smooth, system-like mini music controller.

---

## ✨ Features

- Always-on-top desktop widget  
- Live track info (title, artist, album art, play state)  
- Play / pause / next / previous controls  
- Volume control  
- Auto-opens YouTube Music when controls are used  
- Visual music feedback (sound waves + animated borders while music plays)  
- Works while gaming or multitasking  
- Clean, minimal UI with minimize and close controls  

---

## 🧠 How It Works

Pulse uses a **hybrid architecture**:

- **Electron** renders the desktop widget  
- A **Chrome Extension** reads playback state from YouTube Music  
- **WebSocket communication** syncs data and controls in real time  

This design allows Pulse to feel native while still controlling a web-based music service.

---

## 🛠 Tech Stack

### Desktop
- **Electron**
- **HTML / CSS / JavaScript**
- **Canvas / Web Audio API** (visualizations)

### Browser Integration
- **Chrome Extension (Manifest V3)**
- **YouTube Music DOM hooks**

### Communication
- **WebSockets** (real-time playback sync)

### Tooling
- **Node.js**
- **Electron Builder**
- **npm**

---

## 🚀 Running Pulse (No Installer Needed)

Pulse runs as a **standalone app** using the `win-unpacked` build.

### Steps:
1. Download or clone the repository  
2. Open the `dist/win-unpacked` folder  
3. Double-click `Pulse.exe`  
4. (Optional) Create a desktop shortcut for easy access  

Pulse does **not** require YouTube Music to be open — it will automatically open it when you use playback controls.

---

## 🧩 Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build standalone app
npm run dist

# After building, the app will be in the dist/win-unpacked folder

