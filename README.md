# MemorySpace Features

Small, useful tools extracted from building [MemoryIntelligence](https://github.com/kckassette).

Part of my **Build in Public** journey - [LinkedIn](https://linkedin.com/in/YOUR_LINKEDIN)

---

## Available Features

### [Live Debugger](./live-debugger/)

A drop-in JavaScript debugging console. See every user interaction in real-time.

| Feature | Description |
|---------|-------------|
| Click tracking | Every click with element details |
| Input logging | Form field keystrokes |
| Network monitor | Fetch/XHR requests and responses |
| Error capture | JavaScript errors and promise rejections |
| htmx support | Full htmx event lifecycle |
| Export | Download logs as JSON |

**100% Local by Default**
- No external servers
- No analytics
- No tracking
- Data stays in your browser until you close the tab

**Installation:** Copy one file, add 3 lines of code.

```html
<script src="debugger.js"></script>
<script>
    LiveDebugger.init({ enabled: true });
</script>
```

---

## About

Each feature in this repo is:

- **Self-contained** - Works independently, no dependencies
- **Local-first** - Your data stays on your machine by default
- **Readable** - Small, well-commented code you can audit
- **MIT Licensed** - Use however you want

---

## Structure

```
feature-name/
├── README.md            # What it does, where data goes
├── [main-file]          # The actual code (~500 lines or less)
├── demo.html            # Try it locally
├── INTEGRATION_GUIDE.md # Framework examples
└── LICENSE
```

---

## Contributing

Found a bug? Have an idea?
- Open an issue
- Submit a PR

---

## License

MIT
