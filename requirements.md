# CGX Ice Breaker - Requirements Document

## Overview

**CGX Ice Breaker** is a real-time, social bingo web app designed to kick off group events with playful interactions and friendly competition. Participants mark off bingo squares by interacting with others and logging names. A real-time scoreboard tracks progress, and delightful microinteractions enhance the experience.

## Features

### Bingo Card

* **5x5 grid** (configurable to other sizes like 3x3, 4x4, etc.)
* **Dynamic and unique** per player: randomized from a shared question pool, no duplicate cards
* Center square can be a free space (optional via config)

### Questions Source

* Questions loaded from a **local JSON file** in the project (e.g., `questions.json`)

### Marking Squares

* Clicking a square opens a **modal**

  * User selects another participant's name (from a predefined list)
  * Optionally adds a short answer
* Confirming the mark:

  * Adds a check or badge on the square
  * Sends update over WebSocket
  * Triggers confetti and sound effect

### Participants

* User enters their name on entry
* Participant names are pulled from a predefined list (`participants.json`)
* Name is required to interact with the game

### Scoreboard

* Separate route (`/scoreboard`)
* Displays:

  * All player names
  * Number of marked squares
  * Optional: per-square entries (participant answers)
  * Bingo status (visual highlight for winners)
* Real-time updates via WebSockets
* When a player gets a **Bingo**:

  * Loud sound effect
  * Visual explosion/animation
  * Highlight on scoreboard

### Host Controls

* Host accesses scoreboard page to control the game

  * Can **start/reset** the game from there
  * No authentication needed beyond being on the scoreboard route

### Microinteractions

* Sound effects and animations:

  * On square mark
  * On Bingo
  * Modal open/close
* Confetti + explosion on win
* Fun, bold, over-the-top design aesthetic

  * Animated buttons, hover states, vibrant color palette

### Tech & Hosting

* Uses **WebSockets** for real-time sync
* Deployed to **Vercel**
* Simple static entry flow:

  * User enters name
  * Assigned a randomized card from the same pool
* Responsive and optimized for **mobile**

## Files

* `questions.json` — List of all possible bingo prompts
* `participants.json` — List of participant names for validation

## Non-Goals (for now)

* Authentication/login system
* Multiple simultaneous game sessions

---

Let me know when you're ready and I can scaffold the project structure or help define the WebSocket events and game logic.
