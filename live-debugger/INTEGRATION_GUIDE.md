# Live Debugger Integration Guide

Quick reference for integrating the Live Debugger into different projects.

## Quick Start (30 seconds)

### 1. Copy the file
```bash
cp operator-ui/plugins/live-debugger/debugger.js your-project/static/
```

### 2. Add to HTML
```html
<script src="/static/debugger.js"></script>
<script>
    LiveDebugger.init({ enabled: true });
</script>
```

### 3. Done! 
Click the 🐛 button to see all interactions.

---

## Framework-Specific Integrations

### htmx + Jinja2 (Current MemoryOS Setup)

**File:** `templates/base.html`

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
</head>
<body>
    <header>
        <nav>
            <a href="/">Home</a>
            <!-- Debug button will be auto-added here -->
        </nav>
    </header>

    <main>
        {% block content %}{% endblock %}
    </main>

    <!-- Add before closing body tag -->
    <script src="/static/debugger.js" data-auto-init></script>
</body>
</html>
```

### React

**App.js:**
```javascript
import { useEffect } from 'react';

function App() {
    useEffect(() => {
        // Load debugger script
        const script = document.createElement('script');
        script.src = '/debugger.js';
        script.onload = () => {
            window.LiveDebugger.init({
                enabled: process.env.NODE_ENV === 'development'
            });
        };
        document.body.appendChild(script);
    }, []);

    return (
        <div className="App">
            {/* Your app */}
        </div>
    );
}
```

### Vue 3

**main.js:**
```javascript
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);

// Load debugger
const script = document.createElement('script');
script.src = '/debugger.js';
script.onload = () => {
    window.LiveDebugger.init({
        enabled: import.meta.env.DEV
    });
};
document.head.appendChild(script);

app.mount('#app');
```

### Next.js

**_app.js:**
```javascript
import { useEffect } from 'react';
import Script from 'next/script';

function MyApp({ Component, pageProps }) {
    useEffect(() => {
        if (window.LiveDebugger) {
            window.LiveDebugger.init({
                enabled: process.env.NODE_ENV === 'development'
            });
        }
    }, []);

    return (
        <>
            <Script 
                src="/debugger.js" 
                strategy="afterInteractive"
                onLoad={() => {
                    window.LiveDebugger?.init({
                        enabled: process.env.NODE_ENV === 'development'
                    });
                }}
            />
            <Component {...pageProps} />
        </>
    );
}

export default MyApp;
```

### Django

**base.html:**
```html
{% load static %}
<!DOCTYPE html>
<html>
<head>
    <title>{% block title %}My Site{% endblock %}</title>
</head>
<body>
    {% block content %}{% endblock %}

    <script src="{% static 'debugger.js' %}"></script>
    <script>
        LiveDebugger.init({
            enabled: {% if debug %}true{% else %}false{% endif %}
        });
    </script>
</body>
</html>
```

### Flask

**base.html:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>{% block title %}{% endblock %}</title>
</head>
<body>
    {% block content %}{% endblock %}

    <script src="{{ url_for('static', filename='debugger.js') }}"></script>
    <script>
        LiveDebugger.init({
            enabled: {{ 'true' if config['DEBUG'] else 'false' }}
        });
    </script>
</body>
</html>
```

---

## Advanced Configurations

### Development vs Production

```javascript
// Automatically detect environment
const isDev = 
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.port !== '';

LiveDebugger.init({
    enabled: isDev,
    maxEntries: isDev ? 500 : 50,
    persistLogs: isDev,
    sendToServer: !isDev
});
```

### QA/Staging Environment

```javascript
LiveDebugger.init({
    enabled: true,
    maxEntries: 1000,
    persistLogs: true,
    sendToServer: true,
    serverEndpoint: 'https://logging.yourapp.com/debug-logs'
});
```

### User-Controlled (Support Mode)

```javascript
// Add support mode toggle
const urlParams = new URLSearchParams(window.location.search);
const supportMode = urlParams.get('debug') === 'true';

LiveDebugger.init({
    enabled: supportMode,
    maxEntries: 1000,
    sendToServer: true
});

// Usage: https://yourapp.com/page?debug=true
```

### Feature Flag Integration

```javascript
// LaunchDarkly example
client.variation('enable-live-debugger', false, (enabled) => {
    LiveDebugger.init({
        enabled: enabled,
        sendToServer: enabled
    });
});
```

---

## Custom Event Logging

### Track Custom Business Events

```javascript
// Track checkout steps
document.getElementById('add-to-cart').addEventListener('click', () => {
    LiveDebugger.log('CHECKOUT', 'User added item to cart', '#4a90e2');
});

document.getElementById('checkout-btn').addEventListener('click', () => {
    LiveDebugger.log('CHECKOUT', 'User initiated checkout', '#4a90e2');
});

// Track errors in your code
try {
    await processPayment();
} catch (error) {
    LiveDebugger.log('PAYMENT', `Payment failed: ${error.message}`, '#ff0000');
    throw error;
}
```

### Track API Calls

```javascript
async function fetchUserData(userId) {
    LiveDebugger.log('API', `Fetching user ${userId}`, '#00bfff');
    
    try {
        const response = await fetch(`/api/users/${userId}`);
        const data = await response.json();
        
        LiveDebugger.log('API', `User ${userId} loaded successfully`, '#0f0');
        return data;
    } catch (error) {
        LiveDebugger.log('API', `Failed to load user ${userId}: ${error}`, '#ff0000');
        throw error;
    }
}
```

### Track Performance

```javascript
const startTime = performance.now();

await heavyOperation();

const duration = performance.now() - startTime;
const color = duration > 1000 ? '#ff0000' : '#0f0';
LiveDebugger.log('PERF', `Heavy operation took ${duration.toFixed(2)}ms`, color);
```

---

## Server-Side Setup

### FastAPI (Python)

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import json

app = FastAPI()

# Enable CORS for debugger
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["*"],
)

class DebugLogEntry(BaseModel):
    timestamp: str
    sessionId: str
    type: str
    message: str
    color: str

@app.post("/api/debug-logs")
async def receive_debug_log(entry: DebugLogEntry, request: Request):
    """Receive debug logs from clients"""
    
    # Add metadata
    log_data = entry.dict()
    log_data['ip'] = request.client.host
    log_data['user_agent'] = request.headers.get('user-agent')
    
    # Write to JSONL file
    with open(f"logs/debug_{entry.sessionId}.jsonl", "a") as f:
        f.write(json.dumps(log_data) + "\n")
    
    # Optional: Also log errors to database
    if entry.type == "ERROR":
        # await db.errors.insert_one(log_data)
        pass
    
    return {"status": "logged"}
```

### Express (Node.js)

```javascript
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

app.post('/api/debug-logs', async (req, res) => {
    try {
        const { timestamp, sessionId, type, message, color } = req.body;
        
        // Add metadata
        const logEntry = {
            ...req.body,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            receivedAt: new Date().toISOString()
        };
        
        // Create logs directory if needed
        const logDir = path.join(__dirname, 'logs');
        await fs.mkdir(logDir, { recursive: true });
        
        // Write to JSONL file
        const logFile = path.join(logDir, `debug_${sessionId}.jsonl`);
        await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
        
        // Log errors to console
        if (type === 'ERROR') {
            console.error(`[CLIENT ERROR] ${message}`);
        }
        
        res.json({ status: 'logged' });
    } catch (error) {
        console.error('Failed to log debug entry:', error);
        res.status(500).json({ error: 'Failed to log' });
    }
});

app.listen(3000);
```

---

## Troubleshooting

### Debugger Not Appearing

1. Check console for errors:
```javascript
console.log('LiveDebugger loaded:', typeof LiveDebugger !== 'undefined');
```

2. Verify initialization:
```javascript
LiveDebugger.init({ enabled: true });
LiveDebugger.toggle(); // Force show
```

3. Check if blocked by CSP:
```html
<meta http-equiv="Content-Security-Policy" 
      content="script-src 'self' 'unsafe-inline';">
```

### Events Not Logging

1. Check if panel is enabled:
```javascript
console.log('Debug enabled:', LiveDebugger.config.enabled);
```

2. Check max entries:
```javascript
console.log('Entries:', LiveDebugger.entries.length);
console.log('Max:', LiveDebugger.config.maxEntries);
```

3. Manually log test:
```javascript
LiveDebugger.log('TEST', 'Manual test log', '#ff00ff');
```

### htmx Events Not Showing

1. Verify htmx is loaded:
```javascript
console.log('htmx loaded:', typeof htmx !== 'undefined');
```

2. Initialize debugger AFTER htmx:
```html
<script src="https://unpkg.com/htmx.org@1.9.10"></script>
<script src="/debugger.js"></script>
<script>
    LiveDebugger.init({ enabled: true });
</script>
```

---

## Productization Checklist

- [ ] Add data masking for sensitive info
- [ ] Implement log level filtering
- [ ] Add search/filter UI
- [ ] Create backend log aggregation
- [ ] Build analytics dashboard
- [ ] Add session replay capability
- [ ] Implement rate limiting for server logs
- [ ] Create admin panel for viewing logs
- [ ] Add automated error alerting
- [ ] Document security best practices
- [ ] Create browser extension version
- [ ] Add TypeScript definitions
- [ ] Publish to npm registry
- [ ] Create demo site
- [ ] Write comprehensive docs

---

For more information, see [README.md](./README.md)
