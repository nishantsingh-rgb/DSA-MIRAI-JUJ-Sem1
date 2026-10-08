# DryRun — Design

> **One-line idea:** replay any course program in slow motion, with every box, decision and printed character visible, in words a complete beginner understands.

The name comes from the classroom habit of a *dry run*: tracing a program on paper, line by line, with a table of variable values. DryRun does that tracing for you and animates it.

---

## 1. Who it is for

| Audience | What they need | How the design answers |
|---|---|---|
| **Total beginner / layman** | To *see* what code does without knowing the jargon | Plain-English narration for every step, variables drawn as labelled boxes, decisions drawn as a fork in the road |
| **Course student** | To revise a specific classwork/homework program | Topics laid out as "lines" in course order, with lesson grouping and Class/HW badges |
| **Curious tinkerer** | To ask "what if…?" | Knobs (`n − 5 +`), an input box for `cin`, and a live code editor; every change re-runs instantly |
| **Teacher** | To project and explain | Large type, a keyboard-driven player (Space, ←, →), a timeline you can scrub, and a "Finish loop" jump |

---

## 2. Design principles

1. **One thing happens at a time.** Each step is a single action, such as a box being created, a value changing, a question being answered or a character being printed. The narration sentence, the highlighted line and the animation all describe that same action.
2. **Show the working.** Every expression is broken into its sub-steps (`b * c → 3 * 2 = 6`). Integer division, remainders and ASCII codes get a short note in plain words.
3. **Colour has meaning; it is never decoration.**
   - **Yellow (highlighter):** what is happening *now*
   - **Green:** yes / true / printed
   - **Red:** no / false / error
   - **Violet:** loops
   - **Blue:** input / reading from an array
4. **Never lie.** The interpreter is checked against the real C++ compiler for every program, and the screen shows a *"Matches the real C++ compiler"* badge when it does.
5. **Calm motion.** Animations are short (140–520 ms) and spring-eased, and only the things that changed move. `prefers-reduced-motion` turns them all off.
6. **Works anywhere.** It runs as a static site with no server, no login and no tracking. It works from 320 px phones to projectors.

---

## 3. Visual language

### Typography
| Role | Font | Why |
|---|---|---|
| Headings | **Space Grotesk** | Geometric and a bit technical, with personality at large sizes |
| Body | **Inter** | Very legible at small sizes on every screen |
| Code & values | **JetBrains Mono** | Clear `0/O`, `1/l` and `'`/`"` distinctions, which matter when teaching code |

The fonts are self-hosted through `@fontsource`, so the site makes no third-party requests and shows no layout flash.

### Colour tokens
All colours live in [`src/styles/tokens.css`](src/styles/tokens.css) as CSS variables.

- **Dark ("night lab")** is the default: deep ink `#0b0e14` with a faint dot grid, like graph paper.
- **Light ("paper notebook")** uses warm paper `#f7f5f0` with darker, higher-contrast accents.
- The theme follows the OS on first visit. The ☀/☾ button saves your choice, and an inline script applies it before the first paint, so the page never flashes the wrong theme.
- Each topic gets its own hue (`topicHue()`), so every "line" on the home page is recognisable at a glance.

### Shape & depth
The design uses 10–22 px radii, 1 px borders and soft shadows. Panels sit on `--surface`, and nested items sit on `--surface-2`. Elevation goes up by one step per nesting level.

---

## 4. Page anatomy

### Home `#/`
```
┌ Top bar: logo · search (/ or ⌘K) · theme ───────────────────┐
│ HERO  "Watch your code think."      ┌ live mini demo ──────┐ │
│       CTA: Start from lesson one     │ real engine running  │ │
│       stats: topics · programs ·     │ the star pyramid     │ │
│       ✓ checked against compiler     └──────────────────────┘ │
│ HOW IT WORKS  4 cards                                        │
│ THE COURSE                                                    │
│  01 Getting Started ──────────── 10 programs ▓▓░░  ⌄          │
│  02 Operators ─────────────────── 15 programs ░░░░  ⌄         │
│  …                                                            │
│  06 Patterns  [LATEST]  (open) ──────────────────── ⌃         │
│     Lesson 1  [CW1 Sum of digits…] [CW2 …] [HW1 …]            │
│     Lesson 2  …                                               │
└───────────────────────────────────────────────────────────────┘
```
- Each topic is a **line** (an accordion row). Opening it reveals lessons and one **button per program**.
- The progress bar and ✓ marks remember which programs you have opened (stored in `localStorage` on your device only).

### Program `#/p/<topic>/<file>`
```
breadcrumb · Title · [Classwork 1] [reads input] [Topic notes]
[What it does] [Think of it like] [Watch for]            ← story cards
[Try changing: n − 5 +] [User types: ____ Run] [Edit code]← tweak bar
▌Line 11  Update: j++ → j is now 2.                      ← narration
┌ CODE ────────┐┌ SCREEN (grid / terminal) ┐┌ MEMORY ───┐
│ heat gutter  ││ characters pop in        ││ n  i  j   │
│ ▌active line ││ row labels "i = 2"       ││ boxes,    │
│              │├ WHAT'S HAPPENING ────────┤│ arrays as │
│              ││ fork / loop cards /      ││ tiles with│
│              ││ "working it out"         ││ i, j ptrs │
└──────────────┘└──────────────────────────┘└───────────┘
[⏮][◀][▶ PLAY][▶][Finish loop][⏭]  12/146 ━━━●━━━  0.5× 1× 2× 4× 8×   ← sticky dock
‹ Previous program                         Next program ›
```

### The four panels
| Panel | Shows | Key animations |
|---|---|---|
| **Code** | Source with syntax colours. The current line is marked like a highlighter (green or red after a decision, violet for loop steps). The gutter shows how many times each line has run (`7×`). | Smooth auto-scroll inside the panel. Click a line to jump to the next time it runs. |
| **Screen** | What the program printed. In **Grid** mode every character is a tile, with spaces drawn as dashed cells, and each row is labelled with the outer loop counter. This view is perfect for patterns. **Terminal** mode looks like a real console, with typed input in blue. | New characters pop in with a glow. Characters are coloured by the line of code that printed them. |
| **What's happening** | A picture of the current step: a **decision fork** (a ball rolls down the YES or NO path), **loop cards** (counter value, round number and lap dots for each nested loop), **switch chips** (cases crossed out until one matches), **print chip** flying "→ screen", **keycaps** for typed input, and a **call stack** for functions. Below that, **Working it out** reduces each expression step by step. | Path drawing, ball motion, staggered rows. |
| **Memory** | Every variable is a labelled box with its type ("int", meaning *whole number*). Changed values flash and show `was 1`. Uninitialised values show `?`. Arrays, vectors and indexed strings appear as **tiles** with their index numbers and **pointer tags** (`i`, `j`) under the cells they point at. 2-D arrays appear as a grid. Function calls stack as frames. | New box drops in. A cell being read lifts in blue; a cell being written flashes yellow. |

### Responsive behaviour
| Width | Layout |
|---|---|
| ≥ 1180 px | 3 columns: Code · (Screen over What's happening) · Memory. The stage fits the viewport. |
| 860–1180 px | 2 × 2 grid |
| < 860 px | Single column: Screen → What's happening → Code → Memory. The narration moves **into the sticky dock**, so it is always visible while you scroll. |
| < 520 px | Speed buttons collapse into one tap-to-cycle `1×` button. |

---

## 5. Interaction details

| Action | Mouse / touch | Keyboard |
|---|---|---|
| Play / pause | ▶ button | `Space` or `K` |
| Step | ◀ ▶ | `←` `→` |
| Start / end | ⏮ ⏭ | `Home` `End` |
| Finish the current loop | "Finish loop" | `L` |
| Jump to a line | click the line | |
| Scrub | timeline slider | |
| Search programs | top-bar search | `/` or `⌘K` / `Ctrl K` |

- **Playback pacing:** decisions, switches and input linger 1.5× longer, and loop updates are 0.7× faster. This leaves time for the "aha" moments without dragging the boring parts.
- **Knobs** detect simple numbers set at the top of `main` (`int n = 5;`) and rewrite them in the source, so the whole run updates.
- **Edit code:** a textarea with Tab-to-indent and `⌘/Ctrl + Enter` to run. **Reset** restores the original.

---

## 6. Accessibility
- The narration sits in an `aria-live="polite"` region, so screen-reader users hear each step.
- The page is fully keyboard operable, with visible focus rings (`:focus-visible` in yellow) and a skip-to-content link.
- Colour is never the only signal: decisions also say **Yes/No**, cells carry text, and states use outline as well as fill.
- `prefers-reduced-motion` makes all animations effectively instant. The hero demo shows its final frame instead of looping.
- Text contrast meets WCAG AA in both themes.

---

## 7. Tech choices (and why)

| Choice | Why |
|---|---|
| **Vite + React 19 + TypeScript (strict)** | Industry standard, fast builds and type-safe engine code |
| **Hand-written CSS with tokens** (no framework) | Full control of the look, no runtime cost, easy theming |
| **Own C++ interpreter** in TypeScript (`src/engine/`) | Records *every* step (values, decisions, output) so the UI can scrub back and forth instantly. No server or compiler is needed in the browser. |
| **Build-time g++ run** (`scripts/build-catalog.mjs`) | Proves the interpreter's output is identical to real C++ (`tests/engine.test.ts`) |
| **Hash routing** (`#/p/...`) | Works on any static host, including GitHub Pages, with zero server config |
| **Code-split program page** | The home page loads first, and the player loads on demand |
| No analytics, no cookies | Privacy by default; progress stays in your own browser |
