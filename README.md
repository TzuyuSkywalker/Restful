# 💎 Yolo Guild Loot System

A visually immersive loot distribution system designed for MMORPG guilds, featuring real-time interactions, animated UI, and emerald-themed aesthetics.

## ✨ Visual & Interactive Features

- 🎇 **Loot Particle Effects** — Floating icons like gems, chests, crowns, and coins rendered dynamically across the screen.
- 🌫️ **Psychedelic Smoke** — Animated canvas-based smoke with radiant neon hues for a mystical background ambience.
- 🔥 **Fire Corners** — Four animated emerald glow spots in screen corners pulsing in rhythm.
- 🪙 **Money Rain** — Scrolling background with falling coins and cash textures simulating loot showers.
- 🧊 **Glassmorphism** — Frosted-glass UI panels with blur and semi-transparency for a modern dark theme.
- 🟢 **Emerald Color Theme** — Custom palette blending neon green, mint, and dark jade for a high-fantasy cyber aesthetic.
- 📜 **Animated Rule Cards** — Rules displayed in animated card components with iconography and glow accents.

## ⚙️ Technologies & Stack

- **HTML5 / CSS3** — Base structure and animations.
- **Vanilla JavaScript** — Logic for dynamic rendering, user actions, and real-time updates.
- **Supabase** — Backend service for:
  - Authentication (admin & users)
  - Data storage: loot items, queues, winner history
  - Real-time DB change listening and live UI syncing.
- **Bootstrap 5 & Bootstrap Icons** — Responsive layout, consistent icons, and mobile-first design.
- **Custom JS Modules** — `script.js` and `effect.js` drive the core logic and effects respectively.

## 📁 File Overview

| File            | Purpose                                       |
|-----------------|-----------------------------------------------|
| `index.html`    | Player-facing loot participation UI           |
| `admin.html`    | Secure panel for managing loot and winners    |
| `history.html`  | Dynamic table showing loot winner history     |
| `rules.html`    | Guild rules in animated, themed layout        |
| `styles.css`    | Complete styling with animations and theming  |
| `script.js`     | Core logic: Supabase integration, rendering   |
| `effect.js`     | Particles, floating loot, smoke & fire glow   |

---
