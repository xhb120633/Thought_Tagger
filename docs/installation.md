# Installation Guide (Very Beginner-Friendly)

This guide assumes no programming background.

## What "install" means

Installing prepares all required ThoughtTagger components so the app can run on your computer.

## Prerequisites

- **Node.js 20+**
- **npm 10+** (npm is included with Node.js in most setups)

## Step 1 — Open terminal and move to repository folder

If this is unfamiliar, read `docs/terminal_basics.md` first.

Use `cd` to move into ThoughtTagger:

### Windows (PowerShell)

```powershell
cd C:\Users\YourName\Downloads\Thought_Tagger
```

### macOS

```bash
cd /Users/yourname/Downloads/Thought_Tagger
```

### Linux

```bash
cd /home/yourname/Downloads/Thought_Tagger
```

Confirm location:

```bash
pwd
ls
```

You must see repository files (for example `README.md`).

## Step 2 — Install dependencies

```bash
npm install
```

## Step 3 — Verify install

```bash
npm run build
npm test
```

If both commands complete successfully, installation is complete.

## Common beginner mistake

Running commands outside the repository folder. If a command fails unexpectedly, run:

```bash
pwd
```

Then move back with `cd` and try again.
