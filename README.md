# GREED ISLAND — Card Matcher

> *"You have 60 seconds. Find all 20 pairs. But here's the catch — every time you flip a card, the probability distribution updates."* — Hisoka

A high-difficulty memory match game set in the Greed Island arc of Hunter × Hunter, featuring a live probability engine, Nen interference mechanics, and a hidden board pattern.

---

## Project Structure

```
card-matcher/
├── index.html                  — Main HTML entry point + screens (splash, game, gameover)
├── style.css                   — Dark gothic aesthetic, full responsive CSS
├── app.js                      — Game controller (state machine, event loop, render)
├── algorithm/
│   ├── probabilityEngine.js    — Live probability calculation per-card
│   ├── patternDetector.js      — Board generation + hidden pattern logic
│   └── interferenceManager.js  — Hisoka's Bungee Gum mismatch trigger
└── components/
    ├── CardGrid.js             — 8×5 card grid renderer
    ├── ProbabilityOverlay.js   — Nen charge bar + distortion indicator
    └── ScorePanel.js           — Score / timer / moves HUD
```

---

## How to Run

```bash
# Any static HTTP server works (ES modules require a server, not file://)
npx serve .
# or
python3 -m http.server 8080
# then open http://localhost:8080
```

---

## Game Mechanics

### Core Rules
- **40 cards** arranged in an **8×5 grid** — 20 unique symbols, each appears twice
- **60-second timer** — match all pairs before time runs out
- **Move counter** — tracks total flips (lower = better efficiency score)
- **Scoring**: +10 per pair, streak bonus, time bonus, pattern discovery bonus

### Probability Engine (`probabilityEngine.js`)

After the first card of a pair is flipped, every face-down card displays a live probability (0–100%) indicating its likelihood of being the match.

**Probability formula:**
```
base = (remaining copies of symbol) / (total unknown face-down cards) × 100
+ adjacency bonus  (+20 if Manhattan distance = 1 from selected card)
+ sector bonus     (+8 if in same board sector)
× frequency factor (rarer symbols scaled slightly lower)
± Nen distortion   (random bias applied during interference)
```

Cards whose symbols have been previously seen are returned with **99%** (known match) or **1%** (known non-match) — perfect memory exploitation.

### Pattern Detector (`patternDetector.js`)

The board is **not randomly arranged**. The hidden pattern:

> Each symbol pair is split between **mirror sectors**:
> - Symbols 1–10: one in top-left quadrant, its pair in bottom-right
> - Symbols 11–20: one in top-right quadrant, its pair in bottom-left

Players who discover this pattern can flip diagonal opposites for near-guaranteed matches. The game detects if the player has found the pattern (5+ consecutive diagonal-sector matches) and awards **+50 bonus points**.

### Interference Manager (`interferenceManager.js`)

*"Hisoka's Bungee Gum stretches probability. It has both properties of rubber and gum... and memory distortion."*

- Tracks **consecutive mismatches**
- On the **3rd consecutive mismatch**: triggers **Bungee Gum**
  - A random previously-matched card flips **back to face-down**
  - You must rediscover it — losing a pair and 5 points
  - Nen distortion activates: ~30% of probability numbers are temporarily falsified
- A visual **Nen Charge Bar** shows danger level (0–100%)
- Matching resets the mismatch counter and reduces Nen charge

### Hint System
- Press **💡 HINT** to highlight the face-down card with the highest calculated probability for the selected symbol
- Costs **3 points** per use

---

## Score Calculation

| Action | Points |
|--------|--------|
| Pair matched | +10 |
| Streak bonus (N matches in a row) | +(N-1) × 2 |
| Hint used | -3 |
| Bungee Gum interference | -5 |
| Time remaining (win) | +timeLeft × 2 |
| Perfect game (20 moves) | +100 |
| Pattern discovered | +50 |

**Perfect score benchmark:** 20 moves, 60s remaining ≈ 530+ points

---

## Design Decisions

### Why ES Modules?
Each algorithm is a true ES module for testability and clean separation. `app.js` orchestrates everything without tight coupling.

### Probability "Lies"
The interference manager applies random biases to the probability overlay, not to actual game state. This means the displayed number can be wrong — but the underlying card positions never change. The hint system uses the *true* probability, not the distorted display.

### The Hidden Pattern
The pattern is mechanically real: the generator places pairs in mirror sectors deterministically. A perfect player with pattern knowledge can achieve a near-perfect game without any mismatches.

---

## HxH Character Tips (in-game)

| Character | Tip |
|-----------|-----|
| **Hisoka** | "Probability is not destiny. The 93% card still fails 7% of the time." |
| **Killua** | "Adjacent cards share aura. Check neighbors — +20% bonus." |
| **Kurapika** | "Plan flips in batches of 2 to reset the mismatch counter." |
| **Gon** | "Watch for sudden probability drops — that's Bungee Gum distorting the truth." |
| **Biscuit** | "A perfect game is 20 moves. Anything more is inefficiency." |
| **Anonymous** | "The symbols aren't random. Find the pattern, and probability becomes certainty." |

---

*"Probability is not destiny. The 93% card still fails 7% of the time. Trust nothing."* — Hisoka
