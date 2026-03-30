import express from "express";
import http from "http";
import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const REALTIME_MODEL = process.env.REALTIME_MODEL || "gpt-4o-realtime-preview";
const VOICE_NAME = process.env.VOICE_NAME || "alloy";

// ---- Serve static files ----
app.use(express.static("public"));

// ---- Root route ----
app.get("/", (req, res) => {
  res.sendFile(new URL("./public/index.html", import.meta.url).pathname);
});

// ---- WebSocket Server ----
const wss = new WebSocketServer({ server, path: "/realtime" });

// Default instructions (keep generic for OSS)
const DEFAULT_INSTRUCTIONS = `
You are a helpful, conversational AI assistant.
Respond naturally and clearly.
Keep responses concise and friendly.
`;

// Helper: safe send
function safeSend(ws, data) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

// ---- WebSocket Connection ----
wss.on("connection", async (clientWs) => {
  console.log("[client] connected");

  let upstreamWs = null;
  let upstreamReady = false;
  let upstreamQueue = [];

  // ---- Connect to OpenAI Realtime ----
  function connectUpstream() {
    const url = `wss://api.openai.com/v1/realtime?model=${REALTIME_MODEL}`;

    upstreamWs = new WebSocket(url, {
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "OpenAI-Beta": "realtime=v1"
      }
    });

    upstreamWs.on("open", () => {
      console.log("[upstream] connected");
      upstreamReady = true;

      // Send session config
      upstreamWs.send(JSON.stringify({
        type: "session.update",
        session: {
          instructions: DEFAULT_INSTRUCTIONS,
          modalities: ["audio", "text"],
          voice: VOICE_NAME,
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          input_audio_transcription: {
            model: "gpt-4o-mini-transcribe"
          },
          turn_detection: {
            type: "server_vad"
          }
        }
      }));

      // Flush queued messages
      upstreamQueue.forEach(msg => upstreamWs.send(msg));
      upstreamQueue = [];
    });

    upstreamWs.on("message", (data) => {
      let msg;

      try {
        msg = JSON.parse(data.toString());
      } catch (err) {
        console.error("[upstream] failed to parse message:", err.message);
        return;
      }

      // Forward everything back to client
      safeSend(clientWs, msg);
    });

    upstreamWs.on("close", (code, reasonBuffer) => {
      const reason = reasonBuffer?.toString?.() || "";
      console.log(`[upstream] disconnected ${code}${reason ? ` ${reason}` : ""}`);
    });

    upstreamWs.on("error", (err) => {
      console.error("[upstream] error:", err.message);
    });
  }

  connectUpstream();

  // ---- Handle client messages ----
  clientWs.on("message", (data) => {
    if (!upstreamWs) return;

    const message = data.toString();

    try {
      const parsed = JSON.parse(message);
      if (parsed?.type) {
        console.log(`[relay] client -> upstream: ${parsed.type}`);
      }
    } catch {
      console.log("[relay] client -> upstream: non-json message");
    }

    // If upstream not ready yet → queue
    if (!upstreamReady) {
      upstreamQueue.push(message);
      return;
    }

    upstreamWs.send(message);
  });

  clientWs.on("close", () => {
    console.log("[client] disconnected");
    if (upstreamWs) upstreamWs.close();
  });

  clientWs.on("error", (err) => {
    console.error("[client] error:", err.message);
  });
});

// ---- Start Server ----
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});