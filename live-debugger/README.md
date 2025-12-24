# Live Debugger

A drop-in JavaScript debugging console that tracks user interactions in real-time.

**Version:** 1.0.0 | **License:** MIT

---

## Privacy & Data Handling

**This tool is 100% local by default.** Here's exactly where your data goes:

| Mode | Where Data Goes | Who Can See It |
|------|-----------------|----------------|
| **Default** | Browser memory only | Only you, in your browser tab |
| `persistLogs: true` | Browser's localStorage | Only you, on your device |
| `sendToServer: true` | Your own server endpoint | You control the server |

**What this means:**
- No external servers. No analytics. No tracking.
- Logs exist only in the browser tab while it's open
- Close the tab = logs are gone (unless you enable persistence)
- Export creates a local JSON file on your computer
- Server logging only works if YOU set up an endpoint

**The code is ~500 lines of vanilla JavaScript. Read it yourself:** [debugger.js](./debugger.js)

---

## Quick Start

### 1. Add to your HTML

```html
<script src="debugger.js"></script>
<script>
    LiveDebugger.init({ enabled: true });
</script>
```

### 2. Click the "Debug" button in your nav

### 3. Interact with your page - see every event logged

---

## What It Tracks

- **Clicks** - Every click with element details
- **Inputs** - Keystrokes in form fields
- **Forms** - Submissions
- **Keyboard** - Enter, Escape, / key
- **Network** - Fetch and XHR requests/responses
- **Errors** - JavaScript errors and promise rejections
- **htmx** - Full htmx event lifecycle (if htmx is present)

---

## Configuration

```javascript
LiveDebugger.init({
    enabled: true,              // Show panel on load (default: from localStorage)
    maxEntries: 100,            // Max log entries to keep (default: 100)
    persistLogs: false,         // Save to localStorage (default: false)
    sendToServer: false,        // POST to your server (default: false)
    serverEndpoint: '/api/logs' // Your endpoint (only used if sendToServer: true)
});
```

---

## Features

**Panel:**
- Draggable - move it anywhere
- Resizable - adjust the size
- Color-coded events for quick scanning
- Timestamps with millisecond precision

**Actions:**
- **Export** - Download logs as JSON file (saves to your computer)
- **Clear** - Wipe all logs from memory
- **Close** - Hide the panel (toggle with Debug button)

---

## Export Format

When you click Export, you get a JSON file like this:

```json
{
  "sessionId": "m5x7k2p",
  "exportedAt": "2025-12-23T10:30:00.000Z",
  "userAgent": "Mozilla/5.0...",
  "url": "http://localhost:3000/mypage",
  "entries": [
    {
      "timestamp": "2025-12-23T10:29:45.123Z",
      "type": "CLICK",
      "message": "button#submit - \"Save\""
    }
  ]
}
```

This file is saved to your local Downloads folder. It never leaves your machine unless you share it.

---

## Optional: Server Logging

If you want to collect logs on your own server:

```javascript
LiveDebugger.init({
    sendToServer: true,
    serverEndpoint: '/api/debug-logs'
});
```

Then create an endpoint on YOUR server to receive the logs. Example (FastAPI):

```python
@app.post("/api/debug-logs")
async def receive_log(entry: dict):
    print(f"[{entry['type']}] {entry['message']}")
    return {"status": "ok"}
```

You control the server. You control the data.

---

## Try the Demo

Open `demo.html` in your browser to see it working.

---

## Integration

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for framework-specific examples (React, Vue, htmx, etc.)

---

## License

MIT - Use however you want.
