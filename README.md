# MiMo Code

A VS Code extension for AI-assisted coding, powered by the MiMo model — chat,
edit and build from a sidebar webview.

- **Chat webview** in a dedicated activity-bar view (`MiMo Chat`)
- Commands: `MiMo: New Chat` and more (see `package.json` → `contributes.commands`)
- Packs as a `.vsix` (`mimo-code-0.1.0.vsix`)

## Status

**Experimental** — early extension work (v0.1.0). Not published to the marketplace.

## Stack

- TypeScript
- VS Code Extension API (^1.85.0)
- Webview UI

## Development

```bash
npm install
npm run compile     # or the vsce packaging flow for a .vsix
```

Then load the extension from `out/` via VS Code's "Run Extension" host.
