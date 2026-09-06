<div align="center">

# ✦ Runebound — The Dragon's Trail

**A fantasy snake game built with pure HTML, CSS, and JavaScript.**

Guide your dragon through the enchanted wilds. Gather arcane orbs, unlock ancient spells, and survive increasingly dangerous grove levels.

[![Live Demo](https://img.shields.io/badge/Play%20Now-GitHub%20Pages-7ce8d4?style=for-the-badge&logo=github)](https://krishshukla07.github.io/Fantasy-Snake/)
[![License: MIT](https://img.shields.io/badge/License-MIT-e6b86b?style=for-the-badge)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/Built%20With-Vanilla%20JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Gameplay](#gameplay)
- [Controls](#controls)
- [Spells & Power-ups](#spells--power-ups)
- [Level System](#level-system)
- [Dragon Skins](#dragon-skins)
- [Settings](#settings)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Technical Notes](#technical-notes)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Runebound is a fantasy-themed reimagining of the classic snake game. There are no frameworks, no build tools, no dependencies — just three files and a browser. The game runs entirely on the client using the HTML5 Canvas API and the Web Audio API.

> *"The oldest magic is motion." — The Verdant Codex*

---

## Features

- **9 distinct power-up types** — speed boost, slow motion, shield, score multiplier, teleport, magnet, freeze, growth, and ghost mode
- **4 castable spells** — collect runes to store spells and cast them with keys `1`–`4`
- **9-stage level progression** — portal-gated levels with increasing wall complexity and speed
- **Mission / oath system** — rotating objectives that persist across runs
- **4 unlockable dragon skins** — earned by accumulating arcane orbs
- **Combo scoring** — rapid orb collection multiplies your points up to 4×
- **Lives system** — 3 lives per run; recover from a hit without losing your score
- **Hazard events** — wild magic storms that spawn lethal obstacles mid-game
- **Particle effects & ambient audio** — procedural Web Audio soundtrack with oscillator-based tones
- **Fully responsive** — playable on desktop, tablet, and mobile with touch swipe support
- **Keyboard accessible** — ARIA live regions, focus management, reduced-motion support
- **Persistent high score and profile** — saved to `localStorage` across sessions
- **No server required** — open `index.html` in any modern browser and play

---

## Gameplay

Your dragon moves continuously through a 24 × 24 grid. Eat the glowing arcane orbs to grow longer and score points. Avoid the grove's boundary walls, your own trail, and any wall segments that appear at higher levels.

Every 5 orbs (approximately), a **Power Rune** appears on the field — a spinning cyan diamond. Collecting it activates a random spell immediately and stores it in your spell inventory if it's one of the four castable types.

Once your score crosses the threshold for the next level, a **portal** opens. Enter it to advance to a harder grove with new wall configurations.

---

## Controls

| Action | Keyboard | Mobile |
|---|---|---|
| Move | `W A S D` or `↑ ↓ ← →` | Swipe on canvas or use the on-screen D-pad |
| Pause / Resume | `P` or `Space` | Tap the Pause button |
| Cast spell 1–4 | `1` `2` `3` `4` | Tap a spell in the Found Spells panel |
| Mute / Unmute | Click ♫ in the header | Same |
| Open settings | Click ⚙ in the header | Same |

---

## Spells & Power-ups

### Castable spells (stored in inventory, activated with `1`–`4`)

| Slot | Name | Effect | Duration |
|---|---|---|---|
| 1 | **Velocity** | Increases movement speed by ~28% | 8 sec |
| 2 | **Stasis** | Slows movement by ~90% | 8 sec |
| 3 | **Ward** | Absorbs one lethal collision and reverses direction | Single use |
| 4 | **Golden Age** | Doubles all points scored | 8 sec |

### Rune-only power-ups (activated on pickup, cannot be stored)

| Name | Effect |
|---|---|
| **Teleport** | Instantly relocates the dragon to a random open cell |
| **Magnet** | Pulls food one cell toward the snake head each step |
| **Freeze** | Greatly reduces movement speed for a short window |
| **Growth** | Extends the dragon's trail by 3 segments over the next 3 steps |
| **Ghost** | Phases through wall cells and self-collision |

---

## Level System

Levels unlock when your score crosses a threshold. A portal appears on the field — enter it to advance.

| Level | Stage Name | Wall Configuration |
|---|---|---|
| 1 | CALM | Open grid — no walls |
| 2 | WATCHFUL | Horizontal wall at row 12 with two gaps |
| 3 | RESTLESS | Cross wall (horizontal + vertical) with gaps |
| 4 | FERAL | Cross wall + upper horizontal wall |
| 5–9 | ARCANE → ASCENDED | Maximum wall complexity, increasing speed |

Score thresholds follow a quadratic curve so early levels feel reachable and late levels require sustained skill.

---

## Dragon Skins

Skins are cosmetic only. They change the dragon's colour palette and unlock by accumulating **total arcane orbs** across all runs.

| Skin | Name | Unlock requirement |
|---|---|---|
| 🟢 ember | Emberwing | Default — no requirement |
| 🔵 frost | Frostscale | 25 total orbs |
| 🟡 storm | Stormcoil | 75 total orbs |
| 🟣 void | Voidwyrm | 150 total orbs |

Select your skin from the ⚙ settings panel. Locked skins display their orb cost.

---

## Settings

Open the settings panel with the **⚙** button in the top-right header.

| Setting | Options |
|---|---|
| **Game mode** | Classic boundary (default) · Endless Grove (wrap-around, wall cells non-lethal) |
| **Difficulty** | Wanderer (1×) · Spellbound (0.82×) · Dragon's Fury (0.68×) |
| **Dragon form** | Emberwing · Frostscale · Stormcoil · Voidwyrm |
| **Reduce motion** | Disables CSS animations and transitions |
| **High contrast** | Increases border and text contrast |

Settings persist in `localStorage` between sessions.

---

## Getting Started

### Play instantly (no setup)

Visit the live site:
**https://krishshukla07.github.io/Fantasy-Snake/**

### Run locally

```bash
# Clone the repository
git clone https://github.com/KrishShukla07/Fantasy-Snake.git

# Open in browser — no build step needed
cd Fantasy-Snake
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

Or serve with any static file server:

```bash
# Python (built-in)
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Then open **http://localhost:8080** in your browser.

### Browser compatibility

| Browser | Support |
|---|---|
| Chrome / Edge 88+ | ✅ Full |
| Firefox 78+ | ✅ Full |
| Safari 15.4+ | ✅ Full |
| Safari < 15.4 | ✅ Full (via `-webkit-backdrop-filter`) |
| Mobile Chrome / Safari | ✅ Full (touch + D-pad) |

---

## Project Structure

```
Fantasy-Snake/
├── index.html      # Game shell — layout, HUD structure, static markup
├── style.css       # All styling — layout, canvas, responsive breakpoints
├── script.js       # All game logic — loop, physics, audio, state management
├── LICENSE         # MIT License
└── README.md       # This file
```

No dependencies. No `node_modules`. No build step.

---

## Technical Notes

| Area | Approach |
|---|---|
| **Rendering** | HTML5 Canvas 2D API with DPR-aware scaling (`devicePixelRatio`, capped at 2.5×) |
| **Game loop** | `requestAnimationFrame` + timestamp-delta stepping (decoupled from frame rate) |
| **Audio** | Web Audio API — procedural oscillator tones, no audio files |
| **Persistence** | `localStorage` — high score, profile (orbs, skins, mission index), settings |
| **Responsiveness** | CSS `min()`, `clamp()`, `aspect-ratio: 1`, `100svh` units, `env(safe-area-inset-*)` |
| **Accessibility** | ARIA live region for game events, `role="button"` spell elements, `aria-hidden` on overlay during play, `prefers-reduced-motion` media query |

---

## Contributing

This project is intentionally minimal — one HTML file, one CSS file, one JS file. Contributions that maintain that constraint are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: description"`
4. Push to your fork: `git push origin feature/your-feature`
5. Open a Pull Request

Please keep PRs focused. Bug fixes, accessibility improvements, and new power-up types are great starting points.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with vanilla JS · No frameworks · No build tools

**[Play Now →](https://krishshukla07.github.io/Fantasy-Snake/)**

</div>
