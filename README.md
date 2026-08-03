# VirtualCam — Static Camera Feed

A Chrome Extension that lets you use a pre-captured photo as your webcam feed. Upload an image once, and any website that requests camera access receives your photo as a live 30fps video stream.

## Features

- **One-time upload** — Set your photo once, use it everywhere
- **Live-like stream** — 30fps canvas-based stream with micro-noise animation
- **Works everywhere** — Compatible with any website that uses webcam (attendance portals, video calls, etc.)
- **Toggle on/off** — Instantly switch between virtual and real camera
- **Audio passthrough** — Real microphone audio is preserved when sites request audio+video
- **Privacy-first** — All data stored locally, nothing sent to any server

## Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select this folder
5. Click the VirtualCam icon in the toolbar → upload your photo

## How It Works

When a website calls `navigator.mediaDevices.getUserMedia({ video: true })`, VirtualCam intercepts the call and returns a canvas-based `MediaStream` rendered from your uploaded photo at 30fps with subtle pixel-level noise for liveness.

## File Structure

```
├── manifest.json        # Extension configuration
├── background.js        # Service worker — injects override into pages
├── content.js           # Bridges chrome.storage → localStorage
├── inject.js            # getUserMedia override (runs in page context)
├── popup.html           # Extension popup UI
├── popup.css            # Popup styling
├── popup.js             # Popup logic
├── privacy-policy.html  # Privacy policy (required for Web Store)
├── icons/               # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

## Privacy

All data is stored locally on your device. No data is collected, transmitted, or shared. See [privacy-policy.html](privacy-policy.html) for details.

## License

MIT
