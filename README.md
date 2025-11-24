<div align="center">
  <img src="frontend/public/logo.svg" alt="Gigmaster Logo" width="120" />
  <h1>Gigmaster</h1>
  <p><strong>A self-hosted, stage-ready lyrics library for musicians.</strong></p>

  ![Version](https://img.shields.io/badge/version-2025.11.23-blue?style=flat-square)
  ![Vue](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat-square&logo=vue.js)
  ![Node](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)
  ![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)
</div>

---

## 🎸 Overview

**Gigmaster** is a lightweight, responsive web application designed to manage and display lyrics during gigs or rehearsals. It is built to be self-hosted and uses a simple flat-file structure, making it easy to sync with tools like Dropbox, Syncthing, or simple FTP.

### ✨ Features
* **Dark Mode UI:** Optimized for low-light stage environments.
* **Card Grid Layout:** Easy touch navigation for song selection.
* **Auto-Scroll:** Hands-free lyric scrolling with adjustable speed.
* **Instant Search:** Filter by Title or Artist in real-time.
* **Flat-File DB:** Lyrics are `.txt` files; metadata is `.yaml`. No complex SQL database required.
* **Live Reload:** Add a file to the folder, and it appears instantly on all connected devices.

---

## 📂 Architecture

Gigmaster separates raw content from application logic.

```text
gigmaster/
├── lyrics/                 # 📂 YOUR CONTENT
│   ├── demo-Song.txt       # Song lyrics
│   └── properties/         # ⚙️ METADATA
│       └── demo-Song.yaml # Title, Artist, BPM, Key
├── backend/                # Node.js Express Server
└── frontend/               # Vue 3 + Vite App
├── Dockerfile              # builds the container
└── docker-compose.yml      # runs the container
```

---

## 🚀 Installation

### Option 1: Docker Compose (recommended)
1.  Add your files to the `lyrics/` folder.
2.  Run:
    ```bash
    docker-compose up -d --build
    ```

### Option 2: Standalone (for older systems)
*Requirements: Node.js 16+*

1.  **Run the installer:**
    * **Linux/macOS:** `chmod +x install.sh && ./install.sh`
    * **Windows:** Right-click `install.ps1` -> "Run with PowerShell"

2.  **Start the server:**
    ```bash
    node backend/src/index.js
    ```

3.  **Open in Browser:**
    Go to `http://localhost:3000`

---

## 🎵 Adding Songs

You can add songs via the **"Add Song"** button in the UI, or manually by creating files:

1.  Create `lyrics/mysong.txt` with the lyrics.
2.  (Optional) Create `lyrics/properties/mysong.yaml`:
    ```yaml
    title: My Song
    artist: The Band
    key: Am
    bpm: 120
    genre: Rock
    ```

---

## 📦 Contributing

Feel free to fork this project or contribute to it. If you decide to contribute, please create a seperate branch and a pull request. Thanks.

---

<div align="center">
  <sub>Built with passion and ❤️ for music by Gemini and <a href="https://github.com/rock-n-host">rock-n-host</a></sub>
</div>
