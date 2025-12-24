# Live Debugger

A drop-in JavaScript debugging console that tracks user interactions in real-time.

**Version:** 1.0.0 | **License:** MIT

---

## What This Is

**A JavaScript file for developers to add to their own web projects.**

| It IS | It is NOT |
|-------|-----------|
| A .js file you add to your project | A browser extension |
| For debugging your own web apps | For debugging other websites |
| A development/testing tool | An end-user product |

---

## How to Use It

### Step 1: Get the file

```bash
# Download directly
curl -O https://raw.githubusercontent.com/kckassette/MemorySpaceFeatures/main/live-debugger/debugger.js

# Or clone the repo
git clone https://github.com/kckassette/MemorySpaceFeatures.git
```

### Step 2: Add to your HTML

```html
<script src="debugger.js"></script>
<script>
    LiveDebugger.init({ enabled: true });
</script>
```

### Step 3: Open your app in any browser

Works in Chrome, Firefox, Safari, Edge. No extension needed.

### Step 4: See the debug panel

A "Debug" button appears in your nav. Click it to open the console. Every interaction is logged in real-time.

---

## Privacy & Data Handling

**This tool is 100% local by default.**

| Mode | Where Data Goes | Who Can See It |
|------|-----------------|----------------|
| **Default** | Browser memory only | Only you, in your browser tab |
| `persistLogs: true` | Browser's localStorage | Only you, on your device |
| `sendToServer: true` | Your own server endpoint | You control the server |

- No external servers. No analytics. No tracking.
- Logs exist only in the browser tab while it's open
- Close the tab = logs are gone (unless you enable persistence)
- Export creates a local JSON file on your computer
- Server logging only works if YOU set up an endpoint

**The code is ~500 lines of vanilla JavaScript. Read it yourself:** [debugger.js](./debugger.js)

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
    enabled: true,              // Show panel on load
    maxEntries: 100,            // Max log entries to keep
    persistLogs: false,         // Save to localStorage
    sendToServer: false,        // POST to your server
    serverEndpoint: '/api/logs' // Your endpoint (only if sendToServer: true)
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
- **Close** - Hide the panel

---

## Try the Demo

Open `demo.html` in your browser to see it working.

---

## Integration

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for framework-specific examples (React, Vue, htmx, etc.)

---

## License

MIT - Use however you want.
