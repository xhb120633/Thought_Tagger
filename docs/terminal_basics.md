# Terminal Basics for Researchers (No Programming Assumed)

This page explains exactly how to open a terminal and move into the ThoughtTagger folder before running commands.

## Why this matters

All commands in this repository (for example `npm install`) must be run **inside the ThoughtTagger repository folder**.

## 1) Find your ThoughtTagger folder first

After downloading/cloning, you should have a folder named something like:

- `Thought_Tagger`

Example locations:

- Windows: `C:\Users\YourName\Downloads\Thought_Tagger`
- macOS: `/Users/yourname/Downloads/Thought_Tagger`
- Linux: `/home/yourname/Downloads/Thought_Tagger`

## 2) Open terminal

### Windows (PowerShell)

1. Press **Windows key**.
2. Type **PowerShell**.
3. Press **Enter**.

### macOS (Terminal)

1. Press **Command + Space**.
2. Type **Terminal**.
3. Press **Enter**.

### Linux (Terminal)

Open your standard Terminal app from the application menu.

## 3) Move into the ThoughtTagger folder using `cd`

`cd` means **change directory** (change folder).

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

## 4) Confirm you are in the correct folder

Run:

```bash
pwd
```

You should see a path ending with `Thought_Tagger`.

Then run:

```bash
ls
```

You should see files/folders such as `README.md`, `docs`, `apps`, `packages`.

## 5) If `cd` fails

- Check spelling of folder names.
- If folder has spaces, wrap path in quotes. Example:

```powershell
cd "C:\Users\Your Name\My Projects\Thought_Tagger"
```

or

```bash
cd "/Users/yourname/My Projects/Thought_Tagger"
```

- Use Tab key autocomplete after typing part of the path.

## 6) After this, you can run project commands

Examples (inside repository folder):

```bash
npm install
npm run dev -w @thought-tagger/studio
```
