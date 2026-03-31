# Realtime Voice AI Starter

A minimal, production-style backend for building real-time voice AI systems using WebSockets and the OpenAI Realtime API.
---
## Full System Setup

This project is part of a modular AI system:

- realtime-voice-ai (interface)
- ai-agent-core (decision layer)
- ai-memory-backend (memory)

### Run all services

1. Start memory backend (port 8000)
2. Start agent core (port 8001)
3. Start voice server (port 3000)

### Flow

User → Voice → Agent → Memory → Response

This repository focuses on the interface layer of the system, handling real-time voice input and output.

## Why This Exists

Most AI examples today are text-based and request/response driven.

This project shows how to build a true real-time voice system, similar to modern AI assistants — where users can speak naturally and receive immediate responses.

## Architecture

```
Client (Mic / UI)
      ↓
WebSocket (/realtime)
      ↓
Node.js Server (this repo)
      ↓
OpenAI Realtime API
      ↓
Streaming responses back to client
```

## Features

- Real-time audio and text streaming  
- Low-latency AI responses  
- WebSocket-based architecture  
- Upstream message queueing (handles connection timing)  
- Simple and extensible backend structure  
- Minimal setup for local development  

---

# Setup

### 1. Clone the repo

```bash
git clone https://github.com/your-username/realtime-voice-ai.git
cd realtime-voice-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file:

```bash
touch .env
```

Add your OpenAI API key:

```env
OPENAI_API_KEY=your_api_key_here
PORT=3000
```

---

## Run the Server

```bash
npm start
```

You should see:

```
Server running on http://localhost:3000
```

---

## WebSocket Endpoint

```
ws://localhost:3000/realtime
```

Connect your client to this endpoint and send OpenAI Realtime-compatible events.

---

## Use Cases

- Voice assistants
- AI interview simulators
- Language learning apps
- Real-time translators
- Conversational agents

---

## 📌 Notes

- This is a **backend-only starter** — you can connect any frontend (web, iOS, Android, etc.)
- Designed to be simple, readable, and easy to extend
- No authentication or persistence included (by design)

---

## 🚧 Future Improvements

- Example frontend client
- Audio utilities (buffering, playback helpers)
- Interrupt handling / speaking state
- Multi-session support

---

## 📄 License

MIT