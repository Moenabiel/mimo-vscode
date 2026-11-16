# Your Local AI Business Platform — Beginner Guide

## What You Just Got

You now have a **self-hosted AI platform** running on your computer. It's like having your own private ChatGPT that:
- Runs 24/7 (survives restarts)
- Uses YOUR API keys (you control the costs)
- Stores everything locally (your data stays on your machine)
- Works from any browser (phone, tablet, another computer)

---

## Your First Steps (Do These Now)

### Step 1: Create Your Account
When the browser opens to `http://localhost:3000`:
1. Click **"Sign Up"**
2. Enter your name and email (this stays local — no external server)
3. Create a password
4. Click **"Create Account"**

You are now the admin.

### Step 2: Add Your API Keys
Go to **Settings** (gear icon, bottom-left) → **Connections**:

**For OpenAI (GPT-4, GPT-4o):**
1. Get a key from https://platform.openai.com/api-keys
2. Paste it in the "OpenAI API Key" field
3. Click Save

**For Anthropic (Claude):**
1. Get a key from https://console.anthropic.com/settings/keys
2. Paste it in the "Anthropic API Key" field
3. Click Save

**For Google (Gemini):**
1. Get a key from https://aistudio.google.com/apikey
2. Paste it in the "Google API Key" field
3. Click Save

### Step 3: Start Chatting
1. Click **"New Chat"** (top-left)
2. Select a model from the dropdown (e.g., "gpt-4o" or "claude-sonnet-4")
3. Type your message and press Enter
4. That's it — you're chatting with AI

---

## Day-to-Day Usage

### Switching Models
- Click the model name at the top of the chat
- Pick any model you've configured
- Different models for different tasks:
  - **GPT-4o** — general purpose, fast
  - **Claude Sonnet** — writing, analysis
  - **Gemini Pro** — research, large context
  - **Local models** (free, no API cost) — simple tasks

### Organizing Chats
- **Folders**: Right-click a chat → "Move to Folder"
- **Search**: Use the search bar to find old conversations
- **Export**: Settings → Data → Export all chats

### Sharing with Others
- Your phone/tablet can access `http://YOUR-COMPUTER-IP:3000`
- Find your IP: `ipconfig` in Command Prompt
- Example: `http://192.168.1.50:3000`

---

## Docker Commands You'll Need

Think of Docker like an app store that runs apps in boxes (containers).

### Check if Open WebUI is running
```
docker ps
```
You should see `open-webui` with status "Up"

### Stop Open WebUI
```
docker stop open-webui
```

### Start it again
```
docker start open-webui
```

### Restart it (if something breaks)
```
docker restart open-webui
```

### See what's happening (logs)
```
docker logs open-webui
```

### Remove it completely (nuclear option)
```
docker stop open-webui
docker rm open-webui
```
⚠️ This deletes your chat history too

---

## Adding Free Local Models (Ollama)

When you're ready to run models WITHOUT paying API costs:

### Install Ollama
```
winget install Ollama.Ollama
```
Restart your computer after install.

### Pull a model
```
ollama pull llama3
```
This downloads a free AI model to your computer.

### Open WebUI auto-detects Ollama
- Go to Settings → Connections
- Ollama should appear at `http://localhost:11434`
- Toggle it ON
- Now you can chat with free local models

### Available free models
| Model | Size | Good For |
|-------|------|----------|
| llama3 | 4.7GB | General purpose |
| mistral | 4.1GB | Fast, efficient |
| phi3 | 2.2GB | Small, quick tasks |
| codellama | 3.8GB | Coding help |

---

## Troubleshooting

### "Docker is not running"
- Open Docker Desktop from Start Menu
- Wait for the whale icon in system tray to stop animating
- Try again

### "Port 3000 is already in use"
```
docker stop open-webui
docker rm open-webui
docker run -d -p 3000:3000 -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main
```

### "Page won't load"
1. Check Docker is running: `docker ps`
2. Check container status: should say "Up" and "(healthy)"
3. Try: `docker restart open-webui`
4. Wait 30 seconds, refresh browser

### "Can't connect from phone"
1. Make sure phone is on same WiFi
2. Find your computer's IP: `ipconfig`
3. Use `http://YOUR-IP:3000`
4. Check Windows Firewall isn't blocking port 3000

---

## What's Running Right Now

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Open WebUI | 3000 | http://localhost:3000 | Chat interface |
| (Ollama) | 11434 | http://localhost:11434 | Free local models (install later) |

---

## Quick Reference Card

```
START:   docker start open-webui
STOP:    docker stop open-webui
RESTART: docker restart open-webui
STATUS:  docker ps
LOGS:    docker logs open-webui
OPEN:    http://localhost:3000
```

---

*Created for Quality House — Sudanese Agricultural Export Company*
*Your AI business assistant, running locally 24/7*
