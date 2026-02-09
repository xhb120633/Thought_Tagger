# Quickstart for Psychology Researchers (No Programming Background)

This guide is intentionally step-by-step for researchers who use computers comfortably but do not program.

## What you will do in this quickstart

1. Open Terminal.
2. Move into the ThoughtTagger folder.
3. Install required files once.
4. Start the Studio UI.
5. Create your study via mouse + keyboard.

## Before commands: where to type them

You will type commands in a **Terminal** app:

- **Windows:** PowerShell
- **macOS:** Terminal
- **Linux:** Terminal

If you are new to Terminal, start here first:

- `docs/terminal_basics.md`

> Important: commands like `npm install` must run **inside the ThoughtTagger repository folder**.

## Step 1 — Open terminal and go to project folder

Use `cd` to move into the repository folder.

### Windows example

```powershell
cd C:\Users\YourName\Downloads\Thought_Tagger
```

### macOS example

```bash
cd /Users/yourname/Downloads/Thought_Tagger
```

### Linux example

```bash
cd /home/yourname/Downloads/Thought_Tagger
```

Confirm location:

```bash
pwd
ls
```

You should see `README.md`, `docs`, `apps`, `packages`.

## Step 2 — Install once

```bash
npm install
```

What this does: downloads the components ThoughtTagger needs.

## Step 3 — Start Studio UI

```bash
npm run dev -w @thought-tagger/studio
```

Open the URL printed in terminal (usually `http://localhost:5173`).

## Step 4 — Create your study in Studio (mouse + keyboard workflow)

Inside Studio:

1. In **StudySpec Configuration**:
   - enter **Study ID** (your project name),
   - choose **Task Type**, **Unitization Mode**, **Run Mode**.
2. In **Rubric Editor**:
   - create your questionnaire/label prompts,
   - define options or scoring choices.
3. In **Dataset Input**:
   - upload a `.csv`/`.jsonl` file, or
   - paste text directly for first drafts.
4. In **Preview**:
   - confirm expected counts look right.
5. Click **Export Compiler Bundle**.

## Step 5 — Choose where to run your study

### Option A (easiest): Local testing/demo
- Use for pilot sessions on your own machine.
- Guide: `docs/deployment/self_host.md`

### Option B: Personal server (RA mode)
- Use for internal research assistant workflows.
- Guide: `docs/deployment/self_host.md`

### Option C: Participant platforms
- Use for broader recruitment.
- Guides:
  - `docs/deployment/pavlovia.md`
  - `docs/deployment/prolific.md`

## Files you should see after export

- `manifest.json`
- `units.jsonl`
- `annotation_template.csv`
- `event_log_template.jsonl`
- `assignment_manifest.jsonl` (if workplan is enabled)

## If something fails

- Check `docs/troubleshooting.md`
- Recheck terminal location (`pwd`) and confirm you are inside `Thought_Tagger`.
