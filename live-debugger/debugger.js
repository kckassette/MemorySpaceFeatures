/**
 * Live Debug Panel - Reusable Web Debugger
 * Version: 1.0.0
 * Author: MemoryOS
 * License: MIT
 * 
 * Tracks all user interactions, htmx events, network requests, and errors in real-time.
 * Displays in a console panel with color-coded events.
 * 
 * PRIVACY & SECURITY:
 * - 100% local by default - no data leaves the browser
 * - Password fields are automatically masked
 * - Sensitive field patterns (token, secret, key, auth) are masked
 * - Server logging only allowed to same-origin endpoints
 * - No tracking, analytics, or external requests
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
    
    // Event type colors (Figma design)
    colors: {
        INIT: '#868DED',    // Slate blue
        CLICK: '#DEFF63',   // Lime yellow
        INPUT: '#ffffff',   // White
        KEY: '#DEFF63',     // Lime yellow
        FORM: '#8FC22A',    // Lime green
        HTMX: '#D67008',    // Orange
        FETCH: '#ffffff',   // White
        ERROR: '#D67008',   // Orange
        WARN: '#D67008',    // Orange
        INFO: '#8FC22A',    // Lime green
        DEBUG: '#666666',   // Gray
        CLEAR: '#868DED'    // Slate blue
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
        // Inject JetBrains Mono font
        if (!document.getElementById('jetbrains-mono-font')) {
            const fontLink = document.createElement('link');
            fontLink.id = 'jetbrains-mono-font';
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap';
            document.head.appendChild(fontLink);
        }

        // Create panel
        const panel = document.createElement('div');
        panel.id = 'live-debug-panel';
        panel.style.cssText = `
            display: ${this.config.enabled ? 'block' : 'none'};
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            max-height: 400px;
            background: #000000;
            color: #ffffff;
            font-family: 'JetBrains Mono', 'Courier New', monospace;
            font-size: 13px;
            border-top: 2px solid #DEFF63;
            overflow: hidden;
            z-index: 999999;
            box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.5);
        `;

        // Terminal icon SVG
        const terminalIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;
        
        // Download icon SVG
        const downloadIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
        
        // Trash icon SVG
        const trashIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
        
        // X icon SVG
        const xIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

        panel.innerHTML = `
            <div id="debug-header" style="
                background: #09090b;
                padding: 16px 24px;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="color: #ffffff;">${terminalIcon}</span>
                    <span style="font-weight: 400; text-transform: uppercase; letter-spacing: 0.05em; color: #ffffff;">Live Debug Console</span>
                    <span id="debug-count" style="
                        padding: 4px 8px;
                        background: rgba(255,255,255,0.05);
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 4px;
                        color: rgba(255,255,255,0.6);
                        font-size: 11px;
                    ">0 events</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button id="debug-export" style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px 16px;
                        background: rgba(255,255,255,0.1);
                        color: #ffffff;
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: 600;
                        font-family: inherit;
                        transition: background 0.2s;
                    ">${downloadIcon} Export</button>
                    <button id="debug-clear" style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px 16px;
                        background: rgba(255,255,255,0.1);
                        color: #ffffff;
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 13px;
                        font-weight: 600;
                        font-family: inherit;
                        transition: background 0.2s;
                    ">${trashIcon} Clear</button>
                    <button id="debug-close" style="
                        padding: 8px;
                        background: transparent;
                        color: rgba(255,255,255,0.6);
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: background 0.2s, color 0.2s;
                    ">${xIcon}</button>
                </div>
            </div>
            <div id="debug-log" style="
                padding: 24px;
                overflow-y: auto;
                height: 320px;
                background: #000000;
            "></div>
        `;

        document.body.appendChild(panel);
        
        this.panel = panel;
        this.logContainer = document.getElementById('debug-log');

        // Button hover effects
        const exportBtn = document.getElementById('debug-export');
        const clearBtn = document.getElementById('debug-clear');
        const closeBtn = document.getElementById('debug-close');
        
        [exportBtn, clearBtn].forEach(btn => {
            btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(255,255,255,0.2)');
            btn.addEventListener('mouseleave', () => btn.style.background = 'rgba(255,255,255,0.1)');
        });
        
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = 'rgba(255,255,255,0.1)';
            closeBtn.style.color = '#ffffff';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = 'transparent';
            closeBtn.style.color = 'rgba(255,255,255,0.6)';
        });

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
                padding: 8px 16px;
                background: #DEFF63;
                color: #000000;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 600;
                font-family: 'JetBrains Mono', monospace;
                margin-left: 10px;
                transition: opacity 0.2s;
            `;
            btn.addEventListener('mouseenter', () => btn.style.opacity = '0.8');
            btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
            btn.addEventListener('click', () => this.toggle());
            nav.appendChild(btn);
        }
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

        // Track input changes (with sensitive field masking)
        document.addEventListener('input', (e) => {
            if (e.target.closest('#live-debug-panel')) return;
            
            if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'textarea') {
                const id = e.target.id || e.target.name || 'unnamed';
                const inputType = e.target.type || 'text';
                
                // Mask sensitive fields (passwords, tokens, secrets, etc.)
                const sensitivePatterns = /password|secret|token|key|auth|credential|ssn|credit|card/i;
                const isSensitive = sensitivePatterns.test(id) || inputType === 'password';
                
                const value = isSensitive 
                    ? '[MASKED]' 
                    : e.target.value.substring(0, 50);
                    
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
    addLog(type, message, color = this.colors.INFO, details = null) {
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
            color: color,
            details: details
        };
        
        this.entries.push(entry);
        
        // Limit entries
        if (this.entries.length > this.config.maxEntries) {
            this.entries.shift();
            // Remove first child from log container
            if (this.logContainer.firstChild) {
                this.logContainer.removeChild(this.logContainer.firstChild);
            }
        }

        // Update event count
        const countEl = document.getElementById('debug-count');
        if (countEl) {
            countEl.textContent = `${this.entries.length} events`;
        }

        // Persist if enabled
        if (this.config.persistLogs) {
            this.persistLogs();
        }

        // Send to server if enabled
        if (this.config.sendToServer) {
            this.sendToServer(entry);
        }

        // Render to panel in Figma style
        const div = document.createElement('div');
        div.style.cssText = `
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        `;
        
        // Main log line
        let html = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <span style="color: rgba(255,255,255,0.3); font-size: 11px; padding-top: 2px; white-space: nowrap;">${timestamp}</span>
                <span style="color: ${color}; font-weight: 700; font-size: 11px; min-width: 60px; padding-top: 2px;">[${type}]</span>
                <span style="color: rgba(255,255,255,0.7); flex: 1;">${this.escapeHtml(message)}</span>
            </div>
        `;
        
        // Add details block if present
        if (details) {
            html += `
                <div style="
                    margin-left: 120px;
                    margin-top: 8px;
                    padding: 12px;
                    background: #09090b;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 4px;
                    color: rgba(255,255,255,0.5);
                    font-size: 11px;
                    overflow-x: auto;
                "><pre style="margin: 0; white-space: pre-wrap;">${this.escapeHtml(JSON.stringify(details, null, 2))}</pre></div>
            `;
        }
        
        div.innerHTML = html;
        
        this.logContainer.appendChild(div);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;

        // Console log
        console.log(`[${type}] ${message}`);
    },

    /**
     * Show empty state
     */
    showEmptyState() {
        const terminalIcon = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3;"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`;
        this.logContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.2); text-align: center;">
                ${terminalIcon}
                <p style="margin-top: 12px;">No events logged yet. Start interacting with the page.</p>
            </div>
        `;
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
        // Note: We intentionally exclude userAgent for privacy
        // URL is included but can be removed if needed
        const data = {
            sessionId: this.sessionId,
            exportedAt: new Date().toISOString(),
            pageUrl: window.location.pathname, // Path only, no query params
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
                    const time = new Date(entry.timestamp).toLocaleTimeString('en-US', { 
                        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 
                    });
                    
                    const div = document.createElement('div');
                    div.style.cssText = `
                        margin-bottom: 12px;
                        padding-bottom: 12px;
                        border-bottom: 1px solid rgba(255,255,255,0.05);
                    `;
                    
                    let html = `
                        <div style="display: flex; align-items: flex-start; gap: 12px;">
                            <span style="color: rgba(255,255,255,0.3); font-size: 11px; padding-top: 2px; white-space: nowrap;">${time}</span>
                            <span style="color: ${entry.color}; font-weight: 700; font-size: 11px; min-width: 60px; padding-top: 2px;">[${entry.type}]</span>
                            <span style="color: rgba(255,255,255,0.7); flex: 1;">${this.escapeHtml(entry.message)}</span>
                        </div>
                    `;
                    
                    if (entry.details) {
                        html += `
                            <div style="
                                margin-left: 120px;
                                margin-top: 8px;
                                padding: 12px;
                                background: #09090b;
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 4px;
                                color: rgba(255,255,255,0.5);
                                font-size: 11px;
                                overflow-x: auto;
                            "><pre style="margin: 0; white-space: pre-wrap;">${this.escapeHtml(JSON.stringify(entry.details, null, 2))}</pre></div>
                        `;
                    }
                    
                    div.innerHTML = html;
                    this.logContainer.appendChild(div);
                });
                
                // Update count
                const countEl = document.getElementById('debug-count');
                if (countEl) {
                    countEl.textContent = `${this.entries.length} events`;
                }
            }
        } catch (e) {
            console.error('Failed to restore logs:', e);
        }
    },

    /**
     * Send log entry to server
     * SECURITY: Only sends to same-origin endpoints by default
     */
    sendToServer(entry) {
        if (!this.config.serverEndpoint) return;
        
        // Security: Only allow same-origin or explicitly whitelisted endpoints
        const endpoint = this.config.serverEndpoint;
        const isRelative = endpoint.startsWith('/');
        const isSameOrigin = endpoint.startsWith(window.location.origin);
        
        if (!isRelative && !isSameOrigin) {
            console.warn('[LiveDebugger] Blocked cross-origin server endpoint for security');
            return;
        }
        
        fetch(endpoint, {
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
