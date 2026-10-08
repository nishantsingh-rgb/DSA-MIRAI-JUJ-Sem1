# DryRun: C++ visualizer

An animated, step-by-step visualizer for **every program in this course**. Pick a topic, pick a program, press ▶, and watch the code run one line at a time, with plain-English explanations.

**Live site:** https://nishantsingh-rgb.github.io/DSA-MIRAI-JUJ-Sem1/

- [design.md](design.md): how it looks and why
- [flow.md](flow.md): how it works and how updates flow

---

## Updating the website (the everyday part)

You don't touch the website code at all. Keep doing what you already do:

1. Add your new `.cpp` files to a topic's `Codes/` folder, or create a new topic folder such as `07_Arrays/Codes/`.
   - Name files the usual way: `L1_Class_1_Title.cpp`, `L1_HW_2_Title.cpp`.
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Arrays lesson 1"
   git push
   ```
3. Wait about 2 minutes. The site rebuilds and the new programs appear.
   You can watch progress under the **Actions** tab on GitHub.

**Optional extras (make pages nicer):**
- `visualizer/content/programs.json`: a friendly title, *What it does*, *Think of it like*, *Watch for*, and the default `input` for programs that use `cin`.
- `visualizer/content/topics.json`: a tagline and description for each topic.
- If you skip these, the site still works and uses the file name as the title. You can also ask Claude: *"add stories for the new programs in programs.json"*.

---

## How hosting works (already set up)

The site is hosted free on **GitHub Pages** at
**https://nishantsingh-rgb.github.io/DSA-MIRAI-JUJ-Sem1/**

On every push to `main`, the workflow `.github/workflows/deploy-visualizer.yml` tests and builds the site, then publishes it to the `gh-pages` branch, which GitHub Pages serves. You never need to touch the `gh-pages` branch yourself.

---

## Running it on your own computer (optional)

You need **Node.js 20 or newer**. You already have it; check with `node -v`.

```bash
cd visualizer
npm install        # first time only: downloads the libraries
npm run dev        # starts the site at http://localhost:5173
```
Open the link it prints. The page reloads by itself when you change files. Press `Ctrl + C` to stop.

| Command | What it does |
|---|---|
| `npm run dev` | Local preview while you work |
| `npm test` | Checks that every program's animation prints exactly what real C++ prints |
| `npm run build` | Makes the production site in `visualizer/dist/` |
| `npm run preview` | Serves that built site locally to double-check it |

---

## Hosting somewhere else (optional)

The built site is plain static files, so any host works:

| Host | Settings |
|---|---|
| **Netlify / Vercel / Cloudflare Pages** | Root directory: `visualizer` · Build command: `npm run build` · Output: `dist` |
| **Any web server** | Run `npm run build` and upload the contents of `visualizer/dist/` |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| The Actions run shows a ⚠️ on "Verify every program against g++" | A new program uses a C++ feature the visualizer can't animate yet. The site still deploys, and that page shows the code and real output instead of the animation. Ask Claude to "teach the visualizer engine <feature>". |
| The site didn't update after a push | Open the **Actions** tab and check that the latest *Deploy visualizer* run is green; click **Re-run** if it failed. In **Settings → Pages**, the source should be *Deploy from a branch → gh-pages*. |
| A program waits for input and shows 0 | Add an `"input"` value for it in `content/programs.json`. Visitors can also type their own input on the page. |
| `npm: command not found` | Install Node.js from https://nodejs.org (LTS version). |

---

## Folder map
```
visualizer/
├── content/            ← friendly text you may edit (programs.json, topics.json)
├── scripts/            ← build-catalog.mjs: scans the course folders
├── src/
│   ├── engine/         ← the C++ interpreter that records every step
│   ├── components/     ← UI panels (code, screen, memory, controls…)
│   ├── pages/          ← Home and Program pages
│   ├── lib/            ← routing, storage, player logic, highlighter
│   └── styles/         ← design tokens + CSS
├── tests/              ← engine.test.ts (compares with the real compiler)
├── design.md · flow.md
└── package.json
```
