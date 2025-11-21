# Gigmaster — a Self-hosted Lyrics Library

Overview
- Node.js + Express backend
- Vue 3 + Vite frontend
- Lyrics stored as plain `.txt` files in a single flat directory (mounted into a volume)
- Per-song metadata stored in `.yaml` files alongside the `.txt` files
- Docker Compose and standalone install scripts included

Quickstart (Docker)
1. Add your `.txt` and optional `.yaml` files into the lyrics/ folder.
2. Run:
   docker-compose up -d --build
3. Backend: http://localhost:3000
   Frontend: http://localhost:5173

Standalone (no Docker)
- Use `install.sh` (Linux/macOS) or `install.ps1` (PowerShell 7) to set up Node and run the apps. See scripts for more.
