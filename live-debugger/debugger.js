/**
 * Live Debug Panel - Reusable Web Debugger
 * Version: 1.0.0
 * Author: MemoryOS
 * License: MIT
 * 
 * Tracks all user interactions, htmx events, network requests, and errors in real-time.
 * Displays in a draggable console panel with color-coded events.
 * 
 * Usage:
 *   <script src="debugger.js"></script>
 *   <script>
 *     LiveDebugger.init({
 *       enabled: true,              // Start enabled (default: from localStorage)
 *       maxEntries: 100,            // Max log entries (default: 100)
 *       persistLogs: false,         // Save to localStorage (default: false)
 *       sendToServer: false,        // POST logs to server (default: false)
 *       serverEndpoint: '/api/logs' // Endpoint for server logging
 *     });
 *   </script>
 */

const LiveDebugger = {
    // Configuration
    config: {
        enabled: localStorage.getItem('live-debugger-enabled') === 'true',
        maxEntries: 100,
        persistLogs: false,
        sendToServer: false,
        serverEndpoint: '/api/debug-logs',
        logLevel: 'ALL' // ALL, INFO, WARN, ERROR
    },

    // State
    panel: null,
    logContainer: null,
    entries: [],
    sessionId: Date.now().toString(36),
    
    // Event type colors
    colors: {
        INIT: '#8FC22A',
        CLICK: '#D67008',
        INPUT: '#668DED',
        KEY: '#DEFF63',
        FORM: '#FFFFE8',
        HTMX: '#D67008',
        FETCH: '#668DED',
        ERROR: '#ff6b6b',
        WARN: '#D67008',
        INFO: '#8FC22A',
        DEBUG: '#888'
    },

    /**
     * Initialize the debugger
     */
    init(options = {}) {
        // Merge options
        Object.assign(this.config, options);
        
        // Inject HTML
        this.injectHTML();
        
        // Setup event listeners
        this.setupListeners();
        
        // Restore persisted logs
        if (this.config.persistLogs) {
            this.restoreLogs();
        }
        
        this.addLog('INIT', `Live Debugger v1.0.0 initialized (session: ${this.sessionId})`, this.colors.INIT);
    },

    /**
     * Inject the debug panel HTML
     */
    injectHTML() {
        // Create panel
        const panel = document.createElement('div');
        panel.id = 'live-debug-panel';
        panel.style.cssText = `
            display: ${this.config.enabled ? 'block' : 'none'};
            position: fixed;
            bottom: 0;
            right: 0;
            width: 450px;
            max-height: 70vh;
            background: #2d3d4a;
            color: #8FC22A;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            border: 2px solid #8FC22A;
            border-radius: 8px 0 0 0;
            overflow: hidden;
            z-index: 999999;
            box-shadow: 0 -4px 20px rgba(143, 194, 42, 0.2);
            resize: both;
        `;

        panel.innerHTML = `
            <div id="debug-header" style="background: #3d4f5f; padding: 8px; border-bottom: 1px solid #8FC22A; display: flex; justify-content: space-between; align-items: center; cursor: move;">
                <strong style="color: #8FC22A;">LIVE DEBUG CONSOLE</strong>
                <div>
                    <button id="debug-export" style="padding: 2px 8px; background: #668DED; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px; margin-right: 4px;">Export</button>
                    <button id="debug-clear" style="padding: 2px 8px; background: #D67008; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px; margin-right: 4px;">Clear</button>
                    <button id="debug-close" style="padding: 2px 8px; background: #556677; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 10px;">✕</button>
                </div>
            </div>
            <div id="debug-log" style="padding: 8px; overflow-y: auto; max-height: calc(70vh - 40px); line-height: 1.4;"></div>
        `;

        document.body.appendChild(panel);
        
        this.panel = panel;
        this.logContainer = document.getElementById('debug-log');

        // Make draggable
        this.makeDraggable();

        // Add toggle button to page
        this.addToggleButton();
    },

    /**
     * Add toggle button to page header
     */
    addToggleButton() {
        // Try to find nav or header
        const nav = document.querySelector('nav, header .nav-links, header');
        if (nav) {
            const btn = document.createElement('button');
            btn.id = 'live-debug-toggle';
            btn.innerHTML = 'Debug';
            btn.style.cssText = `
                padding: 6px 12px;
                background: #8FC22A;
                color: #2d3d4a;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: bold;
                margin-left: 10px;
            `;
            btn.addEventListener('click', () => this.toggle());
            nav.appendChild(btn);
        }
    },

    /**
     * Make panel draggable
     */
    makeDraggable() {
        const header = document.getElementById('debug-header');
        let isDragging = false;
        let currentX, currentY, initialX, initialY;

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            initialX = e.clientX - this.panel.offsetLeft;
            initialY = e.clientY - this.panel.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                this.panel.style.left = currentX + 'px';
                this.panel.style.top = currentY + 'px';
                this.panel.style.right = 'auto';
                this.panel.style.bottom = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    },

    /**
     * Setup all event listeners
     */
    setupListeners() {
        // Clear button
        document.getElementById('debug-clear').addEventListener('click', () => {
            this.entries = [];
            this.logContainer.innerHTML = '';
            this.addLog('CLEAR', 'Debug log cleared', this.colors.INFO);
        });

        // Close button
        document.getElementById('debug-close').addEventListener('click', () => {
            this.toggle();
        });

        // Export button
        document.getElementById('debug-export').addEventListener('click', () => {
            this.exportLogs();
        });

        // Track clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('#live-debug-panel')) return; // Ignore debug panel clicks
            
            const target = e.target;
            const tagName = target.tagName.toLowerCase();
            const id = target.id ? `#${target.id}` : '';
            const classes = target.className ? `.${Array.from(target.classList).join('.')}` : '';
            const text = target.textContent ? target.textContent.trim().substring(0, 40) : '';
            
            this.addLog('CLICK', `${tagName}${id}${classes} - "${text}"`, this.colors.CLICK);
            
            // Check htmx attributes
            if (target.hasAttribute('hx-get')) {
                this.addLog('HTMX', `Element has hx-get="${target.getAttribute('hx-get')}"`, this.colors.HTMX);
            }
            if (target.hasAttribute('hx-post')) {
                this.addLog('HTMX', `Element has hx-post="${target.getAttribute('hx-post')}"`, this.colors.HTMX);
            }
        }, true);

        // Track input changes
        document.addEventListener('input', (e) => {
            if (e.target.closest('#live-debug-panel')) return;
            
            if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') {
                const id = e.target.id || e.target.name || 'unnamed';
                const value = e.target.value.substring(0, 50);
                this.addLog('INPUT', `${id} = "${value}"`, this.colors.INPUT);
            }
        }, true);

        // Track form submissions
        document.addEventListener('submit', (e) => {
            this.addLog('FORM', `Form submitted: ${e.target.action || 'no action'}`, this.colors.FORM);
        }, true);

        // Track keyboard events
        document.addEventListener('keydown', (e) => {
            if (['Enter', 'Escape', '/'].includes(e.key)) {
                this.addLog('KEY', `${e.key} pressed on ${e.target.tagName}${e.target.id ? '#' + e.target.id : ''}`, this.colors.KEY);
            }
        }, true);

        // htmx events (if htmx is present)
        if (typeof htmx !== 'undefined') {
            this.setupHtmxListeners();
        }

        // Fetch/XHR tracking
        this.interceptFetch();
        this.interceptXHR();

        // Error tracking
        window.addEventListener('error', (e) => {
            this.addLog('ERROR', `${e.message} at ${e.filename}:${e.lineno}:${e.colno}`, this.colors.ERROR);
        });

        window.addEventListener('unhandledrejection', (e) => {
            this.addLog('ERROR', `Unhandled rejection: ${e.reason}`, this.colors.ERROR);
        });
    },

    /**
     * Setup htmx-specific listeners
     */
    setupHtmxListeners() {
        document.body.addEventListener('htmx:configRequest', (e) => {
            const url = e.detail.path;
            const params = new URLSearchParams(e.detail.parameters).toString();
            this.addLog('HTMX', `Config: ${url}?${params}`, this.colors.HTMX);
        });

        document.body.addEventListener('htmx:beforeRequest', (e) => {
            const url = e.detail.pathInfo ? e.detail.pathInfo.requestPath : 'unknown';
            this.addLog('HTMX', `Request: ${url}`, this.colors.HTMX);
        });

        document.body.addEventListener('htmx:afterRequest', (e) => {
            const status = e.detail.xhr.status;
            const statusColor = status >= 200 && status < 300 ? this.colors.INFO : this.colors.ERROR;
            const responseLength = e.detail.xhr.responseText.length;
            const url = e.detail.pathInfo ? e.detail.pathInfo.requestPath : 'unknown';
            this.addLog('HTMX', `${status} from ${url} (${responseLength} bytes)`, statusColor);
            
            if (status >= 400) {
                const preview = e.detail.xhr.responseText.substring(0, 200);
                this.addLog('ERROR', preview, this.colors.ERROR);
            }
        });

        document.body.addEventListener('htmx:beforeSwap', (e) => {
            const targetId = e.detail.target.id || e.detail.target.className || 'unknown';
            this.addLog('HTMX', `Swapping into: ${targetId}`, this.colors.HTMX);
        });

        document.body.addEventListener('htmx:responseError', (e) => {
            this.addLog('ERROR', `htmx response error: ${e.detail.xhr.status}`, this.colors.ERROR);
        });

        document.body.addEventListener('htmx:sendError', (e) => {
            this.addLog('ERROR', `htmx send error: ${e.detail.error}`, this.colors.ERROR);
        });
    },

    /**
     * Intercept fetch API
     */
    interceptFetch() {
        const originalFetch = window.fetch;
        const self = this;
        window.fetch = function(...args) {
            self.addLog('FETCH', `>> ${args[0]}`, self.colors.FETCH);
            return originalFetch.apply(window, args)
                .then(response => {
                    const color = response.ok ? self.colors.INFO : self.colors.ERROR;
                    self.addLog('FETCH', `<< ${response.status} ${args[0]}`, color);
                    return response;
                })
                .catch(error => {
                    self.addLog('ERROR', `Fetch error: ${error.message}`, self.colors.ERROR);
                    throw error;
                });
        };
    },

    /**
     * Intercept XMLHttpRequest
     */
    interceptXHR() {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url) {
            this._debugUrl = url;
            this._debugMethod = method;
            return originalOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function() {
            LiveDebugger.addLog('XHR', `>> ${this._debugMethod} ${this._debugUrl}`, LiveDebugger.colors.FETCH);
            
            this.addEventListener('load', function() {
                const color = this.status >= 200 && this.status < 300 ? LiveDebugger.colors.INFO : LiveDebugger.colors.ERROR;
                LiveDebugger.addLog('XHR', `<< ${this.status} ${this._debugUrl}`, color);
            });
            
            this.addEventListener('error', function() {
                LiveDebugger.addLog('ERROR', `XHR error: ${this._debugUrl}`, LiveDebugger.colors.ERROR);
            });
            
            return originalSend.apply(this, arguments);
        };
    },

    /**
     * Main logging function
     */
    addLog(type, message, color = this.colors.INFO) {
        const timestamp = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit', 
            fractionalSecondDigits: 3 
        });
        
        const entry = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            type: type,
            message: message,
            color: color
        };
        
        this.entries.push(entry);
        
        // Limit entries
        if (this.entries.length > this.config.maxEntries) {
            this.entries.shift();
        }

        // Persist if enabled
        if (this.config.persistLogs) {
            this.persistLogs();
        }

        // Send to server if enabled
        if (this.config.sendToServer) {
            this.sendToServer(entry);
        }

        // Render to panel
        const div = document.createElement('div');
        div.style.cssText = 'margin-bottom: 4px; border-bottom: 1px solid #333; padding-bottom: 4px;';
        div.innerHTML = `<span style="color: #666;">${timestamp}</span> <span style="color: ${color}; font-weight: bold;">[${type}]</span> ${this.escapeHtml(message)}`;
        
        this.logContainer.appendChild(div);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;

        // Console log
        console.log(`[${type}] ${message}`);
    },

    /**
     * Toggle panel visibility
     */
    toggle() {
        this.config.enabled = !this.config.enabled;
        localStorage.setItem('live-debugger-enabled', this.config.enabled);
        this.panel.style.display = this.config.enabled ? 'block' : 'none';
        
        if (this.config.enabled) {
            this.addLog('INFO', 'Debug panel enabled', this.colors.INFO);
        }
    },

    /**
     * Export logs to JSON file
     */
    exportLogs() {
        const data = {
            sessionId: this.sessionId,
            exportedAt: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            entries: this.entries
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${this.sessionId}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.addLog('INFO', `Exported ${this.entries.length} log entries`, this.colors.INFO);
    },

    /**
     * Persist logs to localStorage
     */
    persistLogs() {
        try {
            localStorage.setItem('live-debugger-logs', JSON.stringify(this.entries));
        } catch (e) {
            console.error('Failed to persist logs:', e);
        }
    },

    /**
     * Restore logs from localStorage
     */
    restoreLogs() {
        try {
            const stored = localStorage.getItem('live-debugger-logs');
            if (stored) {
                this.entries = JSON.parse(stored);
                this.entries.forEach(entry => {
                    const div = document.createElement('div');
                    div.style.cssText = 'margin-bottom: 4px; border-bottom: 1px solid #333; padding-bottom: 4px;';
                    const time = new Date(entry.timestamp).toLocaleTimeString('en-US', { 
                        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 
                    });
                    div.innerHTML = `<span style="color: #666;">${time}</span> <span style="color: ${entry.color}; font-weight: bold;">[${entry.type}]</span> ${this.escapeHtml(entry.message)}`;
                    this.logContainer.appendChild(div);
                });
            }
        } catch (e) {
            console.error('Failed to restore logs:', e);
        }
    },

    /**
     * Send log entry to server
     */
    sendToServer(entry) {
        if (!this.config.serverEndpoint) return;
        
        fetch(this.config.serverEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
        }).catch(err => {
            console.error('Failed to send log to server:', err);
        });
    },

    /**
     * Escape HTML for safe rendering
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Auto-initialize if script is loaded with data-auto-init
if (document.currentScript && document.currentScript.hasAttribute('data-auto-init')) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => LiveDebugger.init());
    } else {
        LiveDebugger.init();
    }
}
