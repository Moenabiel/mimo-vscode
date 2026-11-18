# MiMo Code — VS Code Extension · Snapshot Mirror + Competitive Analysis

![MIT](https://img.shields.io/badge/license-MIT-39F5B4?style=flat-square)
![VS Code](https://img.shields.io/badge/VS%20Code-%5E1.85-43E6D0?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-43E6D0?style=flat-square)
![React](https://img.shields.io/badge/React-18-43E6D0?style=flat-square)
![Snapshot](https://img.shields.io/badge/stage-v0.1.0%20snapshot-A6FF4D?style=flat-square)
![Analysis](https://img.shields.io/badge/my%20work-gap%20analysis%20vs%2010%20agents-A6FF4D?style=flat-square)

> **Attribution first — this is not my extension.**
> **MiMo Code is Xiaomi's project** (`publisher: xiaomi-mimo`, `LICENSE © 2026 Xiaomi MiMo`, MIT).
> Upstream: [XiaomiMiMo/MiMo-Code](https://github.com/XiaomiMiMo/MiMo-Code) — 13.8k stars as of 2026-11-18.
>
> This repository is a **snapshot mirror of the pre-release VS Code extension stage**, kept for
> local evaluation, packaging and continuity. The extension source under `src/` and `webview/`
> is Xiaomi's and carries Xiaomi's MIT licence.
>
> **What is mine here:** the competitive gap analysis in
> [`docs/MIMO_CODE_FEATURE_GAP_ANALYSIS.md`](docs/MIMO_CODE_FEATURE_GAP_ANALYSIS.md),
> the evaluation notes, and the install/packaging workflow documented below.

---

## Portfolio showcase — my contribution

Most repos in a portfolio are code you wrote. This one is worth reading anyway, because the
work here is **analysis, not implementation**: judging an AI coding tool against nine
competitors and writing down what it actually does well, where it is blind, and what to build
next.

### The gap analysis (2026-07-25)

[`docs/MIMO_CODE_FEATURE_GAP_ANALYSIS.md`](docs/MIMO_CODE_FEATURE_GAP_ANALYSIS.md) — a
feature-by-feature matrix of MiMo Code against **OpenHands, Cline, Aider, Continue, Mem0,
LangGraph, Browser Use, Crawl4AI, MCP Inspector and Open WebUI**, category by category:

| Question the analysis answers | Outcome |
|---|---|
| Where does MiMo Code actually compete? | CLI coding-agent tier — competitive with Aider |
| What does it do that nobody else does? | Self-evolution (`/dream`, `/distill`, `/evolve`), judge/goal model, voice input, built-in skills |
| Where is it absent? | IDE-first agents, agent frameworks, browser automation, web crawling, MCP debugging, enterprise readiness |
| What should be built on top of it? | Prioritised gap list with impact ratings — the document I actually use to decide what to extend |

Every star count and feature claim in the document was checked against the live projects at
the time of writing; the methodology and its date are recorded in the file.

### Evaluation & packaging notes (mine)

- Which parts of the extension are worth keeping as the API surface (the HTTP/SSE contract
  with the headless server, the approval-queue model).
- The build and packaging workflow reproduced below, so the snapshot is runnable without
  reading upstream's docs.
- The honest status of the snapshot vs. today's upstream (upstream restructured from a VS Code
  extension into a Bun CLI with 2,079 files on `main` as of 2026-11-18).

---

## The snapshot: what the extension does

MiMo Code's VS Code stage put a terminal-native AI agent inside the editor — a sidebar chat
webview, selection-scoped commands, and an explicit human approval gate before any tool call
runs.

![Extension architecture](docs/architecture.svg)

**Command surface — 15 contributed commands** (plus `mimo.chat.focus`, bound to a keybinding):

| Group | Commands |
|---|---|
| Session | `mimo.newChat`, `mimo.stop`, `mimo.switchSession`, `mimo.exportSession`, `mimo.clearAllSessions` |
| Selection actions | `mimo.explainCode`, `mimo.fixCode`, `mimo.improveCode`, `mimo.refactorCode`, `mimo.writeTests`, `mimo.documentCode` |
| Context | `mimo.addToChat`, `mimo.addTerminalOutputToChat` |
| Configuration | `mimo.openSettings`, `mimo.selectModel` |

**Keybindings (3):** `ctrl+'` (add selection to chat) · `ctrl+shift+'` (focus chat) ·
`ctrl+shift+backspace` (stop generation).

**Settings (4):** `mimo.path` (path to the MiMo binary) · `mimo.defaultModel` ·
`mimo.autoApproveReads` *(default `true`)* · `mimo.autoApproveTerminal` *(default `false`)*.

**Human-in-the-loop by design.** Tool calls land in an approval queue
(`src/approvalQueue.ts`) with `pending → approved / rejected` transitions; nothing executes
without a decision. Terminal auto-approval ships **off** — turn it on only deliberately.

---

## Run the snapshot

```bash
# prerequisites: VS Code ^1.85, Node 18+, and a MiMo Code binary
npm install
npm run build        # tsc for the extension host + esbuild bundle for the webview
```

Then either press <kbd>F5</kbd> in VS Code ("Run Extension") or package the `.vsix`:

```bash
npm run package      # vsce package → mimo-code-0.1.0.vsix (included in this repo)
code --install-extension mimo-code-0.1.0.vsix
```

Point the extension at your binary with `mimo.path` (or let it auto-detect) — the extension
spawns the **MiMo Code headless server** and talks to it over HTTP with server-sent events for
streaming (`src/cliManager.ts`).

---

## Repository layout

```text
src/          extension host (TypeScript) — 11 files
  extension.ts        activation, command registration
  cliManager.ts       headless server lifecycle, HTTP + SSE
  webviewProvider.ts  webview host wiring
  approvalQueue.ts    tool-call approve / reject queue
  codeActionProvider.ts  selection-scoped commands
  sessionManager.ts   session switch / export / clear
  diffManager.ts      diff rendering for agent edits
  streamParser.ts     SSE event parsing
  statusBarManager.ts state indicator
  settings.ts         typed settings access
  types.ts            shared event / tool-call types
webview/      React 18 + esbuild sidebar UI — 12 files
docs/         architecture diagram + my competitive analysis
scripts/      build-webview.js
```

---

## Status — honest labels

**Research / evaluation snapshot.** v0.1.0 of a project whose upstream has since moved on.
Not published to the VS Code Marketplace; the `.vsix` here is a local build artifact. It is
kept because the analysis is worth keeping, and because the extension stage is a useful
reference for what "IDE integration for a terminal-native agent" should look like.

## Licence

Extension source: MIT, © 2026 Xiaomi MiMo (see [`LICENSE`](LICENSE)) — upstream terms apply.
This repository's own material (analysis, notes, diagram): MIT, © 2026 Nabiel.
