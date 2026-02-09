# Quickstart for Psychology Researchers (No Programming Background)

This guide is written for researchers who are comfortable with mouse + keyboard workflows and may be new to software tools.

## Before you start: what is npm, and where do I type commands?

- **npm** is the package manager that installs and runs ThoughtTagger.
- You type npm commands in a **Terminal** app:
  - **Windows:** PowerShell or Command Prompt
  - **macOS:** Terminal
  - **Linux:** Terminal
- Open the terminal in the ThoughtTagger folder (repository root), then run the commands in this guide.

If you have never used terminal commands before, do this once with a colleague/IT support. After initial setup, daily workflow can be mostly through the Studio UI.

## What you need

- Node.js 20+ installed (includes npm)
- ThoughtTagger repository downloaded to your computer
- Optional: your own dataset file (`.jsonl` or `.csv`)

> No dataset file yet? You can still start by typing/pasting text directly in Studio.

## Step 1 — One-time install

```bash
npm install
```

## Step 2 — Start the Studio UI

```bash
npm run dev -w @thought-tagger/studio
```

Open the URL printed in terminal (usually `http://localhost:5173`).

## Step 3 — Create your study in Studio (mouse + keyboard workflow)

Inside Studio, you can build your annotation/evaluation setup without editing code:

1. **StudySpec Configuration**
   - Type study name (**Study ID**)
   - Choose **Task Type**, **Unitization Mode**, and **Run Mode**
2. **Questionnaire / rubric setup**
   - Use **Rubric Editor** to define the evaluation questions/options
   - You can type, revise, and iterate directly from keyboard
3. **Dataset Input**
   - Either upload a file **or paste text data directly**
4. **Preview**
   - Verify expected document/unit counts
5. **Export Compiler Bundle**
   - Generate study artifacts used for deployment

## Step 4 — Choose a deployment path (simplest first)

### Option A: Local testing/demo (recommended first)
Use this to run pilot sessions on your own machine.

Follow: `docs/deployment/self_host.md`

### Option B: Personal server (RA mode)
Use this for internal annotation by research assistants.

Follow: `docs/deployment/self_host.md`

### Option C: Participant platforms (Pavlovia/Prolific)
Use this for broader participant recruitment.

Follow:
- `docs/deployment/pavlovia.md`
- `docs/deployment/prolific.md`

## What files are generated after export

- `manifest.json`
- `units.jsonl`
- `annotation_template.csv`
- `event_log_template.jsonl`
- `assignment_manifest.jsonl` (if workplan is configured)

## If something fails

Go to: `docs/troubleshooting.md`
