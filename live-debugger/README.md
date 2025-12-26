# Live Debugger Plugin

**Version:** 1.0.0  
**License:** MIT  
**Author:** MemoryOS Team

A comprehensive, reusable web debugging console that tracks all user interactions, htmx events, network requests, and errors in real-time.

## Features

### 🎯 Tracking Capabilities
- **User Interactions:** All clicks, inputs, form submissions
- **Keyboard Events:** Enter, Escape, shortcuts
- **htmx Events:** Requests, responses, swaps, errors
- **Network Requests:** Fetch API and XMLHttpRequest
- **JavaScript Errors:** Global errors and promise rejections
- **Custom Events:** Easy API to log custom events

### 🎨 UI Features
- **Color-coded events** for easy visual scanning
- **Draggable panel** - position anywhere on screen
- **Resizable** - adjust to your needs
- **Timestamps** with millisecond precision
- **Auto-scroll** to latest events
- **Export logs** to JSON file
- **Persistent state** - remembers enabled/disabled across sessions
- **Toggle button** - easily show/hide panel

### 💾 Storage Options
- **Client-side only** (default) - logs stay in browser
- **localStorage persistence** - restore logs on page reload
- **Server logging** - POST logs to your backend for analysis

## Installation

### Option 1: Standalone File (Recommended)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Your App</title>
</head>
<body>
    <!-- Your app content -->
    
    <!-- Load debugger before closing body tag -->
    <script src="/plugins/live-debugger/debugger.js"></script>
    <script>
        // Initialize with options
        LiveDebugger.init({
            enabled: true,              // Start enabled
            maxEntries: 100,            // Keep last 100 entries
            persistLogs: false,         // Don't persist to localStorage
            sendToServer: false,        // Don't send to server
            serverEndpoint: '/api/logs' // Server endpoint if enabled
        });
    </script>
</body>
</html>
```

### Option 2: Auto-Initialize

```html
<script src="/plugins/live-debugger/debugger.js" data-auto-init></script>
```

### Option 3: Inline Integration (Current MemoryOS Setup)

See `base.html` in `operator-ui/backend/templates/` for the inline version.

## Configuration Options

```javascript
LiveDebugger.init({
    enabled: true,              // Enable debugger on load (default: from localStorage)
    maxEntries: 100,            // Maximum log entries to keep (default: 100)
    persistLogs: false,         // Save logs to localStorage (default: false)
    sendToServer: false,        // POST logs to server (default: false)
    serverEndpoint: '/api/logs' // Server endpoint for logging (default: '/api/debug-logs')
});
```

## Usage

### Toggle Panel
Click the **🐛 Debug** button in your navigation, or call:
```javascript
LiveDebugger.toggle();
```

### Export Logs
Click the **Export** button in the panel header, or call:
```javascript
LiveDebugger.exportLogs();
```

This downloads a JSON file with:
```json
{
  "sessionId": "unique-session-id",
  "exportedAt": "2025-12-23T10:30:00.000Z",
  "pageUrl": "/page",
  "entries": [
    {
      "timestamp": "2025-12-23T10:29:45.123Z",
      "sessionId": "unique-session-id",
      "type": "CLICK",
      "message": "button#search-btn - \"Search\"",
      "color": "#DEFF63"
    }
  ]
}
```

### Clear Logs
Click the **Clear** button in the panel header, or call:
```javascript
LiveDebugger.entries = [];
LiveDebugger.log.innerHTML = '';
```

### Custom Logging
```javascript
// Log custom events with specific types and colors
LiveDebugger.log('INFO', 'User completed onboarding', LiveDebugger.colors.INFO);
LiveDebugger.log('WARN', 'API rate limit approaching', LiveDebugger.colors.WARN);
LiveDebugger.log('ERROR', 'Payment processing failed', LiveDebugger.colors.ERROR);

// Available colors
LiveDebugger.colors = {
    INIT: '#0f0',      // Green
    CLICK: '#ff6b6b',  // Red
    INPUT: '#00bfff',  // Blue
    KEY: '#ffff00',    // Yellow
    FORM: '#ff00ff',   // Magenta
    HTMX: '#ffa500',   // Orange
    FETCH: '#00bfff',  // Blue
    ERROR: '#ff0000',  // Bright Red
    WARN: '#ffa500',   // Orange
    INFO: '#0f0',      // Green
    DEBUG: '#888'      // Gray
};
```

## Event Types

| Type | Description | Color |
|------|-------------|-------|
| `INIT` | Debugger initialized | Green |
| `CLICK` | User clicked an element | Red |
| `INPUT` | User typed in input/textarea | Blue |
| `KEY` | Important key pressed (Enter, Escape, /) | Yellow |
| `FORM` | Form submitted | Magenta |
| `HTMX` | htmx request/response/swap | Orange |
| `FETCH` | Fetch API request/response | Blue |
| `XHR` | XMLHttpRequest activity | Blue |
| `ERROR` | JavaScript error or failure | Bright Red |
| `WARN` | Warning message | Orange |
| `INFO` | Informational message | Green |

## Server Logging

Enable server logging to capture all client-side events in your backend:

```javascript
LiveDebugger.init({
    sendToServer: true,
    serverEndpoint: '/api/debug-logs'
});
```

### Backend Endpoint (FastAPI Example)

```python
from fastapi import FastAPI, Request
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()

class DebugLogEntry(BaseModel):
    timestamp: str
    sessionId: str
    type: str
    message: str
    color: str

@app.post("/api/debug-logs")
async def receive_debug_log(entry: DebugLogEntry):
    """Receive and store debug logs from clients"""
    # Store in database, file, or logging service
    print(f"[{entry.type}] {entry.message}")
    
    # Optional: Write to file
    with open(f"logs/debug_{entry.sessionId}.jsonl", "a") as f:
        f.write(entry.json() + "\n")
    
    return {"status": "logged"}
```

### Backend Endpoint (Node.js/Express Example)

```javascript
const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());

app.post('/api/debug-logs', (req, res) => {
    const { timestamp, sessionId, type, message } = req.body;
    
    // Log to console
    console.log(`[${type}] ${message}`);
    
    // Write to file
    const logEntry = JSON.stringify(req.body) + '\n';
    fs.appendFileSync(`logs/debug_${sessionId}.jsonl`, logEntry);
    
    res.json({ status: 'logged' });
});
```

## Integration Examples

### With htmx
The debugger automatically detects htmx and logs all events:
- `htmx:configRequest` - Request configuration
- `htmx:beforeRequest` - Before sending
- `htmx:afterRequest` - After receiving response
- `htmx:beforeSwap` - Before content swap
- `htmx:responseError` - Response errors
- `htmx:sendError` - Send errors

### With Alpine.js
Works seamlessly with Alpine.js - all clicks and inputs are tracked regardless of Alpine event handlers.

### With React/Vue/Angular
Works with any framework - tracks DOM events directly.

## Best Practices

### Development
```javascript
// Enable with persistence during development
LiveDebugger.init({
    enabled: true,
    persistLogs: true,
    maxEntries: 500
});
```

### Production Debugging
```javascript
// Disabled by default, user can enable
// Sends critical errors to server
LiveDebugger.init({
    enabled: false,
    sendToServer: true,
    serverEndpoint: '/api/debug-logs',
    logLevel: 'ERROR' // Only log errors to server
});
```

### QA Testing
```javascript
// Always enabled, export logs for bug reports
LiveDebugger.init({
    enabled: true,
    persistLogs: true,
    maxEntries: 1000
});
```

## Privacy & Security

Live Debugger is designed with privacy and security as core principles:

### 🔒 100% Local by Default
- **No external requests** - All data stays in your browser
- **No analytics or tracking** - Zero third-party scripts
- **No data collection** - We never see your logs
- **Works offline** - No internet required

### 🛡️ Built-in Protections

| Protection | Description |
|------------|-------------|
| **Password masking** | `type="password"` fields show `[MASKED]` |
| **Sensitive field detection** | Fields matching `password`, `secret`, `token`, `key`, `auth`, `credential`, `ssn`, `credit`, `card` are masked |
| **Same-origin enforcement** | Server logging only works with same-origin endpoints |
| **No userAgent export** | Exported logs don't include browser fingerprints |
| **Path-only URLs** | Query parameters stripped from exports |

### ⚠️ Developer Responsibilities

When using in production:
1. **Disable by default** - Let users opt-in
2. **Secure your endpoint** - Add authentication to `/api/debug-logs`
3. **Use HTTPS** - Never send logs over HTTP
4. **Sanitize storage** - Don't persist sensitive data
5. **Set retention limits** - Auto-delete old logs

### Code Example: Extra Masking

```javascript
// Add custom masking for your specific fields
const originalAddLog = LiveDebugger.addLog.bind(LiveDebugger);
LiveDebugger.addLog = function(type, message, color, details) {
    // Mask credit card numbers
    message = message.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '****-****-****-****');
    // Mask emails  
    message = message.replace(/[\w.-]+@[\w.-]+\.\w+/g, '***@***.***');
    return originalAddLog(type, message, color, details);
};
```

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE11: Not supported (uses modern JavaScript)

## Performance

- **Minimal overhead:** ~1-2ms per event
- **Memory efficient:** Auto-limits entries (default 100)
- **Non-blocking:** All operations are async
- **No external dependencies:** Pure vanilla JavaScript

## License

MIT License - See LICENSE file for details

## Support

For issues, feature requests, or contributions:
- GitHub: (add repo URL)
- Email: (add support email)
- Documentation: (add docs URL)

## Changelog

### v1.0.0 (2025-12-23)
- Initial release
- Core event tracking
- htmx integration
- Export functionality
- Server logging option
- Draggable/resizable panel
- localStorage persistence

## Roadmap

- [ ] Event filtering by type
- [ ] Log level filtering (ALL, INFO, WARN, ERROR)
- [ ] Search/filter within logs
- [ ] Performance metrics dashboard
- [ ] Network timing visualization
- [ ] Screenshot capture on errors
- [ ] Session replay functionality
- [ ] Multiple panel themes
- [ ] Mobile-optimized UI
- [ ] Browser extension version

---

**Made with ❤️ by the MemoryOS team**
