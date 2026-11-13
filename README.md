# VirtualCam — Static Camera Feed

A Chrome Extension that lets you use a pre-captured photo as your webcam feed. Click a photo directly using your webcam or upload an image, and any website that requests camera access receives your photo as a live 30fps video stream.

## Features

- **Direct Webcam Capture ("Click & Use")** — Take a snapshot directly from your webcam inside the popup and activate it instantly
- **File Upload** — Upload or drag-and-drop any existing JPG, PNG, or WEBP image
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
5. Click the VirtualCam icon in the toolbar → take a photo or upload an image

## How It Works

When a website calls `navigator.mediaDevices.getUserMedia({ video: true })`, VirtualCam intercepts the call and returns a canvas-based `MediaStream` rendered from your captured or uploaded photo at 30fps with subtle pixel-level noise for liveness.

## File Structure

```
├── manifest.json        # Extension configuration
├── background.js        # Service worker — injects override into pages
├── content.js           # Bridges chrome.storage → localStorage
├── inject.js            # getUserMedia override (runs in page context)
├── popup.html           # Extension popup UI
├── popup.css            # Popup styling
├── popup.js             # Popup logic (Upload, Camera capture & storage sync)
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
